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

    // Format version date
    const formatVersionDate = (dateStr: string) => moment(dateStr).format('MMM D, YYYY [at] h:mm A');

    // Check if current version is latest
    const isLatestVersion = computed(() => {
        if (!availableVersions.value || availableVersions.value.length === 0) return true;
        return selectedVersion.value === availableVersions.value[0].revision.toString();
    });

    // Load versions from API
    const loadVersions = async (service: ServiceInterface | null, containerName: string) => {
        if (!service || !containerName) return;

        isLoadingVersions.value = true;
        try {
            const response = await awsService.getEnvironmentVariableVersions({
                clusterName: service.clusterName,
                serviceName: service.name,
                containerName,
            });

            availableVersions.value = response.versions.map((version: any) => ({
                revision: version.revision,
                label: `v${version.revision} — ${formatVersionDate(version.registeredAt)}`,
                arn: version.arn,
                registeredAt: version.registeredAt,
            }));

            // Set current version as the latest
            if (availableVersions.value.length > 0) {
                selectedVersion.value = availableVersions.value[0].revision.toString();
            }
        } catch (error: any) {
            console.error('Failed to load versions:', error);
        } finally {
            isLoadingVersions.value = false;
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
    ) => {
        // Watch service changes
        watch(
            service,
            async (newService) => {
                if (newService && newService.containers.length > 0) {
                    selectedContainer.value = newService.containers[0].name;
                    versionEnvironmentVariables.value = null;
                    await nextTick();
                    loadVersions(newService, selectedContainer.value);
                } else {
                    versionEnvironmentVariables.value = null;
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

        // Watch version changes
        watch(selectedVersion, async (newVersion) => {
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

        // Computed
        isLatestVersion,

        // Methods
        loadVersions,
        performRollback,
        setupVersionWatchers,
        formatVersionDate,
    };
}
