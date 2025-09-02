<template>
    <div class="space-y-4">
        <div>
            <h3 class="text-lg font-medium mb-2">Find and Replace</h3>
            <p class="text-sm text-muted-foreground mb-4">Find and replace text in variable values</p>
        </div>

        <div class="grid grid-cols-2 gap-6">
            <div class="space-y-4">
                <div>
                    <Label for="findText" class="text-sm font-medium mb-2 block">Find</Label>
                    <Input id="findText" v-model="findReplace.find" placeholder="Enter text to find..." class="font-mono" />
                </div>

                <div>
                    <Label for="replaceText" class="text-sm font-medium mb-2 block">Replace with</Label>
                    <Input id="replaceText" v-model="findReplace.replace" placeholder="Enter replacement text..." class="font-mono" />
                </div>

                <div class="space-y-3">
                    <Label class="text-sm font-medium">Options</Label>

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

            <div class="space-y-4">
                <div>
                    <Label class="text-sm font-medium mb-2 block">Preview</Label>
                    <div class="text-sm text-muted-foreground mb-2">{{ replacePreview }}</div>

                    <div class="border rounded-lg bg-muted/50 max-h-64 overflow-y-auto">
                        <div v-if="findMatches.length === 0" class="p-4 text-center text-muted-foreground">
                            {{ findReplace.find ? 'No matches found' : 'Enter search text to see matches' }}
                        </div>
                        <div v-else class="p-3 space-y-3">
                            <div v-for="match in findMatches" :key="`${match.container}-${match.variableName}`" class="space-y-2">
                                <div class="flex items-center gap-2">
                                    <Badge :variant="match.isSecret ? 'secondary' : 'default'" class="text-xs">
                                        {{ match.isSecret ? 'SECRET' : 'ENV' }}
                                    </Badge>
                                    <span class="font-mono text-sm font-medium">{{ match.variableName }}</span>
                                    <span class="text-xs text-muted-foreground">({{ match.container }})</span>
                                    <Badge variant="outline" class="text-xs">
                                        {{ match.matches.length }} match{{ match.matches.length !== 1 ? 'es' : '' }}
                                    </Badge>
                                </div>

                                <div class="bg-background rounded border p-2 space-y-1">
                                    <div class="text-xs text-muted-foreground">Before:</div>
                                    <div class="font-mono text-xs break-all">
                                        <HighlightedText :text="match.originalValue" :highlights="match.matches" />
                                    </div>

                                    <div class="text-xs text-muted-foreground">After:</div>
                                    <div class="font-mono text-xs break-all text-green-600 dark:text-green-400">
                                        {{ match.newValue }}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div
                    v-if="findMatches.length > 0"
                    class="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800"
                >
                    <div class="flex items-start gap-2">
                        <CheckCircleIcon class="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                        <div class="text-sm">
                            <div class="font-medium text-green-900 dark:text-green-100">Replace Summary</div>
                            <div class="text-green-700 dark:text-green-300 mt-1">
                                {{ getTotalMatches() }} occurrence(s) in {{ findMatches.length }} variable(s) will be replaced
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
import HighlightedText from './HighlightedText.vue';
import type { FindMatch } from '../composables/useBulkReplace';

interface Props {
    findReplace: {
        find: string;
        replace: string;
        caseSensitive: boolean;
        useRegex: boolean;
    };
    findMatches: FindMatch[];
    replacePreview: string;
    getTotalMatches: () => number;
}

const props = defineProps<Props>();

const emit = defineEmits<{
    (e: 'update:findReplace', value: Props['findReplace']): void;
}>();

const { findReplace } = toRefs(props);
</script>
