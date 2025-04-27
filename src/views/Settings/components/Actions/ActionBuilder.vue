<script setup lang="ts">
import { ref, watch } from 'vue';
import {
    type ActionDefinition,
    type ActionType,
    actionTypeLabels,
    actionTypeSchema,
    baseActionDefinitionSchema,
    type TriggerType,
    TriggerTypeEnum,
    triggerTypeLabels,
    triggerTypeSchema,
} from './schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import type { ZodRawShape } from 'zod';
import * as z from 'zod';
import { getActionConfig } from '@/views/Settings/components/Actions/action-config.helper.ts';
import { toast } from '@/components/ui/toast';
import { PermissionEnum } from '@/enums/user/user.enum.ts';
import { usePermissions } from '@/composables/usePermissions.ts';
import { X } from 'lucide-vue-next';
import { ConfigurationFactory } from '@/views/Settings/components/Actions/configurations';

const { hasPermission } = usePermissions();
const emit = defineEmits<{
    (e: 'action-created', action: ActionDefinition): void;
    (e: 'cancel'): void;
}>();

const formBaseSchema = baseActionDefinitionSchema.pick({
    config: true,
    schedulerConfig: true,
    name: true,
    triggerType: true,
    actionType: true,
});

const {
    handleSubmit,
    resetForm,
    values: formValues,
    setFieldValue,
    setFieldError,
} = useForm({
    validationSchema: toTypedSchema(formBaseSchema),
    initialValues: {
        name: '',
        actionType: undefined as ActionType | undefined,
        triggerType: undefined as TriggerType | undefined,
        config: {} as Record<string, unknown>,
        schedulerConfig: undefined as Record<string, unknown> | undefined,
    },
});

const currentConfigSchema = ref<z.ZodObject<ZodRawShape> | null>(null);
const isSubmitting = ref(false);

watch(
    () => formValues.actionType,
    (newActionType) => {
        const { schema, defaultValues } = getActionConfig(newActionType);
        currentConfigSchema.value = schema;

        if (!formValues.config || Object.keys(formValues.config).length === 0) {
            setFieldValue('config', defaultValues);
        }
    },
    { immediate: true },
);

watch(
    () => formValues.triggerType,
    (newTriggerType) => {
        if (newTriggerType === TriggerTypeEnum.scheduled_job) {
            // Initialize schedulerConfig with default values if it's a scheduled job
            if (!formValues.schedulerConfig || Object.keys(formValues.schedulerConfig).length === 0) {
                setFieldValue('schedulerConfig', { customCronExpression: '0 0 * * *' });
                console.log('Initialized schedulerConfig:', formValues.schedulerConfig);
            }
        }
    },
);

const onSubmit = handleSubmit(async (values) => {
    console.log('Form submission started', values); // Debug line
    isSubmitting.value = true;
    try {
        let validatedConfig: Record<string, unknown> | null = null;
        let validatedSchedulerConfig = values.schedulerConfig || null;

        if (currentConfigSchema.value) {
            if (!values.config || Object.keys(values.config).length === 0) {
                toast({
                    title: 'Configuration Error',
                    description: 'Please fill in the configuration details for the selected action type.',
                    variant: 'destructive',
                });
                isSubmitting.value = false;
                return;
            }

            const configResult = await currentConfigSchema.value.safeParseAsync(values.config);
            if (!configResult.success) {
                console.error('Config validation failed:', configResult.error.flatten().fieldErrors);
                configResult.error.errors.forEach((err) => {
                    const fieldName = `config.${err.path.join('.')}` as keyof typeof values;
                    setFieldError(fieldName, err.message);
                });
                toast({
                    title: 'Configuration Error',
                    description: 'Configuration details are invalid. Please check the fields.',
                    variant: 'destructive',
                });
                isSubmitting.value = false;
                return;
            }
            validatedConfig = configResult.data;
        } else {
            validatedConfig = {};
        }

        // Check for customCronExpression since that's what ScheduledJobConfiguration sets
        if (values.triggerType === TriggerTypeEnum.scheduled_job) {
            console.log('Scheduler config:', values.schedulerConfig); // Debug line
            if (!values.schedulerConfig || !values.schedulerConfig.customCronExpression) {
                toast({
                    title: 'Scheduler Configuration Error',
                    description: 'Please provide a valid cron expression for the scheduled job.',
                    variant: 'destructive',
                });
                isSubmitting.value = false;
                return;
            }
            validatedSchedulerConfig = values.schedulerConfig;
        }

        const newActionData = {
            id: crypto.randomUUID(),
            name: values.name,
            actionType: values.actionType!,
            triggerType: values.triggerType!,
            config: validatedConfig,
            schedulerConfig: validatedSchedulerConfig,
            enabled: true,
        };

        console.log('Action data before validation:', newActionData); // Debug line

        const finalValidation = baseActionDefinitionSchema.safeParse(newActionData);
        if (!finalValidation.success) {
            console.error('Final validation failed:', finalValidation.error);
            toast({
                title: 'Configuration Error',
                description: 'Configuration details are invalid. Please check the fields.',
                variant: 'destructive',
            });
            isSubmitting.value = false;
            return;
        }

        console.log('Emitting action-created with:', finalValidation.data);

        emit('action-created', finalValidation.data);
        resetForm();
        currentConfigSchema.value = null;
    } catch (error) {
        console.error('Error creating action:', error);
        toast({
            title: 'Error',
            description: 'An unexpected error occurred. Please try again.',
            variant: 'destructive',
        });
    } finally {
        isSubmitting.value = false;
    }
});

const handleCancel = () => {
    resetForm();
    emit('cancel');
};

const getEnumKeys = <T extends object>(enumObj: T) => Object.keys(enumObj) as Array<keyof T>;

const triggerTypes = triggerTypeSchema.enum;
const actionTypes = actionTypeSchema.enum;
</script>

<template>
    <Card class="shadow-sm border-border/40 overflow-hidden w-full">
        <CardHeader class="bg-muted/30 flex flex-row items-center justify-between">
            <div>
                <CardTitle class="text-xl font-semibold">Create New Action</CardTitle>
                <CardDescription>Define a new automated action based on event triggers.</CardDescription>
            </div>
            <Button variant="ghost" size="icon" @click="handleCancel" class="rounded-full">
                <X class="h-5 w-5" />
            </Button>
        </CardHeader>

        <form @submit.prevent="onSubmit" class="space-y-6">
            <CardContent class="pt-6">
                <div class="space-y-6">
                    <FormField name="name" v-slot="{ field }">
                        <FormItem>
                            <FormLabel>Action Name</FormLabel>
                            <FormControl>
                                <Input v-bind="field" placeholder="e.g., Allow SSH on Login" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    </FormField>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField name="triggerType" v-slot="{ field }">
                            <FormItem>
                                <FormLabel>Trigger Event</FormLabel>
                                <Select v-bind="field">
                                    <FormControl>
                                        <SelectTrigger class="w-full">
                                            <SelectValue placeholder="Select an event..." />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem
                                            v-for="typeKey in getEnumKeys(triggerTypes)"
                                            :key="typeKey"
                                            :value="triggerTypes[typeKey]"
                                        >
                                            {{ triggerTypeLabels[triggerTypes[typeKey]] }}
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        </FormField>

                        <FormField name="actionType" v-slot="{ field }">
                            <FormItem>
                                <FormLabel>Action Type</FormLabel>
                                <Select
                                    v-bind="field"
                                    @update:model-value="
                                        (value: ActionType) => {
                                            setFieldValue('actionType', value);
                                            setFieldValue('config', {});
                                        }
                                    "
                                >
                                    <FormControl>
                                        <SelectTrigger class="w-full">
                                            <SelectValue placeholder="Select an action..." />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem
                                            v-for="typeKey in getEnumKeys(actionTypes)"
                                            :key="typeKey"
                                            :value="actionTypes[typeKey]"
                                        >
                                            {{ actionTypeLabels[actionTypes[typeKey]] }}
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        </FormField>
                    </div>

                    <div
                        v-if="formValues.actionType || formValues.triggerType === TriggerTypeEnum.scheduled_job"
                        class="pt-4 mt-4 border-t border-border/60"
                    >
                        <ConfigurationFactory
                            :actionType="formValues.actionType"
                            :triggerType="formValues.triggerType"
                            :configPath="'config'"
                            :schedulerConfig="formValues.schedulerConfig"
                            @update:schedulerConfig="setFieldValue('schedulerConfig', $event)"
                        />
                    </div>

                    <Alert
                        v-if="formValues.actionType && !hasPermission(PermissionEnum.ACTIONS_CREATE)"
                        class="mt-4 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800"
                    >
                        <AlertDescription class="text-amber-800 dark:text-amber-300">
                            You don't have permission to create actions. Please contact your administrator.
                        </AlertDescription>
                    </Alert>
                </div>
            </CardContent>
            {{ formValues }}
            <CardFooter class="bg-muted/20 px-6 py-4 flex justify-between">
                <Button type="button" variant="outline" @click="handleCancel">Cancel</Button>
                <Button type="submit" :disabled="!formValues.actionType || !hasPermission(PermissionEnum.ACTIONS_CREATE) || isSubmitting">
                    <span v-if="isSubmitting" class="mr-2">
                        <span
                            class="animate-spin inline-block h-4 w-4 border-2 border-current border-t-transparent rounded-full"
                            aria-hidden="true"
                        ></span>
                    </span>
                    {{ isSubmitting ? 'Creating...' : 'Create Action' }}
                </Button>
            </CardFooter>
        </form>
    </Card>
</template>
