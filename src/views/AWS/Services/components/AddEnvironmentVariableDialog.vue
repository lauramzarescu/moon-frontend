<template>
    <Dialog :modal="true" v-model:open="isOpen" class="z-10">
        <DialogTrigger as-child>
            <Button disabled variant="outline" size="sm" class="gap-2">
                <PlusIcon class="h-4 w-4" />
                Add Variable
            </Button>
        </DialogTrigger>
        <DialogContent class="max-w-3xl max-h-[90vh] overflow-hidden">
            <!-- Header -->
            <DialogHeader class="pb-6 border-b">
                <DialogTitle class="text-2xl font-bold text-foreground flex items-center gap-3">
                    <div class="p-2 bg-primary/10 rounded-md">
                        <GlobeIcon class="h-5 w-5 text-primary" />
                    </div>
                    Environment Variables
                </DialogTitle>
                <DialogDescription class="text-muted-foreground mt-2">
                    Add environment variables to <span class="font-semibold text-foreground">{{ containerName }}</span>
                </DialogDescription>
            </DialogHeader>

            <!-- Content -->
            <div class="py-6 max-h-[60vh] overflow-y-auto">
                <Form
                    :validation-schema="formSchema"
                    @submit="handleSubmit"
                    :initial-values="initialValues"
                    class="space-y-6"
                    v-slot="{ values, setFieldValue }"
                >
                    <!-- Variables List -->
                    <div class="space-y-4">
                        <div
                            v-for="(variable, index) in variables"
                            :key="index"
                            class="relative p-4 border rounded-lg bg-card hover:bg-accent/5 transition-colors"
                        >
                            <!-- Remove Button -->
                            <Button
                                v-if="variables.length > 1"
                                type="button"
                                variant="ghost"
                                size="sm"
                                @click="removeVariable(index, setFieldValue)"
                                class="absolute top-2 right-2 h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            >
                                <TrashIcon class="h-4 w-4" />
                            </Button>

                            <!-- Variable Number -->
                            <div class="flex items-center gap-2 mb-4">
                                <div
                                    class="flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs font-medium"
                                >
                                    {{ index + 1 }}
                                </div>
                                <span class="text-sm font-medium text-muted-foreground">Variable {{ index + 1 }}</span>
                            </div>

                            <!-- Fields -->
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <!-- Name Field -->
                                <FormField v-slot="{ componentField }" :name="`environmentVariables.${index}.name`">
                                    <FormItem>
                                        <FormLabel>Name</FormLabel>
                                        <FormControl>
                                            <Input
                                                autofocus
                                                placeholder="VARIABLE_NAME"
                                                class="font-mono"
                                                v-bind="componentField"
                                                :disabled="false"
                                                @input="updateVariable(index, 'name', $event.target.value)"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                </FormField>

                                <!-- Value Field -->
                                <FormField v-slot="{ componentField }" :name="`environmentVariables.${index}.value`">
                                    <FormItem>
                                        <FormLabel>Value</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Enter value..."
                                                rows="3"
                                                class="resize-none font-mono text-sm"
                                                v-bind="componentField"
                                                :disabled="isLoading"
                                                @input="updateVariable(index, 'value', $event.target.value)"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                </FormField>
                            </div>
                        </div>
                    </div>

                    <!-- Add Variable Button -->
                    <div class="flex justify-center pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            @click="addVariable(setFieldValue)"
                            class="gap-2 border-dashed hover:bg-accent"
                            :disabled="isLoading"
                        >
                            <PlusIcon class="h-4 w-4" />
                            Add Another Variable
                        </Button>
                    </div>

                    <!-- Footer -->
                    <DialogFooter class="pt-6 border-t">
                        <Button type="button" variant="outline" @click="closeDialog" :disabled="isLoading"> Cancel </Button>
                        <Button type="submit" :disabled="isLoading">
                            <Loader2Icon v-if="isLoading" class="h-4 w-4 animate-spin mr-2" />
                            Add {{ variables.length }} Variable{{ variables.length > 1 ? 's' : '' }}
                        </Button>
                    </DialogFooter>
                </Form>
            </div>
        </DialogContent>
    </Dialog>
</template>

<script setup lang="ts">
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/components/ui/toast';
import { GlobeIcon, Loader2Icon, PlusIcon, TrashIcon } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import { AwsService } from '@/services/aws.service';
import {
    type AddEnvironmentVariablesInput,
    addEnvironmentVariablesSchema,
} from '@/views/AWS/Services/components/environment-variable.schema';
import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';

interface VariableForm {
    name: string;
    value: string;
}

const props = defineProps<{
    clusterName: string;
    serviceName: string;
    containerName: string;
    open?: boolean;
}>();

const emit = defineEmits<{
    (e: 'variable-added'): void;
    (e: 'update:open', value: boolean): void;
}>();

const { toast } = useToast();
const awsService = new AwsService();

const isOpen = computed({
    get: () => props.open ?? false,
    set: (value) => emit('update:open', value),
});
const isLoading = ref(false);

const variables = ref<VariableForm[]>([
    {
        name: '',
        value: '',
    },
]);

const initialValues = computed(() => ({
    environmentVariables: variables.value,
}));

const formSchema = computed(() => {
    return toTypedSchema(
        z.object({
            environmentVariables: z
                .array(
                    z.object({
                        name: z.string().min(1, 'Environment variable name is required'),
                        value: z.string(),
                    }),
                )
                .min(1, 'At least one environment variable is required')
                .refine(
                    (vars) => {
                        const names = vars.map((v) => v.name.trim()).filter((name) => name !== '');
                        return names.length === new Set(names).size;
                    },
                    {
                        message: 'Variable names must be unique',
                        path: [0, 'name'],
                    },
                ),
        }),
    );
});

const updateVariable = (index: number, field: 'name' | 'value', value: string) => {
    variables.value[index][field] = value;
};

const addVariable = (setFieldValue: any) => {
    const newIndex = variables.value.length;
    variables.value.push({
        name: '',
        value: '',
    });

    // Update form values
    setFieldValue(`environmentVariables.${newIndex}.name`, '');
    setFieldValue(`environmentVariables.${newIndex}.value`, '');
};

const removeVariable = (index: number, setFieldValue: any) => {
    if (variables.value.length > 1) {
        variables.value.splice(index, 1);

        // Update form field values after removal
        variables.value.forEach((variable, i) => {
            setFieldValue(`environmentVariables.${i}.name`, variable.name);
            setFieldValue(`environmentVariables.${i}.value`, variable.value);
        });
        setFieldValue(`environmentVariables.${variables.value.length}.name`, undefined);
        setFieldValue(`environmentVariables.${variables.value.length}.value`, undefined);
    }
};

const closeDialog = () => {
    isOpen.value = false;
    variables.value = [
        {
            name: '',
            value: '',
        },
    ];
};

const handleSubmit = async (values: any) => {
    isLoading.value = true;

    try {
        const payload: AddEnvironmentVariablesInput = {
            clusterName: props.clusterName,
            serviceName: props.serviceName,
            containerName: props.containerName,
            environmentVariables: values.environmentVariables,
        };

        const validationResult = addEnvironmentVariablesSchema.safeParse(payload);
        if (!validationResult.success) {
            toast({
                variant: 'destructive',
                title: 'Validation Error',
                description: 'Please fill in all required fields correctly',
            });
            return;
        }

        await awsService.addEnvironmentVariables(payload);

        const variableCount = values.environmentVariables.length;

        toast({
            variant: 'success',
            title: `${variableCount} Environment Variable${variableCount > 1 ? 's' : ''} added successfully`,
            description: `Environment variable${variableCount > 1 ? 's' : ''} have been added to ${props.containerName}.`,
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
