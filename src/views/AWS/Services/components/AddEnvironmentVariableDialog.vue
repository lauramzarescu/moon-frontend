<template>
    <Dialog v-model:open="isOpen">
        <DialogTrigger as-child>
            <Button variant="outline" size="sm" class="gap-2">
                <PlusIcon class="h-4 w-4" />
                Add Variable
            </Button>
        </DialogTrigger>
        <DialogContent class="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>Add Environment Variables</DialogTitle>
                <DialogDescription> Add new environment variables or secrets to {{ containerName }}</DialogDescription>
            </DialogHeader>

            <form @submit.prevent="handleSubmit" class="space-y-4">
                <div class="space-y-4">
                    <div v-for="(variable, index) in variables" :key="index" class="border rounded-lg p-4 space-y-4">
                        <div class="flex items-center justify-between">
                            <h4 class="font-medium">Variable {{ index + 1 }}</h4>
                            <Button
                                v-if="variables.length > 1"
                                type="button"
                                variant="ghost"
                                size="sm"
                                @click="removeVariable(index)"
                                class="text-red-600 hover:text-red-700"
                            >
                                <TrashIcon class="h-4 w-4" />
                            </Button>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div class="space-y-2">
                                <Label :for="`type-${index}`">Type</Label>
                                <Select :model-value="variable.type" @update:model-value="variable.type = $event">
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="environment">
                                            <div class="flex items-center gap-2">
                                                <GlobeIcon class="h-4 w-4 text-green-600" />
                                                Environment Variable
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="secret">
                                            <div class="flex items-center gap-2">
                                                <KeyIcon class="h-4 w-4 text-purple-600" />
                                                Secret
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div class="space-y-2">
                                <Label :for="`name-${index}`">Name</Label>
                                <Input
                                    :id="`name-${index}`"
                                    :model-value="variable.name"
                                    @update:model-value="variable.name = $event"
                                    placeholder="VARIABLE_NAME"
                                    required
                                    :class="{ 'border-red-500': errors[index]?.name }"
                                />
                                <p v-if="errors[index]?.name" class="text-sm text-red-500">{{ errors[index].name }}</p>
                            </div>

                            <div class="space-y-2">
                                <Label :for="`value-${index}`">Value</Label>
                                <Textarea
                                    :id="`value-${index}`"
                                    :model-value="variable.value"
                                    @update:model-value="variable.value = $event"
                                    placeholder="Enter value..."
                                    required
                                    :class="{ 'border-red-500': errors[index]?.value }"
                                    rows="2"
                                />
                                <p v-if="errors[index]?.value" class="text-sm text-red-500">{{ errors[index].value }}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="flex justify-center">
                    <Button type="button" variant="outline" @click="addVariable" class="gap-2">
                        <PlusIcon class="h-4 w-4" />
                        Add Another Variable
                    </Button>
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" @click="closeDialog"> Cancel</Button>
                    <Button type="submit" :disabled="isLoading">
                        <Loader2Icon v-if="isLoading" class="h-4 w-4 animate-spin mr-2" />
                        Add {{ variables.length }} Variable{{ variables.length > 1 ? 's' : '' }}
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
    </Dialog>
</template>

<script setup lang="ts">
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { GlobeIcon, KeyIcon, Loader2Icon, PlusIcon, TrashIcon } from 'lucide-vue-next';
import { reactive, ref } from 'vue';
import { AwsService } from '@/services/aws.service';
import type { AddEnvironmentVariablesInput } from '@/views/AWS/Services/components/environment-variable.schema';

interface VariableForm {
    type: string;
    name: string;
    value: string;
}

interface VariableErrors {
    name?: string;
    value?: string;
    type?: string;
}

const props = defineProps<{
    clusterName: string;
    serviceName: string;
    containerName: string;
}>();

const emit = defineEmits<{
    (e: 'variable-added'): void;
}>();

const { toast } = useToast();
const awsService = new AwsService();

const isOpen = ref(false);
const isLoading = ref(false);

const variables = ref<VariableForm[]>([
    {
        type: '',
        name: '',
        value: '',
    },
]);

const errors = reactive<Record<number, VariableErrors>>({});

const addVariable = () => {
    variables.value.push({
        type: '',
        name: '',
        value: '',
    });
};

const removeVariable = (index: number) => {
    if (variables.value.length > 1) {
        variables.value.splice(index, 1);
        delete errors[index];

        // Reindex errors
        const newErrors: Record<number, VariableErrors> = {};
        Object.keys(errors).forEach((key) => {
            const numKey = parseInt(key);
            if (numKey > index) {
                newErrors[numKey - 1] = errors[numKey];
            } else if (numKey < index) {
                newErrors[numKey] = errors[numKey];
            }
        });
        Object.keys(errors).forEach((key) => delete errors[parseInt(key)]);
        Object.assign(errors, newErrors);
    }
};

const closeDialog = () => {
    isOpen.value = false;
    variables.value = [
        {
            type: '',
            name: '',
            value: '',
        },
    ];
    Object.keys(errors).forEach((key) => delete errors[parseInt(key)]);
};

const validateForm = () => {
    Object.keys(errors).forEach((key) => delete errors[parseInt(key)]);
    let isValid = true;

    variables.value.forEach((variable, index) => {
        const variableErrors: VariableErrors = {};

        if (!variable.name.trim()) {
            variableErrors.name = 'Name is required';
            isValid = false;
        } else if (!/^[A-Z_][A-Z0-9_]*$/.test(variable.name)) {
            variableErrors.name = 'Name must contain only uppercase letters, numbers, and underscores';
            isValid = false;
        }

        if (!variable.value.trim()) {
            variableErrors.value = 'Value is required';
            isValid = false;
        }

        if (!variable.type) {
            variableErrors.type = 'Type is required';
            isValid = false;
        }

        // Check for duplicate names
        const duplicateIndex = variables.value.findIndex(
            (v, i) => i !== index && v.name.trim() === variable.name.trim() && variable.name.trim() !== '',
        );
        if (duplicateIndex !== -1) {
            variableErrors.name = 'Variable name must be unique';
            isValid = false;
        }

        if (Object.keys(variableErrors).length > 0) {
            errors[index] = variableErrors;
        }
    });

    if (!isValid && variables.value.some((v) => !v.type)) {
        toast({
            variant: 'destructive',
            title: 'Validation Error',
            description: 'Please fill in all required fields and select types for all variables',
        });
    }

    return isValid;
};

const handleSubmit = async () => {
    if (!validateForm()) return;

    isLoading.value = true;

    try {
        const payload: AddEnvironmentVariablesInput = {
            clusterName: props.clusterName,
            serviceName: props.serviceName,
            containerName: props.containerName,
            environmentVariables: variables.value.map((variable) => ({
                name: variable.name,
                value: variable.value,
            })),
        };

        await awsService.addEnvironmentVariables(payload);

        const variableCount = variables.value.length;
        const variableTypes = variables.value.map((v) => (v.type === 'environment' ? 'Environment variable' : 'Secret'));
        const uniqueTypes = [...new Set(variableTypes)];

        toast({
            variant: 'success',
            title: `${variableCount} Variable${variableCount > 1 ? 's' : ''} added successfully`,
            description: `${uniqueTypes.join(' and ')}${uniqueTypes.length > 1 ? 's' : ''} have been added to ${props.containerName}.`,
        });

        closeDialog();
        emit('variable-added');
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Failed to add variables',
            description: error instanceof Error ? error.message : 'An unexpected error occurred',
        });
    } finally {
        isLoading.value = false;
    }
};
</script>
