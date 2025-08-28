<template>
    <Dialog v-model:open="isOpen">
        <DialogContent class="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
                <DialogTitle class="flex items-center gap-3">
                    <PlusIcon class="h-5 w-5 text-primary" />
                    Add Environment Variables
                    <Badge v-if="service" variant="outline" class="ml-2">
                        {{ service.name }} / {{ container }}
                    </Badge>
                </DialogTitle>
                <DialogDescription>
                    Add multiple environment variables and secrets at once
                </DialogDescription>
            </DialogHeader>

            <!-- Add Method Tabs -->
            <div class="border-b">
                <div class="flex space-x-1 p-1">
                    <button
                        v-for="method in addMethods"
                        :key="method.key"
                        @click="activeMethod = method.key"
                        :class="[
                            'px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 flex items-center gap-2',
                            activeMethod === method.key
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
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
                <div v-if="activeMethod === 'individual'" class="space-y-4">
                    <div class="flex items-center justify-between">
                        <h3 class="text-lg font-medium">Add Variables One by One</h3>
                        <Button
                            size="sm"
                            @click="addNewVariable"
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
                                class="grid grid-cols-12 gap-3 p-3 border rounded-lg hover:bg-muted/20 transition-colors"
                            >
                                <div class="col-span-1 flex items-center">
                                    <Select v-model="variable.type">
                                        <SelectTrigger class="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectItem value="environment">
                                                    <div class="flex items-center gap-2">
                                                        <GlobeIcon class="h-3 w-3" />
                                                        Env
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="secret">
                                                    <div class="flex items-center gap-2">
                                                        <KeyIcon class="h-3 w-3" />
                                                        Secret
                                                    </div>
                                                </SelectItem>
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div class="col-span-4">
                                    <Input
                                        v-model="variable.name"
                                        placeholder="Variable name"
                                        class="font-mono"
                                    />
                                </div>
                                <div class="col-span-6">
                                    <Input
                                        v-model="variable.value"
                                        placeholder="Variable value"
                                        :type="variable.type === 'secret' ? 'password' : 'text'"
                                        class="font-mono"
                                    />
                                </div>
                                <div class="col-span-1 flex items-center">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        @click="removeVariable(index)"
                                        class="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                    >
                                        <TrashIcon class="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </TransitionGroup>
                    </div>
                </div>

                <!-- Bulk Text Method -->
                <div v-else-if="activeMethod === 'bulk'" class="space-y-4">
                    <div>
                        <h3 class="text-lg font-medium mb-2">Bulk Add from Text</h3>
                        <p class="text-sm text-muted-foreground mb-4">
                            Enter variables in KEY=VALUE format, one per line. Prefix with SECRET: for secrets.
                        </p>
                    </div>

                    <div class="grid grid-cols-2 gap-4 h-80">
                        <div class="space-y-2">
                            <Label class="text-sm font-medium">Input</Label>
                            <Textarea
                                v-model="bulkText"
                                placeholder="DATABASE_URL=postgres://localhost:5432/db&#10;SECRET:API_KEY=your-secret-key&#10;NODE_ENV=production"
                                class="h-full font-mono text-sm resize-none"
                            />
                        </div>
                        <div class="space-y-2">
                            <Label class="text-sm font-medium">Preview ({{ parsedVariables.length }} variables)</Label>
                            <div class="h-full border rounded-md p-3 overflow-y-auto bg-muted/20">
                                <div v-if="parsedVariables.length === 0" class="text-sm text-muted-foreground">
                                    Variables will appear here as you type...
                                </div>
                                <div v-else class="space-y-2">
                                    <div
                                        v-for="(variable, index) in parsedVariables"
                                        :key="index"
                                        class="flex items-center gap-2 text-sm"
                                    >
                                        <Badge
                                            :variant="variable.type === 'environment' ? 'default' : 'secondary'"
                                            class="text-xs"
                                        >
                                            {{ variable.type === 'environment' ? 'ENV' : 'SECRET' }}
                                        </Badge>
                                        <code class="font-mono">{{ variable.name }}</code>
                                        <span class="text-muted-foreground">=</span>
                                        <code class="font-mono text-muted-foreground">
                                            {{ variable.type === 'secret' ? '••••••••' : variable.value }}
                                        </code>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- File Upload Method -->
                <div v-else-if="activeMethod === 'file'" class="space-y-4">
                    <div>
                        <h3 class="text-lg font-medium mb-2">Upload from File</h3>
                        <p class="text-sm text-muted-foreground mb-4">
                            Upload a .env file or any text file with KEY=VALUE pairs.
                        </p>
                    </div>

                    <div class="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                        <input
                            ref="fileInput"
                            type="file"
                            accept=".env,.txt"
                            @change="handleFileUpload"
                            class="hidden"
                        />
                        <UploadIcon class="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h4 class="text-lg font-medium mb-2">Drop your file here</h4>
                        <p class="text-sm text-muted-foreground mb-4">
                            or click to browse for a .env or .txt file
                        </p>
                        <Button @click="$refs.fileInput?.click()">
                            Choose File
                        </Button>
                    </div>

                    <div v-if="uploadedVariables.length > 0" class="space-y-2">
                        <Label class="text-sm font-medium">
                            Uploaded Variables ({{ uploadedVariables.length }})
                        </Label>
                        <div class="max-h-40 overflow-y-auto border rounded-md p-3 bg-muted/20">
                            <div class="space-y-1">
                                <div
                                    v-for="(variable, index) in uploadedVariables"
                                    :key="index"
                                    class="flex items-center gap-2 text-sm"
                                >
                                    <Badge
                                        :variant="variable.type === 'environment' ? 'default' : 'secondary'"
                                        class="text-xs"
                                    >
                                        {{ variable.type === 'environment' ? 'ENV' : 'SECRET' }}
                                    </Badge>
                                    <code class="font-mono">{{ variable.name }}</code>
                                    <span class="text-muted-foreground">=</span>
                                    <code class="font-mono text-muted-foreground">
                                        {{ variable.type === 'secret' ? '••••••••' : variable.value }}
                                    </code>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div class="flex items-center justify-between pt-4 border-t">
                <div class="text-sm text-muted-foreground">
                    {{ totalVariablesCount }} variables ready to add
                </div>
                <div class="flex items-center gap-2">
                    <Button variant="outline" @click="closeDialog">
                        Cancel
                    </Button>
                    <Button
                        @click="addAllVariables"
                        :disabled="totalVariablesCount === 0"
                        class="hover:shadow-sm transition-all duration-200"
                    >
                        Add {{ totalVariablesCount }} Variables
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
import {
    PlusIcon,
    TrashIcon,
    GlobeIcon,
    KeyIcon,
    FileTextIcon,
    UploadIcon,
    EditIcon
} from 'lucide-vue-next';
import type { ServiceInterface } from '@/views/AWS/Services/types/service.interface';
import { useToast } from '@/components/ui/toast';

interface Variable {
    id: string;
    name: string;
    value: string;
    type: 'environment' | 'secret';
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

// Reactive state
const activeMethod = ref<string>('individual');
const individualVariables = ref<Variable[]>([]);
const bulkText = ref('');
const uploadedVariables = ref<Variable[]>([]);
const fileInput = ref<HTMLInputElement | null>(null);

// Computed properties
const isOpen = computed({
    get: () => props.open,
    set: (value) => emit('update:open', value),
});

const addMethods = computed(() => [
    { key: 'individual', label: 'Individual', icon: EditIcon },
    { key: 'bulk', label: 'Bulk Text', icon: FileTextIcon },
    { key: 'file', label: 'File Upload', icon: UploadIcon },
]);

const parsedVariables = computed(() => {
    if (!bulkText.value.trim()) return [];

    const lines = bulkText.value.split('\n').filter(line => line.trim());
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
                type: isSecret ? 'secret' : 'environment'
            });
        }
    });

    return variables;
});

const totalVariablesCount = computed(() => {
    switch (activeMethod.value) {
        case 'individual':
            return individualVariables.value.filter(v => v.name.trim()).length;
        case 'bulk':
            return parsedVariables.value.length;
        case 'file':
            return uploadedVariables.value.length;
        default:
            return 0;
    }
});


const addNewVariable = () => {
    individualVariables.value.push({
        id: `var-${Date.now()}-${Math.random()}`,
        name: '',
        value: '',
        type: 'environment'
    });
};

const removeVariable = (index: number) => {
    individualVariables.value.splice(index, 1);
};

const handleFileUpload = (event: Event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const content = e.target?.result as string;
        const variables = parseFileContent(content);
        uploadedVariables.value = variables;

        toast({
            variant: 'success',
            title: 'File Uploaded',
            description: `Found ${variables.length} variables in the file.`
        });
    };
    reader.readAsText(file);
};

const parseFileContent = (content: string): Variable[] => {
    const lines = content.split('\n').filter(line => line.trim());
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
                id: `file-${index}`,
                name,
                value,
                type: isSecret ? 'secret' : 'environment'
            });
        }
    });

    return variables;
};

const addAllVariables = () => {
    let variablesToAdd: Variable[] = [];

    switch (activeMethod.value) {
        case 'individual':
            variablesToAdd = individualVariables.value.filter(v => v.name.trim());
            break;
        case 'bulk':
            variablesToAdd = parsedVariables.value;
            break;
        case 'file':
            variablesToAdd = uploadedVariables.value;
            break;
    }

    if (variablesToAdd.length === 0) return;

    // Here you would implement the actual API call to add variables
    toast({
        variant: 'success',
        title: 'Variables Added',
        description: `Successfully added ${variablesToAdd.length} variables.`
    });

    emit('added');
    closeDialog();
};

const closeDialog = () => {
    isOpen.value = false;
    // Reset state
    individualVariables.value = [];
    bulkText.value = '';
    uploadedVariables.value = [];
    activeMethod.value = 'individual';
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
