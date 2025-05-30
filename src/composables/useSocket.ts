import { io, Socket } from 'socket.io-client';
import { ref } from 'vue';
import type { ClusterInterface } from '@/views/AWS/Clusters/types/cluster.interface.ts';
import type { DeploymentInterface, ServiceInterface, TaskDefinitionInterface } from '@/views/AWS/Services/types/service.interface.ts';
import type { ClusterResponseInterface } from '@/types/response/cluster.interface.ts';
import { config } from '../../app.config.ts';
import type { ScheduledTaskInterface } from '@/views/AWS/ScheduledTasks/types/scheduled-task.interface.ts';

export const SOCKET_EVENTS = {
    CLUSTERS_UPDATE: 'clusters-update',
    CLUSTERS_ERROR: 'clusters-error',

    // Progressive loading events
    CLUSTERS_BASIC_UPDATE: 'clusters-basic-update',
    CLUSTER_SERVICES_UPDATE: 'cluster-services-update',
    CLUSTER_SCHEDULED_TASKS_UPDATE: 'cluster-scheduled-tasks-update',
    EC2_INVENTORY_UPDATE: 'ec2-inventory-update',

    TOGGLE_PROGRESSIVE_LOADING: 'toggle-progressive-loading',
    REFRESH_CLUSTER_SERVICES: 'refresh-cluster-services',
    REFRESH_CLUSTER_SCHEDULED_TASKS: 'refresh-cluster-scheduled-tasks',
    GET_EC2_INVENTORY: 'get-ec2-inventory',

    LOADING_PROGRESS: 'loading-progress',
    LOADING_COMPLETE: 'loading-complete',

    INTERVAL_UPDATED: 'interval-updated',
    INTERVAL_SET: 'set-interval',

    MANUAL_REFRESH: 'manual-refresh',
    DISCONNECT: 'disconnect',
} as const;

let socket: Socket | null = null;

export function useSocket() {
    if (!socket) {
        socket = io(config.SOCKET_URL, {
            withCredentials: true,
            transports: ['polling', 'websocket'],
            reconnection: true,
            reconnectionAttempts: 20,
            reconnectionDelay: 1000,
        });
    }

    const data = ref<ClusterResponseInterface | null>(null);
    const loadingProgress = ref<{ current: number; total: number; stage: string }>({
        current: 0,
        total: 0,
        stage: '',
    });
    const isLoading = ref<boolean>(false);

    const processClusters = (_clusters: ClusterInterface[]) => {
        const clusters = ref<ClusterInterface[]>([]);
        const services = ref<ServiceInterface[]>([]);
        const scheduledTasks = ref<ScheduledTaskInterface[]>([]);
        const deployments = ref<DeploymentInterface[]>([]);
        const taskDefinitions = ref<TaskDefinitionInterface[]>([]);

        for (const cluster of _clusters) {
            clusters.value.push(cluster);
            scheduledTasks.value.push(...cluster.scheduledTasks);

            for (const service of cluster.services) {
                services.value.push(service);

                for (const deployment of service.deployments) {
                    deployments.value.push(deployment);
                }

                taskDefinitions.value.push(service.taskDefinition);
            }
        }

        return {
            clusters: clusters.value,
            services: services.value,
            scheduledTasks: scheduledTasks.value,
            deployments: deployments.value,
            taskDefinitions: taskDefinitions.value,
        };
    };

    const processBasicClusters = (_clusters: Partial<ClusterInterface>[]) => {
        const clusters = ref<Partial<ClusterInterface>[]>([]);

        for (const cluster of _clusters) {
            clusters.value.push({
                ...cluster,
                services: cluster.services || [],
                scheduledTasks: cluster.scheduledTasks || [],
            });
        }

        return {
            clusters: clusters.value,
        };
    };

    const setRefreshInterval = (intervalTime: number) => {
        socket?.emit(SOCKET_EVENTS.INTERVAL_SET, intervalTime);
    };

    const manualRefresh = () => {
        socket?.emit(SOCKET_EVENTS.MANUAL_REFRESH);
    };

    const setupProgressiveListeners = (callbacks: {
        onClustersBasicUpdate?: (data: any) => void;
        onClusterServicesUpdate?: (data: any) => void;
        onClusterScheduledTasksUpdate?: (data: any) => void;
        onEC2InventoryUpdate?: (data: any) => void;
        onLoadingProgress?: (progress: { current: number; total: number; stage: string }) => void;
        onLoadingComplete?: () => void;
        onClustersError?: (error: any) => void;
    }) => {
        // Remove existing listeners to prevent duplicates
        socket?.off(SOCKET_EVENTS.CLUSTERS_BASIC_UPDATE);
        socket?.off(SOCKET_EVENTS.CLUSTER_SERVICES_UPDATE);
        socket?.off(SOCKET_EVENTS.CLUSTER_SCHEDULED_TASKS_UPDATE);
        socket?.off(SOCKET_EVENTS.EC2_INVENTORY_UPDATE);
        socket?.off(SOCKET_EVENTS.LOADING_PROGRESS);
        socket?.off(SOCKET_EVENTS.LOADING_COMPLETE);
        socket?.off(SOCKET_EVENTS.CLUSTERS_ERROR);

        // Set up progressive loading listeners
        if (callbacks.onClustersBasicUpdate) {
            socket?.on(SOCKET_EVENTS.CLUSTERS_BASIC_UPDATE, callbacks.onClustersBasicUpdate);
        }

        if (callbacks.onClusterServicesUpdate) {
            socket?.on(SOCKET_EVENTS.CLUSTER_SERVICES_UPDATE, callbacks.onClusterServicesUpdate);
        }

        if (callbacks.onClusterScheduledTasksUpdate) {
            socket?.on(SOCKET_EVENTS.CLUSTER_SCHEDULED_TASKS_UPDATE, callbacks.onClusterScheduledTasksUpdate);
        }

        if (callbacks.onEC2InventoryUpdate) {
            socket?.on(SOCKET_EVENTS.EC2_INVENTORY_UPDATE, callbacks.onEC2InventoryUpdate);
        }

        if (callbacks.onLoadingProgress) {
            socket?.on(SOCKET_EVENTS.LOADING_PROGRESS, (progress) => {
                loadingProgress.value = progress;
                isLoading.value = true;
                callbacks.onLoadingProgress?.(progress);
            });
        }

        if (callbacks.onLoadingComplete) {
            socket?.on(SOCKET_EVENTS.LOADING_COMPLETE, () => {
                isLoading.value = false;
                loadingProgress.value = { current: 0, total: 0, stage: '' };
                callbacks.onLoadingComplete?.();
            });
        }

        if (callbacks.onClustersError) {
            socket?.on(SOCKET_EVENTS.CLUSTERS_ERROR, (error) => {
                isLoading.value = false;
                loadingProgress.value = { current: 0, total: 0, stage: '' };
                callbacks.onClustersError?.(error);
            });
        }
    };

    const removeProgressiveListeners = () => {
        socket?.off(SOCKET_EVENTS.CLUSTERS_BASIC_UPDATE);
        socket?.off(SOCKET_EVENTS.CLUSTER_SERVICES_UPDATE);
        socket?.off(SOCKET_EVENTS.CLUSTER_SCHEDULED_TASKS_UPDATE);
        socket?.off(SOCKET_EVENTS.EC2_INVENTORY_UPDATE);
        socket?.off(SOCKET_EVENTS.LOADING_PROGRESS);
        socket?.off(SOCKET_EVENTS.LOADING_COMPLETE);
        socket?.off(SOCKET_EVENTS.CLUSTERS_ERROR);
    };

    return {
        socket,
        data,
        loadingProgress,
        isLoading,
        processClusters,
        processBasicClusters,
        setRefreshInterval,
        manualRefresh,
        setupProgressiveListeners,
        removeProgressiveListeners,
        SOCKET_EVENTS,
    };
}
