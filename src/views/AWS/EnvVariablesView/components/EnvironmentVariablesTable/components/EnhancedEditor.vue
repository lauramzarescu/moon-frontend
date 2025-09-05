<template>
    <Dialog v-model:open="isOpen">
        <DialogContent class="max-w-4xl max-h-[80vh] flex flex-col">
            <DialogHeader>
                <DialogTitle>Edit Variable</DialogTitle>
                <DialogDescription>
                    <div class="flex items-center gap-2">
                        <Badge :variant="variableId.startsWith('secret-') ? 'secondary' : 'default'" class="text-xs">
                            {{ variableId.startsWith('secret-') ? 'SECRET' : 'ENV' }}
                        </Badge>
                        <Badge v-if="selectedType === VariableDataType.JSON" variant="outline" class="text-xs"> JSON </Badge>
                        <Badge v-if="autoDetectedType !== selectedType" variant="outline" class="text-xs text-orange-600">
                            Auto-detected: {{ getTypeLabel(autoDetectedType) }}
                        </Badge>
                    </div>
                </DialogDescription>
            </DialogHeader>

            <div class="flex-1 min-h-0 space-y-4">
                <!-- Variable Name -->
                <div class="space-y-2">
                    <Label for="variable-name" class="text-sm font-medium">Variable Name</Label>
                    <Input id="variable-name" v-model="name" @input="syncToParent" class="font-mono" placeholder="VARIABLE_NAME" />
                </div>

                <!-- Variable Type Selector -->
                <div class="space-y-2">
                    <Label for="variable-type" class="text-sm font-medium">
                        Variable Type
                        <span class="text-xs text-muted-foreground font-normal">(optional - auto-detected from value)</span>
                    </Label>

                    <!-- Temporary native select for testing -->
                    <select
                        :value="selectedType"
                        @change="
                            (e) => {
                                selectedType = e.target?.value;
                                syncToParent();
                            }
                        "
                        class="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                    >
                        <option value="">Select variable type...</option>
                        <option v-for="type in VARIABLE_TYPES" :key="type.type" :value="type.type">
                            {{ type.label }} - {{ type.description }}
                        </option>
                    </select>
                </div>

                <!-- JSON Pretty Toggle -->
                <div v-if="selectedType === VariableDataType.JSON" class="flex items-center space-x-2">
                    <Switch
                        id="pretty-json"
                        :checked="prettyJson"
                        @update:checked="
                            (checked) => {
                                prettyJson = checked;
                                toggleJsonPretty();
                            }
                        "
                    />
                    <Label for="pretty-json" class="text-sm">Pretty format JSON</Label>
                </div>

                <!-- Variable Value -->
                <div class="space-y-2 flex-1 min-h-0 flex flex-col">
                    <Label for="variable-value" class="text-sm font-medium">Variable Value</Label>
                    <Textarea
                        id="variable-value"
                        v-model="value"
                        @input="
                            () => {
                                updateAutoDetectedType();
                                syncToParent();
                            }
                        "
                        class="min-h-[350px] font-mono text-sm resize-none flex-1"
                        :class="{ 'whitespace-pre': selectedType === VariableDataType.JSON && prettyJson }"
                        placeholder="Enter variable value..."
                    />
                </div>

                <!-- Value Info and Validation -->
                <div class="text-xs flex items-center gap-4">
                    <span class="text-muted-foreground">Length: {{ value.length }} characters</span>
                    <span v-if="validationMessage" :class="validationMessage.includes('✓') ? 'text-green-600' : 'text-red-600'">
                        {{ validationMessage }}
                    </span>
                </div>
            </div>

            <DialogFooter class="gap-2">
                <Button variant="outline" @click="closeEditor" :disabled="isSaving"> Cancel </Button>
                <Button @click="saveEditor" :disabled="!isValidForSaving || isSaving">
                    <div v-if="isSaving" class="flex items-center gap-2">
                        <div class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                        Saving...
                    </div>
                    <span v-else>Save Changes</span>
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import {
    detectVariableType,
    formatJson,
    getValidationMessage,
    isValidForType,
    VARIABLE_TYPES,
    VariableDataType,
} from '../utils/variableUtils';
import type { EnhancedEditorState } from '../types';

interface Props {
    modelValue: EnhancedEditorState;
}

interface Emits {
    (e: 'update:modelValue', value: EnhancedEditorState): void;
    (e: 'save', data: { name: string; value: string; selectedType: VariableDataType }): void;
    (e: 'close'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const { toast } = useToast();

const isOpen = ref(props.modelValue.isOpen);
const name = ref(props.modelValue.name);
const value = ref(props.modelValue.value);
const selectedType = ref(props.modelValue.selectedType);
const autoDetectedType = ref(props.modelValue.autoDetectedType);
const prettyJson = ref(props.modelValue.prettyJson);
const isSaving = ref(false);

watch(
    () => props.modelValue.isOpen,
    (newValue) => {
        if (newValue) {
            // Only update when dialog opens to avoid recursive updates
            isOpen.value = newValue;
            name.value = props.modelValue.name;
            value.value = props.modelValue.value;
            selectedType.value = props.modelValue.selectedType;
            autoDetectedType.value = props.modelValue.autoDetectedType;
            prettyJson.value = props.modelValue.prettyJson;

            // Update auto-detected type when dialog opens
            updateAutoDetectedType();
        }
    },
    { immediate: true },
);

watch(isOpen, (open) => {
    if (!open) emit('close');
});


// Sync local changes back to parent periodically (debounced)
let syncTimeout: NodeJS.Timeout | null = null;
const syncToParent = () => {
    if (syncTimeout) clearTimeout(syncTimeout);
    syncTimeout = setTimeout(() => {
        if (isOpen.value) {
            emit('update:modelValue', {
                ...props.modelValue,
                name: name.value,
                value: value.value,
                selectedType: selectedType.value,
                autoDetectedType: autoDetectedType.value,
                prettyJson: prettyJson.value,
            });
        }
    }, 300);
};

const variableId = computed(() => props.modelValue.variableId);

const getTypeLabel = (type: VariableDataType): string => {
    return VARIABLE_TYPES.find((t) => t.type === type)?.label || 'Text';
};

const validationMessage = computed(() => {
    if (!value.value) return null;

    if (selectedType.value === VariableDataType.JSON) {
        const message = getValidationMessage(value.value, VariableDataType.JSON);
        return message ? `✗ ${message}` : '✓ Valid JSON';
    }

    return null;
});

const isValidForSaving = computed(() => {
    if (!value.value) return true;

    // If JSON type is selected, validate JSON syntax
    if (selectedType.value === VariableDataType.JSON) {
        return isValidForType(value.value, VariableDataType.JSON);
    }

    return true;
});

const toggleJsonPretty = () => {
    if (selectedType.value === VariableDataType.JSON) {
        try {
            if (prettyJson.value) {
                value.value = formatJson(value.value, true);
            } else {
                value.value = formatJson(value.value, false);
            }
        } catch (error) {
            console.error('Error formatting JSON:', error);
            toast({
                variant: 'destructive',
                title: 'JSON Format Error',
                description: 'Unable to format JSON. Please check the syntax.',
            });
        }
    }
};

const saveEditor = async () => {
    isSaving.value = true;

    try {
        let finalValue = value.value;

        // If JSON type is selected, always minify for storage
        if (selectedType.value === VariableDataType.JSON) {
            try {
                const parsed = JSON.parse(finalValue);
                finalValue = JSON.stringify(parsed);
            } catch {
                // If parsing fails, keep the original value
            }
        }

        emit('update:modelValue', {
            ...props.modelValue,
            name: name.value.trim(),
            value: finalValue,
            selectedType: selectedType.value,
            autoDetectedType: autoDetectedType.value,
            prettyJson: prettyJson.value,
        });

        emit('save', {
            name: name.value.trim(),
            value: finalValue,
            selectedType: selectedType.value,
        });

        // Add a small delay to show the loading state
        await new Promise((resolve) => setTimeout(resolve, 300));

        closeEditor();

        toast({
            variant: 'success',
            title: 'Variable Saved',
            description: 'Variable has been saved successfully.',
        });
    } catch (error) {
        console.error('Error saving variable:', error);
        toast({
            variant: 'destructive',
            title: 'Save Failed',
            description: 'Failed to save variable. Please try again.',
        });
    } finally {
        isSaving.value = false;
    }
};

const closeEditor = () => {
    isOpen.value = false;
    emit('close');
};

const updateAutoDetectedType = () => {
    if (value.value) {
        const detectedType = detectVariableType(value.value);
        autoDetectedType.value = detectedType;

        // Auto-update selected type if JSON is detected and not already selected
        if (detectedType === VariableDataType.JSON && selectedType.value !== VariableDataType.JSON) {
            selectedType.value = detectedType;
            prettyJson.value = true;
        }
    }
};
</script>
