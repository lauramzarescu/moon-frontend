import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
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

        // Computed properties
        const loadingPercentage = computed(() => {
            if (loadingProgress.value.total === 0) return 0;
            return Math.round((loadingProgress.value.current / loadingProgress.value.total) * 100);
        });

        const isDataPartiallyLoaded = computed(() => {
            return clusters.value.length > 0 && isProgressiveLoading.value;
        });

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
                    loadingStages.value.push('clusters-basic');
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
                    loadingStages.value.push('cluster-services');
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
                    loadingStages.value.push('cluster-scheduled-tasks');
                },

                onEC2InventoryUpdate: (data: { instances: InstanceInterface[]; updatedOn: Date }) => {
                    console.log('Received EC2 inventory data:', data);
                    instances.value = data.instances;
                    updatedOn.value = data.updatedOn;
                    loadingStages.value.push('ec2-inventory');
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
                    loadingStages.value = [];
                },
                onClustersError: (error: any) => {
                    console.error('Clusters loading error:', error);
                    isProgressiveLoading.value = false;
                    loadingProgress.value = { current: 0, total: 0, stage: '' };
                    loadingStages.value = [];
                },
            });

            if (!socket?.connected) {
                socket?.connect();
            } else {
                setRefreshInterval(refreshInterval.value);
            }
        };

        const manualRefreshData = async () => {
            // Reset loading state
            isProgressiveLoading.value = true;
            loadingStages.value = [];
            loadingProgress.value = { current: 0, total: 0, stage: 'Initiating refresh...' };

            manualRefresh();
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
            loadingStages.value = [];
        };

        // Cleanup function
        const cleanup = () => {
            removeProgressiveListeners();
            socket?.off('connect');
            socket?.off(SOCKET_EVENTS.CLUSTERS_UPDATE);
            socket?.off(SOCKET_EVENTS.INTERVAL_UPDATED);
        };

        // Helper functions to check loading status of specific data types
        const isClustersBasicLoaded = computed(() => loadingStages.value.includes('clusters-basic'));
        const isServicesLoaded = computed(() => loadingStages.value.includes('cluster-services'));
        const isScheduledTasksLoaded = computed(() => loadingStages.value.includes('cluster-scheduled-tasks'));
        const isEC2InventoryLoaded = computed(() => loadingStages.value.includes('ec2-inventory'));

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
            manualRefresh: manualRefreshData,
            cleanup,
        };
    },
    {
        persist: {
            storage: window.localStorage,
        },
    },
);
