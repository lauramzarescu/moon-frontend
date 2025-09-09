import { computed, nextTick, ref, watch } from 'vue';
import moment from 'moment';
import { AwsService } from '@/services/aws.service';
import { useToast } from '@/components/ui/toast';
import { useDataStore } from '@/stores/dataStore';
import type { ServiceInterface } from '@/views/AWS/Services/types/service.interface';

export function useVersionManagement() {
    const awsService = new AwsService();
    const { toast } = useToast();
    const store = useDataStore();

    // Reactive state
    const selectedVersion = ref<string>('');
    const availableVersions = ref<Array<{ revision: number; label: string; arn: string; registeredAt: string }>>([]);
    const isLoadingVersions = ref(false);
    const isLoadingMoreVersions = ref(false);
    const pagination = ref<{ page: number; limit: number; totalPages: number; hasNextPage: boolean; hasPreviousPage: boolean } | null>(
        null,
    );
    const currentService = ref<ServiceInterface | null>(null);
    const currentContainer = ref<string>('');

    // Track previous service identity to preserve version selection during data refreshes
    const previousServiceIdentity = ref<string>('');

    // Format version date
    const formatVersionDate = (dateStr: string) => moment(dateStr).format('MMM D, YYYY [at] h:mm A');

    // Check if current version is latest
    const isLatestVersion = computed(() => {
        if (!availableVersions.value || availableVersions.value.length === 0) return true;
        return selectedVersion.value === availableVersions.value[0].revision.toString();
    });

    const loadVersions = async (service: ServiceInterface | null, containerName: string, preserveSelectedVersion = false) => {
        if (!service || !containerName) return;

        // Store current service and container for load more functionality
        currentService.value = service;
        currentContainer.value = containerName;

        // Store the currently selected version before resetting state
        const currentSelectedVersion = selectedVersion.value;

        // Reset state for new service/container
        availableVersions.value = [];
        pagination.value = null;
        if (!preserveSelectedVersion) {
            selectedVersion.value = '';
        }

        isLoadingVersions.value = true;
        try {
            const response = await awsService.getEnvironmentVariableVersions({
                clusterName: service.clusterName,
                serviceName: service.name,
                containerName,
                page: 1,
                limit: 10,
            });

            availableVersions.value = response.versions.map((version: any) => ({
                revision: version.revision,
                label: `v${version.revision} — ${formatVersionDate(version.registeredAt)}`,
                arn: version.arn,
                registeredAt: version.registeredAt,
            }));

            pagination.value = response.pagination;

            if (availableVersions.value.length > 0) {
                if (preserveSelectedVersion && currentSelectedVersion) {
                    // Check if the previously selected version still exists in the new list
                    const versionExists = availableVersions.value.some((v) => v.revision.toString() === currentSelectedVersion);
                    if (versionExists) {
                        selectedVersion.value = currentSelectedVersion;
                    } else {
                        // If the previously selected version no longer exists, fall back to latest
                        selectedVersion.value = availableVersions.value[0].revision.toString();
                    }
                } else {
                    // Set current version as the latest (default behavior)
                    selectedVersion.value = availableVersions.value[0].revision.toString();
                }
            }
        } catch (error: any) {
            console.error('Failed to load versions:', error);
        } finally {
            isLoadingVersions.value = false;
        }
    };

    const loadMoreVersions = async () => {
        if (!pagination.value?.hasNextPage || isLoadingMoreVersions.value || !currentService.value || !currentContainer.value) {
            return;
        }

        isLoadingMoreVersions.value = true;
        try {
            const response = await awsService.getEnvironmentVariableVersions({
                clusterName: currentService.value.clusterName,
                serviceName: currentService.value.name,
                containerName: currentContainer.value,
                page: pagination.value.page + 1,
                limit: 10,
            });

            const newVersions = response.versions.map((version: any) => ({
                revision: version.revision,
                label: `v${version.revision} — ${formatVersionDate(version.registeredAt)}`,
                arn: version.arn,
                registeredAt: version.registeredAt,
            }));

            // Append new versions to existing ones
            availableVersions.value = [...availableVersions.value, ...newVersions];
            pagination.value = response.pagination;
        } catch (error: any) {
            console.error('Failed to load more versions:', error);
        } finally {
            isLoadingMoreVersions.value = false;
        }
    };

    // Perform rollback to selected version
    const performRollback = async (
        service: ServiceInterface,
        containerName: string,
        targetRevision: number,
        isRestoring: { value: boolean },
        onSuccess?: () => void,
    ) => {
        isRestoring.value = true;

        try {
            await awsService.rollbackEnvironmentVariables({
                clusterName: service.clusterName,
                serviceName: service.name,
                containerName,
                targetRevision,
            });

            toast({
                variant: 'success',
                title: 'Rollback Successful',
                description: `Successfully rolled back to version ${targetRevision}.`,
            });

            // Refresh data from backend
            store.manualRefresh();
            onSuccess?.();
        } catch (error: any) {
            console.error('Failed to rollback:', error);
            toast({
                variant: 'destructive',
                title: 'Rollback Failed',
                description: error.message || 'Failed to rollback to the selected version.',
            });
        } finally {
            isRestoring.value = false;
        }
    };

    // Setup watchers for version changes
    const setupVersionWatchers = (
        service: () => ServiceInterface | null,
        selectedContainer: { value: string },
        versionEnvironmentVariables: { value: any },
        isLoadingVersionData: { value: boolean },
        loadVersionData: (revision: number) => Promise<any>,
        isDialogOpen?: () => boolean,
    ) => {
        // Watch service changes
        watch(
            service,
            async (newService, oldService) => {
                if (newService && newService.containers.length > 0) {
                    // Create service identity string for comparison
                    const newServiceIdentity = `${newService.name}:${newService.clusterName}`;
                    const oldServiceIdentity = oldService ? `${oldService.name}:${oldService.clusterName}` : '';

                    // Only reload versions if:
                    // 1. It's a completely new service (different identity)
                    // 2. Dialog is not open (to prevent refreshes during dialog usage)
                    const isNewService = newServiceIdentity !== oldServiceIdentity;
                    const shouldReload = isNewService || !(isDialogOpen && isDialogOpen());

                    if (shouldReload) {
                        const isSameService = previousServiceIdentity.value === newServiceIdentity;

                        selectedContainer.value = newService.containers[0].name;
                        versionEnvironmentVariables.value = null;
                        await nextTick();

                        // Preserve version selection if it's the same service being refreshed
                        loadVersions(newService, selectedContainer.value, isSameService);

                        // Update the tracked service identity
                        previousServiceIdentity.value = newServiceIdentity;
                    }
                } else {
                    versionEnvironmentVariables.value = null;
                    previousServiceIdentity.value = '';
                }
            },
            { immediate: true },
        );

        // Watch container changes
        watch(
            () => selectedContainer.value,
            async () => {
                if (selectedContainer.value) {
                    versionEnvironmentVariables.value = null;
                    await loadVersions(service(), selectedContainer.value);
                }
            },
        );

        watch(selectedVersion, async (newVersion, oldVersion) => {
            if (newVersion && selectedContainer.value) {
                const isLatest = availableVersions.value.length > 0 && newVersion === availableVersions.value[0].revision.toString();

                if (!isLatest) {
                    isLoadingVersionData.value = true;
                    try {
                        const revision = parseInt(newVersion);
                        versionEnvironmentVariables.value = await loadVersionData(revision);
                    } catch (error) {
                        console.error('Failed to load version data:', error);
                        versionEnvironmentVariables.value = null;
                    } finally {
                        isLoadingVersionData.value = false;
                    }
                } else {
                    versionEnvironmentVariables.value = null;
                }
            }
        });
    };

    return {
        // Reactive state
        selectedVersion,
        availableVersions,
        isLoadingVersions,
        isLoadingMoreVersions,
        pagination,

        // Computed
        isLatestVersion,

        // Methods
        loadVersions,
        loadMoreVersions,
        performRollback,
        setupVersionWatchers,
        formatVersionDate,
    };
}
