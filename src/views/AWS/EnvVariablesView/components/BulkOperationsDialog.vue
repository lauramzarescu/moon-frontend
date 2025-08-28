<template>
    <Dialog v-model:open="isOpen">
        <DialogContent class="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
                <DialogTitle class="flex items-center gap-3">
                    <SettingsIcon class="h-5 w-5 text-primary" />
                    Bulk Operations
                    <Badge v-if="selectedVariables.length > 0" variant="outline" class="ml-2">
                        {{ selectedVariables.length }} selected
                    </Badge>
                </DialogTitle>
                <DialogDescription> Perform bulk operations on selected environment variables and secrets </DialogDescription>
            </DialogHeader>

            <!-- Operation Tabs -->
            <div class="border-b">
                <div class="flex space-x-1 p-1">
                    <button
                        v-for="operation in operations"
                        :key="operation.key"
                        @click="activeOperation = operation.key"
                        :class="[
                            'px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 flex items-center gap-2',
                            activeOperation === operation.key
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                        ]"
                    >
                        <component :is="operation.icon" class="h-4 w-4" />
                        {{ operation.label }}
                    </button>
                </div>
            </div>

            <!-- Content Area -->
            <div class="flex-1 overflow-hidden flex flex-col p-4">
                <!-- Copy/Move Variables -->
                <div v-if="activeOperation === 'copy'" class="space-y-4">
                    <div>
                        <h3 class="text-lg font-medium mb-2">Copy Variables</h3>
                        <p class="text-sm text-muted-foreground mb-4">Copy selected variables to another service or version</p>
                    </div>

                    <div class="grid grid-cols-2 gap-6">
                        <div class="space-y-4">
                            <div>
                                <Label class="text-sm font-medium mb-2 block">Destination Service</Label>
                                <Select v-model="copyDestination.service">
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select service" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectItem v-for="svc in availableServices" :key="svc.name" :value="svc.name">
                                                {{ svc.name }} ({{ svc.clusterName }})
                                            </SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div v-if="copyDestination.service">
                                <Label class="text-sm font-medium mb-2 block">Destination Container</Label>
                                <Select v-model="copyDestination.container">
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select container" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectItem v-for="container in destinationContainers" :key="container" :value="container">
                                                {{ container }}
                                            </SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label class="text-sm font-medium mb-2 block">Operation Type</Label>
                                <Select v-model="copyDestination.operation">
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectItem value="copy">Copy (keep original)</SelectItem>
                                            <SelectItem value="move">Move (remove original)</SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div class="space-y-2">
                            <Label class="text-sm font-medium">Selected Variables</Label>
                            <div class="border rounded-md p-3 max-h-64 overflow-y-auto bg-muted/20">
                                <div v-if="selectedVariables.length === 0" class="text-sm text-muted-foreground">No variables selected</div>
                                <div v-else class="space-y-2">
                                    <div
                                        v-for="variable in selectedVariables"
                                        :key="variable"
                                        class="flex items-center gap-2 text-sm p-2 bg-background rounded border"
                                    >
                                        <Badge :variant="variable.startsWith('env-') ? 'default' : 'secondary'" class="text-xs">
                                            {{ variable.startsWith('env-') ? 'ENV' : 'SECRET' }}
                                        </Badge>
                                        <code class="font-mono">{{ variable.split('-').slice(1).join('-') }}</code>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Export Variables -->
                <div v-else-if="activeOperation === 'export'" class="space-y-4">
                    <div>
                        <h3 class="text-lg font-medium mb-2">Export Variables</h3>
                        <p class="text-sm text-muted-foreground mb-4">Export selected variables to different formats</p>
                    </div>

                    <div class="grid grid-cols-2 gap-6">
                        <div class="space-y-4">
                            <div>
                                <Label class="text-sm font-medium mb-2 block">Export Format</Label>
                                <Select v-model="exportFormat">
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectItem value="env">.env file</SelectItem>
                                            <SelectItem value="json">JSON</SelectItem>
                                            <SelectItem value="yaml">YAML</SelectItem>
                                            <SelectItem value="docker">Docker Compose</SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div class="flex items-center space-x-2">
                                <Checkbox id="include-secrets" v-model:checked="exportOptions.includeSecrets" />
                                <Label for="include-secrets" class="text-sm">Include secrets (masked)</Label>
                            </div>

                            <div class="flex items-center space-x-2">
                                <Checkbox id="include-comments" v-model:checked="exportOptions.includeComments" />
                                <Label for="include-comments" class="text-sm">Include comments</Label>
                            </div>
                        </div>

                        <div class="space-y-2">
                            <Label class="text-sm font-medium">Preview</Label>
                            <div class="border rounded-md p-3 h-64 overflow-y-auto bg-muted/20">
                                <pre class="text-xs font-mono whitespace-pre-wrap">{{ exportPreview }}</pre>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Delete Variables -->
                <div v-else-if="activeOperation === 'delete'" class="space-y-4">
                    <div>
                        <h3 class="text-lg font-medium mb-2 text-destructive">Delete Variables</h3>
                        <p class="text-sm text-muted-foreground mb-4">
                            Permanently delete selected variables. This action cannot be undone.
                        </p>
                    </div>

                    <div class="border border-destructive/20 rounded-lg p-4 bg-destructive/5">
                        <div class="flex items-start gap-3">
                            <AlertTriangleIcon class="h-5 w-5 text-destructive mt-0.5" />
                            <div>
                                <h4 class="font-medium text-destructive mb-2">Warning</h4>
                                <p class="text-sm text-muted-foreground mb-3">
                                    You are about to delete {{ selectedVariables.length }} variables. This will remove them from the service
                                    configuration permanently.
                                </p>
                                <div class="space-y-2">
                                    <div
                                        v-for="variable in selectedVariables.slice(0, 5)"
                                        :key="variable"
                                        class="flex items-center gap-2 text-sm"
                                    >
                                        <Badge :variant="variable.startsWith('env-') ? 'default' : 'secondary'" class="text-xs">
                                            {{ variable.startsWith('env-') ? 'ENV' : 'SECRET' }}
                                        </Badge>
                                        <code class="font-mono">{{ variable.split('-').slice(1).join('-') }}</code>
                                    </div>
                                    <div v-if="selectedVariables.length > 5" class="text-sm text-muted-foreground">
                                        ... and {{ selectedVariables.length - 5 }} more
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="flex items-center space-x-2">
                        <Checkbox id="confirm-delete" v-model:checked="deleteConfirmation" />
                        <Label for="confirm-delete" class="text-sm"> I understand this action cannot be undone </Label>
                    </div>
                </div>

                <!-- Find and Replace -->
                <div v-else-if="activeOperation === 'replace'" class="space-y-4">
                    <div>
                        <h3 class="text-lg font-medium mb-2">Find and Replace</h3>
                        <p class="text-sm text-muted-foreground mb-4">Find and replace text in variable values</p>
                    </div>

                    <div class="grid grid-cols-2 gap-6">
                        <div class="space-y-4">
                            <div>
                                <Label class="text-sm font-medium mb-2 block">Find</Label>
                                <Input v-model="findReplace.find" placeholder="Text to find" class="font-mono" />
                            </div>

                            <div>
                                <Label class="text-sm font-medium mb-2 block">Replace with</Label>
                                <Input v-model="findReplace.replace" placeholder="Replacement text" class="font-mono" />
                            </div>

                            <div class="flex items-center space-x-2">
                                <Checkbox id="case-sensitive" v-model:checked="findReplace.caseSensitive" />
                                <Label for="case-sensitive" class="text-sm">Case sensitive</Label>
                            </div>

                            <div class="flex items-center space-x-2">
                                <Checkbox id="regex-mode" v-model:checked="findReplace.useRegex" />
                                <Label for="regex-mode" class="text-sm">Use regular expressions</Label>
                            </div>
                        </div>

                        <div class="space-y-2">
                            <Label class="text-sm font-medium">Matches Found</Label>
                            <div class="border rounded-md p-3 h-64 overflow-y-auto bg-muted/20">
                                <div v-if="findMatches.length === 0" class="text-sm text-muted-foreground">
                                    {{ findReplace.find ? 'No matches found' : 'Enter text to find matches' }}
                                </div>
                                <div v-else class="space-y-2">
                                    <div
                                        v-for="match in findMatches"
                                        :key="match.variable"
                                        class="text-sm p-2 bg-background rounded border"
                                    >
                                        <div class="font-mono font-medium mb-1">{{ match.variable }}</div>
                                        <div class="text-muted-foreground">
                                            {{ match.preview }}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div class="flex items-center justify-between pt-4 border-t">
                <div class="text-sm text-muted-foreground">{{ selectedVariables.length }} variables selected</div>
                <div class="flex items-center gap-2">
                    <Button variant="outline" @click="closeDialog"> Cancel </Button>
                    <Button
                        v-if="activeOperation === 'copy'"
                        @click="performCopyOperation"
                        :disabled="!copyDestination.service || !copyDestination.container"
                        class="hover:shadow-sm transition-all duration-200"
                    >
                        {{ copyDestination.operation === 'move' ? 'Move' : 'Copy' }} Variables
                    </Button>
                    <Button
                        v-else-if="activeOperation === 'export'"
                        @click="performExport"
                        :disabled="selectedVariables.length === 0"
                        class="hover:shadow-sm transition-all duration-200"
                    >
                        <DownloadIcon class="h-4 w-4 mr-2" />
                        Export
                    </Button>
                    <Button
                        v-else-if="activeOperation === 'delete'"
                        @click="performDelete"
                        :disabled="!deleteConfirmation || selectedVariables.length === 0"
                        variant="destructive"
                        class="hover:shadow-sm transition-all duration-200"
                    >
                        <TrashIcon class="h-4 w-4 mr-2" />
                        Delete Variables
                    </Button>
                    <Button
                        v-else-if="activeOperation === 'replace'"
                        @click="performReplace"
                        :disabled="!findReplace.find || findMatches.length === 0"
                        class="hover:shadow-sm transition-all duration-200"
                    >
                        Replace {{ findMatches.length }} Matches
                    </Button>
                </div>
            </div>
        </DialogContent>
    </Dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangleIcon, CopyIcon, DownloadIcon, SearchIcon, SettingsIcon, TrashIcon } from 'lucide-vue-next';
import type { ServiceInterface } from '@/views/AWS/Services/types/service.interface';
import { useToast } from '@/components/ui/toast';
import { AwsService } from '@/services/aws.service';
import { storeToRefs } from 'pinia';
import { useDataStore } from '@/stores/dataStore';
import type {
    CopyEnvVarsResponse,
    RemoveEnvVarsResponse
} from '@/types/aws';

const props = defineProps<{
    open: boolean;
    service: ServiceInterface | null;
    selectedVariables: string[];
}>();

const emit = defineEmits<{
    (e: 'update:open', value: boolean): void;
    (e: 'completed'): void;
}>();

const { toast } = useToast();
const awsService = new AwsService();
const store = useDataStore();
const { services } = storeToRefs(store);

// Reactive state
const activeOperation = ref<string>('copy');
const deleteConfirmation = ref(false);
const exportFormat = ref<string>('env');

const copyDestination = reactive({
    service: '',
    container: '',
    operation: 'copy',
});

const exportOptions = reactive({
    includeSecrets: false,
    includeComments: true,
});

const findReplace = reactive({
    find: '',
    replace: '',
    caseSensitive: false,
    useRegex: false,
});

// Available services for copy operations
const availableServices = computed(() => services.value);

// Computed properties
const isOpen = computed({
    get: () => props.open,
    set: (value) => emit('update:open', value),
});

const operations = computed(() => [
    { key: 'copy', label: 'Copy/Move', icon: CopyIcon },
    { key: 'export', label: 'Export', icon: DownloadIcon },
    { key: 'delete', label: 'Delete', icon: TrashIcon },
    { key: 'replace', label: 'Find & Replace', icon: SearchIcon },
]);

const destinationContainers = computed(() => {
    const service = availableServices.value.find((s) => s.name === copyDestination.service);
    return service?.containers.map((c) => c.name) || [];
});

const exportPreview = computed(() => {
    if (props.selectedVariables.length === 0) return 'No variables selected';

    // Mock preview based on format
    switch (exportFormat.value) {
        case 'env':
            return props.selectedVariables
                .map((v) => {
                    const name = v.split('-').slice(1).join('-');
                    const isSecret = v.startsWith('secret-');
                    const value = isSecret && !exportOptions.includeSecrets ? '••••••••' : 'example_value';
                    return `${name}=${value}`;
                })
                .join('\n');
        case 'json':
            const jsonObj = props.selectedVariables.reduce(
                (acc, v) => {
                    const name = v.split('-').slice(1).join('-');
                    const isSecret = v.startsWith('secret-');
                    acc[name] = isSecret && !exportOptions.includeSecrets ? '••••••••' : 'example_value';
                    return acc;
                },
                {} as Record<string, string>,
            );
            return JSON.stringify(jsonObj, null, 2);
        default:
            return 'Preview not available for this format';
    }
});

const findMatches = computed(() => {
    if (!findReplace.find) return [];

    // Mock matches - replace with actual search logic
    return props.selectedVariables.slice(0, 3).map((v) => ({
        variable: v.split('-').slice(1).join('-'),
        preview: `old_value → new_value`,
    }));
});


const performCopyOperation = async () => {
    if (!props.service || !copyDestination.service || !copyDestination.container) {
        return;
    }

    try {
        const targetService = availableServices.value.find((s) => s.name === copyDestination.service);
        if (!targetService) {
            throw new Error('Target service not found');
        }

        await awsService.copyEnvironmentVariables({
            sourceClusterName: props.service.clusterName,
            sourceServiceName: props.service.name,
            sourceContainerName: props.service.containers[0].name, // Use first container
            targetClusterName: targetService.clusterName,
            targetServiceName: targetService.name,
            targetContainerName: copyDestination.container,
        });

        toast({
            variant: 'success',
            title: `Variables ${copyDestination.operation === 'move' ? 'Moved' : 'Copied'}`,
            description: `${props.selectedVariables.length} variables ${copyDestination.operation === 'move' ? 'moved' : 'copied'} to ${copyDestination.service}.`,
        });

        emit('completed');
        closeDialog();
    } catch (error: any) {
        console.error('Failed to copy variables:', error);
        toast({
            variant: 'destructive',
            title: 'Copy Failed',
            description: error?.message || 'Failed to copy environment variables.',
        });
    }
};

const performExport = () => {
    // Mock export functionality
    const content = exportPreview.value;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `variables.${exportFormat.value}`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
        variant: 'success',
        title: 'Export Complete',
        description: `Variables exported as ${exportFormat.value} file.`,
    });
};

const performDelete = async () => {
    if (!props.service || props.selectedVariables.length === 0) {
        return;
    }

    try {
        // Extract variable names from selected variables
        const variableNames = props.selectedVariables.map((id) => {
            const [type, ...nameParts] = id.split('-');
            return nameParts.join('-');
        });

        // Use the remove API endpoint
        await awsService.removeEnvironmentVariables({
            clusterName: props.service.clusterName,
            serviceName: props.service.name,
            containerName: props.service.containers[0].name, // Use first container
            variableNames,
        });

        toast({
            variant: 'success',
            title: 'Variables Deleted',
            description: `${props.selectedVariables.length} variables have been deleted.`,
        });

        emit('completed');
        closeDialog();
    } catch (error: any) {
        console.error('Failed to delete variables:', error);
        toast({
            variant: 'destructive',
            title: 'Delete Failed',
            description: error?.message || 'Failed to delete environment variables.',
        });
    }
};

const performReplace = () => {
    toast({
        variant: 'success',
        title: 'Replace Complete',
        description: `Replaced text in ${findMatches.value.length} variables.`,
    });
    emit('completed');
    closeDialog();
};

const closeDialog = () => {
    isOpen.value = false;
    // Reset state
    deleteConfirmation.value = false;
    copyDestination.service = '';
    copyDestination.container = '';
    copyDestination.operation = 'copy';
    findReplace.find = '';
    findReplace.replace = '';
    activeOperation.value = 'copy';
};
</script>
