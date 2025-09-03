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
                    <div class="flex space-x-1 p-1 py-2">
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
                <div class="flex-1 overflow-y-auto w-full">
                    <div class="p-4 pt-6">
                        <div>
                            <Transition name="content-fade" mode="out-in">
                                <!-- Loading State -->
                                <div v-if="showLoadingState" key="loading" class="space-y-3 py-1">
                                    <div class="space-y-3">
                                        <div
                                            v-for="i in 6"
                                            :key="`skeleton-${i}`"
                                            class="border rounded-lg p-4 bg-muted/20 animate-pulse"
                                            :style="{ animationDelay: `${i * 0.1}s` }"
                                        >
                                            <div class="flex items-center justify-between mb-3">
                                                <div class="flex items-center gap-2">
                                                    <div class="h-1.5 w-1.5 rounded-full bg-muted-foreground/30"></div>
                                                    <div
                                                        class="h-4 bg-muted-foreground/30 rounded"
                                                        :style="{ width: `${Math.floor(Math.random() * 80) + 80}px` }"
                                                    ></div>
                                                </div>
                                                <div class="flex items-center gap-1.5">
                                                    <div class="h-5 w-12 bg-muted-foreground/30 rounded"></div>
                                                    <div class="h-5 w-10 bg-muted-foreground/30 rounded"></div>
                                                </div>
                                            </div>
                                            <div class="grid grid-cols-[1fr_auto_1fr] items-start gap-3">
                                                <div class="space-y-2">
                                                    <div class="h-4 w-20 bg-muted-foreground/30 rounded"></div>
                                                    <div class="h-6 bg-muted-foreground/20 rounded"></div>
                                                </div>
                                                <div class="flex items-center justify-center pt-4">
                                                    <div class="h-4 w-4 bg-muted-foreground/30 rounded"></div>
                                                </div>
                                                <div class="space-y-2">
                                                    <div class="h-4 w-20 bg-muted-foreground/30 rounded"></div>
                                                    <div class="h-6 bg-muted-foreground/20 rounded"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Empty State Message -->
                                <div v-else-if="showEmptyMessage" key="empty-message" class="text-center py-8 text-muted-foreground">
                                    No {{ activeFilter }} variables found
                                </div>

                                <!-- Comparison Results -->
                                <div v-else-if="showComparisonResults" key="results" class="space-y-3 py-1">
                                    <Transition name="list-fade" mode="out-in" appear>
                                        <div :key="activeFilter" class="space-y-3 py-1">
                                            <div
                                                v-for="item in filteredComparison"
                                                :key="`${item.name}-${item.container}`"
                                                :class="getComparisonCardClass(item.status)"
                                                class="border rounded-lg p-4 transition-colors duration-200 hover:shadow-md"
                                            >
                                                <div class="relative">
                                                    <div class="flex-1">
                                                        <div class="flex items-center justify-between mb-2">
                                                            <div class="flex items-center gap-2 group">
                                                                <span class="h-1.5 w-1.5 rounded-full bg-primary/70 animate-pulse"></span>
                                                                <span
                                                                    class="inline-block relative font-mono text-[15px] font-semibold text-primary"
                                                                >
                                                                    {{ item.name }}
                                                                    <span
                                                                        class="absolute left-0 -bottom-0.5 h-[2px] w-full bg-primary/30 rounded"
                                                                    ></span>
                                                                </span>
                                                                <button
                                                                    class="opacity-100 transition-all text-muted-foreground hover:text-foreground hover:scale-[1.02]"
                                                                    @click="onCopyName(item.name)"
                                                                    title="Copy variable name"
                                                                >
                                                                    <CopyIcon v-if="copiedName !== item.name" class="h-4 w-4" />
                                                                    <CheckIcon v-else class="h-4 w-4 text-green-600" />
                                                                </button>
                                                            </div>
                                                            <div class="flex items-center gap-1.5">
                                                                <Badge
                                                                    :variant="getStatusVariant(item.status)"
                                                                    class="text-[10px] h-5 px-1.5 py-0"
                                                                >
                                                                    {{ item.status }}
                                                                </Badge>
                                                                <Badge
                                                                    :variant="!item.isSecret ? 'default' : 'secondary'"
                                                                    class="text-[10px] h-5 px-1.5 py-0"
                                                                >
                                                                    {{ getVariableTypeLabel(item.isSecret) }}
                                                                </Badge>
                                                                <!--                                                                <Badge-->
                                                                <!--                                                                    v-if="item.status !== 'unchanged'"-->
                                                                <!--                                                                    variant="outline"-->
                                                                <!--                                                                    class="text-[10px] h-6 px-2.5 py-0 cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"-->
                                                                <!--                                                                    @click="onCopyToVersion(item)"-->
                                                                <!--                                                                >-->
                                                                <!--                                                                    <component-->
                                                                <!--                                                                        :is="copiedTo === item.name ? CheckIcon : CopyIcon"-->
                                                                <!--                                                                        class="h-3.5 w-3.5 mr-1 transition-transform duration-200"-->
                                                                <!--                                                                    />-->
                                                                <!--                                                                    Copy to {{ toVersion }}-->
                                                                <!--                                                                </Badge>-->
                                                            </div>
                                                        </div>

                                                        <div class="grid grid-cols-[1fr_auto_1fr] items-start gap-3 py-1 w-full">
                                                            <div class="min-w-0">
                                                                <div class="flex items-center gap-2 mb-2">
                                                                    <Badge variant="outline" class="text-[10px] font-medium">
                                                                        <GitBranchIcon class="h-2.5 w-2.5 mr-1" />
                                                                        Revision {{ fromVersion }}
                                                                    </Badge>
                                                                </div>
                                                                <div class="text-sm font-mono">
                                                                    <span
                                                                        class="block w-full truncate px-3 rounded bg-muted/30 text-left"
                                                                        >{{ item.fromValue || '(not set)' }}</span
                                                                    >
                                                                </div>
                                                            </div>
                                                            <div class="text-muted-foreground flex items-center justify-center">
                                                                <ArrowRightIcon class="h-4 w-4" />
                                                            </div>
                                                            <div class="min-w-0">
                                                                <div class="flex items-center gap-2 mb-2">
                                                                    <Badge variant="outline" class="text-[10px] font-medium">
                                                                        <GitBranchIcon class="h-2.5 w-2.5 mr-1" />
                                                                        Revision {{ toVersion }}
                                                                    </Badge>
                                                                </div>
                                                                <div class="text-sm font-mono">
                                                                    <span
                                                                        class="block w-full truncate px-3 rounded bg-muted/30 text-left"
                                                                        >{{ item.toValue || '(not set)' }}</span
                                                                    >
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div class="hidden"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </Transition>
                                </div>
                            </Transition>
                        </div>
                    </div>
                </div>

                <!-- Empty State -->
                <div v-if="showEmptyState" class="flex-1 flex items-center justify-center">
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
            </div>
        </DialogContent>
    </Dialog>
</template>

<script setup lang="ts">
import { computed, ref, Transition, watch } from 'vue';
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
import type { ContainerInterface, ServiceInterface } from '@/views/AWS/Services/types/service.interface';
import { useToast } from '@/components/ui/toast';
import { AwsService } from '@/services/aws.service';
import { withDelay } from '@/utils';
import { ComparisonStatus, getVariableTypeLabel as getStandardVariableTypeLabel } from '@/types/aws';
import { copyToClipboard } from '@/composables/useClipboard';

/**
 * ComparisonItem interface that integrates with ContainerInterface structure
 * - Uses isSecret boolean to distinguish between environment variables and secrets
 * - Compatible with ContainerInterface.environmentVariables structure
 * - Distinguishes using environmentVariables.environment vs environmentVariables.secrets
 */
interface ComparisonItem {
    name: string;
    isSecret: boolean;
    status: ComparisonStatus;
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

/**
 * Helper function to determine if variable is secret based on ContainerInterface structure
 * Uses environmentVariables.environment vs environmentVariables.secrets to distinguish:
 * - Items from environment array -> false (public)
 * - Items from secrets array -> true (secret)
 * - API response items with secret indicators -> true (secret)
 */
const isVariableSecret = (item: any, context?: 'environment' | 'secrets'): boolean => {
    // If context is provided from service interface, use it directly
    if (context === 'environment') return false;
    if (context === 'secrets') return true;

    // Check API response indicators for secrets
    if (item.type === 'secret' || item.isSecret === true) {
        return true;
    }
    // Check if the item comes from secrets array context (has valueFrom or secretArn)
    if (item.valueFrom || item.secretArn) {
        return true;
    }
    // Default to public/environment variable
    return false;
};

// Helper function to get display label for variable type (using standardized function)
const getVariableTypeLabel = (isSecret: boolean): string => {
    return getStandardVariableTypeLabel(isSecret).toLowerCase();
};

/**
 * Utility function to extract variables from ContainerInterface with proper typing
 * Returns variables with their correct type based on which array they come from
 */
const extractVariablesFromContainer = (container: ContainerInterface) => {
    const variables: Array<{ name: string; value: string; isSecret: boolean }> = [];

    // Add environment variables (public)
    container.environmentVariables.environment.forEach((envVar) => {
        variables.push({
            name: envVar.name,
            value: envVar.value,
            isSecret: false,
        });
    });

    // Add secrets (secret)
    container.environmentVariables.secrets.forEach((secret: any) => {
        variables.push({
            name: secret.name,
            value: secret.valueFrom || secret.value || '[Secret]',
            isSecret: true,
        });
    });

    return variables;
};

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

const copiedName = ref<string | null>(null);

const copiedTo = ref<string | null>(null);
const onCopyToVersion = async (item: ComparisonItem) => {
    await copyToVersion(item);
    copiedTo.value = item.name;

    setTimeout(() => {
        if (copiedTo.value === item.name) copiedTo.value = null;
    }, 1200);
};
const onCopyName = async (name: string) => {
    const ok = await copyToClipboard(name);
    if (!ok) return;

    copiedName.value = name;
    setTimeout(() => {
        if (copiedName.value === name) copiedName.value = null;
    }, 1500);
};

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

        // Set default versions - prioritize currentVersion if provided
        if (availableVersions.value.length >= 2) {
            if (props.currentVersion) {
                // If currentVersion is provided, use it as the "To" version
                const currentRevision = parseInt(props.currentVersion.toString().replace(/\D/g, ''));
                toVersion.value = currentRevision.toString();

                // Find a different version for comparison
                const otherVersion = availableVersions.value.find((v) => v.revision !== currentRevision);
                if (otherVersion) {
                    fromVersion.value = otherVersion.revision.toString();
                } else {
                    fromVersion.value = availableVersions.value[1].revision.toString();
                }
            } else {
                // Default behavior: latest vs previous
                toVersion.value = availableVersions.value[0].revision.toString();
                fromVersion.value = availableVersions.value[1].revision.toString();
            }

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

const showLoadingState = computed(() => {
    return isLoading.value;
});

const showEmptyMessage = computed(() => {
    return !isLoading.value && comparisonResult.value && filteredComparison.value.length === 0;
});

const showComparisonResults = computed(() => {
    return !isLoading.value && comparisonResult.value && filteredComparison.value.length > 0;
});

const showEmptyState = computed(() => {
    return !isLoading.value && !comparisonResult.value;
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
            // Handle different version formats (could be "v20", "20", or just a number)
            let currentRevision: number;
            if (typeof newVersion === 'string') {
                // Extract number from version string (handles "v20", "20", etc.)
                const match = newVersion.match(/\d+/);
                currentRevision = match ? parseInt(match[0]) : parseInt(newVersion);
            } else {
                currentRevision = parseInt(newVersion.toString());
            }

            // Set the current version as "To" version
            toVersion.value = currentRevision.toString();

            // Find a different version for comparison (prefer the previous version)
            const otherVersion = availableVersions.value.find((v) => v.revision !== currentRevision);
            if (otherVersion) {
                fromVersion.value = otherVersion.revision.toString();
            } else if (availableVersions.value.length > 1) {
                // If no different version found, use the first available different version
                const differentVersion = availableVersions.value.find((v) => v.revision.toString() !== currentRevision.toString());
                if (differentVersion) {
                    fromVersion.value = differentVersion.revision.toString();
                }
            }
        }
    },
    { immediate: true },
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
            added: comparison.added.map((item: any) => {
                const isSecret = isVariableSecret(item);
                return {
                    name: item.name,
                    isSecret: isSecret,
                    status: ComparisonStatus.ADDED,
                    toValue: item.value,
                    container: container.name,
                };
            }),
            removed: comparison.removed.map((item: any) => {
                const isSecret = isVariableSecret(item);
                return {
                    name: item.name,
                    isSecret: isSecret,
                    status: ComparisonStatus.REMOVED,
                    fromValue: item.value,
                    container: container.name,
                };
            }),
            modified: comparison.modified.map((item: any) => {
                const isSecret = isVariableSecret(item);
                return {
                    name: item.name,
                    isSecret: isSecret,
                    status: ComparisonStatus.MODIFIED,
                    fromValue: item.oldValue,
                    toValue: item.newValue,
                    container: container.name,
                };
            }),
            unchanged: comparison.unchanged.map((item: any) => {
                const isSecret = isVariableSecret(item);
                return {
                    name: item.name,
                    isSecret: isSecret,
                    status: ComparisonStatus.UNCHANGED,
                    fromValue: item.value,
                    toValue: item.value,
                    container: container.name,
                };
            }),
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

const getStatusVariant = (status: ComparisonStatus) => {
    switch (status) {
        case ComparisonStatus.ADDED:
            return 'default';
        case ComparisonStatus.REMOVED:
            return 'destructive';
        case ComparisonStatus.MODIFIED:
            return 'secondary';
        case ComparisonStatus.UNCHANGED:
            return 'outline';
        default:
            return 'outline';
    }
};

const getComparisonCardClass = (status: ComparisonStatus) => {
    switch (status) {
        case ComparisonStatus.ADDED:
            return 'bg-muted/30 border-border hover:bg-muted/50';
        case ComparisonStatus.REMOVED:
            return 'bg-muted/30 border-border hover:bg-muted/50';
        case ComparisonStatus.MODIFIED:
            return 'bg-muted/30 border-border hover:bg-muted/50';
        case ComparisonStatus.UNCHANGED:
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
/* Loading skeleton animations */
@keyframes skeleton-pulse {
    0%,
    100% {
        opacity: 1;
    }
    50% {
        opacity: 0.4;
    }
}

.animate-pulse {
    animation: skeleton-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
