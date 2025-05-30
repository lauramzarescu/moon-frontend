import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { debounce } from 'lodash'; // Add this import
import { useSocket } from '@/composables/useSocket.ts';
import type { ClusterResponseInterface } from '@/types/response/cluster.interface.ts';
import type { InstanceInterface, ServiceInterface } from '@/views/AWS/Services/types/service.interface.ts';
import type { ClusterInterface } from '@/views/AWS/Clusters/types/cluster.interface.ts';
import type { ScheduledTaskInterface } from '@/views/AWS/ScheduledTasks/types/scheduled-task.interface.ts';

export const useDataStore = defineStore(
    'data',
    () => {
        const {
            socket,
            processClusters,
            processBasicClusters,
            setRefreshInterval,
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

        // Progressive loading state
        const loadingProgress = ref<{ current: number; total: number; stage: string }>({
            current: 0,
            total: 0,
            stage: '',
        });
        const isProgressiveLoading = ref<boolean>(false);
        const loadingStages = ref<string[]>([]);

        // Helper functions for loadingStages management
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

        // Computed properties
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
                // Reset loading state
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

        const initializeData = () => {
            // Remove any existing listeners to prevent duplicates
            socket?.off('connect');
            socket?.off(SOCKET_EVENTS.CLUSTERS_UPDATE);
            socket?.off(SOCKET_EVENTS.INTERVAL_UPDATED);
            removeProgressiveListeners();

            // Set up basic socket listeners
            socket?.on('connect', () => {
                setRefreshInterval(refreshInterval.value);
            });

            // Fallback for complete data update (backward compatibility)
            socket?.on(SOCKET_EVENTS.CLUSTERS_UPDATE, (receivedData: ClusterResponseInterface) => {
                processCompleteData(receivedData);
            });

            socket?.on(SOCKET_EVENTS.INTERVAL_UPDATED, (interval: number) => {
                refreshInterval.value = interval;
            });

            // Set up progressive loading listeners
            setupProgressiveListeners({
                onClustersBasicUpdate: (data: { clusters: Partial<ClusterInterface>[]; updatedOn: Date }) => {
                    console.log('Received basic clusters data:', data);
                    const processedData = processBasicClusters(data.clusters);
                    clusters.value = processedData.clusters as ClusterInterface[];
                    updatedOn.value = data.updatedOn;
                    addLoadingStage('clusters-basic');
                },

                onClusterServicesUpdate: (data: { clusterArn: string; services: ServiceInterface[] }) => {
                    console.log('Received cluster services data:', data);
                    const clusterIndex = clusters.value.findIndex((c) => c.arn === data.clusterArn);

                    if (clusterIndex !== -1) {
                        clusters.value[clusterIndex].services = data.services;

                        // Update services array and related data
                        const allServices: ServiceInterface[] = [];
                        const allDeployments: any[] = [];
                        const allTaskDefinitions: any[] = [];

                        clusters.value.forEach((cluster) => {
                            cluster.services?.forEach((service) => {
                                allServices.push(service);
                                if (service.deployments) {
                                    allDeployments.push(...service.deployments);
                                }
                                if (service.taskDefinition) {
                                    allTaskDefinitions.push(service.taskDefinition);
                                }
                            });
                        });

                        services.value = allServices;
                    }
                    addLoadingStage('cluster-services');
                },

                onClusterScheduledTasksUpdate: (data: { clusterArn: string; scheduledTasks: ScheduledTaskInterface[] }) => {
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

                onEC2InventoryUpdate: (data: { instances: InstanceInterface[]; updatedOn: Date }) => {
                    console.log('Received EC2 inventory data:', data);
                    instances.value = data.instances;
                    updatedOn.value = data.updatedOn;
                    addLoadingStage('ec2-inventory');
                },

                onLoadingProgress: (progress: { current: number; total: number; stage: string }) => {
                    console.log('Loading progress:', progress);
                    loadingProgress.value = progress;
                    isProgressiveLoading.value = true;
                },

                onLoadingComplete: () => {
                    console.log('Loading complete');
                    isProgressiveLoading.value = false;
                    loadingProgress.value = { current: 0, total: 0, stage: '' };
                    clearLoadingStages();
                },
                onClustersError: (error: any) => {
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
            }
        };

        const processCompleteData = (receivedData: ClusterResponseInterface) => {
            console.log('Received complete data update:', receivedData);
            const processedData = processClusters(receivedData.clusters.clusters);

            if (processedData) {
                instances.value = receivedData.ec2Instances.instances;
                services.value = processedData.services;
                clusters.value = processedData.clusters;
                scheduledTasks.value = processedData.scheduledTasks;
                updatedOn.value = receivedData.updatedOn;
            }

            // Reset progressive loading state
            isProgressiveLoading.value = false;
            loadingProgress.value = { current: 0, total: 0, stage: '' };
            clearLoadingStages();
        };

        // Cleanup function
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

            // Progressive loading state
            loadingProgress,
            isProgressiveLoading,
            loadingStages,

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
