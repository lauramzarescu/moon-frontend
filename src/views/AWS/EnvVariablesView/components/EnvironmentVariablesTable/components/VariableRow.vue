<template>
    <div class="grid grid-cols-12 gap-4 px-4 py-3 border-b last:border-b-0 transition-colors group">
        <!-- Checkbox -->
        <div class="col-span-1 flex items-center">
            <Checkbox :checked="isSelected" @update:checked="(checked) => onSelect(variableId, checked)" />
        </div>

        <!-- Variable Name -->
        <div class="col-span-4 flex items-center">
            <div class="w-full">
                <Input
                    v-if="variable.isNew && isEditingName"
                    v-model="editNameModel"
                    placeholder="Variable name"
                    class="text-sm font-mono"
                    @keydown.enter="saveNewVariable"
                    @keydown.escape="cancelNewVariable"
                    :data-editing-name="variableId"
                />
                <div
                    v-else
                    class="text-sm font-mono font-medium cursor-pointer hover:bg-muted/50 px-2 py-1 rounded transition-colors flex items-center gap-2"
                    @click="startEditName"
                >
                    <span>{{ variable.name || '(unnamed)' }}</span>
                    <div v-if="isEdited || isNew" class="flex items-center gap-1 flex-shrink-0">
                        <PencilIcon class="h-4 w-4 text-orange-500" title="This variable has unsaved changes" />
                        <RotateCcwIcon
                            v-if="isEdited && !isNew"
                            @click.stop="resetVariable"
                            class="h-4 w-4 text-gray-400 hover:text-orange-500 cursor-pointer transition-colors"
                            title="Reset to original value"
                        />
                    </div>
                </div>
            </div>
        </div>

        <!-- Variable Value -->
        <div class="col-span-6 flex items-center">
            <div class="w-full">
                <Input
                    v-if="isEditingValue"
                    v-model="editValueModel"
                    @keydown.enter="handleEnterKey"
                    @keydown.escape="handleEscapeKey"
                    class="text-sm"
                    :data-editing="variableId"
                    :placeholder="variable.isNew ? 'Variable value' : ''"
                />
                <div
                    v-else-if="!variable.isNew || (variable.isNew && variable.name)"
                    class="text-sm font-mono cursor-pointer hover:bg-muted/50 px-2 py-1 rounded transition-colors flex items-center gap-2 group"
                >
                    <span @click="startEditValue" class="truncate flex-1">
                        {{ displayValue }}
                    </span>
                    <div class="flex items-center gap-1 flex-shrink-0">
                        <Badge v-if="isJsonValue" variant="outline" class="text-xs px-1 py-0"> JSON </Badge>
                        <MaximizeIcon
                            @click="openEnhancedEditor"
                            class="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:text-foreground"
                            title="Edit in popup"
                        />
                    </div>
                </div>
                <div
                    v-else
                    @click="startEditValue"
                    class="text-sm font-mono cursor-pointer hover:bg-muted/50 px-2 py-1 rounded transition-colors text-muted-foreground"
                >
                    Click to add value...
                </div>
            </div>
        </div>

        <!-- Actions -->
        <div class="col-span-1 flex items-center justify-end">
            <div v-if="variable.isNew && (isEditingName || isEditingValue) && !isSaving" class="flex items-center gap-1">
                <Button
                    size="sm"
                    variant="ghost"
                    class="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                    @click="saveNewVariable"
                    title="Save"
                >
                    <CheckIcon class="h-4 w-4" />
                </Button>
                <Button
                    size="sm"
                    variant="ghost"
                    class="h-8 w-8 p-0 text-destructive hover:text-destructive/70"
                    @click="cancelNewVariable"
                    title="Cancel"
                >
                    <XIcon class="h-4 w-4" />
                </Button>
            </div>
            <DropdownMenu v-else>
                <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost" class="h-8 w-8 p-0">
                        <MoreHorizontalIcon class="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem @click="startEditValue">
                        <EditIcon class="h-4 w-4 mr-2" />
                        Edit Inline
                    </DropdownMenuItem>
                    <DropdownMenuItem @click="openEnhancedEditor">
                        <MaximizeIcon class="h-4 w-4 mr-2" />
                        Edit in Popup
                    </DropdownMenuItem>
                    <DropdownMenuItem v-if="isEdited && !isNew" @click="resetVariable" class="text-orange-600">
                        <RotateCcwIcon class="h-4 w-4 mr-2" />
                        Reset to Original
                    </DropdownMenuItem>
                    <DropdownMenuItem @click="copyValue">
                        <CopyIcon class="h-4 w-4 mr-2" />
                        Copy Value
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        @click="deleteVariable"
                        class="text-destructive hover:text-destructive focus:text-destructive hover:bg-destructive/10 focus:bg-destructive/10"
                    >
                        <TrashIcon class="h-4 w-4 mr-2" />
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    CheckIcon,
    CopyIcon,
    EditIcon,
    MaximizeIcon,
    MoreHorizontalIcon,
    PencilIcon,
    RotateCcwIcon,
    TrashIcon,
    XIcon,
} from 'lucide-vue-next';
import { copyToClipboard } from '@/composables/useClipboard';
import { useToast } from '@/components/ui/toast';
import { VariableType } from '@/types/aws/environment-variable.enums';
import { isJsonString } from '../utils/variableUtils';
import type { Variable } from '../types';

interface Props {
    variable: Variable;
    index: number;
    isSelected: boolean;
    isEditingValue: boolean;
    isEditingName: boolean;
    editValue: string;
    editName: string;
    isSecret?: boolean;
    isEdited?: boolean;
    isNew?: boolean;
    isSaving?: boolean;
}

interface Emits {
    (e: 'select', variableId: string, selected: boolean): void;
    (e: 'edit-value', variableId: string, value: string): void;
    (e: 'edit-name', variableId: string, name: string): void;
    (e: 'save', variable: Variable, type: VariableType): void;
    (e: 'save-new', variable: Variable): void;
    (e: 'cancel'): void;
    (e: 'cancel-new', variable: Variable): void;
    (e: 'delete', variable: Variable, type: VariableType): void;
    (e: 'open-enhanced-editor', variableId: string, value: string, variable: Variable): void;
    (e: 'reset', variable: Variable, type: VariableType): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const { toast } = useToast();

// Computed properties for two-way binding with events
const editValueModel = computed({
    get: () => props.editValue,
    set: (value: string) => emit('edit-value', variableId.value, value),
});

const editNameModel = computed({
    get: () => props.editName,
    set: (value: string) => emit('edit-name', variableId.value, value),
});

// Computed properties
const variableId = computed(() => {
    const prefix = props.isSecret ? 'secret' : 'env';
    return `${prefix}-${props.variable.name || props.variable.id}`;
});

const displayValue = computed(() => {
    if (props.isSecret) {
        return props.variable.value || props.variable.valueFrom || '[No Value]';
    }
    return props.variable.value || '(empty)';
});

const isJsonValue = computed(() => {
    return isJsonString(displayValue.value);
});

const variableType = computed(() => {
    return props.isSecret ? VariableType.SECRET : VariableType.ENVIRONMENT;
});

// Methods
const onSelect = (variableId: string, selected: boolean) => {
    emit('select', variableId, selected);
};

const startEditValue = () => {
    const value = props.isSecret ? props.variable.value || props.variable.valueFrom || '' : props.variable.value;
    emit('edit-value', variableId.value, value);
};

const startEditName = () => {
    emit('edit-name', variableId.value, props.variable.name);
};

const saveEdit = () => {
    emit('save', props.variable, variableType.value);
};

const saveNewVariable = () => {
    emit('save-new', props.variable);
};

const cancelEdit = () => {
    emit('cancel');
};

const cancelNewVariable = () => {
    emit('cancel-new', props.variable);
};

// Handle Enter key press
const handleEnterKey = () => {
    if (props.variable.isNew) {
        saveNewVariable();
    } else {
        saveEdit();
    }
};

// Handle Escape key press
const handleEscapeKey = () => {
    if (props.variable.isNew) {
        cancelNewVariable();
    } else {
        cancelEdit();
    }
};

const deleteVariable = () => {
    if (props.variable.isNew) {
        cancelNewVariable();
        return;
    }

    emit('delete', props.variable, variableType.value);
};

const openEnhancedEditor = () => {
    const value = props.isSecret ? props.variable.value || props.variable.valueFrom || '' : props.variable.value;
    emit('open-enhanced-editor', variableId.value, value, props.variable);
};

const resetVariable = () => {
    emit('reset', props.variable, variableType.value);
};

const copyValue = async () => {
    const value = displayValue.value;
    const success = await copyToClipboard(value);
    if (success) {
        toast({
            variant: 'success',
            title: 'Copied',
            description: 'Variable value copied to clipboard',
        });
    } else {
        toast({
            variant: 'destructive',
            title: 'Copy Failed',
            description: 'Failed to copy variable value to clipboard',
        });
    }
};
</script>
