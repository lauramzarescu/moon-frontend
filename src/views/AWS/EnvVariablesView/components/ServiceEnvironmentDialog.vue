<template>
    <Dialog v-model:open="isOpen">
        <DialogContent class="max-w-7xl max-h-[90vh] flex flex-col min-h-0">
            <DialogHeader>
                <DialogTitle class="flex items-center gap-3">
                    <div class="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <ServerIcon class="h-4 w-4" />
                    </div>
                    <div class="flex items-center flex-wrap gap-2">
                        <span class="text-lg font-semibold mr-1">{{ service?.name }}</span>
                        <Badge variant="secondary" class="text-xs">{{ service?.clusterName }}</Badge>
                        <Badge :variant="service?.status === 'ACTIVE' ? 'default' : 'secondary'" class="text-xs">
                            {{ service?.status }}
                        </Badge>
                        <Badge v-if="hasStoredUnsavedChanges" variant="destructive" class="text-xs">
                            {{ unsavedChangesCount }} Unsaved Changes
                        </Badge>
                    </div>
                </DialogTitle>
                <DialogDescription class="mt-2"> Manage environment variables and secrets for this service </DialogDescription>
            </DialogHeader>

            <!-- Version Selector and Actions -->
            <div class="flex items-center justify-between gap-3 pt-3 pb-3">
                <div class="flex items-center gap-3">
                    <div class="flex items-center gap-2">
                        <Label class="text-sm font-medium">Version:</Label>
                        <Select v-model="selectedVersion" :disabled="isLoadingVersions">
                            <SelectTrigger class="w-[260px]">
                                <SelectValue>
                                    <div v-if="isLoadingVersions" class="flex items-center gap-2">
                                        <Loader2Icon class="h-3 w-3 animate-spin" />
                                        Loading...
                                    </div>
                                    <span v-else>
                                        {{
                                            availableVersions.find((v) => v.revision.toString() === selectedVersion)?.label ||
                                            'Select version'
                                        }}
                                    </span>
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectItem
                                        v-for="(version, idx) in availableVersions"
                                        :key="version.revision"
                                        :value="version.revision.toString()"
                                    >
                                        <div class="flex items-center justify-between gap-3">
                                            <span>{{ version.label }}</span>
                                            <Badge v-if="idx === 0" variant="outline" class="text-[10px]">Latest</Badge>
                                        </div>
                                    </SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button size="sm" variant="outline" @click="openVersionComparison" class="hover:shadow-sm transition-all duration-200">
                        <GitCompareIcon class="h-4 w-4 mr-2" />
                        Compare
                    </Button>
                    <Button
                        v-if="selectedVersion && selectedVersion !== availableVersions[0].revision.toString()"
                        size="sm"
                        variant="outline"
                        @click="confirmRestoreToVersion"
                        class="hover:shadow-sm group transition-all duration-200"
                    >
                        <RefreshCwIcon class="h-4 w-4 transition-transform duration-200 group-hover:rotate-180" />
                        Restore to this version
                    </Button>
                </div>

                <div class="flex items-center gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        :disabled="!hasPermission(PermissionEnum.AWS_SERVICE_WRITE)"
                        @click="openBulkAdd"
                        class="hover:shadow-sm transition-all duration-200"
                    >
                        <PlusIcon class="h-4 w-4 mr-2" />
                        Add Variable
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        :disabled="!hasPermission(PermissionEnum.AWS_SERVICE_WRITE)"
                        @click="openBulkOperations"
                        class="hover:shadow-sm transition-all duration-200"
                    >
                        <SettingsIcon class="h-4 w-4 mr-2" />
                        Bulk Operations
                    </Button>
                </div>
            </div>

            <!-- Container Tabs -->
            <div class="flex-1 flex flex-col min-h-0">
                <div class="border-b">
                    <div class="flex items-center px-3 py-1">
                        <button
                            v-for="container in service?.containers"
                            :key="container.name"
                            @click="selectedContainer = container.name"
                            :class="[
                                'inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-t-md border-b-2 transition-all duration-200 -mb-px',
                                selectedContainer === container.name
                                    ? 'bg-background text-foreground border-primary'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/30 border-transparent',
                            ]"
                        >
                            {{ container.name }}
                        </button>
                    </div>
                </div>

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
    <Dialog v-model:open="restoreConfirmationDialog.isOpen">
        <DialogContent class="max-w-md">
            <DialogHeader>
                <DialogTitle>Restore to Version</DialogTitle>
                <DialogDescription>
                    Are you sure you want to restore to <strong>version {{ selectedVersion }}</strong>?
                    <br><br>
                    This will replace the current environment variables with those from the selected version. This action cannot be undone.
                </DialogDescription>
            </DialogHeader>
            <DialogFooter class="gap-2">
                <Button variant="outline" @click="restoreConfirmationDialog.isOpen = false">
                    Cancel
                </Button>
                <Button variant="destructive" @click="performRestoreToVersion">
                    Restore to Version
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>

<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue';
import moment from 'moment';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GitCompareIcon, Loader2Icon, PlusIcon, RefreshCwIcon, ServerIcon, SettingsIcon } from 'lucide-vue-next';
import type { ServiceInterface } from '@/views/AWS/Services/types/service.interface';
import { AwsService } from '@/services/aws.service';
import { useToast } from '@/components/ui/toast';
import { useDataStore } from '@/stores/dataStore';
import { storeToRefs } from 'pinia';
import { VariableType } from '@/types/aws/environment-variable.enums';
import { useUnsavedChanges } from '../composables/useUnsavedChanges';
import EnvironmentVariablesTable from './EnvironmentVariablesTableWrapper.vue';
import BulkAddDialog from './BulkAddDialog.vue';
import BulkOperationsDialog from './BulkOperationsDialog.vue';
import VersionComparisonDialog from './VersionComparisonDialog.vue';
import { PermissionEnum } from '@/enums/user/user.enum.ts';
import { usePermissions } from '@/composables/usePermissions.ts';

const props = defineProps<{
    open: boolean;
    service: ServiceInterface | null;
}>();

const emit = defineEmits<{
    (e: 'update:open', value: boolean): void;
    (e: 'refresh'): void;
}>();

const awsService = new AwsService();
const { toast } = useToast();
const { hasPermission } = usePermissions();
const store = useDataStore();
const { services } = storeToRefs(store);
const { hasUnsavedChanges, getUnsavedChangesCount } = useUnsavedChanges();

const environmentVariablesTableRef = ref<any>(null);
const selectedContainer = ref<string>('');
const selectedVersion = ref<string>('');
const selectedVariables = ref<string[]>([]);
const hasChanges = ref(false);
const hasPendingChanges = ref(false);
const versionEnvironmentVariables = ref<any>(null);
const isLoadingVersionData = ref(false);

const isDeleting = ref(false);
const isSaving = ref(false);
const isRestoring = ref(false);

const bulkAddDialog = reactive({ isOpen: false });
const bulkOperationsDialog = reactive({ isOpen: false });
const versionComparisonDialog = reactive({ isOpen: false });
const restoreConfirmationDialog = reactive({ isOpen: false });

const isOpen = computed({
    get: () => props.open,
    set: (value) => emit('update:open', value),
});

const service = computed(() => {
    if (!props.service) return null;

    // Find the current service in the store's services array
    const currentService = services.value.find((s) => s.name === props.service?.name && s.clusterName === props.service?.clusterName);

    return currentService || props.service;
});

// Unsaved changes detection
const hasStoredUnsavedChanges = computed(() => {
    if (!service.value) return false;
    return hasUnsavedChanges(service.value.name, service.value.clusterName);
});

const unsavedChangesCount = computed(() => {
    if (!service.value) return 0;
    return getUnsavedChangesCount(service.value.name, service.value.clusterName);
});

const currentContainer = computed(() => {
    if (!service.value || !selectedContainer.value) return null;

    const baseContainer = service.value.containers.find((c) => c.name === selectedContainer.value);
    if (!baseContainer) return null;

    // If we have version-specific data, use it; otherwise use base container
    if (versionEnvironmentVariables.value) {
        return {
            ...baseContainer,
            environmentVariables: versionEnvironmentVariables.value,
        };
    }

    return baseContainer;
});

// Real version management using API
const availableVersions = ref<Array<{ revision: number; label: string; arn: string; registeredAt: string }>>([]);
const isLoadingVersions = ref(false);

const formatVersionDate = (dateStr: string) => moment(dateStr).format('MMM D, YYYY [at] h:mm A');

const loadVersions = async () => {
    if (!service.value || !selectedContainer.value) return;

    isLoadingVersions.value = true;
    try {
        const response = await awsService.getEnvironmentVariableVersions({
            clusterName: service.value.clusterName,
            serviceName: service.value.name,
            containerName: selectedContainer.value,
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

const totalVariablesCount = computed(() => {
    if (!service.value) return 0;
    return service.value.containers.reduce((total, container) => {
        return total + (container.environmentVariables.environment?.length || 0);
    }, 0);
});

const isLatestVersion = computed(() => {
    if (!availableVersions.value || availableVersions.value.length === 0) return true;
    return selectedVersion.value === availableVersions.value[0].revision.toString();
});

const totalSecretsCount = computed(() => {
    if (!service.value) return 0;
    return service.value.containers.reduce((total, container) => {
        return total + (container.environmentVariables.secrets?.length || 0);
    }, 0);
});

// Generate all variable IDs for bulk operations when none are selected
const allVariableIds = computed(() => {
    if (!service.value) return [];

    const variableIds: string[] = [];

    service.value.containers.forEach((container) => {
        // Add environment variables
        container.environmentVariables.environment?.forEach((envVar) => {
            variableIds.push(`env-${envVar.name}`);
        });

        // Add secrets
        container.environmentVariables.secrets?.forEach((secret) => {
            variableIds.push(`secret-${secret.name}`);
        });
    });

    return variableIds;
});

// Use all variables if none are manually selected
const effectiveSelectedVariables = computed(() => {
    return selectedVariables.value.length > 0 ? selectedVariables.value : allVariableIds.value;
});

watch(
    () => service.value,
    async (newService) => {
        if (newService && newService.containers.length > 0) {
            selectedContainer.value = newService.containers[0].name;
            versionEnvironmentVariables.value = null;
            await nextTick();
            loadVersions();
        } else {
            versionEnvironmentVariables.value = null;
        }
    },
    { immediate: true },
);

watch(selectedContainer, () => {
    if (selectedContainer.value) {
        // Reset version-specific data when switching containers
        versionEnvironmentVariables.value = null;
        loadVersions();
    }
});

watch(selectedVersion, async (newVersion) => {
    if (newVersion && selectedContainer.value) {
        // Check if this is the latest version
        const isLatest = availableVersions.value.length > 0 && newVersion === availableVersions.value[0].revision.toString();

        // Only load version data if it's not the latest version
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
            // For latest version, clear version data to use base container
            versionEnvironmentVariables.value = null;
        }
    }
});

const openVersionComparison = () => {
    versionComparisonDialog.isOpen = true;
};

const openBulkAdd = () => {
    bulkAddDialog.isOpen = true;
};

const openBulkOperations = () => {
    bulkOperationsDialog.isOpen = true;
};

const confirmRestoreToVersion = () => {
    if (!service.value || !selectedContainer.value) return;
    if (!selectedVersion.value) return;
    if (selectedVersion.value === availableVersions.value[0].revision.toString()) return;

    restoreConfirmationDialog.isOpen = true;
};

const performRestoreToVersion = async () => {
    if (!service.value || !selectedContainer.value) return;
    if (!selectedVersion.value) return;
    if (selectedVersion.value === availableVersions.value[0].revision.toString()) return;

    restoreConfirmationDialog.isOpen = false;
    isRestoring.value = true;

    try {
        const revision = parseInt(selectedVersion.value);
        await awsService.rollbackEnvironmentVariables({
            clusterName: service.value.clusterName,
            serviceName: service.value.name,
            containerName: selectedContainer.value,
            targetRevision: revision,
        });

        toast({
            variant: 'success',
            title: 'Rollback Successful',
            description: `Successfully rolled back to version ${revision}.`,
        });

        // Refresh data from backend
        store.manualRefresh();
        emit('refresh');
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

// AWS Systems Manager parameter name validation
const validateParameterName = (name: string): { isValid: boolean; error?: string } => {
    if (!name || name.length === 0) {
        return { isValid: false, error: 'Parameter name cannot be empty' };
    }

    if (name.length > 2048) {
        return { isValid: false, error: 'Parameter name cannot exceed 2048 characters' };
    }

    if (!/^[a-zA-Z0-9]/.test(name)) {
        return { isValid: false, error: 'Parameter name must start with a letter or number' };
    }

    if (!/^[a-zA-Z0-9_.\-/]+$/.test(name)) {
        return { isValid: false, error: 'Parameter name can only contain letters, numbers, and the symbols: _ . - /' };
    }

    return { isValid: true };
};

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

const loadVersionData = async (revision: number) => {
    if (!service.value || !selectedContainer.value) return null;

    try {
        const response = await awsService.getEnvironmentVariableVersion({
            clusterName: service.value.clusterName,
            serviceName: service.value.name,
            containerName: selectedContainer.value,
            revision,
        });

        const base = service.value.containers.find((c) => c.name === selectedContainer.value);
        const secrets = base?.environmentVariables?.secrets || [];
        const envList = response.environmentVariables || [];
        return { environment: envList, secrets } as any;
    } catch (error: any) {
        console.error('Failed to load version data:', error);
        return null;
    }
};

const handleRefresh = () => {
    loadVersions();
    emit('refresh');
};
</script>
