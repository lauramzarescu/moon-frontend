<template>
    <Dialog v-model:open="isOpen">
        <DialogContent class="max-w-7xl max-h-[90vh] flex flex-col min-h-0">
            <!-- Service Header -->
            <ServiceEnvironmentDialogHeader
                :service="service"
                :has-stored-unsaved-changes="hasStoredUnsavedChanges"
                :unsaved-changes-count="unsavedChangesCount"
            />

            <!-- Version Management -->
            <VersionManagement
                v-model:selected-version="selectedVersion"
                :available-versions="availableVersions"
                :is-loading-versions="isLoadingVersions"
                @compare="openVersionComparison"
                @restore="confirmRestoreToVersion"
                @add-variable="openBulkAdd"
                @bulk-operations="openBulkOperations"
            />

            <!-- Container Tabs -->
            <div class="flex-1 flex flex-col min-h-0">
                <ContainerTabs
                    v-if="service?.containers"
                    :containers="service.containers"
                    v-model:selected-container="selectedContainer"
                />

                <!-- Variables Content -->
                <div class="flex-1 min-h-0 p-4 overflow-y-auto relative">
                    <div v-if="isLoadingVersionData" class="flex items-center justify-center h-32">
                        <div class="flex items-center gap-2 text-muted-foreground">
                            <Loader2Icon class="h-5 w-5 animate-spin" />
                            Loading version data...
                        </div>
                    </div>
                    <EnvironmentVariablesTable
                        v-else-if="currentContainer"
                        ref="environmentVariablesTableRef"
                        :container="currentContainer"
                        :service-name="service?.name"
                        :cluster-name="service?.clusterName"
                        :selected-version="selectedVersion"
                        :is-latest="isLatestVersion"
                        @delete="handleDelete"
                        @bulk-select="handleBulkSelect"
                        @add-new="handleAddNew"
                        @pending-changes="handlePendingChanges"
                        @save-all-changes="handleSaveAllChanges"
                    />
                    <div v-else class="flex items-center justify-center h-32 text-muted-foreground">No container selected</div>
                </div>
            </div>

            <!-- Footer Actions -->
            <div class="flex items-center justify-between pt-4 border-t">
                <div class="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{{ totalVariablesCount }} variables</span>
                    <span>•</span>
                    <span>{{ totalSecretsCount }} secrets</span>
                </div>
                <div class="flex items-center gap-2">
                    <Button variant="outline" @click="closeDialog" :disabled="isSaving || isDeleting"> Cancel </Button>
                    <Button @click="saveChanges" :disabled="!hasPendingChanges || isSaving || isDeleting">
                        <div v-if="isSaving" class="flex items-center gap-2">
                            <div class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                            Saving...
                        </div>
                        <span v-else>Save Changes</span>
                    </Button>
                </div>
            </div>

            <!-- Global Loading Overlay covering the entire dialog -->
            <div
                v-if="isDeleting || isSaving || isRestoring"
                class="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
            >
                <div class="flex items-center gap-3 bg-card border rounded-lg px-4 py-3 shadow-lg">
                    <div class="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                    <span class="text-sm font-medium">
                        {{ isDeleting ? 'Deleting variables...' : isRestoring ? 'Restoring to version...' : 'Saving changes...' }}
                    </span>
                </div>
            </div>
        </DialogContent>
    </Dialog>

    <!-- Sub-dialogs -->
    <BulkAddDialog v-model:open="bulkAddDialog.isOpen" :service="service" :container="selectedContainer" @added="handleBulkAdded" />

    <BulkOperationsDialog
        v-model:open="bulkOperationsDialog.isOpen"
        :service="service"
        :selected-variables="effectiveSelectedVariables"
        @completed="handleRefresh"
    />

    <VersionComparisonDialog
        v-model:open="versionComparisonDialog.isOpen"
        :service="service"
        :services="service ? [service] : []"
        :current-version="selectedVersion"
    />

    <!-- Restore Confirmation Dialog -->
    <RestoreConfirmationDialog
        v-model:open="restoreConfirmationDialog.isOpen"
        :selected-version="selectedVersion"
        @confirm="performRestoreToVersion"
    />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2Icon } from 'lucide-vue-next';
import type { ServiceInterface } from '@/views/AWS/Services/types/service.interface';
import { VariableType } from '@/types/aws/environment-variable.enums';
import { useUnsavedChanges } from '../composables/useUnsavedChanges';
import { useDialogStates } from '../composables/useDialogStates';
import { useServiceEnvironmentData } from '../composables/useServiceEnvironmentData';
import { useVersionManagement } from '../composables/useVersionManagement';
import EnvironmentVariablesTable from './EnvironmentVariablesTableWrapper.vue';
import BulkAddDialog from './BulkAddDialog.vue';
import BulkOperationsDialog from './BulkOperationsDialog.vue';
import VersionComparisonDialog from './VersionComparisonDialog.vue';
import RestoreConfirmationDialog from './RestoreConfirmationDialog.vue';
import ServiceEnvironmentDialogHeader from './ServiceEnvironmentDialogHeader.vue';
import VersionManagement from './VersionManagement.vue';
import ContainerTabs from './ContainerTabs.vue';

const props = defineProps<{
    open: boolean;
    service: ServiceInterface | null;
}>();

const emit = defineEmits<{
    (e: 'update:open', value: boolean): void;
    (e: 'refresh'): void;
}>();

// Composables
const { hasUnsavedChanges, getUnsavedChangesCount } = useUnsavedChanges();
const {
    isDeleting,
    isSaving,
    isRestoring,
    bulkAddDialog,
    bulkOperationsDialog,
    versionComparisonDialog,
    restoreConfirmationDialog,
    openBulkAdd,
    openBulkOperations,
    openVersionComparison,
    openRestoreConfirmation,
    closeRestoreConfirmation,
} = useDialogStates();

const {
    selectedContainer,
    selectedVariables,
    hasChanges,
    hasPendingChanges,
    versionEnvironmentVariables,
    isLoadingVersionData,
    getCurrentService,
    getCurrentContainer,
    getTotalVariablesCount,
    getTotalSecretsCount,
    getEffectiveSelectedVariables,
    loadVersionData,
    validateParameterName,
    store,
    awsService,
    toast,
} = useServiceEnvironmentData();

const {
    selectedVersion,
    availableVersions,
    isLoadingVersions,
    isLatestVersion,
    loadVersions,
    performRollback,
    setupVersionWatchers,
} = useVersionManagement();

const environmentVariablesTableRef = ref<any>(null);

// Computed properties
const isOpen = computed({
    get: () => props.open,
    set: (value) => emit('update:open', value),
});

const service = computed(() => getCurrentService(props.service));

const hasStoredUnsavedChanges = computed(() => {
    if (!service.value) return false;
    return hasUnsavedChanges(service.value.name, service.value.clusterName);
});

const unsavedChangesCount = computed(() => {
    if (!service.value) return 0;
    return getUnsavedChangesCount(service.value.name, service.value.clusterName);
});

const currentContainer = computed(() => getCurrentContainer(service.value));

const totalVariablesCount = computed(() => getTotalVariablesCount(service.value));

const totalSecretsCount = computed(() => getTotalSecretsCount(service.value));

const effectiveSelectedVariables = computed(() => getEffectiveSelectedVariables(service.value));

// Setup version management watchers
setupVersionWatchers(
    () => service.value,
    selectedContainer,
    versionEnvironmentVariables,
    isLoadingVersionData,
    async (revision: number) => {
        if (!service.value || !selectedContainer.value) return null;
        return await loadVersionData(service.value, selectedContainer.value, revision);
    }
);

// Restore version methods
const confirmRestoreToVersion = () => {
    if (!service.value || !selectedContainer.value) return;
    if (!selectedVersion.value) return;
    if (selectedVersion.value === availableVersions.value[0]?.revision.toString()) return;

    openRestoreConfirmation();
};

const performRestoreToVersion = async () => {
    if (!service.value || !selectedContainer.value) return;
    if (!selectedVersion.value) return;
    if (selectedVersion.value === availableVersions.value[0]?.revision.toString()) return;

    closeRestoreConfirmation();

    const revision = parseInt(selectedVersion.value);
    await performRollback(
        service.value,
        selectedContainer.value,
        revision,
        isRestoring,
        () => emit('refresh')
    );
};

const handleDelete = async (deleteData: any) => {
    if (!service.value || !selectedContainer.value) return;

    isDeleting.value = true;
    try {
        if (deleteData.isBulk) {
            // Handle bulk delete - separate environment variables and secrets
            const environmentVariables = deleteData.variables.filter((v: any) => v.type === VariableType.ENVIRONMENT);
            const secrets = deleteData.variables.filter((v: any) => v.type === VariableType.SECRET);

            const payload: any = {
                clusterName: service.value.clusterName,
                serviceName: service.value.name,
                containerName: selectedContainer.value,
            };

            if (environmentVariables.length > 0) {
                payload.variableNames = environmentVariables.map((v: any) => v.name);
            }

            if (secrets.length > 0) {
                payload.secretNames = secrets.map((v: any) => v.name);
            }

            await awsService.removeEnvironmentVariables(payload);

            toast({
                variant: 'success',
                title: 'Variables Deleted',
                description: `Successfully deleted ${environmentVariables.length} environment variables and ${secrets.length} secrets.`,
            });
        } else {
            // Handle single delete
            const payload: any = {
                clusterName: service.value.clusterName,
                serviceName: service.value.name,
                containerName: selectedContainer.value,
            };

            if (deleteData.type === VariableType.ENVIRONMENT) {
                payload.variableNames = [deleteData.name];
            } else if (deleteData.type === VariableType.SECRET) {
                payload.secretNames = [deleteData.name];
            }

            await awsService.removeEnvironmentVariables(payload);

            const variableTypeLabel = deleteData.type === VariableType.SECRET ? 'Secret' : 'Variable';
            toast({
                variant: 'success',
                title: `${variableTypeLabel} Deleted`,
                description: `Successfully deleted ${deleteData.name}.`,
            });
        }

        hasChanges.value = true;

        // Refresh data from backend
        store.manualRefresh();

        // Emit refresh to parent to reload service data
        emit('refresh');
    } catch (error: any) {
        console.error('Failed to delete variable(s):', error);
        toast({
            variant: 'destructive',
            title: 'Failed to Delete',
            description: error.message || 'An unexpected error occurred while deleting variables.',
        });
    } finally {
        isDeleting.value = false;
    }
};

const handleBulkSelect = (variables: string[]) => {
    selectedVariables.value = variables;
};

const handleAddNew = (variable: any) => {
    // This is called when "Add Public Variable" or "Add Secret" is clicked
    // It should only show the inputs, not make any API calls
    // The actual API call happens when Save Changes button is clicked
};

const handleBulkAdded = () => {
    // Called when bulk add dialog completes successfully
    store.manualRefresh();
    emit('refresh');
};

const handlePendingChanges = (hasPending: boolean) => {
    hasPendingChanges.value = hasPending;
};

// Event handlers

const handleSaveAllChanges = async (changes: { newVariables: any[]; editedVariables: any[] }) => {
    if (!service.value || !selectedContainer.value) return;

    isSaving.value = true;
    try {
        // Validate secret names before processing
        const allSecrets = [...changes.newVariables.filter((v) => v.isSecret), ...changes.editedVariables.filter((v) => v.isSecret)];

        for (const secret of allSecrets) {
            const validation = validateParameterName(secret.name);
            if (!validation.isValid) {
                toast({
                    variant: 'destructive',
                    title: 'Invalid Secret Name',
                    description: `Secret "${secret.name}": ${validation.error}`,
                });
                return;
            }
        }
        // Process new variables (POST requests)
        if (changes.newVariables.length > 0) {
            // Separate environment variables and secrets
            const newEnvVars = changes.newVariables.filter((v) => !v.isSecret);
            const newSecrets = changes.newVariables.filter((v) => v.isSecret);

            const addPayload: any = {
                clusterName: service.value.clusterName,
                serviceName: service.value.name,
                containerName: selectedContainer.value,
            };

            if (newEnvVars.length > 0) {
                addPayload.environmentVariables = newEnvVars.map((v) => ({
                    name: v.name,
                    value: v.value,
                }));
            }

            if (newSecrets.length > 0) {
                addPayload.secrets = newSecrets.map((v) => ({
                    name: v.name,
                    valueFrom: v.value,
                }));
            }

            if (newEnvVars.length > 0 || newSecrets.length > 0) {
                await awsService.addEnvironmentVariables(addPayload);
            }
        }

        // Process edited variables (PUT requests)
        if (changes.editedVariables.length > 0) {
            // Separate environment variables and secrets
            const editedEnvVars = changes.editedVariables.filter((v) => !v.isSecret);
            const editedSecrets = changes.editedVariables.filter((v) => v.isSecret);

            const editPayload: any = {
                clusterName: service.value.clusterName,
                serviceName: service.value.name,
                containerName: selectedContainer.value,
            };

            if (editedEnvVars.length > 0) {
                editPayload.environmentVariables = editedEnvVars.map((v) => ({
                    name: v.name,
                    value: v.value,
                }));
            }

            if (editedSecrets.length > 0) {
                editPayload.secrets = editedSecrets.map((v) => ({
                    name: v.name,
                    valueFrom: v.value,
                }));
            }

            if (editedEnvVars.length > 0 || editedSecrets.length > 0) {
                await awsService.editEnvironmentVariables(editPayload);
            }
        }

        hasChanges.value = true;
        hasPendingChanges.value = false;

        // Refresh data from backend
        store.manualRefresh();

        // Emit refresh to parent to reload service data
        emit('refresh');

        const newEnvCount = changes.newVariables.filter((v) => !v.isSecret).length;
        const newSecretCount = changes.newVariables.filter((v) => v.isSecret).length;
        const editedEnvCount = changes.editedVariables.filter((v) => !v.isSecret).length;
        const editedSecretCount = changes.editedVariables.filter((v) => v.isSecret).length;

        toast({
            variant: 'success',
            title: 'Changes Saved',
            description: `Successfully saved ${newEnvCount + newSecretCount} new variables (${newEnvCount} env, ${newSecretCount} secrets) and ${editedEnvCount + editedSecretCount} edited variables (${editedEnvCount} env, ${editedSecretCount} secrets).`,
        });
    } catch (error: any) {
        console.error('Failed to save changes:', error);
        toast({
            variant: 'destructive',
            title: 'Failed to Save Changes',
            description: error.message || 'An unexpected error occurred while saving changes.',
        });
    } finally {
        isSaving.value = false;
    }
};

const saveChanges = () => {
    // Trigger the table to save all pending changes
    if (environmentVariablesTableRef.value) {
        environmentVariablesTableRef.value.saveAllChanges();
    }
};

const closeDialog = () => {
    // Reset any pending changes before closing
    if (environmentVariablesTableRef.value && hasPendingChanges.value) {
        environmentVariablesTableRef.value.clearPendingChanges();
    }

    isOpen.value = false;
    hasChanges.value = false;
    hasPendingChanges.value = false;
    selectedVariables.value = [];
    versionEnvironmentVariables.value = null;
    selectedVersion.value = '';
};

const handleRefresh = () => {
    if (service.value && selectedContainer.value) {
        loadVersions(service.value, selectedContainer.value);
    }
    emit('refresh');
};
</script>
