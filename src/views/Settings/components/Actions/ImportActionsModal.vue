<template>
    <Dialog :open="isOpen" @update:open="$emit('update:isOpen', $event)">
        <DialogContent class="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>Import Actions</DialogTitle>
                <DialogDescription> Import actions by uploading a JSON file or by pasting JSON data directly. </DialogDescription>
            </DialogHeader>

            <div class="space-y-6 py-4">
                <!-- Tab Selection -->
                <div class="flex space-x-1 bg-muted p-1 rounded-lg">
                    <button
                        type="button"
                        :class="[
                            'flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                            activeTab === 'file'
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground',
                        ]"
                        @click="activeTab = 'file'"
                    >
                        Upload File
                    </button>
                    <button
                        type="button"
                        :class="[
                            'flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                            activeTab === 'json'
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground',
                        ]"
                        @click="activeTab = 'json'"
                    >
                        JSON Editor
                    </button>
                </div>

                <!-- File Upload Tab -->
                <div v-if="activeTab === 'file'" class="space-y-4">
                    <div
                        :class="[
                            'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
                            isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/50',
                        ]"
                        @dragover.prevent="isDragOver = true"
                        @dragleave.prevent="isDragOver = false"
                        @drop.prevent="handleFileDrop"
                    >
                        <Upload class="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <div class="space-y-2">
                            <p class="text-sm font-medium">
                                Drop your JSON file here, or
                                <button type="button" class="text-primary hover:underline" @click="$refs.fileInput?.click()">browse</button>
                            </p>
                            <p class="text-xs text-muted-foreground">Supports JSON files up to 10MB</p>
                        </div>
                        <input ref="fileInput" type="file" accept=".json" class="hidden" @change="handleFileSelect" />
                    </div>

                    <!-- Selected File Info -->
                    <div v-if="selectedFile" class="flex items-center space-x-2 p-3 bg-muted rounded-lg">
                        <FileText class="h-4 w-4 text-muted-foreground" />
                        <span class="text-sm font-medium">{{ selectedFile.name }}</span>
                        <span class="text-xs text-muted-foreground">({{ formatFileSize(selectedFile.size) }})</span>
                        <button type="button" class="ml-auto text-muted-foreground hover:text-foreground" @click="clearFile">
                            <X class="h-4 w-4" />
                        </button>
                    </div>
                </div>

                <!-- JSON Editor Tab -->
                <div v-if="activeTab === 'json'" class="space-y-4">
                    <div class="space-y-2">
                        <Label for="json-editor">JSON Data</Label>
                        <textarea
                            id="json-editor"
                            v-model="jsonData"
                            class="min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                            placeholder="Paste your JSON data here..."
                        />
                    </div>

                    <!-- JSON Validation Error -->
                    <div v-if="jsonError" class="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                        <div class="flex items-center space-x-2">
                            <AlertCircle class="h-4 w-4 text-destructive" />
                            <span class="text-sm font-medium text-destructive">Invalid JSON</span>
                        </div>
                        <p class="text-xs text-destructive/80 mt-1">{{ jsonError }}</p>
                    </div>
                </div>

                <!-- Validation Errors -->
                <Alert v-if="validationErrors.length > 0" variant="destructive">
                    <AlertCircle class="h-4 w-4" />
                    <AlertTitle>Validation Errors</AlertTitle>
                    <AlertDescription>
                        <ul class="list-disc list-inside space-y-1">
                            <li v-for="error in validationErrors" :key="error">{{ error }}</li>
                        </ul>
                    </AlertDescription>
                </Alert>

                <!-- Preview -->
                <Alert v-if="previewData.length > 0" variant="info">
                    <InfoIcon class="h-4 w-4" />
                    <AlertTitle>Preview</AlertTitle>
                    <AlertDescription>
                        Found {{ previewData.length }} action(s) to import:
                        <ul class="list-disc list-inside mt-2 space-y-1">
                            <li v-for="action in previewData.slice(0, 5)" :key="action.name">
                                {{ action.name }} ({{ actionTypeLabels[action.actionType] }})
                            </li>
                            <li v-if="previewData.length > 5" class="text-muted-foreground">... and {{ previewData.length - 5 }} more</li>
                        </ul>
                    </AlertDescription>
                </Alert>

                <!-- Expected Format Info -->
                <div class="p-4 bg-muted/50 rounded-lg">
                    <h4 class="text-sm font-medium mb-2">Expected JSON Format:</h4>
                    <pre class="text-xs text-muted-foreground overflow-x-auto"><code>[
  {
    "name": "Action Name",
    "actionType": "webhook",
    "description": "Action description",
    "configuration": {
      "url": "https://example.com/webhook",
      "method": "POST"
    }
  }
]</code></pre>
                </div>
            </div>

            <DialogFooter>
                <Button type="button" variant="outline" @click="closeModal"> Cancel</Button>
                <Button type="button" :disabled="!canImport || isLoading" @click="handleImport">
                    <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
                    Import Actions
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { toast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, FileText, InfoIcon, Loader2, Upload, X } from 'lucide-vue-next';
import { ActionService } from '@/services/action.service.ts';
import { type ActionImportInput, actionImportSchema, actionTypeLabels } from './schema';

const props = defineProps<{
    isOpen: boolean;
}>();

const emit = defineEmits<{
    (e: 'update:isOpen', value: boolean): void;
    (e: 'actions-imported'): void;
}>();

const actionService = new ActionService();

// State
const activeTab = ref<'file' | 'json'>('file');
const isDragOver = ref(false);
const selectedFile = ref<File | null>(null);
const jsonData = ref('');
const jsonError = ref('');
const isLoading = ref(false);
const validationErrors = ref<string[]>([]);
const previewData = ref<ActionImportInput[]>([]);

// Computed
const canImport = computed(() => {
    if (activeTab.value === 'file') {
        return selectedFile.value !== null && validationErrors.value.length === 0;
    } else {
        return jsonData.value.trim() !== '' && jsonError.value === '' && validationErrors.value.length === 0;
    }
});

// Watch for JSON validation and preview
watch(jsonData, (newValue) => {
    if (!newValue.trim()) {
        jsonError.value = '';
        validationErrors.value = [];
        previewData.value = [];
        return;
    }

    try {
        const data = JSON.parse(newValue);
        jsonError.value = '';
        validateData(data);
    } catch (error) {
        jsonError.value = error instanceof Error ? error.message : 'Invalid JSON format';
        validationErrors.value = [];
        previewData.value = [];
    }
});

// Watch for file selection
watch(selectedFile, (newFile) => {
    if (newFile) {
        validateFile(newFile);
    } else {
        validationErrors.value = [];
        previewData.value = [];
    }
});


const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const handleFileDrop = (event: DragEvent) => {
    isDragOver.value = false;
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
        const file = files[0];
        if (file.type === 'application/json' || file.name.endsWith('.json')) {
            selectedFile.value = file;
        } else {
            toast({
                title: 'Invalid file type',
                description: 'Please select a JSON file.',
                variant: 'destructive',
            });
        }
    }
};

const handleFileSelect = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const files = target.files;
    if (files && files.length > 0) {
        selectedFile.value = files[0];
    }
};

const clearFile = () => {
    selectedFile.value = null;
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
        fileInput.value = '';
    }
};

const validateFile = (file: File) => {
    const reader = new FileReader();

    reader.onload = (e) => {
        try {
            const content = e.target?.result as string;
            const data = JSON.parse(content);
            validateData(data);
        } catch (error) {
            validationErrors.value = ['Invalid JSON file format'];
            previewData.value = [];
        }
    };

    reader.readAsText(file);
};

const validateData = (data: any) => {
    validationErrors.value = [];
    previewData.value = [];

    if (!Array.isArray(data)) {
        validationErrors.value.push('File must contain an array of actions');
        return;
    }

    if (data.length === 0) {
        validationErrors.value.push('File must contain at least one action');
        return;
    }

    const validActions: ActionImportInput[] = [];
    const errors: string[] = [];

    data.forEach((item, index) => {
        const result = actionImportSchema.safeParse(item);
        if (result.success) {
            validActions.push(result.data);
        } else {
            errors.push(`Action ${index + 1}: ${result.error.errors.map((e) => e.message).join(', ')}`);
        }
    });
    if (errors.length > 0) {
        validationErrors.value = errors;
    } else {
        previewData.value = validActions;
    }
};

const closeModal = () => {
    emit('update:isOpen', false);
    resetForm();
};

const resetForm = () => {
    activeTab.value = 'file';
    selectedFile.value = null;
    jsonData.value = '';
    jsonError.value = '';
    isDragOver.value = false;
    validationErrors.value = [];
    previewData.value = [];
};

const handleImport = async () => {
    if (!canImport.value) return;

    isLoading.value = true;
    try {
        let fileToImport: File;

        if (activeTab.value === 'file' && selectedFile.value) {
            fileToImport = selectedFile.value;
        } else if (activeTab.value === 'json' && jsonData.value.trim()) {
            // Create a File object from JSON data
            const blob = new Blob([jsonData.value], { type: 'application/json' });
            fileToImport = new File([blob], 'actions.json', { type: 'application/json' });
        } else {
            return;
        }

        const response = await actionService.importActions(fileToImport);

        emit('update:isOpen', false);
        emit('actions-imported');
        resetForm();

        toast({
            title: 'Import successful',
            description: `${response.summary.successful} actions imported successfully.`,
            variant: 'success',
        });
    } catch (error) {
        console.error('Failed to import actions:', error);
        toast({
            title: 'Import failed',
            description: error instanceof Error ? error.message : 'Failed to import actions. Please try again.',
            variant: 'destructive',
        });
    } finally {
        isLoading.value = false;
    }
};

watch(
    () => props.isOpen,
    (newValue) => {
        if (!newValue) {
            resetForm();
        }
    },
);
</script>
