<template>
    <div class="space-y-4 px-4">
        <div>
            <h3 class="text-lg font-medium mb-2">Global Find and Replace</h3>
            <p class="text-sm text-muted-foreground mb-4">Find and replace text across all services and environment variables</p>
        </div>

        <div class="space-y-6">
            <!-- Find and Replace Fields Section -->
            <div class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label for="findText" class="text-sm font-medium mb-2 block">Find</Label>
                        <Input id="findText" v-model="findReplace.find" placeholder="Enter text to find..." class="font-mono" />
                    </div>

                    <div>
                        <Label for="replaceText" class="text-sm font-medium mb-2 block">Replace with</Label>
                        <Input id="replaceText" v-model="findReplace.replace" placeholder="Enter replacement text..." class="font-mono" />
                    </div>
                </div>

                <div class="flex items-center gap-6">
                    <div class="flex items-center space-x-2">
                        <Checkbox id="caseSensitive" v-model:checked="findReplace.caseSensitive" />
                        <Label for="caseSensitive" class="text-sm">Case sensitive</Label>
                    </div>

                    <div class="flex items-center space-x-2">
                        <Checkbox id="useRegex" v-model:checked="findReplace.useRegex" />
                        <Label for="useRegex" class="text-sm">Use regular expressions</Label>
                    </div>
                </div>

                <div
                    v-if="findReplace.useRegex"
                    class="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800"
                >
                    <div class="flex items-start gap-2">
                        <InfoIcon class="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <div class="text-sm">
                            <div class="font-medium text-blue-900 dark:text-blue-100">Regex Mode</div>
                            <div class="text-blue-700 dark:text-blue-300 mt-1">
                                Use JavaScript regex syntax. Capture groups ($1, $2) are supported in replacement text.
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Preview Section -->
            <div class="space-y-4">
                <div>
                    <div class="flex items-center justify-between mb-4">
                        <Label class="text-lg font-medium">Preview</Label>
                        <div class="text-sm text-muted-foreground">{{ replacePreview }}</div>
                    </div>

                    <div class="border rounded-lg bg-muted/50 max-h-[70vh] overflow-y-auto">
                        <div v-if="findMatches.length === 0" class="p-4 text-center text-muted-foreground">
                            {{ findReplace.find ? 'No matches found across all services' : 'Enter search text to see matches' }}
                        </div>
                        <div v-else class="p-4 space-y-3">
                            <div v-for="match in findMatches" :key="match.variableId" class="rounded-lg bg-card border shadow-sm p-4 transition-colors">
                                <!-- Header with badges -->
                                <div class="flex items-center justify-between gap-3 mb-3">
                                    <div class="flex items-center gap-2">
                                        <div class="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                                            {{ match.isSecret ? 'S' : 'E' }}
                                        </div>
                                        <div>
                                            <div class="font-mono text-sm font-medium">{{ match.variableName }}</div>
                                            <div class="text-xs text-muted-foreground">{{ match.container }}</div>
                                        </div>
                                    </div>
                                    <div class="flex items-center gap-2 flex-wrap">
                                        <Badge variant="outline" class="text-xs">{{ match.serviceName }}</Badge>
                                        <Badge variant="outline" class="text-xs">{{ match.clusterName }}</Badge>
                                        <Badge variant="outline" class="text-xs bg-accent/50 border-accent">
                                            {{ match.matches.length }} match{{ match.matches.length !== 1 ? 'es' : '' }}
                                        </Badge>
                                    </div>
                                </div>

                                <!-- Value changes -->
                                <div class="space-y-3">
                                    <div class="bg-muted/50 rounded-lg p-3 border">
                                        <div class="text-xs text-muted-foreground font-medium mb-2">Before:</div>
                                        <div class="font-mono text-sm break-all">
                                            <HighlightedText :text="match.originalValue" :highlights="match.matches" />
                                        </div>
                                    </div>
                                    <div class="bg-accent/20 rounded-lg p-3 border border-accent/30">
                                        <div class="text-xs text-muted-foreground font-medium mb-2">After:</div>
                                        <div class="font-mono text-sm break-all text-accent-foreground">
                                            {{ match.newValue }}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Summary and Pending Changes Section -->
                <div v-if="findMatches.length > 0" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <!-- Summary -->
                    <div class="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                        <div class="flex items-start gap-2">
                            <CheckCircleIcon class="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                            <div>
                                <div class="font-medium text-green-900 dark:text-green-100 mb-2">Global Replace Summary</div>
                                <div class="text-green-700 dark:text-green-300">
                                    <div>
                                        <span class="font-semibold">{{ getTotalMatches() }}</span> occurrence(s) found
                                    </div>
                                    <div>
                                        <span class="font-semibold">{{ findMatches.length }}</span> variable(s) affected
                                    </div>
                                    <div>
                                        <span class="font-semibold">{{ getServiceCount() }}</span> service(s) will be updated
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Pending Changes -->
                    <div v-if="pendingChanges.size > 0" class="space-y-3">
                        <div class="p-4 bg-accent/20 rounded-lg border border-accent/30">
                            <div class="flex items-start gap-2">
                                <InfoIcon class="h-5 w-5 text-accent-foreground mt-0.5 flex-shrink-0" />
                                <div>
                                    <div class="font-medium text-accent-foreground mb-2">Pending Changes</div>
                                    <div class="text-muted-foreground">
                                        <span class="font-semibold">{{ pendingChanges.size }}</span> service container(s) will be updated
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { toRefs } from 'vue';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { CheckCircleIcon, InfoIcon } from 'lucide-vue-next';
import HighlightedText from './BulkOperationsDialog/HighlightedText.vue';
import type { GlobalFindMatch, PendingChange } from '../composables/useGlobalFindReplace';

interface Props {
    findReplace: {
        find: string;
        replace: string;
        caseSensitive: boolean;
        useRegex: boolean;
    };
    findMatches: GlobalFindMatch[];
    replacePreview: string;
    pendingChanges: Map<string, PendingChange>;
    getTotalMatches: () => number;
}

const props = defineProps<Props>();

const emit = defineEmits<{
    (e: 'update:findReplace', value: Props['findReplace']): void;
}>();

const { findReplace } = toRefs(props);

const getServiceCount = () => {
    const services = new Set(props.findMatches.map((m) => `${m.clusterName}-${m.serviceName}`));
    return services.size;
};
</script>
