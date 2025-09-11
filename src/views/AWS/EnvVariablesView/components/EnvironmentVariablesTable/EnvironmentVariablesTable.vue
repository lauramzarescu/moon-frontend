<template>
    <div class="space-y-6">
        <!-- Table Header with Actions -->
        <TableHeader
            :selected-count="selectedVariables.length"
            :total-count="totalVariablesCount"
            :is-all-selected="isAllSelected"
            @select-all="selectAll"
            @bulk-delete="bulkDelete"
        />

        <!-- Public Variables Section -->
        <VariableSection
            title="Public Variables"
            :icon="GlobeIcon"
            icon-class="text-green-600"
            :variables="environmentVariables"
            :selected-variables="selectedVariables"
            :editing-variable="editingVariable"
            :edit-value="editValue"
            :edit-name="editName"
            :is-all-selected="isAllEnvSelected"
            :is-secret="false"
            :edited-variables="editedVariableIds"
            :saving-variables="savingVariables"
            @toggle-all="toggleAllEnv"
            @variable-select="handleVariableSelect"
            @edit-value="startEdit"
            @edit-name="startEditName"
            @save="saveEdit"
            @save-new="saveNewVariable"
            @cancel="cancelEdit"
            @cancel-new="cancelNewVariable"
            @delete="deleteVariable"
            @reset="resetVariable"
            @open-enhanced-editor="openEnhancedEditor"
            @add-new="() => addNewVariable(false)"
        />

        <!-- Secrets Section -->
        <VariableSection
            title="Secrets"
            :icon="KeyIcon"
            icon-class="text-orange-600"
            :variables="secrets"
            :selected-variables="selectedVariables"
            :editing-variable="editingVariable"
            :edit-value="editValue"
            :edit-name="editName"
            :is-all-selected="isAllSecretsSelected"
            :is-secret="true"
            :edited-variables="editedVariableIds"
            :saving-variables="savingVariables"
            @toggle-all="toggleAllSecrets"
            @variable-select="handleVariableSelect"
            @edit-value="startEdit"
            @edit-name="startEditName"
            @save="saveEdit"
            @save-new="saveNewVariable"
            @cancel="cancelEdit"
            @cancel-new="cancelNewVariable"
            @delete="deleteVariable"
            @reset="resetVariable"
            @open-enhanced-editor="openEnhancedEditor"
            @add-new="() => addNewVariable(true)"
        />

        <!-- Enhanced Editor Dialog -->
        <EnhancedEditor v-model="editorDialog" @save="handleEnhancedEditorSave" @close="closeEnhancedEditor" />

        <!-- Confirmation Dialog -->
        <ConfirmationDialog v-model="confirmationDialog" @confirm="confirmDelete" @close="closeConfirmationDialog" />
    </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { GlobeIcon, KeyIcon } from 'lucide-vue-next';
import type { ContainerInterface } from '@/views/AWS/Services/types/service.interface';
import { useToast } from '@/components/ui/toast';
import { VariableType } from '@/types/aws/environment-variable.enums';
import { detectVariableType, VariableDataType } from './utils/variableUtils';
import { useUnsavedChanges } from '../../composables/useUnsavedChanges';
import type { ConfirmationDialogState, EnhancedEditorState, Variable } from './types/index';
import TableHeader from './components/TableHeader.vue';
import VariableSection from './components/VariableSection.vue';
import EnhancedEditor from './components/EnhancedEditor.vue';
import ConfirmationDialog from './components/ConfirmationDialog.vue';

const props = defineProps<{
    container: ContainerInterface;
    serviceName?: string;
    clusterName?: string;
    selectedVersion: string;
    isLatest?: boolean;
}>();

const emit = defineEmits<{
    (e: 'edit', variable: any): void;
    (e: 'delete', variable: any): void;
    (e: 'bulk-select', variables: string[]): void;
    (e: 'add-new', variable: any): void;
    (e: 'pending-changes', hasPending: boolean): void;
    (e: 'save-all-changes', changes: { newVariables: any[]; editedVariables: any[] }): void;
}>();

const { toast } = useToast();
const { hasUnsavedChanges, getUnsavedChanges, saveUnsavedChanges, clearUnsavedChanges } = useUnsavedChanges();

// Reactive state
const selectedVariables = ref<string[]>([]);
const editingVariable = ref<string | null>(null);
const editValue = ref('');
const editName = ref('');

// Additional reactive state for managing variables
const newVariables = ref<Variable[]>([]);
const originalValues = ref<Map<string, string>>(new Map());
const resetVariables = ref<Set<string>>(new Set());
const savingVariables = ref<Set<string>>(new Set());

// Dialog states
const confirmationDialog = ref<ConfirmationDialogState>({
    isOpen: false,
    variable: null,
    type: null,
    isBulk: false,
    variablesToDelete: [],
});

const editorDialog = ref<EnhancedEditorState>({
    isOpen: false,
    variable: null,
    variableId: '',
    name: '',
    value: '',
    isJson: false,
    prettyJson: false,
    originalValue: '',
    selectedType: VariableDataType.TEXT,
    autoDetectedType: VariableDataType.TEXT,
});

// Get unsaved changes from local storage
const getUnsavedChangesFromStorage = () => {
    if (!props.serviceName || !props.clusterName) return null;
    return getUnsavedChanges(props.serviceName, props.clusterName);
};

const environmentVariables = computed(() => {
    const existing = props.container.environmentVariables.environment || [];
    const unsaved = getUnsavedChangesFromStorage();

    // Start with existing variables from API
    let variables = [...existing];

    // Apply unsaved edits to existing variables
    if (unsaved?.editedVariables) {
        variables = variables.map((variable) => {
            const editedVar = unsaved.editedVariables.find((edited: any) => edited.name === variable.name && !edited.isSecret);
            if (editedVar) {
                return { ...variable, value: editedVar.value, isEdited: true };
            }
            return variable;
        });
    }

    // Add new variables from local storage (these are saved but not yet committed to server)
    if (unsaved?.newVariables) {
        const newEnvVars = unsaved.newVariables.filter((v: any) => !v.isSecret);
        variables = [...variables, ...newEnvVars.map((v: any) => ({ ...v, isSaved: true }))];
    }

    // Sort existing and saved variables first
    variables.sort((a, b) => {
        const nameA = a.name || '';
        const nameB = b.name || '';
        return nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
    });

    // Add temporary new variables that haven't been saved yet at the end
    const tempNewEnvVars = newVariables.value.filter((v) => !v.isSecret);
    variables = [...variables, ...tempNewEnvVars];

    return variables;
});

const secrets = computed(() => {
    const existing = props.container.environmentVariables.secrets || [];
    const unsaved = getUnsavedChangesFromStorage();

    // Start with existing variables from API, convert valueFrom to value for consistency
    let variables = existing.map((secret) => ({
        ...secret,
        value: (secret as any).value || (secret as any).valueFrom || '',
        isSecret: true,
    }));

    // Apply unsaved edits to existing variables
    if (unsaved?.editedVariables) {
        variables = variables.map((variable) => {
            const editedVar = unsaved.editedVariables.find((edited: any) => edited.name === variable.name && edited.isSecret);
            if (editedVar) {
                return { ...variable, value: editedVar.value, isEdited: true };
            }
            return variable;
        });
    }

    // Add new variables from local storage (these are saved but not yet committed to server)
    if (unsaved?.newVariables) {
        const newSecrets = unsaved.newVariables.filter((v: any) => v.isSecret);
        variables = [...variables, ...newSecrets.map((v: any) => ({ ...v, isSaved: true }))];
    }

    // Sort existing and saved variables first
    variables.sort((a, b) => {
        const nameA = a.name || '';
        const nameB = b.name || '';
        return nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
    });

    // Add temporary new secrets that haven't been saved yet at the end
    const tempNewSecrets = newVariables.value.filter((v) => v.isSecret);
    variables = [...variables, ...tempNewSecrets];

    return variables;
});

const totalVariablesCount = computed(() => {
    return environmentVariables.value.length + secrets.value.length;
});

const hasPendingChanges = computed(() => {
    const unsaved = getUnsavedChangesFromStorage();
    return (unsaved?.newVariables?.length || 0) > 0 || (unsaved?.editedVariables?.length || 0) > 0;
});

const pendingChangesCount = computed(() => {
    const unsaved = getUnsavedChangesFromStorage();
    return (unsaved?.newVariables?.length || 0) + (unsaved?.editedVariables?.length || 0);
});

const isAllSelected = computed(() => {
    const allVariables = [...environmentVariables.value.map((v) => `env-${v.name}`), ...secrets.value.map((s) => `secret-${s.name}`)];
    return allVariables.length > 0 && allVariables.every((v) => selectedVariables.value.includes(v));
});

const isAllEnvSelected = computed(() => {
    const envVariables = environmentVariables.value.map((v) => `env-${v.name}`);
    return envVariables.length > 0 && envVariables.every((v) => selectedVariables.value.includes(v));
});

const isAllSecretsSelected = computed(() => {
    const secretVariables = secrets.value.map((s) => `secret-${s.name}`);
    return secretVariables.length > 0 && secretVariables.every((v) => selectedVariables.value.includes(v));
});

// Get list of edited variable IDs - simplified to check flags from computed properties
const editedVariableIds = computed(() => {
    const editedIds: string[] = [];

    // Check environment variables for isEdited, isNew, or isSaved flags
    environmentVariables.value.forEach((variable) => {
        if ((variable as any).isEdited || (variable as any).isNew || (variable as any).isSaved) {
            editedIds.push(`env-${variable.name}`);
        }
    });

    // Check secrets for isEdited, isNew, or isSaved flags
    secrets.value.forEach((variable) => {
        if ((variable as any).isEdited || (variable as any).isNew || (variable as any).isSaved) {
            editedIds.push(`secret-${variable.name}`);
        }
    });

    return editedIds;
});

// Selection methods
const selectAll = () => {
    if (isAllSelected.value) {
        selectedVariables.value = [];
    } else {
        selectedVariables.value = [
            ...environmentVariables.value.map((v) => `env-${v.name}`),
            ...secrets.value.map((s) => `secret-${s.name}`),
        ];
    }
};

const toggleAllEnv = (checked: boolean) => {
    const envVariables = environmentVariables.value.map((v) => `env-${v.name}`);
    if (checked) {
        selectedVariables.value = [...new Set([...selectedVariables.value, ...envVariables])];
    } else {
        selectedVariables.value = selectedVariables.value.filter((v) => !envVariables.includes(v));
    }
};

const toggleAllSecrets = (checked: boolean) => {
    const secretVariables = secrets.value.map((s) => `secret-${s.name}`);
    if (checked) {
        selectedVariables.value = [...new Set([...selectedVariables.value, ...secretVariables])];
    } else {
        selectedVariables.value = selectedVariables.value.filter((v) => !secretVariables.includes(v));
    }
};

const handleVariableSelect = (variableId: string, selected: boolean) => {
    if (selected) {
        selectedVariables.value.push(variableId);
    } else {
        selectedVariables.value = selectedVariables.value.filter((v) => v !== variableId);
    }
};

// Editing methods
const startEdit = async (variableId: string, value: string) => {
    editingVariable.value = variableId;
    editValue.value = value;
    await nextTick();

    const inputElement = document.querySelector(`input[data-editing="${variableId}"]`) as HTMLInputElement;
    inputElement?.focus();
};

const startEditName = async (variableId: string, name: string) => {
    editingVariable.value = variableId;
    editName.value = name;
    await nextTick();

    const inputElement = document.querySelector(`input[data-editing-name="${variableId}"]`) as HTMLInputElement;
    inputElement?.focus();
};

const saveEdit = (variable: Variable, type: VariableType) => {
    if (editValue.value !== variable.value && props.serviceName && props.clusterName) {
        const isSecret = type === VariableType.SECRET;
        const unsaved = getUnsavedChangesFromStorage() || { newVariables: [], editedVariables: [] };

        // Find original value from container data
        const containerVariables = isSecret
            ? props.container.environmentVariables.secrets || []
            : props.container.environmentVariables.environment || [];
        const originalVariable = containerVariables.find((v) => v.name === variable.name);
        const originalValue = isSecret
            ? (originalVariable as any)?.value || (originalVariable as any)?.valueFrom || ''
            : (originalVariable as any)?.value || '';

        // Update or add to edited variables
        const existingIndex = unsaved.editedVariables.findIndex((v: any) => v.name === variable.name && v.isSecret === isSecret);

        const editedVariable = {
            name: variable.name,
            value: editValue.value,
            isSecret,
            originalValue,
        };

        let editedVariablesArray = [...unsaved.editedVariables];
        if (existingIndex > -1) {
            editedVariablesArray[existingIndex] = editedVariable;
        } else {
            editedVariablesArray.push(editedVariable);
        }

        // Save to local storage
        saveUnsavedChanges(props.serviceName, props.clusterName, unsaved.newVariables, editedVariablesArray);

        emit('pending-changes', true);

        toast({
            variant: 'success',
            title: 'Variable Updated',
            description: `"${variable.name}" has been updated.`,
        });
    }
    cancelEdit();
};

const cancelEdit = () => {
    editingVariable.value = null;
    editValue.value = '';
    editName.value = '';
};

// Reset variable to original value
const resetVariable = (variable: Variable, type: VariableType) => {
    if (!props.serviceName || !props.clusterName) return;

    const isSecret = type === VariableType.SECRET;
    const unsaved = getUnsavedChangesFromStorage() || { newVariables: [], editedVariables: [] };

    // Find the original value from container data
    const containerVariables = isSecret
        ? props.container.environmentVariables.secrets || []
        : props.container.environmentVariables.environment || [];

    const originalFromContainer = containerVariables.find((v) => v.name === variable.name);

    if (originalFromContainer) {
        // Remove from edited variables in local storage
        const filteredEditedVariables = unsaved.editedVariables.filter((v: any) => !(v.name === variable.name && v.isSecret === isSecret));

        // Save updated changes to local storage
        saveUnsavedChanges(props.serviceName, props.clusterName, unsaved.newVariables, filteredEditedVariables);

        emit('pending-changes', hasPendingChanges.value);

        toast({
            variant: 'success',
            title: 'Variable Reset',
            description: `"${variable.name}" has been reset to its original value.`,
        });
    }
};

// Variable management methods
const addNewVariable = (isSecret: boolean) => {
    const newVariableId = `new-${Date.now()}`;
    const newVariable: Variable = {
        id: newVariableId,
        name: '',
        value: '',
        isSecret,
        isNew: true,
    };

    newVariables.value.push(newVariable);
    editingVariable.value = isSecret ? `secret-${newVariableId}` : `env-${newVariableId}`;
    editValue.value = '';
    editName.value = '';

    emit('add-new', newVariable);

    nextTick(() => {
        const variableId = isSecret ? `secret-${newVariableId}` : `env-${newVariableId}`;
        const inputElement = document.querySelector(`input[data-editing-name="${variableId}"]`) as HTMLInputElement;
        inputElement?.focus();
    });
};

const saveNewVariable = (variable: Variable) => {
    if (!editName.value.trim()) {
        toast({
            variant: 'destructive',
            title: 'Invalid Name',
            description: 'Variable name cannot be empty.',
        });
        return;
    }

    if (!props.serviceName || !props.clusterName) return;

    const variableId = variable.isSecret ? `secret-${variable.id}` : `env-${variable.id}`;

    // Add to saving state to hide actions
    savingVariables.value.add(variableId);

    // Create a new variable object
    const savedVariable = {
        ...variable,
        name: editName.value.trim(),
        value: editValue.value,
        isNew: true,
    };

    // Remove from temporary new variables
    const index = newVariables.value.findIndex((v) => v.id === variable.id);
    if (index > -1) {
        newVariables.value.splice(index, 1);
    }

    // Add to local storage
    const unsaved = getUnsavedChangesFromStorage() || { newVariables: [], editedVariables: [] };
    const newVariablesArray = [...unsaved.newVariables, savedVariable];
    saveUnsavedChanges(props.serviceName, props.clusterName, newVariablesArray, unsaved.editedVariables);

    // Clear editing state
    editingVariable.value = null;
    editName.value = '';
    editValue.value = '';

    emit('pending-changes', true);

    // Remove from saving state after a small delay to prevent icon flash
    setTimeout(() => {
        savingVariables.value.delete(variableId);
    }, 100);

    toast({
        variant: 'success',
        title: 'Variable Added',
        description: `${savedVariable.isSecret ? 'Secret' : 'Variable'} "${savedVariable.name}" added successfully.`,
    });
};

const cancelNewVariable = (variable: Variable) => {
    const variableId = variable.isSecret ? `secret-${variable.id}` : `env-${variable.id}`;

    // Add to saving state to hide actions briefly
    savingVariables.value.add(variableId);

    // Remove temporary new variable (not yet saved)
    const tempIndex = newVariables.value.findIndex((v) => v.id === variable.id);
    if (tempIndex > -1) {
        newVariables.value.splice(tempIndex, 1);
    }

    // Also remove from saved unsaved-changes list (if present)
    if (props.serviceName && props.clusterName) {
        const unsaved = getUnsavedChangesFromStorage() || { newVariables: [], editedVariables: [] };
        const filteredNewVars = unsaved.newVariables.filter(
            (v: any) => !(v.name === (variable.name || '') && !!v.isSecret === !!variable.isSecret),
        );
        if (filteredNewVars.length !== (unsaved.newVariables?.length || 0)) {
            saveUnsavedChanges(props.serviceName, props.clusterName, filteredNewVars, unsaved.editedVariables);
        }
    }

    // Trigger recompute of computed lists
    newVariables.value = [...newVariables.value];

    editingVariable.value = null;
    editName.value = '';
    editValue.value = '';

    // Remove from saving state after a small delay
    setTimeout(() => {
        savingVariables.value.delete(variableId);
    }, 100);
};

const deleteVariable = (variable: Variable, type: VariableType) => {
    confirmationDialog.value = {
        isOpen: true,
        variable: variable,
        type: type,
        isBulk: false,
        variablesToDelete: [],
    };
};

const bulkDelete = () => {
    const variablesToDelete = selectedVariables.value.map((id) => {
        const [type, name] = id.split('-', 2);
        const variable =
            type === 'env' ? environmentVariables.value.find((v) => v.name === name) : secrets.value.find((s) => s.name === name);
        return {
            ...variable,
            name: name,
            value: variable?.value || '',
            type: type === 'env' ? VariableType.ENVIRONMENT : VariableType.SECRET,
            isSecret: type === 'secret',
        } as Variable & { type: VariableType };
    });

    confirmationDialog.value = {
        isOpen: true,
        variable: null,
        type: null,
        isBulk: true,
        variablesToDelete: variablesToDelete,
    };
};

const confirmDelete = () => {
    if (confirmationDialog.value.isBulk) {
        emit('delete', { variables: confirmationDialog.value.variablesToDelete, isBulk: true });
        selectedVariables.value = [];
    } else if (confirmationDialog.value.variable && confirmationDialog.value.type) {
        emit('delete', { ...confirmationDialog.value.variable, type: confirmationDialog.value.type });
    }
    closeConfirmationDialog();
};

const closeConfirmationDialog = () => {
    confirmationDialog.value = {
        isOpen: false,
        variable: null,
        type: null,
        isBulk: false,
        variablesToDelete: [],
    };
};

// Enhanced editor methods
const openEnhancedEditor = (variableId: string, value: string, variable: Variable) => {
    const detectedType = detectVariableType(value);

    editorDialog.value = {
        isOpen: true,
        variable: variable,
        variableId: variableId,
        name: variable.name || '',
        value: value,
        isJson: detectedType === VariableDataType.JSON,
        prettyJson: detectedType === VariableDataType.JSON,
        originalValue: value,
        selectedType: detectedType,
        autoDetectedType: detectedType,
    };
};

const handleEnhancedEditorSave = (data: { name: string; value: string; selectedType: VariableDataType }) => {
    if (editorDialog.value.variable) {
        // Update variable name if changed
        if (data.name.trim() !== editorDialog.value.variable.name) {
            editorDialog.value.variable.name = data.name.trim();
        }

        // Update edit value and trigger save
        editValue.value = data.value;

        const [type] = editorDialog.value.variableId.split('-', 2);
        const variableType = type === 'env' ? VariableType.ENVIRONMENT : VariableType.SECRET;

        saveEdit(editorDialog.value.variable, variableType);
    }

    closeEnhancedEditor();
};

const closeEnhancedEditor = () => {
    editorDialog.value = {
        isOpen: false,
        variable: null,
        variableId: '',
        name: '',
        value: '',
        isJson: false,
        prettyJson: false,
        originalValue: '',
        selectedType: VariableDataType.TEXT,
        autoDetectedType: VariableDataType.TEXT,
    };
};

// Save all changes
const saveAllChanges = () => {
    const unsaved = getUnsavedChangesFromStorage();
    if (unsaved) {
        emit('save-all-changes', {
            newVariables: unsaved.newVariables || [],
            editedVariables: unsaved.editedVariables || [],
        });
    }

    clearPendingChanges();
};

// Clear pending changes without saving
const clearPendingChanges = () => {
    // Clear from local storage
    if (props.serviceName && props.clusterName) {
        clearUnsavedChanges(props.serviceName, props.clusterName);
    }

    // Reset all pending changes
    newVariables.value = [];
    originalValues.value.clear();
    resetVariables.value.clear();
    savingVariables.value.clear();

    // Reset editing state
    editingVariable.value = null;
    editName.value = '';
    editValue.value = '';

    // Reset selection
    selectedVariables.value = [];

    emit('pending-changes', false);
};

watch(
    selectedVariables,
    (newSelection) => {
        emit('bulk-select', newSelection);
    },
    { deep: true },
);

watch(
    hasPendingChanges,
    (newValue) => {
        emit('pending-changes', newValue);
    },
    { immediate: true },
);

onMounted(() => {
    if (props.serviceName && props.clusterName) {
        const unsaved = getUnsavedChanges(props.serviceName, props.clusterName);
        if (unsaved) {
            emit('pending-changes', true);

            const totalChanges = (unsaved.newVariables?.length || 0) + (unsaved.editedVariables?.length || 0);
            if (totalChanges > 0) {
                toast({
                    variant: 'warning',
                    title: 'Unsaved Changes Detected',
                    description: `Found ${totalChanges} unsaved changes for this service.`,
                });
            }
        }
    }
});

defineExpose({
    saveAllChanges,
    clearPendingChanges,
});
</script>
