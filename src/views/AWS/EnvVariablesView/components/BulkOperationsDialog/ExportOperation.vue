<template>
    <div class="space-y-4">
        <div>
            <h3 class="text-lg font-medium mb-2">Export Variables</h3>
            <p class="text-sm text-muted-foreground mb-4">Export selected variables to different formats</p>
        </div>

        <div class="grid grid-cols-2 gap-6">
            <div class="space-y-4">
                <div>
                    <Label class="text-sm font-medium mb-2 block">Export Format</Label>
                    <Select v-model="exportFormatProxy">
                        <SelectTrigger>
                            <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem :value="ExportFormat.ENV">.env file</SelectItem>
                            <SelectItem :value="ExportFormat.JSON">JSON</SelectItem>
                            <SelectItem :value="ExportFormat.YAML">YAML</SelectItem>
                            <SelectItem :value="ExportFormat.DOCKER_COMPOSE">Docker Compose</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div class="space-y-3">
                    <Label class="text-sm font-medium">Export Options</Label>

                    <div class="flex items-center space-x-2">
                        <Checkbox id="includeSecrets" v-model:checked="includeSecretsProxy" />
                        <Label for="includeSecrets" class="text-sm">Include secrets</Label>
                    </div>

                    <div class="flex items-center space-x-2">
                        <Checkbox id="includeComments" v-model:checked="includeCommentsProxy" />
                        <Label for="includeComments" class="text-sm">Include comments</Label>
                    </div>
                </div>

                <div class="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                    <div class="flex items-start gap-2">
                        <AlertTriangleIcon class="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                        <div class="text-sm">
                            <div class="font-medium text-amber-900 dark:text-amber-100">Security Notice</div>
                            <div class="text-amber-700 dark:text-amber-300 mt-1">
                                Exported files may contain sensitive information. Handle with care and avoid committing to version control.
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="space-y-4">
                <div>
                    <Label class="text-sm font-medium mb-2 block">Preview</Label>
                    <div class="border rounded-lg bg-muted/50 max-h-64 overflow-auto">
                        <pre class="p-3 text-xs font-mono whitespace-pre-wrap">{{ exportPreview }}</pre>
                    </div>
                </div>

                <div class="space-y-2">
                    <div class="text-sm font-medium">Export Summary</div>
                    <div class="space-y-1 text-sm text-muted-foreground">
                        <div>Total variables: {{ totalSelectedCount }}</div>
                        <div>Environment variables: {{ environmentVariablesCount }}</div>
                        <div>Secrets: {{ secretsCount }}</div>
                        <div v-if="!exportOptions.includeSecrets && secretsCount > 0" class="text-amber-600 dark:text-amber-400">
                            {{ secretsCount }} secret(s) will be excluded
                        </div>
                    </div>
                </div>

                <div class="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div class="flex items-start gap-2">
                        <InfoIcon class="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <div class="text-sm">
                            <div class="font-medium text-blue-900 dark:text-blue-100">Export Info</div>
                            <div class="text-blue-700 dark:text-blue-300 mt-1">
                                File will be downloaded as: <span class="font-mono">environment-variables.{{ getFileExtension() }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertTriangleIcon, InfoIcon } from 'lucide-vue-next';
import { ExportFormat } from '@/types/aws';

interface Props {
    exportFormat: ExportFormat;
    exportOptions: {
        includeSecrets: boolean;
        includeComments: boolean;
    };
    exportPreview: string;
    totalSelectedCount: number;
    variablesByContainer: Map<
        string,
        Array<{
            name: string;
            value: string;
            isSecret: boolean;
            container: string;
        }>
    >;
}

const props = defineProps<Props>();

const emit = defineEmits<{
    (e: 'update:exportFormat', value: ExportFormat): void;
    (e: 'update:exportOptions', value: Props['exportOptions']): void;
}>();

const exportFormatProxy = computed<ExportFormat>({
    get: () => props.exportFormat,
    set: (value) => emit('update:exportFormat', value),
});

const includeSecretsProxy = computed<boolean>({
    get: () => props.exportOptions.includeSecrets,
    set: (checked) => emit('update:exportOptions', { ...props.exportOptions, includeSecrets: checked }),
});

const includeCommentsProxy = computed<boolean>({
    get: () => props.exportOptions.includeComments,
    set: (checked) => emit('update:exportOptions', { ...props.exportOptions, includeComments: checked }),
});

const environmentVariablesCount = computed(() => {
    let count = 0;
    props.variablesByContainer.forEach((variables) => {
        count += variables.filter((v) => !v.isSecret).length;
    });
    return count;
});

const secretsCount = computed(() => {
    let count = 0;
    props.variablesByContainer.forEach((variables) => {
        count += variables.filter((v) => v.isSecret).length;
    });
    return count;
});

const getFileExtension = (): string => {
    switch (props.exportFormat) {
        case ExportFormat.JSON:
            return 'json';
        case ExportFormat.YAML:
            return 'yml';
        case ExportFormat.DOCKER_COMPOSE:
            return 'docker-compose.yml';
        default:
            return 'env';
    }
};
</script>
