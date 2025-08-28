<template>
    <div class="space-y-4">
        <!-- Table Header with Actions -->
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
                <h3 class="text-lg font-medium">{{ container.name }}</h3>
                <Badge variant="outline" class="text-xs">
                    {{ selectedVersion }}
                </Badge>
            </div>
            <div class="flex items-center gap-2">
                <Button
                    v-if="selectedVariables.length > 0"
                    size="sm"
                    variant="destructive"
                    @click="bulkDelete"
                    class="transition-all duration-200"
                >
                    <TrashIcon class="h-4 w-4 mr-2" />
                    Delete Selected ({{ selectedVariables.length }})
                </Button>
                <Button
                    size="sm"
                    variant="outline"
                    @click="selectAll"
                    class="transition-all duration-200"
                >
                    {{ isAllSelected ? 'Deselect All' : 'Select All' }}
                </Button>
            </div>
        </div>

        <!-- Environment Variables Section -->
        <div class="space-y-3">
            <div class="flex items-center gap-2">
                <GlobeIcon class="h-4 w-4 text-green-600" />
                <h4 class="font-medium">Environment Variables</h4>
                <Badge variant="secondary" class="text-xs">
                    {{ environmentVariables.length }}
                </Badge>
            </div>

            <div class="border rounded-lg overflow-hidden">
                <div class="bg-muted/30 px-4 py-2 border-b">
                    <div class="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground">
                        <div class="col-span-1">
                            <Checkbox
                                :checked="isAllEnvSelected"
                                @update:checked="toggleAllEnv"
                            />
                        </div>
                        <div class="col-span-4">Name</div>
                        <div class="col-span-6">Value</div>
                        <div class="col-span-1">Actions</div>
                    </div>
                </div>

                <div class="max-h-64 overflow-y-auto">
                    <TransitionGroup name="variable-row">
                        <div
                            v-for="(variable, index) in environmentVariables"
                            :key="`env-${variable.name || variable.id}`"
                            class="grid grid-cols-12 gap-4 px-4 py-3 border-b last:border-b-0 hover:bg-muted/20 transition-colors group"
                        >
                            <div class="col-span-1 flex items-center">
                                <Checkbox
                                    v-if="!variable.isNew"
                                    :checked="selectedVariables.includes(`env-${variable.name}`)"
                                    @update:checked="toggleVariable(`env-${variable.name}`)"
                                />
                            </div>
                            <div class="col-span-4 flex items-center">
                                <Input
                                    v-if="variable.isNew && editingVariable === `env-${variable.name || variable.id}`"
                                    v-model="editName"
                                    placeholder="Variable name"
                                    class="text-sm font-mono"
                                    @blur="saveNewVariable(variable, 'environment')"
                                    @keydown.enter="saveNewVariable(variable, 'environment')"
                                    @keydown.escape="cancelNewVariable(variable)"
                                />
                                <code v-else class="text-sm font-mono bg-muted/50 px-2 py-1 rounded">
                                    {{ variable.name || 'NEW_VARIABLE' }}
                                </code>
                            </div>
                            <div class="col-span-6 flex items-center">
                                <div class="w-full">
                                    <Input
                                        v-if="editingVariable === `env-${variable.name || variable.id}`"
                                        v-model="editValue"
                                        @blur="variable.isNew ? saveNewVariable(variable, 'environment') : saveEdit(variable, 'environment')"
                                        @keydown.enter="variable.isNew ? saveNewVariable(variable, 'environment') : saveEdit(variable, 'environment')"
                                        @keydown.escape="variable.isNew ? cancelNewVariable(variable) : cancelEdit"
                                        class="text-sm"
                                        ref="editInput"
                                        :placeholder="variable.isNew ? 'Variable value' : ''"
                                    />
                                    <div
                                        v-else-if="!variable.isNew"
                                        @click="startEdit(`env-${variable.name}`, variable.value)"
                                        class="text-sm font-mono cursor-pointer hover:bg-muted/50 px-2 py-1 rounded transition-colors"
                                    >
                                        {{ variable.value || '(empty)' }}
                                    </div>
                                    <div
                                        v-else
                                        @click="startEdit(`env-${variable.id}`, '')"
                                        class="text-sm font-mono cursor-pointer hover:bg-muted/50 px-2 py-1 rounded transition-colors text-muted-foreground"
                                    >
                                        Click to add value...
                                    </div>
                                </div>
                            </div>
                            <div class="col-span-1 flex items-center">
                                <div v-if="variable.isNew" class="flex gap-1">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        class="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                                        @click="saveNewVariable(variable, 'environment')"
                                        title="Save"
                                    >
                                        <CheckIcon class="h-4 w-4" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        class="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                        @click="cancelNewVariable(variable)"
                                        title="Cancel"
                                    >
                                        <XIcon class="h-4 w-4" />
                                    </Button>
                                </div>
                                <DropdownMenu v-else>
                                    <DropdownMenuTrigger as-child>
                                        <Button size="sm" variant="ghost" class="h-8 w-8 p-0">
                                            <MoreHorizontalIcon class="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem @click="startEdit(`env-${variable.name}`, variable.value)">
                                            <EditIcon class="h-4 w-4 mr-2" />
                                            Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem @click="copyValue(variable.value)">
                                            <CopyIcon class="h-4 w-4 mr-2" />
                                            Copy Value
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            @click="deleteVariable(variable, 'environment')"
                                            class="text-destructive"
                                        >
                                            <TrashIcon class="h-4 w-4 mr-2" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </TransitionGroup>
                </div>

                <!-- Add new environment variable -->
                <div class="px-4 py-3 border-t bg-muted/10">
                    <Button
                        size="sm"
                        variant="ghost"
                        @click="addNewVariable('environment')"
                        class="w-full justify-start text-muted-foreground hover:text-foreground"
                    >
                        <PlusIcon class="h-4 w-4 mr-2" />
                        Add Environment Variable
                    </Button>
                </div>
            </div>
        </div>

        <!-- Secrets Section -->
        <div class="space-y-3">
            <div class="flex items-center gap-2">
                <KeyIcon class="h-4 w-4 text-purple-600" />
                <h4 class="font-medium">Secrets</h4>
                <Badge variant="secondary" class="text-xs">
                    {{ secrets.length }}
                </Badge>
            </div>

            <div class="border rounded-lg overflow-hidden">
                <div class="bg-muted/30 px-4 py-2 border-b">
                    <div class="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground">
                        <div class="col-span-1">
                            <Checkbox
                                :checked="isAllSecretsSelected"
                                @update:checked="toggleAllSecrets"
                            />
                        </div>
                        <div class="col-span-4">Name</div>
                        <div class="col-span-6">Value</div>
                        <div class="col-span-1">Actions</div>
                    </div>
                </div>

                <div class="max-h-64 overflow-y-auto">
                    <TransitionGroup name="variable-row">
                        <div
                            v-for="secret in secrets"
                            :key="`secret-${secret.name}`"
                            class="grid grid-cols-12 gap-4 px-4 py-3 border-b last:border-b-0 hover:bg-muted/20 transition-colors group"
                        >
                            <div class="col-span-1 flex items-center">
                                <Checkbox
                                    :checked="selectedVariables.includes(`secret-${secret.name}`)"
                                    @update:checked="toggleVariable(`secret-${secret.name}`)"
                                />
                            </div>
                            <div class="col-span-4 flex items-center">
                                <code class="text-sm font-mono bg-muted/50 px-2 py-1 rounded">
                                    {{ secret.name }}
                                </code>
                            </div>
                            <div class="col-span-6 flex items-center">
                                <div class="text-sm font-mono text-muted-foreground">
                                    ••••••••••••
                                </div>
                            </div>
                            <div class="col-span-1 flex items-center">
                                <DropdownMenu>
                                    <DropdownMenuTrigger as-child>
                                        <Button size="sm" variant="ghost" class="h-8 w-8 p-0">
                                            <MoreHorizontalIcon class="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem @click="copyValue(secret.value)">
                                            <CopyIcon class="h-4 w-4 mr-2" />
                                            Copy Value
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            @click="deleteVariable(secret, 'secret')"
                                            class="text-destructive"
                                        >
                                            <TrashIcon class="h-4 w-4 mr-2" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </TransitionGroup>
                </div>

                <!-- Add new secret -->
                <div class="px-4 py-3 border-t bg-muted/10">
                    <Button
                        size="sm"
                        variant="ghost"
                        @click="addNewVariable('secret')"
                        class="w-full justify-start text-muted-foreground hover:text-foreground"
                    >
                        <PlusIcon class="h-4 w-4 mr-2" />
                        Add Secret
                    </Button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
    GlobeIcon,
    KeyIcon,
    TrashIcon,
    PlusIcon,
    EditIcon,
    CopyIcon,
    MoreHorizontalIcon,
    CheckIcon,
    XIcon
} from 'lucide-vue-next';
import type { ContainerInterface } from '@/views/AWS/Services/types/service.interface';
import { useToast } from '@/components/ui/toast';
import { copyToClipboard } from '@/composables/useClipboard';

const props = defineProps<{
    container: ContainerInterface;
    serviceName?: string;
    clusterName?: string;
    selectedVersion: string;
}>();

const emit = defineEmits<{
    (e: 'edit', variable: any): void;
    (e: 'delete', variable: any): void;
    (e: 'bulk-select', variables: string[]): void;
    (e: 'add-new', variable: any): void;
}>();

const { toast } = useToast();

// Reactive state
const selectedVariables = ref<string[]>([]);
const editingVariable = ref<string | null>(null);
const editValue = ref('');
const editName = ref('');
const editInput = ref<HTMLInputElement | null>(null);
const newVariables = ref<any[]>([]);

// Computed properties
const environmentVariables = computed(() => {
    const existing = props.container.environmentVariables.environment || [];
    const newEnvVars = newVariables.value.filter(v => v.type === 'environment');
    return [...existing, ...newEnvVars];
});

const secrets = computed(() => {
    const existing = props.container.environmentVariables.secrets || [];
    const newSecrets = newVariables.value.filter(v => v.type === 'secret');
    return [...existing, ...newSecrets];
});

const isAllSelected = computed(() => {
    const allVariables = [
        ...environmentVariables.value.map(v => `env-${v.name}`),
        ...secrets.value.map(s => `secret-${s.name}`)
    ];
    return allVariables.length > 0 && allVariables.every(v => selectedVariables.value.includes(v));
});

const isAllEnvSelected = computed(() => {
    const envVariables = environmentVariables.value.map(v => `env-${v.name}`);
    return envVariables.length > 0 && envVariables.every(v => selectedVariables.value.includes(v));
});

const isAllSecretsSelected = computed(() => {
    const secretVariables = secrets.value.map(s => `secret-${s.name}`);
    return secretVariables.length > 0 && secretVariables.every(v => selectedVariables.value.includes(v));
});

// Watchers
watch(selectedVariables, (newSelection) => {
    emit('bulk-select', newSelection);
}, { deep: true });


const toggleVariable = (variableId: string) => {
    const index = selectedVariables.value.indexOf(variableId);
    if (index > -1) {
        selectedVariables.value.splice(index, 1);
    } else {
        selectedVariables.value.push(variableId);
    }
};

const selectAll = () => {
    if (isAllSelected.value) {
        selectedVariables.value = [];
    } else {
        selectedVariables.value = [
            ...environmentVariables.value.map(v => `env-${v.name}`),
            ...secrets.value.map(s => `secret-${s.name}`)
        ];
    }
};

const toggleAllEnv = () => {
    const envVariables = environmentVariables.value.map(v => `env-${v.name}`);
    if (isAllEnvSelected.value) {
        selectedVariables.value = selectedVariables.value.filter(v => !envVariables.includes(v));
    } else {
        const newSelection = [...selectedVariables.value];
        envVariables.forEach(v => {
            if (!newSelection.includes(v)) {
                newSelection.push(v);
            }
        });
        selectedVariables.value = newSelection;
    }
};

const toggleAllSecrets = () => {
    const secretVariables = secrets.value.map(s => `secret-${s.name}`);
    if (isAllSecretsSelected.value) {
        selectedVariables.value = selectedVariables.value.filter(v => !secretVariables.includes(v));
    } else {
        const newSelection = [...selectedVariables.value];
        secretVariables.forEach(v => {
            if (!newSelection.includes(v)) {
                newSelection.push(v);
            }
        });
        selectedVariables.value = newSelection;
    }
};

const startEdit = async (variableId: string, value: string) => {
    editingVariable.value = variableId;
    editValue.value = value;
    await nextTick();
    editInput.value?.focus();
};

const saveEdit = (variable: any, type: 'environment' | 'secret') => {
    if (editValue.value !== variable.value) {
        emit('edit', { ...variable, value: editValue.value, type });
    }
    cancelEdit();
};

const cancelEdit = () => {
    editingVariable.value = null;
    editValue.value = '';
};

const deleteVariable = (variable: any, type: 'environment' | 'secret') => {
    emit('delete', { ...variable, type });
};

const bulkDelete = () => {
    // Emit bulk delete event
    const variablesToDelete = selectedVariables.value.map(id => {
        const [type, name] = id.split('-', 2);
        const variable = type === 'env'
            ? environmentVariables.value.find(v => v.name === name)
            : secrets.value.find(s => s.name === name);
        return { ...variable, type: type === 'env' ? 'environment' : 'secret' };
    });

    variablesToDelete.forEach(variable => {
        emit('delete', variable);
    });

    selectedVariables.value = [];
};

const addNewVariable = (type: 'environment' | 'secret') => {
    const newVariableId = `new-${type}-${Date.now()}`;

    // Add a temporary variable to the local array for inline editing
    const newVariable = {
        name: '',
        value: '',
        isNew: true,
        id: newVariableId,
        type
    };

    newVariables.value.push(newVariable);

    // Start editing the new variable
    editingVariable.value = newVariableId;
    editValue.value = '';
    editName.value = '';

    // Emit an event to notify parent component
    emit('add-new', newVariable);

    // Focus the edit input after the next tick
    nextTick(() => {
        editInput.value?.focus();
    });
};

const saveNewVariable = (variable: any, type: 'environment' | 'secret') => {
    if (!editName.value.trim()) {
        cancelNewVariable(variable);
        return;
    }

    // Update the variable with the new name and value
    variable.name = editName.value.trim();
    variable.value = editValue.value;

    // Emit the edit event to save the variable
    emit('edit', { ...variable, type, isNew: true });

    // Clear editing state
    editingVariable.value = null;
    editName.value = '';
    editValue.value = '';

    toast({
        variant: 'success',
        title: 'Variable Added',
        description: `${variable.name} has been added.`
    });
};

const cancelNewVariable = (variable: any) => {
    // Remove the variable from the new variables array
    const index = newVariables.value.findIndex(v => v.id === variable.id);
    if (index > -1) {
        newVariables.value.splice(index, 1);
    }

    // Clear editing state
    editingVariable.value = null;
    editName.value = '';
    editValue.value = '';
};

const copyValue = async (value: string) => {
    const success = await copyToClipboard(value);
    if (success) {
        toast({
            variant: 'success',
            title: 'Copied',
            description: 'Value copied to clipboard.'
        });
    }
};
</script>

<style scoped>
.variable-row-enter-active,
.variable-row-leave-active {
    transition: all 0.3s ease;
}

.variable-row-enter-from,
.variable-row-leave-to {
    opacity: 0;
    transform: translateX(-20px);
}

.variable-row-move {
    transition: transform 0.3s ease;
}
</style>
