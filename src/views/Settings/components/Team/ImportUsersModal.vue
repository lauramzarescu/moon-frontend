<template>
    <Dialog :open="isOpen" @update:open="$emit('update:isOpen', $event)">
        <DialogContent class="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>Import Users</DialogTitle>
                <DialogDescription> Import users by uploading a JSON file or by pasting JSON data directly. </DialogDescription>
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

                <!-- Expected Format Info -->
                <div class="p-4 bg-muted/50 rounded-lg">
                    <h4 class="text-sm font-medium mb-2">Expected JSON Format:</h4>
                    <pre class="text-xs text-muted-foreground overflow-x-auto"><code>[
  {
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  },
  {
    "name": "Jane Smith",
    "email": "jane@example.com",
    "role": "admin"
  }
]</code></pre>
                </div>
            </div>

            <DialogFooter>
                <Button type="button" variant="outline" @click="closeModal"> Cancel</Button>
                <Button type="button" :disabled="!canImport || isLoading" @click="handleImport">
                    <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
                    Import Users
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
import { AlertCircle, FileText, Loader2, Upload, X } from 'lucide-vue-next';
import { UserService } from '@/services/user.service.ts';

const props = defineProps<{
    isOpen: boolean;
}>();

const emit = defineEmits<{
    (e: 'update:isOpen', value: boolean): void;
    (e: 'users-imported'): void;
}>();

const userService = new UserService();

// State
const activeTab = ref<'file' | 'json'>('file');
const isDragOver = ref(false);
const selectedFile = ref<File | null>(null);
const jsonData = ref('');
const jsonError = ref('');
const isLoading = ref(false);

// Computed
const canImport = computed(() => {
    if (activeTab.value === 'file') {
        return selectedFile.value !== null;
    } else {
        return jsonData.value.trim() !== '' && jsonError.value === '';
    }
});

// Watch for JSON validation
watch(jsonData, (newValue) => {
    if (!newValue.trim()) {
        jsonError.value = '';
        return;
    }

    try {
        JSON.parse(newValue);
        jsonError.value = '';
    } catch (error) {
        jsonError.value = error instanceof Error ? error.message : 'Invalid JSON format';
    }
});

// Methods
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
};

const handleImport = async () => {
    if (!canImport.value) return;

    isLoading.value = true;
    try {
        let fileToImport: File;

        if (activeTab.value === 'file' && selectedFile.value) {
            fileToImport = selectedFile.value;
        } else if (activeTab.value === 'json' && jsonData.value.trim()) {
            const blob = new Blob([jsonData.value], { type: 'application/json' });
            fileToImport = new File([blob], 'users.json', { type: 'application/json' });
        } else {
            return;
        }

        await userService.importUsers(fileToImport);

        emit('update:isOpen', false);
        emit('users-imported');
        resetForm();

        toast({
            title: 'Users imported successfully',
            description: 'The users have been imported into the system.',
        });
    } catch (error) {
        toast({
            title: 'Error importing users',
            description: error instanceof Error ? error.message : 'An unknown error occurred',
            variant: 'destructive',
        });
    } finally {
        isLoading.value = false;
    }
};
</script>
