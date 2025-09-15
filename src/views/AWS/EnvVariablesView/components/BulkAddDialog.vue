<template>
    <Dialog v-model:open="isOpen">
        <DialogContent class="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
                <DialogTitle class="flex items-center gap-3">
                    <PlusIcon class="h-5 w-5 text-primary" />
                    Add Environment Variables
                    <Badge v-if="service" variant="outline" class="ml-2"> {{ service.name }} / {{ container }} </Badge>
                </DialogTitle>
                <DialogDescription class="mt-2"> Add multiple environment variables and secrets at once </DialogDescription>
            </DialogHeader>

            <!-- Add Method Tabs -->
            <div class="border-b">
                <div class="flex space-x-2 p-2">
                    <button
                        v-for="method in addMethods"
                        :key="method.key"
                        @click="activeMethod = method.key"
                        :class="[
                            'px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 flex items-center gap-2',
                            activeMethod === method.key
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                        ]"
                    >
                        <component :is="method.icon" class="h-4 w-4" />
                        {{ method.label }}
                    </button>
                </div>
            </div>

            <!-- Content Area -->
            <div class="flex-1 overflow-hidden flex flex-col p-4">
                <!-- Individual Add Method -->
                <div v-if="activeMethod === BulkAddMethod.INDIVIDUAL" class="space-y-4">
                    <div class="flex items-center justify-between">
                        <h3 class="text-lg font-medium">Add Variables One by One</h3>
                        <Button
                            size="sm"
                            @click="addNewVariable"
                            :disabled="!hasPermission(PermissionEnum.AWS_SERVICE_WRITE)"
                            class="hover:shadow-sm transition-all duration-200"
                        >
                            <PlusIcon class="h-4 w-4 mr-2" />
                            Add Variable
                        </Button>
                    </div>

                    <div class="space-y-3 max-h-96 overflow-y-auto">
                        <TransitionGroup name="variable-item">
                            <div
                                v-for="(variable, index) in individualVariables"
                                :key="variable.id"
                                class="grid grid-cols-12 bg-card gap-3 p-3 border rounded-lg hover:bg-muted/20 transition-colors"
                            >
                                <div class="col-span-2 flex items-center">
                                    <Select v-model="variable.isSecret">
                                        <SelectTrigger class="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectItem :value="false">
                                                    <div class="flex items-center gap-2">
                                                        <GlobeIcon class="h-3 w-3" />
                                                        Public
                                                    </div>
                                                </SelectItem>
                                                <SelectItem :value="true">
                                                    <div class="flex items-center gap-2">
                                                        <KeyIcon class="h-3 w-3" />
                                                        Secret
                                                    </div>
                                                </SelectItem>
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div class="col-span-3">
                                    <Input v-model="variable.name" placeholder="Variable name" class="font-mono" />
                                </div>
                                <div class="col-span-6">
                                    <Input v-model="variable.value" placeholder="Variable value" type="text" class="font-mono" />
                                </div>
                                <div class="col-span-1 flex items-center">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        @click="removeVariable(index)"
                                        class="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    >
                                        <TrashIcon class="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </TransitionGroup>
                    </div>
                </div>

                <!-- Bulk Text Method -->
                <div v-else-if="activeMethod === BulkAddMethod.BULK" class="space-y-4">
                    <div>
                        <h3 class="text-lg font-medium mb-2">Bulk Add from Text</h3>
                        <p class="text-sm text-muted-foreground mb-4">
                            Enter variables in KEY=VALUE format, one per line. Prefix with SECRET: for secrets.
                        </p>
                    </div>

                    <div class="grid grid-cols-2 gap-4 min-h-[24rem] max-h-[32rem]">
                        <div class="space-y-2 flex flex-col">
                            <Label class="text-sm font-medium">Input</Label>
                            <Textarea
                                v-model="bulkText"
                                placeholder="DATABASE_URL=postgres://localhost:5432/db&#10;SECRET:API_KEY=your-secret-key&#10;NODE_ENV=production"
                                class="flex-1 font-mono text-sm resize-y min-h-[20rem] max-h-[28rem]"
                            />
                        </div>
                        <div class="space-y-2 flex flex-col">
                            <Label class="text-sm font-medium">Preview ({{ parsedVariables.length }} variables)</Label>
                            <div class="flex-1 border rounded-md p-3 overflow-y-auto bg-muted/20 min-h-[20rem] max-h-[28rem]">
                                <div v-if="parsedVariables.length === 0" class="text-sm text-muted-foreground">
                                    Variables will appear here as you type...
                                </div>
                                <div v-else class="space-y-2">
                                    <div v-for="(variable, index) in parsedVariables" :key="index" class="flex items-center gap-2 text-sm">
                                        <Badge :variant="!variable.isSecret ? 'default' : 'secondary'" class="text-xs">
                                            {{ !variable.isSecret ? 'PUBLIC' : 'SECRET' }}
                                        </Badge>
                                        <code class="font-mono">{{ variable.name }}</code>
                                        <span class="text-muted-foreground">=</span>
                                        <code class="font-mono text-muted-foreground">
                                            {{ variable.value }}
                                        </code>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- File Upload Method -->
                <div v-else-if="activeMethod === BulkAddMethod.FILE" class="space-y-4">
                    <div>
                        <h3 class="text-lg font-medium mb-2">Upload from File</h3>
                        <p class="text-sm text-muted-foreground mb-4">Upload a .env file or any text file with KEY=VALUE pairs.</p>
                    </div>

                    <div
                        @dragover="handleDragOver"
                        @dragleave="handleDragLeave"
                        @drop="handleDrop"
                        @click="fileInput?.click()"
                        :class="[
                            'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200',
                            isDragOver
                                ? 'border-primary bg-primary/5 scale-[1.02]'
                                : 'border-muted-foreground/25 hover:border-muted-foreground/40 hover:bg-muted/20',
                        ]"
                    >
                        <input ref="fileInput" type="file" accept=".env,.txt" @change="handleFileUpload" class="hidden" />
                        <UploadIcon
                            :class="[
                                'h-12 w-12 mx-auto mb-4 transition-colors duration-200',
                                isDragOver ? 'text-primary' : 'text-muted-foreground',
                            ]"
                        />
                        <h4
                            :class="[
                                'text-lg font-medium mb-2 transition-colors duration-200',
                                isDragOver ? 'text-primary' : 'text-foreground',
                            ]"
                        >
                            {{ isDragOver ? 'Drop your file here' : 'Drop your file here' }}
                        </h4>
                        <p
                            :class="[
                                'text-sm mb-4 transition-colors duration-200',
                                isDragOver ? 'text-primary/70' : 'text-muted-foreground',
                            ]"
                        >
                            {{ isDragOver ? 'Release to upload' : 'or click to browse for a .env or .txt file' }}
                        </p>
                        <Button v-if="!isDragOver" @click.stop="fileInput?.click()" class="pointer-events-auto"> Choose File </Button>
                    </div>

                    <div v-if="uploadedVariables.length > 0" class="space-y-2">
                        <Label class="text-sm font-medium"> Uploaded Variables ({{ uploadedVariables.length }}) </Label>
                        <div class="max-h-40 overflow-y-auto border rounded-md p-3 bg-muted/20">
                            <div class="space-y-1">
                                <div v-for="(variable, index) in uploadedVariables" :key="index" class="flex items-center gap-2 text-sm">
                                    <Badge :variant="!variable.isSecret ? 'default' : 'secondary'" class="text-xs">
                                        {{ !variable.isSecret ? 'PUBLIC' : 'SECRET' }}
                                    </Badge>
                                    <code class="font-mono">{{ variable.name }}</code>
                                    <span class="text-muted-foreground">=</span>
                                    <code class="font-mono text-muted-foreground">
                                        {{ variable.value }}
                                    </code>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Copy from Service Method -->
                <div v-else-if="activeMethod === BulkAddMethod.COPY" class="space-y-4">
                    <div>
                        <h3 class="text-lg font-medium mb-2">Copy from Another Service</h3>
                        <p class="text-sm text-muted-foreground mb-4">Select a service and container to copy environment variables from.</p>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <!-- Service Selection -->
                        <div class="space-y-2">
                            <Label for="copy-service">Source Service</Label>
                            <Select v-model="copyFromService.selectedService" @update:model-value="onServiceChange">
                                <SelectTrigger>
                                    <SelectValue placeholder="Select service" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectItem v-for="service in availableServices" :key="service.name" :value="service.name">
                                            {{ service.name }}
                                        </SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>

                        <!-- Container Selection -->
                        <div class="space-y-2">
                            <Label for="copy-container">Source Container</Label>
                            <Select
                                v-model="copyFromService.selectedContainer"
                                @update:model-value="onContainerChange"
                                :disabled="!copyFromService.selectedService"
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select container" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectItem v-for="container in availableContainers" :key="container" :value="container">
                                            {{ container }}
                                        </SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <!-- Loading State -->
                    <div v-if="copyFromService.isLoadingVariables" class="flex items-center justify-center py-8">
                        <div class="flex items-center gap-2 text-muted-foreground">
                            <div class="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                            Loading variables...
                        </div>
                    </div>

                    <!-- Variables Preview -->
                    <div v-else-if="copyFromService.copiedVariables.length > 0" class="space-y-3">
                        <div class="flex items-center justify-between">
                            <h4 class="font-medium">Variables to Copy</h4>
                            <Badge variant="secondary" class="text-xs"> {{ copyFromService.copiedVariables.length }} variables </Badge>
                        </div>
                        <div class="border rounded-lg max-h-48 overflow-y-auto">
                            <div class="space-y-1 p-3">
                                <div
                                    v-for="(variable, index) in copyFromService.copiedVariables"
                                    :key="index"
                                    class="flex items-center gap-2 text-sm"
                                >
                                    <Badge :variant="!variable.isSecret ? 'default' : 'secondary'" class="text-xs">
                                        {{ !variable.isSecret ? 'PUBLIC' : 'SECRET' }}
                                    </Badge>
                                    <code class="font-mono">{{ variable.name }}</code>
                                    <span class="text-muted-foreground">=</span>
                                    <code class="font-mono text-muted-foreground">
                                        {{ variable.value }}
                                    </code>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Empty State -->
                    <div
                        v-else-if="copyFromService.selectedService && copyFromService.selectedContainer"
                        class="text-center py-8 text-muted-foreground"
                    >
                        <p>No environment variables found in the selected container.</p>
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div class="flex items-center justify-between pt-4 border-t">
                <div class="text-sm text-muted-foreground">{{ totalVariablesCount }} variables ready to add</div>
                <div class="flex items-center gap-2">
                    <Button variant="outline" @click="closeDialog"> Cancel </Button>
                    <Button
                        @click="addAllVariables"
                        :disabled="totalVariablesCount === 0 || isLoading"
                        class="hover:shadow-sm transition-all duration-200"
                    >
                        <span v-if="isLoading" class="flex items-center gap-2">
                            <div class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                            Adding...
                        </span>
                        <span v-else> Add {{ totalVariablesCount }} Variables </span>
                    </Button>
                </div>
            </div>
        </DialogContent>
    </Dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CopyIcon, EditIcon, FileTextIcon, GlobeIcon, KeyIcon, PlusIcon, TrashIcon, UploadIcon } from 'lucide-vue-next';
import type { ServiceInterface } from '@/views/AWS/Services/types/service.interface';
import { useToast } from '@/components/ui/toast';
import { BulkAddMethod } from '@/types/aws/environment-variable.enums';
import { AwsService } from '@/services/aws.service';
import {
    type AddEnvironmentVariablesInput,
    addEnvironmentVariablesSchema,
} from '@/views/AWS/Services/components/environment-variable.schema';
import { useDataStore } from '@/stores/dataStore';
import { storeToRefs } from 'pinia';
import { PermissionEnum } from '@/enums/user/user.enum.ts';
import { usePermissions } from '@/composables/usePermissions.ts';

interface Variable {
    id: string;
    name: string;
    value: string;
    isSecret: boolean;
}

const props = defineProps<{
    open: boolean;
    service: ServiceInterface | null;
    container?: string;
}>();

const emit = defineEmits<{
    (e: 'update:open', value: boolean): void;
    (e: 'added'): void;
}>();

const { toast } = useToast();
const { hasPermission } = usePermissions();
const awsService = new AwsService();
const store = useDataStore();
const { services } = storeToRefs(store);

// Reactive state
const activeMethod = ref<string>(BulkAddMethod.INDIVIDUAL);
const isLoading = ref(false);
const individualVariables = ref<Variable[]>([]);
const bulkText = ref('');
const uploadedVariables = ref<Variable[]>([]);
const fileInput = ref<HTMLInputElement | null>(null);
const isDragOver = ref(false);

// Copy from service state
const copyFromService = ref({
    selectedService: '',
    selectedContainer: '',
    copiedVariables: [] as Variable[],
    isLoadingVariables: false,
});

// Computed properties
const isOpen = computed({
    get: () => props.open,
    set: (value) => emit('update:open', value),
});

const addMethods = computed(() => [
    { key: BulkAddMethod.INDIVIDUAL, label: 'Individual', icon: EditIcon },
    { key: BulkAddMethod.BULK, label: 'Bulk Text', icon: FileTextIcon },
    { key: BulkAddMethod.FILE, label: 'File Upload', icon: UploadIcon },
    { key: BulkAddMethod.COPY, label: 'Copy from Service', icon: CopyIcon },
]);

const parsedVariables = computed(() => {
    if (!bulkText.value.trim()) return [];

    const lines = bulkText.value.split('\n').filter((line) => line.trim());
    const variables: Variable[] = [];

    lines.forEach((line, index) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;

        let isSecret = false;
        let processedLine = trimmed;

        if (trimmed.startsWith('SECRET:')) {
            isSecret = true;
            processedLine = trimmed.substring(7);
        }

        const equalIndex = processedLine.indexOf('=');
        if (equalIndex > 0) {
            const name = processedLine.substring(0, equalIndex).trim();
            const value = processedLine.substring(equalIndex + 1).trim();

            variables.push({
                id: `bulk-${index}`,
                name,
                value,
                isSecret: isSecret,
            });
        }
    });

    return variables;
});

// Available services for copy operations (excluding current service)
const availableServices = computed(() => {
    return services.value.filter((s) => s.name !== props.service?.name);
});

// Available containers for selected service
const availableContainers = computed(() => {
    const service = services.value.find((s) => s.name === copyFromService.value.selectedService);
    return service?.containers.map((c) => c.name) || [];
});

const totalVariablesCount = computed(() => {
    switch (activeMethod.value) {
        case BulkAddMethod.INDIVIDUAL:
            return individualVariables.value.filter((v) => v.name.trim()).length;
        case BulkAddMethod.BULK:
            return parsedVariables.value.length;
        case BulkAddMethod.FILE:
            return uploadedVariables.value.length;
        case BulkAddMethod.COPY:
            return copyFromService.value.copiedVariables.length;
        default:
            return 0;
    }
});

const addNewVariable = () => {
    individualVariables.value.push({
        id: `var-${Date.now()}-${Math.random()}`,
        name: '',
        value: '',
        isSecret: false,
    });
};

const removeVariable = (index: number) => {
    individualVariables.value.splice(index, 1);
};

// Copy from service methods
const onServiceChange = () => {
    copyFromService.value.selectedContainer = '';
    copyFromService.value.copiedVariables = [];
};

const onContainerChange = async () => {
    if (!copyFromService.value.selectedService || !copyFromService.value.selectedContainer) {
        copyFromService.value.copiedVariables = [];
        return;
    }

    copyFromService.value.isLoadingVariables = true;
    try {
        const sourceService = services.value.find((s) => s.name === copyFromService.value.selectedService);
        const sourceContainer = sourceService?.containers.find((c) => c.name === copyFromService.value.selectedContainer);

        if (sourceContainer?.environmentVariables) {
            const variables: Variable[] = [];

            // Add environment variables
            if (sourceContainer.environmentVariables.environment) {
                sourceContainer.environmentVariables.environment.forEach((env) => {
                    variables.push({
                        id: `copy-env-${env.name}`,
                        name: env.name,
                        value: env.value || '',
                        isSecret: false,
                    });
                });
            }

            // Add secrets
            if (sourceContainer.environmentVariables.secrets) {
                sourceContainer.environmentVariables.secrets.forEach((secret) => {
                    variables.push({
                        id: `copy-secret-${secret.name}`,
                        name: secret.name,
                        value: secret.value || secret.valueFrom || '',
                        isSecret: true,
                    });
                });
            }

            copyFromService.value.copiedVariables = variables;
        }
    } catch (error) {
        console.error('Failed to load variables from service:', error);
        toast({
            variant: 'destructive',
            title: 'Failed to Load Variables',
            description: 'Could not load variables from the selected service.',
        });
        copyFromService.value.copiedVariables = [];
    } finally {
        copyFromService.value.isLoadingVariables = false;
    }
};

const handleFileUpload = (event: Event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    processFile(file);
};

const processFile = (file: File) => {
    // Validate file type
    const allowedTypes = ['.env', '.txt'];
    const fileName = file.name.toLowerCase();
    const isValidType = allowedTypes.some((type) => fileName.endsWith(type)) || file.type === 'text/plain';

    if (!isValidType) {
        toast({
            variant: 'destructive',
            title: 'Invalid File Type',
            description: 'Please upload a .env or .txt file.',
        });
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const content = e.target?.result as string;
        const variables = parseFileContent(content);
        uploadedVariables.value = variables;

        toast({
            variant: 'success',
            title: 'File Uploaded',
            description: `Found ${variables.length} variables in ${file.name}.`,
        });
    };
    reader.readAsText(file);
};

// AWS Systems Manager parameter name validation and sanitization
const validateParameterName = (name: string): { isValid: boolean; error?: string; suggestion?: string } => {
    // AWS Systems Manager parameter name requirements:
    // - Up to 2048 characters
    // - Can include: a-zA-Z0-9_.-/
    // - Must start with a letter or number
    // - Cannot contain spaces or other special characters

    if (!name || name.length === 0) {
        return { isValid: false, error: 'Parameter name cannot be empty' };
    }

    if (name.length > 2048) {
        return { isValid: false, error: 'Parameter name cannot exceed 2048 characters' };
    }

    // Check if name starts with a letter or number
    if (!/^[a-zA-Z0-9]/.test(name)) {
        const suggestion = sanitizeParameterName(name);
        return {
            isValid: false,
            error: 'Parameter name must start with a letter or number',
            suggestion: suggestion !== name ? suggestion : undefined,
        };
    }

    // Check for invalid characters
    if (!/^[a-zA-Z0-9_.\-/]+$/.test(name)) {
        const suggestion = sanitizeParameterName(name);
        return {
            isValid: false,
            error: 'Parameter name can only contain letters, numbers, and the symbols: _ . - /',
            suggestion: suggestion !== name ? suggestion : undefined,
        };
    }

    return { isValid: true };
};

// Sanitize parameter name to make it AWS Systems Manager compatible
const sanitizeParameterName = (name: string): string => {
    // Replace invalid characters with underscores
    let sanitized = name.replace(/[^a-zA-Z0-9_.\-/]/g, '_');

    // Ensure it starts with a letter or number
    if (!/^[a-zA-Z0-9]/.test(sanitized)) {
        sanitized = 'param_' + sanitized;
    }

    // Remove consecutive underscores
    sanitized = sanitized.replace(/_+/g, '_');

    // Remove trailing underscores
    sanitized = sanitized.replace(/_+$/, '');

    // Truncate if too long
    if (sanitized.length > 2048) {
        sanitized = sanitized.substring(0, 2048);
    }

    return sanitized;
};

const parseFileContent = (content: string): Variable[] => {
    const lines = content.split('\n').filter((line) => line.trim());
    const variables: Variable[] = [];

    lines.forEach((line, index) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;

        let isSecret = false;
        let processedLine = trimmed;

        if (trimmed.startsWith('SECRET:')) {
            isSecret = true;
            processedLine = trimmed.substring(7);
        }

        const equalIndex = processedLine.indexOf('=');
        if (equalIndex > 0) {
            const name = processedLine.substring(0, equalIndex).trim();
            const value = processedLine.substring(equalIndex + 1).trim();

            // Validate secret names for AWS Systems Manager compatibility
            if (isSecret) {
                const validation = validateParameterName(name);
                if (!validation.isValid) {
                    const suggestionText = validation.suggestion ? ` Suggested name: "${validation.suggestion}"` : '';
                    toast({
                        variant: 'destructive',
                        title: 'Invalid Secret Name',
                        description: `Secret "${name}": ${validation.error}.${suggestionText}`,
                    });
                    return; // Skip this variable
                }
            }

            variables.push({
                id: `file-${index}`,
                name,
                value,
                isSecret: isSecret,
            });
        }
    });

    return variables;
};

// Drag and drop handlers
const handleDragOver = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    isDragOver.value = true;
};

const handleDragLeave = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    isDragOver.value = false;
};

const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    isDragOver.value = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
        const file = files[0];
        processFile(file);
    }
};

const addAllVariables = async () => {
    if (!props.service || !props.container) {
        toast({
            variant: 'destructive',
            title: 'Missing Information',
            description: 'Service and container information are required.',
        });
        return;
    }

    let variablesToAdd: Variable[] = [];

    switch (activeMethod.value) {
        case BulkAddMethod.INDIVIDUAL:
            variablesToAdd = individualVariables.value.filter((v) => v.name.trim());
            break;
        case BulkAddMethod.BULK:
            variablesToAdd = parsedVariables.value;
            break;
        case BulkAddMethod.FILE:
            variablesToAdd = uploadedVariables.value;
            break;
        case BulkAddMethod.COPY:
            variablesToAdd = copyFromService.value.copiedVariables;
            break;
    }

    if (variablesToAdd.length === 0) {
        toast({
            variant: 'destructive',
            title: 'No Variables',
            description: 'Please add at least one variable before submitting.',
        });
        return;
    }

    isLoading.value = true;

    try {
        // Separate environment variables and secrets
        const environmentVariables = variablesToAdd.filter((v) => !v.isSecret);
        const secrets = variablesToAdd.filter((v) => v.isSecret);

        // Validate secret names before submission
        for (const secret of secrets) {
            const validation = validateParameterName(secret.name);
            if (!validation.isValid) {
                const suggestionText = validation.suggestion ? ` Suggested name: "${validation.suggestion}"` : '';
                toast({
                    variant: 'destructive',
                    title: 'Invalid Secret Name',
                    description: `Secret "${secret.name}": ${validation.error}.${suggestionText}`,
                });
                return;
            }
        }

        // Prepare the unified payload with both environment variables and secrets
        const payload: AddEnvironmentVariablesInput = {
            clusterName: props.service.clusterName,
            serviceName: props.service.name,
            containerName: props.container,
        };

        // Add environment variables if any
        if (environmentVariables.length > 0) {
            payload.environmentVariables = environmentVariables.map((v) => ({
                name: v.name,
                value: v.value,
            }));
        }

        // Add secrets if any
        if (secrets.length > 0) {
            payload.secrets = secrets.map((v) => ({
                name: v.name,
                valueFrom: v.value,
            }));
        }

        // Validate the payload
        const validationResult = addEnvironmentVariablesSchema.safeParse(payload);
        if (!validationResult.success) {
            toast({
                variant: 'destructive',
                title: 'Validation Error',
                description: 'Please ensure all variable names are valid.',
            });
            return;
        }

        await awsService.addEnvironmentVariables(payload);
        const addedCount = environmentVariables.length + secrets.length;

        toast({
            variant: 'success',
            title: 'Variables Added Successfully',
            description: `Successfully added ${addedCount} variable${addedCount > 1 ? 's' : ''} (${environmentVariables.length} environment variable${environmentVariables.length !== 1 ? 's' : ''}, ${secrets.length} secret${secrets.length !== 1 ? 's' : ''}) to ${props.container}.`,
        });

        emit('added');
        closeDialog();
    } catch (error) {
        console.error('Failed to add variables:', error);
        toast({
            variant: 'destructive',
            title: 'Failed to Add Variables',
            description: error instanceof Error ? error.message : 'An unexpected error occurred while adding variables.',
        });
    } finally {
        isLoading.value = false;
    }
};

const closeDialog = () => {
    isOpen.value = false;
    // Reset state
    individualVariables.value = [];
    bulkText.value = '';
    uploadedVariables.value = [];
    isDragOver.value = false;
    activeMethod.value = BulkAddMethod.INDIVIDUAL;

    // Reset copy state
    copyFromService.value = {
        selectedService: '',
        selectedContainer: '',
        copiedVariables: [],
        isLoadingVariables: false,
    };
};

// Initialize with one empty variable
watch(isOpen, (newValue) => {
    if (newValue && individualVariables.value.length === 0) {
        addNewVariable();
    }
});
</script>

<style scoped>
.variable-item-enter-active,
.variable-item-leave-active {
    transition: all 0.3s ease;
}

.variable-item-enter-from,
.variable-item-leave-to {
    opacity: 0;
    transform: translateY(-10px);
}

.variable-item-move {
    transition: transform 0.3s ease;
}
</style>
