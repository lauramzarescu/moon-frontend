<template>
    <Dialog v-model:open="isOpen">
        <DialogContent class="max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
                <DialogTitle class="flex items-center gap-3">
                    <GitCompareIcon class="h-5 w-5 text-primary" />
                    Version Comparison
                    <Badge v-if="services.length === 1" variant="outline" class="ml-2">
                        {{ services[0]?.name }}
                    </Badge>
                </DialogTitle>
                <DialogDescription> Compare environment variables and secrets between different versions </DialogDescription>
            </DialogHeader>

            <!-- Version Selectors -->
            <div class="flex items-center gap-4 py-4 border-b">
                <div class="flex items-center gap-2">
                    <Label class="text-sm font-medium">From:</Label>
                    <Select v-model="fromVersion" :disabled="isLoadingVersions">
                        <SelectTrigger class="w-[200px]">
                            <SelectValue placeholder="Select version">
                                <div v-if="isLoadingVersions" class="flex items-center gap-2">
                                    <Loader2Icon class="h-3 w-3 animate-spin" />
                                    Loading...
                                </div>
                                <span v-else-if="fromVersion">
                                    {{
                                        availableVersions.find((v) => v.revision.toString() === fromVersion)?.label ||
                                        `Revision ${fromVersion}`
                                    }}
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

                <ArrowRightIcon class="h-4 w-4 text-muted-foreground" />

                <div class="flex items-center gap-2">
                    <Label class="text-sm font-medium">To:</Label>
                    <Select v-model="toVersion" :disabled="isLoadingVersions">
                        <SelectTrigger class="w-[200px]">
                            <SelectValue placeholder="Select version">
                                <div v-if="isLoadingVersions" class="flex items-center gap-2">
                                    <Loader2Icon class="h-3 w-3 animate-spin" />
                                    Loading...
                                </div>
                                <span v-else-if="toVersion">
                                    {{
                                        availableVersions.find((v) => v.revision.toString() === toVersion)?.label || `Revision ${toVersion}`
                                    }}
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

                <div class="flex-1" />

                <div class="flex items-center gap-2">
                    <Button size="sm" variant="outline" @click="swapVersions" :disabled="!fromVersion || !toVersion">
                        <ArrowUpDownIcon class="h-4 w-4" />
                    </Button>
                    <Button
                        size="sm"
                        @click="performComparison"
                        :disabled="!fromVersion || !toVersion || fromVersion === toVersion || isLoading"
                    >
                        <Loader2Icon v-if="isLoading" class="h-4 w-4 mr-2 animate-spin" />
                        Compare
                    </Button>
                </div>
            </div>

            <!-- Comparison Results -->
            <div v-if="comparisonResult" class="flex-1 overflow-hidden flex flex-col">
                <!-- Summary Stats -->
                <div class="grid grid-cols-4 gap-4 py-4 border-b">
                    <div class="text-center">
                        <div class="text-2xl font-bold text-green-600">{{ comparisonResult.added.length }}</div>
                        <div class="text-sm text-muted-foreground">Added</div>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl font-bold text-red-600">{{ comparisonResult.removed.length }}</div>
                        <div class="text-sm text-muted-foreground">Removed</div>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl font-bold text-yellow-600">{{ comparisonResult.modified.length }}</div>
                        <div class="text-sm text-muted-foreground">Modified</div>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl font-bold text-blue-600">{{ comparisonResult.unchanged.length }}</div>
                        <div class="text-sm text-muted-foreground">Unchanged</div>
                    </div>
                </div>

                <!-- Filter Tabs -->
                <div class="border-b">
                    <div class="flex space-x-1 p-1">
                        <button
                            v-for="filter in comparisonFilters"
                            :key="filter.key"
                            @click="activeFilter = filter.key"
                            :class="[
                                'px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 flex items-center gap-2',
                                activeFilter === filter.key
                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                            ]"
                        >
                            <component :is="filter.icon" class="h-4 w-4" />
                            {{ filter.label }}
                            <Badge variant="secondary" class="text-xs">
                                {{ getFilterCount(filter.key) }}
                            </Badge>
                        </button>
                    </div>
                </div>

                <!-- Comparison Table -->
                <div class="flex-1 overflow-y-auto">
                    <div class="p-4 pt-6">
                        <div v-if="filteredComparison.length === 0" class="text-center py-8 text-muted-foreground">
                            No {{ activeFilter }} variables found
                        </div>

                        <Transition name="fade" mode="out-in">
                            <div :key="activeFilter" class="space-y-3">
                                <div
                                    v-for="item in filteredComparison"
                                    :key="`${item.name}-${item.type}`"
                                    :class="getComparisonCardClass(item.status)"
                                    class="border rounded-lg p-4 transition-colors duration-200 hover:shadow-md"
                                >
                                    <div class="flex items-start justify-between gap-4">
                                        <div class="flex-1">
                                            <div class="flex items-center gap-3 mb-2">
                                                <Badge :variant="getStatusVariant(item.status)" class="text-xs">
                                                    {{ item.status }}
                                                </Badge>
                                                <code class="text-sm font-mono bg-muted/50 px-2 py-1 rounded">
                                                    {{ item.name }}
                                                </code>
                                                <Badge :variant="item.type === 'environment' ? 'default' : 'secondary'" class="text-xs">
                                                    {{ item.type }}
                                                </Badge>
                                            </div>

                                            <div class="grid grid-cols-2 gap-4">
                                                <div>
                                                    <div class="flex items-center gap-2 mb-2">
                                                        <Badge variant="outline" class="text-[10px] font-medium">
                                                            <GitBranchIcon class="h-2.5 w-2.5 mr-1" />
                                                            Revision {{ fromVersion }}
                                                        </Badge>
                                                    </div>
                                                    <div
                                                        class="text-sm font-mono bg-muted/40 p-3 rounded-md border min-h-[60px] flex items-start"
                                                    >
                                                        <span class="break-all">{{ item.fromValue || '(not set)' }}</span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <div class="flex items-center gap-2 mb-2">
                                                        <Badge variant="outline" class="text-[10px] font-medium">
                                                            <GitBranchIcon class="h-2.5 w-2.5 mr-1" />
                                                            Revision {{ toVersion }}
                                                        </Badge>
                                                    </div>
                                                    <div
                                                        class="text-sm font-mono bg-muted/40 p-3 rounded-md border min-h-[60px] flex items-start"
                                                    >
                                                        <span class="break-all">{{ item.toValue || '(not set)' }}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div class="flex items-center gap-2">
                                            <Button
                                                v-if="item.status !== 'unchanged'"
                                                size="sm"
                                                variant="outline"
                                                @click="copyToVersion(item)"
                                            >
                                                <CopyIcon class="h-4 w-4 mr-2" />
                                                Copy to {{ toVersion }}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Transition>
                    </div>
                </div>
            </div>

            <!-- Empty State -->
            <div v-else class="flex-1 flex items-center justify-center">
                <div class="text-center">
                    <GitCompareIcon class="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 class="text-lg font-medium mb-2">Select versions to compare</h3>
                    <p class="text-muted-foreground">
                        Choose two different versions to see the differences in environment variables and secrets.
                    </p>
                </div>
            </div>

            <!-- Footer -->
            <div class="flex items-center justify-end gap-2 pt-4 border-t">
                <Button variant="outline" @click="closeDialog"> Close </Button>
            </div>
        </DialogContent>
    </Dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch, Transition } from 'vue';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    ArrowRightIcon,
    ArrowUpDownIcon,
    CheckIcon,
    CopyIcon,
    EditIcon,
    GitBranchIcon,
    GitCompareIcon,
    Loader2Icon,
    MinusIcon,
    PlusIcon,
} from 'lucide-vue-next';
import type { ServiceInterface } from '@/views/AWS/Services/types/service.interface';
import { useToast } from '@/components/ui/toast';
import { AwsService } from '@/services/aws.service';
import { withDelay } from '@/utils';

interface ComparisonItem {
    name: string;
    type: 'environment' | 'secret';
    status: 'added' | 'removed' | 'modified' | 'unchanged';
    fromValue?: string;
    toValue?: string;
    container: string;
}

interface ComparisonResult {
    added: ComparisonItem[];
    removed: ComparisonItem[];
    modified: ComparisonItem[];
    unchanged: ComparisonItem[];
}

const props = defineProps<{
    open: boolean;
    services: ServiceInterface[];
    service?: ServiceInterface | null;
    currentVersion?: string;
}>();

const emit = defineEmits<{
    (e: 'update:open', value: boolean): void;
}>();

const { toast } = useToast();
const awsService = new AwsService();

// Reactive state
const fromVersion = ref<string>('');
const toVersion = ref<string>('');
const activeFilter = ref<string>('all');
const comparisonResult = ref<ComparisonResult | null>(null);
const isLoading = ref<boolean>(false);

// Computed properties
const isOpen = computed({
    get: () => props.open,
    set: (value) => emit('update:open', value),
});

// Real version management using API
const availableVersions = ref<Array<{ revision: number; label: string }>>([]);
const isLoadingVersions = ref(false);

const loadVersions = async () => {
    const service = props.service || (props.services && props.services[0]);
    if (!service || !service.containers.length) return;

    isLoadingVersions.value = true;
    try {
        const response = await awsService.getEnvironmentVariableVersions({
            clusterName: service.clusterName,
            serviceName: service.name,
            containerName: service.containers[0].name,
        });

        availableVersions.value = response.versions.map((version: any) => ({
            revision: version.revision,
            label: `v${version.revision} (${new Date(version.registeredAt).toLocaleDateString()})`,
        }));

        // Set default versions
        if (availableVersions.value.length >= 2) {
            toVersion.value = availableVersions.value[0].revision.toString();
            fromVersion.value = availableVersions.value[1].revision.toString();

            // Auto-execute comparison with delay to avoid debouncing issues
            await withDelay(async () => {
                if (props.open && fromVersion.value !== toVersion.value) {
                    await performComparison();
                }
            });
        } else if (availableVersions.value.length === 1) {
            toVersion.value = availableVersions.value[0].revision.toString();
            fromVersion.value = availableVersions.value[0].revision.toString();
        }
    } catch (error: any) {
        console.error('Failed to load versions:', error);
        // Fallback to mock data
        const baseVersion = service.taskDefinition.revision;
        availableVersions.value = [
            { revision: baseVersion, label: `v${baseVersion} (current)` },
            { revision: baseVersion - 1, label: `v${baseVersion - 1}` },
            { revision: baseVersion - 2, label: `v${baseVersion - 2}` },
        ];
        if (!toVersion.value) {
            toVersion.value = baseVersion.toString();
        }
        if (!fromVersion.value) {
            fromVersion.value = (baseVersion - 1).toString();
        }

        // Auto-execute comparison with fallback data and delay to avoid debouncing
        await withDelay(async () => {
            if (props.open && fromVersion.value !== toVersion.value) {
                await performComparison();
            }
        });
    } finally {
        isLoadingVersions.value = false;
    }
};

const comparisonFilters = computed(() => [
    { key: 'all', label: 'All Changes', icon: GitCompareIcon },
    { key: 'added', label: 'Added', icon: PlusIcon },
    { key: 'removed', label: 'Removed', icon: MinusIcon },
    { key: 'modified', label: 'Modified', icon: EditIcon },
    { key: 'unchanged', label: 'Unchanged', icon: CheckIcon },
]);

const filteredComparison = computed(() => {
    if (!comparisonResult.value) return [];

    if (activeFilter.value === 'all') {
        return [
            ...comparisonResult.value.added,
            ...comparisonResult.value.removed,
            ...comparisonResult.value.modified,
            ...comparisonResult.value.unchanged,
        ];
    }

    return comparisonResult.value[activeFilter.value as keyof ComparisonResult] || [];
});

watch(
    () => props.open,
    async (isOpen) => {
        if (isOpen) {
            await loadVersions();
        }
    },
    { immediate: true },
);

watch(availableVersions, async (newVersions) => {
    if (newVersions.length > 0 && (!fromVersion.value || !toVersion.value)) {
        let shouldCompare = false;

        if (newVersions.length >= 2) {
            if (!toVersion.value) {
                toVersion.value = newVersions[0].revision.toString();
                shouldCompare = true;
            }
            if (!fromVersion.value) {
                fromVersion.value = newVersions[1].revision.toString();
                shouldCompare = true;
            }
        } else if (newVersions.length === 1) {
            if (!toVersion.value) toVersion.value = newVersions[0].revision.toString();
            if (!fromVersion.value) fromVersion.value = newVersions[0].revision.toString();
        }

        // Auto-execute comparison if we just set default values and dialog is open
        if (shouldCompare && props.open && fromVersion.value && toVersion.value && fromVersion.value !== toVersion.value) {
            await withDelay(performComparison);
        }
    }
});

watch(
    () => props.currentVersion,
    (newVersion) => {
        if (newVersion && availableVersions.value.length > 0) {
            toVersion.value = newVersion;
            // Find a different version for comparison
            const currentRevision = parseInt(newVersion.replace(/^v(\d+)\..*/, '$1'));
            const otherVersion = availableVersions.value.find((v) => v.revision !== currentRevision);
            if (otherVersion) {
                fromVersion.value = otherVersion.revision.toString();
            }
        }
    },
);

watch(
    [fromVersion, toVersion],
    async () => {
        if (fromVersion.value && toVersion.value && fromVersion.value !== toVersion.value) {
            await withDelay(performComparison);
        }
    },
    { immediate: false },
);

const swapVersions = async () => {
    const temp = fromVersion.value;
    fromVersion.value = toVersion.value;
    toVersion.value = temp;
    if (comparisonResult.value) {
        await performComparison();
    }
};

const performComparison = async () => {
    if (!fromVersion.value || !toVersion.value || fromVersion.value === toVersion.value) {
        return;
    }

    if (!props.service && (!props.services || props.services.length === 0)) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'No service selected for comparison.',
        });
        return;
    }

    const service = props.service || props.services[0];
    const container = service.containers[0];

    isLoading.value = true;

    try {
        const revision1 = parseInt(fromVersion.value);
        const revision2 = parseInt(toVersion.value);

        const response = await awsService.compareEnvironmentVariables({
            clusterName: service.clusterName,
            serviceName: service.name,
            containerName: container.name,
            revision1,
            revision2,
        });

        const comparison = response.comparison;
        const transformedResult: ComparisonResult = {
            added: comparison.added.map((item: any) => ({
                name: item.name,
                type: 'environment',
                status: 'added' as const,
                toValue: item.value,
                container: container.name,
            })),
            removed: comparison.removed.map((item: any) => ({
                name: item.name,
                type: 'environment',
                status: 'removed' as const,
                fromValue: item.value,
                container: container.name,
            })),
            modified: comparison.modified.map((item: any) => ({
                name: item.name,
                type: 'environment',
                status: 'modified' as const,
                fromValue: item.oldValue,
                toValue: item.newValue,
                container: container.name,
            })),
            unchanged: comparison.unchanged.map((item: any) => ({
                name: item.name,
                type: 'environment',
                status: 'unchanged' as const,
                fromValue: item.value,
                toValue: item.value,
                container: container.name,
            })),
        };

        comparisonResult.value = transformedResult;
        activeFilter.value = 'all';

        toast({
            variant: 'success',
            title: 'Comparison Complete',
            description: `Found ${Object.values(transformedResult).reduce((total, items) => total + items.length, 0)} variables.`,
        });
    } catch (error: any) {
        console.error('Failed to compare versions:', error);
        toast({
            variant: 'destructive',
            title: 'Comparison Failed',
            description: error?.message || 'Failed to compare environment variable versions.',
        });
    } finally {
        isLoading.value = false;
    }
};

const getFilterCount = (filterKey: string): number => {
    if (!comparisonResult.value) return 0;

    if (filterKey === 'all') {
        return Object.values(comparisonResult.value).reduce((total, items) => total + items.length, 0);
    }

    return comparisonResult.value[filterKey as keyof ComparisonResult]?.length || 0;
};

const getStatusVariant = (status: string) => {
    switch (status) {
        case 'added':
            return 'default';
        case 'removed':
            return 'destructive';
        case 'modified':
            return 'secondary';
        case 'unchanged':
            return 'outline';
        default:
            return 'outline';
    }
};

const getComparisonCardClass = (status: string) => {
    switch (status) {
        case 'added':
            return 'bg-muted/30 border-border hover:bg-muted/50';
        case 'removed':
            return 'bg-muted/30 border-border hover:bg-muted/50';
        case 'modified':
            return 'bg-muted/30 border-border hover:bg-muted/50';
        case 'unchanged':
            return 'bg-muted/20 border-border hover:bg-muted/40';
        default:
            return 'bg-background border-border hover:bg-muted/20';
    }
};

const copyToVersion = async (item: ComparisonItem) => {
    if (!props.service && (!props.services || props.services.length === 0)) {
        return;
    }

    const service = props.service || props.services[0];
    const container = service.containers[0];

    try {
        await awsService.editEnvironmentVariables({
            clusterName: service.clusterName,
            serviceName: service.name,
            containerName: container.name,
            environmentVariables: [
                {
                    name: item.name,
                    value: item.toValue || item.fromValue || '',
                },
            ],
        });

        toast({
            variant: 'success',
            title: 'Variable Copied',
            description: `${item.name} has been copied to ${toVersion.value}`,
        });

        // Refresh the comparison
        await withDelay(performComparison);
    } catch (error: any) {
        console.error('Failed to copy variable:', error);
        toast({
            variant: 'destructive',
            title: 'Copy Failed',
            description: error?.message || 'Failed to copy variable.',
        });
    }
};

const closeDialog = () => {
    isOpen.value = false;
    comparisonResult.value = null;
    activeFilter.value = 'all';
};
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
