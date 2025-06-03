import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { debounce } from 'lodash';
import { useSocket } from '@/composables/useSocket.ts';
import type { InstanceInterface, ServiceInterface } from '@/views/AWS/Services/types/service.interface.ts';
import type { ClusterInterface } from '@/views/AWS/Clusters/types/cluster.interface.ts';
import type { ScheduledTaskInterface } from '@/views/AWS/ScheduledTasks/types/scheduled-task.interface.ts';
import type {
    AWSResponseInterface,
    ClientInfoResponse,
    ClustersBasicResponse,
    ClusterScheduledTasksResponse,
    ClusterServicesResponse,
    EC2InventoryResponse,
    LoadingProgressResponse,
    SocketErrorResponse,
} from '@/types/socket/socket-response.interface.ts';

export const useDataStore = defineStore(
    'data',
    () => {
        const {
            socket,
            processClusters,
            processBasicClusters,
            setRefreshInterval,
            toggleProgressiveLoading,
            manualRefresh,
            setupProgressiveListeners,
            removeProgressiveListeners,
            SOCKET_EVENTS,
        } = useSocket();

        // Data state
        const instances = ref<InstanceInterface[]>([]);
        const services = ref<ServiceInterface[]>([]);
        const clusters = ref<ClusterInterface[]>([]);
        const scheduledTasks = ref<ScheduledTaskInterface[]>([]);
        const updatedOn = ref<Date | null>(null);
        const refreshInterval = ref<number>(15);
        const refreshIsDynamic = ref<boolean>(false);
        const clientInfo = ref<ClientInfoResponse | null>(null);
        const hasInitialData = ref<boolean>(false);

        // Progressive loading state
        const loadingProgress = ref<{ current: number; total: number; stage: string }>({
            current: 0,
            total: 0,
            stage: '',
        });
        const isProgressiveLoading = ref<boolean>(false);
        const loadingStages = ref<string[]>([]);

        const useProgressiveLoading = ref<boolean>(localStorage.getItem('useProgressiveLoading') === 'true' || false);

        const addLoadingStage = (stage: string) => {
            if (!loadingStages.value.includes(stage)) {
                loadingStages.value.push(stage);
            }
        };

        const hasLoadingStage = (stage: string) => {
            return loadingStages.value.includes(stage);
        };

        const clearLoadingStages = () => {
            loadingStages.value = [];
        };

        const loadingPercentage = computed(() => {
            if (loadingProgress.value.total === 0) return 0;
            return Math.round((loadingProgress.value.current / loadingProgress.value.total) * 100);
        });

        const isDataPartiallyLoaded = computed(() => {
            return clusters.value.length > 0 && isProgressiveLoading.value;
        });

        // Create debounced manual refresh function
        const debouncedManualRefresh = debounce(
            () => {
                isProgressiveLoading.value = true;
                clearLoadingStages();
                loadingProgress.value = { current: 0, total: 0, stage: 'Initiating refresh...' };

                // Emit the manual refresh socket event
                manualRefresh();
            },
            1000, // 1 second debounce delay
            {
                leading: true, // Execute immediately on first call
                trailing: false, // Don't execute again after the delay
            },
        );

        const handleToggleProgressiveLoading = (enabled: boolean) => {
            useProgressiveLoading.value = enabled;
            localStorage.setItem('useProgressiveLoading', String(enabled));
            toggleProgressiveLoading(enabled);
        };

        const initializeData = () => {
            // Remove any existing listeners to prevent duplicates
            socket?.off('connect');
            socket?.off(SOCKET_EVENTS.CLUSTERS_UPDATE);
            socket?.off(SOCKET_EVENTS.INTERVAL_UPDATED);
            removeProgressiveListeners();

            // Set up basic socket listeners
            socket?.on('connect', () => {
                setRefreshInterval(refreshIsDynamic.value ? -1 : refreshInterval.value);
                toggleProgressiveLoading(useProgressiveLoading.value);
            });

            socket?.on(SOCKET_EVENTS.CLUSTERS_UPDATE, (receivedData: AWSResponseInterface) => {
                processCompleteData(receivedData);
            });

            socket?.on(SOCKET_EVENTS.INTERVAL_UPDATED, (payload: { clientInfo: ClientInfoResponse }) => {
                refreshInterval.value =
                    (payload.clientInfo.isAutomatic ? payload.clientInfo?.automaticIntervalTime : payload.clientInfo?.intervalTime) || 0;
                refreshIsDynamic.value = payload.clientInfo.isAutomatic;
            });

            setupProgressiveListeners({
                onClustersBasicUpdate: (data: ClustersBasicResponse) => {
                    console.log('Received basic clusters data:', data);
                    const processedData = processBasicClusters(data.clusters);
                    clusters.value = processedData.clusters as ClusterInterface[];
                    updatedOn.value = new Date(data.updatedOn);
                    clientInfo.value = data.clientInfo;
                    addLoadingStage('clusters-basic');
                },

                onClusterServicesUpdate: (data: ClusterServicesResponse) => {
                    console.log('Received cluster services data:', data);
                    const clusterIndex = clusters.value.findIndex((c) => c.arn === data.clusterArn || c.name === data.clusterName);

                    if (clusterIndex !== -1) {
                        clusters.value[clusterIndex].services = data.services;

                        const updatedServices: ServiceInterface[] = [];

                        clusters.value.forEach((cluster) => {
                            cluster.services?.forEach((service) => {
                                updatedServices.push(service);
                            });
                        });

                        if (updatedServices.length > 0 || !hasInitialData.value) {
                            services.value = updatedServices;
                            hasInitialData.value = true;
                        }
                    }
                    addLoadingStage('cluster-services');
                },

                onClusterScheduledTasksUpdate: (data: ClusterScheduledTasksResponse) => {
                    console.log('Received cluster scheduled tasks data:', data);
                    const clusterIndex = clusters.value.findIndex((c) => c.arn === data.clusterArn);

                    if (clusterIndex !== -1) {
                        clusters.value[clusterIndex].scheduledTasks = data.scheduledTasks;

                        // Update scheduled tasks array
                        const allScheduledTasks: ScheduledTaskInterface[] = [];
                        clusters.value.forEach((cluster) => {
                            if (cluster.scheduledTasks) {
                                allScheduledTasks.push(...cluster.scheduledTasks);
                            }
                        });

                        scheduledTasks.value = allScheduledTasks;
                    }
                    addLoadingStage('cluster-scheduled-tasks');
                },

                onEC2InventoryUpdate: (data: EC2InventoryResponse) => {
                    console.log('Received EC2 inventory data:', data);
                    instances.value = data.instances;
                    updatedOn.value = new Date(data.updatedOn);
                    addLoadingStage('ec2-inventory');
                },

                onLoadingProgress: (progress: LoadingProgressResponse) => {
                    console.log('Loading progress:', progress);
                    loadingProgress.value = {
                        current: progress.step,
                        total: progress.totalSteps,
                        stage: progress.message,
                    };
                    isProgressiveLoading.value = true;
                },

                onLoadingComplete: () => {
                    console.log('Loading complete');
                    isProgressiveLoading.value = false;
                    loadingProgress.value = { current: 0, total: 0, stage: '' };
                    clearLoadingStages();
                    hasInitialData.value = true;
                },

                onClustersError: (error: SocketErrorResponse) => {
                    console.error('Clusters loading error:', error);
                    isProgressiveLoading.value = false;
                    loadingProgress.value = { current: 0, total: 0, stage: '' };
                    clearLoadingStages();
                },
            });

            if (!socket?.connected) {
                socket?.connect();
            } else {
                setRefreshInterval(refreshInterval.value);
                toggleProgressiveLoading(useProgressiveLoading.value);
            }
        };

        const processCompleteData = (receivedData: AWSResponseInterface) => {
            console.log('Received complete data update:', receivedData);
            const processedData = processClusters(receivedData.clusters.clusters);

            if (processedData) {
                instances.value = receivedData.ec2Instances.instances;
                services.value = processedData.services;
                clusters.value = processedData.clusters;
                scheduledTasks.value = processedData.scheduledTasks;
                updatedOn.value = receivedData.updatedOn;
                clientInfo.value = receivedData.clientInfo;
            }

            // Reset progressive loading state
            isProgressiveLoading.value = false;
            loadingProgress.value = { current: 0, total: 0, stage: '' };
            clearLoadingStages();
        };

        const cleanup = () => {
            removeProgressiveListeners();
            socket?.off('connect');
            socket?.off(SOCKET_EVENTS.CLUSTERS_UPDATE);
            socket?.off(SOCKET_EVENTS.INTERVAL_UPDATED);
            // Cancel any pending debounced calls
            debouncedManualRefresh.cancel();
        };

        // Helper functions to check loading status of specific data types
        const isClustersBasicLoaded = computed(() => hasLoadingStage('clusters-basic'));
        const isServicesLoaded = computed(() => hasLoadingStage('cluster-services'));
        const isScheduledTasksLoaded = computed(() => hasLoadingStage('cluster-scheduled-tasks'));
        const isEC2InventoryLoaded = computed(() => hasLoadingStage('ec2-inventory'));

        // Get clusters with loading status
        const clustersWithLoadingStatus = computed(() => {
            return clusters.value.map((cluster) => ({
                ...cluster,
                isServicesLoaded: cluster.services && cluster.services.length > 0,
                isScheduledTasksLoaded: cluster.scheduledTasks && cluster.scheduledTasks.length > 0,
            }));
        });

        return {
            // Data
            instances,
            services,
            clusters,
            scheduledTasks,
            updatedOn,
            refreshInterval,
            refreshIsDynamic,
            clientInfo,

            // Progressive loading state
            loadingProgress,
            isProgressiveLoading,
            loadingStages,
            useProgressiveLoading,

            // Computed properties
            loadingPercentage,
            isDataPartiallyLoaded,
            isClustersBasicLoaded,
            isServicesLoaded,
            isScheduledTasksLoaded,
            isEC2InventoryLoaded,
            clustersWithLoadingStatus,

            // Methods
            initializeData,
            setRefreshInterval,
            toggleProgressiveLoading: handleToggleProgressiveLoading,
            manualRefresh: debouncedManualRefresh,
            cleanup,
        };
    },
    {
        persist: {
            storage: window.localStorage,
        },
    },
);
