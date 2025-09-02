<template>
    <div class="space-y-3">
        <div class="flex items-center gap-2">
            <component :is="icon" class="h-4 w-4" :class="iconClass" />
            <h4 class="font-medium">{{ title }}</h4>
            <Badge variant="secondary" class="text-xs">
                {{ variables.length }}
            </Badge>
        </div>

        <div class="border rounded-lg overflow-hidden">
            <!-- Table Header -->
            <div class="bg-muted/30 px-4 py-2 border-b">
                <div class="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground">
                    <div class="col-span-1">
                        <Checkbox :checked="isAllSelected" @update:checked="onToggleAll" />
                    </div>
                    <div class="col-span-4">Name</div>
                    <div class="col-span-6">Value</div>
                    <div class="col-span-1">Actions</div>
                </div>
            </div>

            <!-- Variables List -->
            <div>
                <TransitionGroup name="variable-row">
                    <VariableRow
                        v-for="(variable, index) in variables"
                        :key="getVariableKey(variable)"
                        :variable="variable"
                        :index="index"
                        :is-selected="isVariableSelected(variable)"
                        :is-editing-value="isEditingValue(variable)"
                        :is-editing-name="isEditingName(variable)"
                        :edit-value="editValue"
                        :edit-name="editName"
                        :is-secret="isSecret"
                        :is-edited="isVariableEdited(variable)"
                        :is-new="!!variable.isNew"
                        :is-saving="isSaving(variable)"
                        @select="onVariableSelect"
                        @edit-value="onEditValue"
                        @edit-name="onEditName"
                        @save="onSave"
                        @save-new="onSaveNew"
                        @cancel="onCancel"
                        @cancel-new="onCancelNew"
                        @delete="onDelete"
                        @reset="onReset"
                        @open-enhanced-editor="onOpenEnhancedEditor"
                    />
                </TransitionGroup>
            </div>

            <!-- Add New Variable Button -->
            <div class="px-4 py-3 border-t bg-muted/10">
                <Button size="sm" variant="outline" @click="addNewVariable" class="w-full justify-start">
                    <PlusIcon class="h-4 w-4 mr-2" />
                    Add {{ isSecret ? 'Secret' : 'Public Variable' }}
                </Button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { PlusIcon } from 'lucide-vue-next';
import { VariableType } from '@/types/aws/environment-variable.enums';
import VariableRow from './VariableRow.vue';
import type { Variable } from '../types';

interface Props {
    title: string;
    icon: any;
    iconClass?: string;
    variables: Variable[];
    selectedVariables: string[];
    editingVariable: string | null;
    editValue: string;
    editName: string;
    isAllSelected: boolean;
    isSecret?: boolean;
    editedVariables?: string[];
    savingVariables?: Set<string>;
}

interface Emits {
    (e: 'toggle-all', checked: boolean): void;
    (e: 'variable-select', variableId: string, selected: boolean): void;
    (e: 'edit-value', variableId: string, value: string): void;
    (e: 'edit-name', variableId: string, name: string): void;
    (e: 'save', variable: Variable, type: VariableType): void;
    (e: 'save-new', variable: Variable): void;
    (e: 'cancel'): void;
    (e: 'cancel-new', variable: Variable): void;
    (e: 'delete', variable: Variable, type: VariableType): void;
    (e: 'open-enhanced-editor', variableId: string, value: string, variable: Variable): void;
    (e: 'reset', variable: Variable, type: VariableType): void;
    (e: 'add-new'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Computed properties
const getVariableKey = (variable: Variable): string => {
    const prefix = props.isSecret ? 'secret' : 'env';
    return `${prefix}-${variable.name || variable.id}`;
};

const isVariableSelected = (variable: Variable): boolean => {
    const variableId = getVariableKey(variable);
    return props.selectedVariables.includes(variableId);
};

const isEditingValue = (variable: Variable): boolean => {
    const variableId = getVariableKey(variable);
    return props.editingVariable === variableId;
};

const isEditingName = (variable: Variable): boolean => {
    const variableId = getVariableKey(variable);
    return !!variable.isNew && props.editingVariable === variableId;
};

const isVariableEdited = (variable: Variable): boolean => {
    const variableId = getVariableKey(variable);
    return props.editedVariables?.includes(variableId) || false;
};

const isSaving = (variable: Variable): boolean => {
    const variableId = getVariableKey(variable);
    return props.savingVariables?.has(variableId) || false;
};

// Event handlers
const onToggleAll = (checked: boolean) => {
    emit('toggle-all', checked);
};

const onVariableSelect = (variableId: string, selected: boolean) => {
    emit('variable-select', variableId, selected);
};

const onEditValue = (variableId: string, value: string) => {
    emit('edit-value', variableId, value);
};

const onEditName = (variableId: string, name: string) => {
    emit('edit-name', variableId, name);
};

const onSave = (variable: Variable, type: VariableType) => {
    emit('save', variable, type);
};

const onSaveNew = (variable: Variable) => {
    emit('save-new', variable);
};

const onCancel = () => {
    emit('cancel');
};

const onCancelNew = (variable: Variable) => {
    emit('cancel-new', variable);
};

const onDelete = (variable: Variable, type: VariableType) => {
    emit('delete', variable, type);
};

const onOpenEnhancedEditor = (variableId: string, value: string, variable: Variable) => {
    emit('open-enhanced-editor', variableId, value, variable);
};

const onReset = (variable: Variable, type: VariableType) => {
    emit('reset', variable, type);
};

const addNewVariable = () => {
    emit('add-new');
};
</script>

<style scoped>
.variable-row-enter-active,
.variable-row-leave-active {
    transition: all 0.3s ease;
}

.variable-row-enter-from {
    opacity: 0;
    transform: translateX(-20px);
}

.variable-row-leave-to {
    opacity: 0;
    transform: translateX(-20px);
}

.variable-row-move {
    transition: transform 0.3s ease;
}
</style>
