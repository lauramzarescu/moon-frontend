<template>
    <Dialog v-model:open="isOpen">
        <DialogContent class="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
                <DialogTitle class="flex items-center gap-3">
                    <div class="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <ServerIcon class="h-4 w-4" />
                    </div>
                    <div>
                        <span class="text-lg">{{ service?.name }}</span>
                        <div class="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" class="text-xs">{{ service?.clusterName }}</Badge>
                            <Badge :variant="service?.status === 'ACTIVE' ? 'default' : 'secondary'" class="text-xs">
                                {{ service?.status }}
                            </Badge>
                        </div>
                    </div>
                </DialogTitle>
                <DialogDescription>
                    Manage environment variables and secrets for this service
                </DialogDescription>
            </DialogHeader>

            <!-- Version Selector and Actions -->
            <div class="flex items-center justify-between gap-3 py-3 border-b">
                <div class="flex items-center gap-3">
                    <div class="flex items-center gap-2">
                        <Label class="text-sm font-medium">Version:</Label>
                        <Select v-model="selectedVersion" :disabled="isLoadingVersions">
                            <SelectTrigger class="w-[200px]">
                                <SelectValue>
                                    <div v-if="isLoadingVersions" class="flex items-center gap-2">
                                        <Loader2Icon class="h-3 w-3 animate-spin" />
                                        Loading...
                                    </div>
                                    <span v-else>
                                        {{ availableVersions.find(v => v.revision.toString() === selectedVersion)?.label || 'Select version' }}
                                    </span>
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectItem
                                        v-for="version in availableVersions"
                                        :key="version.revision"
                                        :value="version.revision.toString()"
                                    >
                                        {{ version.label }}
                                    </SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button
                        size="sm"
                        variant="outline"
                        @click="openVersionComparison"
                        class="hover:shadow-sm transition-all duration-200"
                    >
                        <GitCompareIcon class="h-4 w-4 mr-2" />
                        Compare
                    </Button>
                </div>

                <div class="flex items-center gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        @click="openBulkAdd"
                        class="hover:shadow-sm transition-all duration-200"
                    >
                        <PlusIcon class="h-4 w-4 mr-2" />
                        Add Variable
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        @click="openBulkOperations"
                        class="hover:shadow-sm transition-all duration-200"
                    >
                        <SettingsIcon class="h-4 w-4 mr-2" />
                        Bulk Operations
                    </Button>
                </div>
            </div>

            <!-- Container Tabs -->
            <div class="flex-1 overflow-hidden flex flex-col">
                <div class="border-b">
                    <div class="flex space-x-1 p-1">
                        <button
                            v-for="container in service?.containers"
                            :key="container.name"
                            @click="selectedContainer = container.name"
                            :class="[
                                'px-3 py-2 text-sm font-medium rounded-md transition-all duration-200',
                                selectedContainer === container.name
                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                            ]"
                        >
                            {{ container.name }}
                        </button>
                    </div>
                </div>

                <!-- Variables Content -->
                <div class="flex-1 overflow-hidden p-4">
                    <div class="h-full overflow-y-auto">
                        <div v-if="isLoadingVersionData" class="flex items-center justify-center h-32">
                            <div class="flex items-center gap-2 text-muted-foreground">
                                <Loader2Icon class="h-5 w-5 animate-spin" />
                                Loading version data...
                            </div>
                        </div>
                        <EnvironmentVariablesTable
                            v-else-if="currentContainer"
                            :container="currentContainer"
                            :service-name="service?.name"
                            :cluster-name="service?.clusterName"
                            :selected-version="selectedVersion"
                            @edit="handleEdit"
                            @delete="handleDelete"
                            @bulk-select="handleBulkSelect"
                            @add-new="handleAddNew"
                        />
                        <div v-else class="flex items-center justify-center h-32 text-muted-foreground">
                            No container selected
                        </div>
                    </div>
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
                    <Button variant="outline" @click="closeDialog">
                        Cancel
                    </Button>
                    <Button @click="saveChanges" :disabled="!hasChanges">
                        Save Changes
                    </Button>
                </div>
            </div>
        </DialogContent>
    </Dialog>

    <!-- Sub-dialogs -->
    <BulkAddDialog
        v-model:open="bulkAddDialog.isOpen"
        :service="service"
        :container="selectedContainer"
        @added="handleRefresh"
    />

    <BulkOperationsDialog
        v-model:open="bulkOperationsDialog.isOpen"
        :service="service"
        :selected-variables="selectedVariables"
        @completed="handleRefresh"
    />

    <VersionComparisonDialog
        v-model:open="versionComparisonDialog.isOpen"
        :service="service"
        :services="service ? [service] : []"
        :current-version="selectedVersion"
    />
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    ServerIcon,
    GitCompareIcon,
    PlusIcon,
    SettingsIcon,
    Loader2Icon
} from 'lucide-vue-next';
import type { ServiceInterface, ContainerInterface } from '@/views/AWS/Services/types/service.interface';
import { AwsService } from '@/services/aws.service';
import type {
    GetVersionsResponse,
    GetVersionResponse,
    EnvironmentVariableVersion
} from '@/types/aws';

// Import sub-components
import EnvironmentVariablesTable from './EnvironmentVariablesTable.vue';
import BulkAddDialog from './BulkAddDialog.vue';
import BulkOperationsDialog from './BulkOperationsDialog.vue';
import VersionComparisonDialog from './VersionComparisonDialog.vue';

const props = defineProps<{
    open: boolean;
    service: ServiceInterface | null;
}>();

const emit = defineEmits<{
    (e: 'update:open', value: boolean): void;
    (e: 'refresh'): void;
}>();

const awsService = new AwsService();

// Reactive state
const selectedContainer = ref<string>('');
const selectedVersion = ref<string>('');
const selectedVariables = ref<string[]>([]);
const hasChanges = ref(false);
const versionEnvironmentVariables = ref<any>(null);
const isLoadingVersionData = ref(false);

// Dialog states
const bulkAddDialog = reactive({ isOpen: false });
const bulkOperationsDialog = reactive({ isOpen: false });
const versionComparisonDialog = reactive({ isOpen: false });

// Computed properties
const isOpen = computed({
    get: () => props.open,
    set: (value) => emit('update:open', value),
});

const currentContainer = computed(() => {
    if (!props.service || !selectedContainer.value) return null;

    const baseContainer = props.service.containers.find(c => c.name === selectedContainer.value);
    if (!baseContainer) return null;

    // If we have version-specific data, merge it with the base container
    if (versionEnvironmentVariables.value) {
        return {
            ...baseContainer,
            environmentVariables: versionEnvironmentVariables.value
        };
    }

    return baseContainer;
});

// Real version management using API
const availableVersions = ref<Array<{revision: number, label: string, arn: string, registeredAt: string}>>([]);
const isLoadingVersions = ref(false);

const loadVersions = async () => {
    if (!props.service || !selectedContainer.value) return;

    isLoadingVersions.value = true;
    try {
        const response = await awsService.getEnvironmentVariableVersions({
            clusterName: props.service.clusterName,
            serviceName: props.service.name,
            containerName: selectedContainer.value
        });

        availableVersions.value = response.versions.map((version: any) => ({
            revision: version.revision,
            label: `v${version.revision} (${new Date(version.registeredAt).toLocaleDateString()})`,
            arn: version.arn,
            registeredAt: version.registeredAt
        }));

        // Set current version as the latest
        if (availableVersions.value.length > 0) {
            selectedVersion.value = availableVersions.value[0].revision.toString();
        }
    } catch (error: any) {
        console.error('Failed to load versions:', error);
        // Fallback to mock data
        const baseVersion = props.service.taskDefinition.revision;
        availableVersions.value = [
            { revision: baseVersion, label: `v${baseVersion} (current)`, arn: '', registeredAt: new Date().toISOString() },
            { revision: baseVersion - 1, label: `v${baseVersion - 1}`, arn: '', registeredAt: new Date().toISOString() },
            { revision: baseVersion - 2, label: `v${baseVersion - 2}`, arn: '', registeredAt: new Date().toISOString() },
        ];
        selectedVersion.value = baseVersion.toString();
    } finally {
        isLoadingVersions.value = false;
    }
};

const totalVariablesCount = computed(() => {
    if (!props.service) return 0;
    return props.service.containers.reduce((total, container) => {
        return total + (container.environmentVariables.environment?.length || 0);
    }, 0);
});

const totalSecretsCount = computed(() => {
    if (!props.service) return 0;
    return props.service.containers.reduce((total, container) => {
        return total + (container.environmentVariables.secrets?.length || 0);
    }, 0);
});

// Watchers
watch(() => props.service, (newService) => {
    if (newService && newService.containers.length > 0) {
        selectedContainer.value = newService.containers[0].name;
        loadVersions();
    }
}, { immediate: true });

watch(selectedContainer, () => {
    if (selectedContainer.value) {
        loadVersions();
    }
});

watch(selectedVersion, async (newVersion) => {
    if (newVersion && selectedContainer.value) {
        isLoadingVersionData.value = true;
        try {
            const revision = parseInt(newVersion);
            versionEnvironmentVariables.value = await loadVersionData(revision);
        } catch (error) {
            console.error('Failed to load version data:', error);
        } finally {
            isLoadingVersionData.value = false;
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

const handleEdit = async (variable: any) => {
    if (!props.service || !selectedContainer.value) return;

    try {
        await awsService.editEnvironmentVariables({
            clusterName: props.service.clusterName,
            serviceName: props.service.name,
            containerName: selectedContainer.value,
            environmentVariables: [{
                name: variable.name,
                value: variable.value
            }]
        });

        hasChanges.value = true;
        emit('refresh');
    } catch (error: any) {
        console.error('Failed to edit variable:', error);
        // Handle error - could show toast notification
    }
};

const handleDelete = async (variable: any) => {
    if (!props.service || !selectedContainer.value) return;

    try {
        await awsService.removeEnvironmentVariables({
            clusterName: props.service.clusterName,
            serviceName: props.service.name,
            containerName: selectedContainer.value,
            variableNames: [variable.name]
        });

        hasChanges.value = true;
        emit('refresh');
    } catch (error: any) {
        console.error('Failed to delete variable:', error);
        // Handle error - could show toast notification
    }
};

const handleBulkSelect = (variables: string[]) => {
    selectedVariables.value = variables;
};

const handleAddNew = async (variable: any) => {
    if (!props.service || !selectedContainer.value || !variable.name) return;

    try {
        await awsService.addEnvironmentVariables({
            clusterName: props.service.clusterName,
            serviceName: props.service.name,
            containerName: selectedContainer.value,
            environmentVariables: [{
                name: variable.name,
                value: variable.value || ''
            }]
        });

        hasChanges.value = true;
        emit('refresh');
    } catch (error: any) {
        console.error('Failed to add variable:', error);
        // Handle error - could show toast notification
    }
};

const saveChanges = () => {
    // Save all pending changes
    hasChanges.value = false;
    emit('refresh');
};

const closeDialog = () => {
    isOpen.value = false;
    hasChanges.value = false;
    selectedVariables.value = [];
};

const loadVersionData = async (revision: number) => {
    if (!props.service || !selectedContainer.value) return null;

    try {
        const response = await awsService.getEnvironmentVariableVersion({
            clusterName: props.service.clusterName,
            serviceName: props.service.name,
            containerName: selectedContainer.value,
            revision
        });

        return response.environmentVariables;
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
