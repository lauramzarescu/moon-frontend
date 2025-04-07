<script setup lang="ts">
import { ref, watch } from 'vue';
import {
    type ActionDefinition,
    type ActionType,
    actionTypeLabels,
    actionTypeSchema,
    baseActionDefinitionSchema,
    type TriggerType,
    triggerTypeLabels,
    triggerTypeSchema,
} from './schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';
import { getActionConfig } from '@/views/Settings/components/Actions/action-config.helper.ts';

const emit = defineEmits<{ (e: 'action-created', action: ActionDefinition): void }>();

const formBaseSchema = baseActionDefinitionSchema.pick({
    config: true,
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
    },
});

const currentConfigSchema = ref<z.ZodObject<unknown> | null>(null);

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

const onSubmit = handleSubmit(async (values) => {
    let validatedConfig: Record<string, unknown> | null = null;
    if (currentConfigSchema.value) {
        if (!values.config || Object.keys(values.config).length === 0) {
            alert('Configuration details are missing for the selected action type.');
            return;
        }

        const configResult = await currentConfigSchema.value.safeParseAsync(values.config);
        if (!configResult.success) {
            console.error('Config validation failed:', configResult.error.flatten().fieldErrors);
            configResult.error.errors.forEach((err) => {
                const fieldName = `config.${err.path.join('.')}`;
                setFieldError(fieldName, err.message);
            });
            alert('Configuration details are invalid. Please check the fields.');
            return;
        }
        validatedConfig = configResult.data;
    } else {
        validatedConfig = {};
    }

    const newActionData = {
        id: crypto.randomUUID(),
        name: values.name,
        actionType: values.actionType!,
        triggerType: values.triggerType!,
        config: validatedConfig,
        enabled: true,
    };

    const finalValidation = baseActionDefinitionSchema.safeParse(newActionData);
    if (!finalValidation.success) {
        console.error('Final object validation failed:', finalValidation.error.flatten());
        return;
    }

    emit('action-created', finalValidation.data);
    resetForm();
    currentConfigSchema.value = null;
});

const getEnumKeys = <T extends object>(enumObj: T) => Object.keys(enumObj) as Array<keyof T>;

const triggerTypes = triggerTypeSchema.enum;
const actionTypes = actionTypeSchema.enum;
</script>

<template>
    <Card>
        <CardHeader>
            <CardTitle>Create New Action</CardTitle>
            <CardDescription>Define a new automated action based on event triggers.</CardDescription>
        </CardHeader>
        <form @submit="onSubmit">
            <CardContent class="space-y-6">
                <FormField name="name" v-slot="{ field }">
                    <FormItem>
                        <FormLabel>Action Name</FormLabel>
                        <FormControl>
                            <Input v-bind="field" placeholder="e.g., Allow SSH on Login" />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                </FormField>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField name="triggerType" v-slot="{ field }">
                        <FormItem>
                            <FormLabel>Trigger Event</FormLabel>
                            <Select v-bind="field">
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select an event..." />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem v-for="typeKey in getEnumKeys(triggerTypes)" :key="typeKey" :value="triggerTypes[typeKey]">
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
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select an action..." />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem v-for="typeKey in getEnumKeys(actionTypes)" :key="typeKey" :value="actionTypes[typeKey]">
                                        {{ actionTypeLabels[actionTypes[typeKey]] }}
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    </FormField>
                </div>

                <div v-if="formValues.actionType" class="pt-4 mt-4 border-t">
                    <h4 class="text-md font-semibold mb-3">Configure Action Details</h4>
                    <div v-if="formValues.actionType === actionTypes.add_inbound_rule" class="space-y-4">
                        <FormField name="config.securityGroupId" v-slot="{ field }">
                            <FormItem>
                                <FormLabel>Security Group ID</FormLabel>
                                <FormControl><Input v-bind="field" placeholder="sg-xxxxxxxxxxxxxxxxx" /> </FormControl>
                                <FormMessage />
                            </FormItem>
                        </FormField>
                        <FormField name="config.protocol" v-slot="{ field }">
                            <FormItem>
                                <FormLabel>Protocol</FormLabel>
                                <FormControl><Input v-bind="field" placeholder="e.g., tcp, udp, icmp" /> </FormControl>
                                <FormMessage />
                            </FormItem>
                        </FormField>
                        <FormField name="config.portRange" v-slot="{ field }">
                            <FormItem>
                                <FormLabel>Port / Range</FormLabel>
                                <FormControl><Input v-bind="field" placeholder="e.g., 22, 80, 1000-2000" /> </FormControl>
                                <FormMessage />
                            </FormItem>
                        </FormField>
                        <FormField name="config.descriptionTemplate" v-slot="{ field }">
                            <FormItem>
                                <FormLabel>Description Template (Optional)</FormLabel>
                                <FormControl><Input v-bind="field" placeholder="Access for {email} on {timestamp}" /></FormControl>
                                <FormMessage />
                            </FormItem>
                        </FormField>
                    </div>

                    <div v-if="formValues.actionType === actionTypes.send_email_notification" class="space-y-4">
                        <FormField name="config.email" v-slot="{ field }">
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl><Input v-bind="field" placeholder="admin@example.com" /></FormControl>
                                <FormMessage />
                            </FormItem>
                        </FormField>
                        <FormField name="config.subject" v-slot="{ field }">
                            <FormItem>
                                <FormLabel>Subject</FormLabel>
                                <FormControl><Input v-bind="field" placeholder="Service alert" /></FormControl>
                                <FormMessage />
                            </FormItem>
                        </FormField>
                        <FormField name="config.body" v-slot="{ field }">
                            <FormItem>
                                <FormLabel>Body</FormLabel>
                                <FormControl><Input v-bind="field" placeholder="User {userId} logged in." /> </FormControl>
                                <FormMessage />
                            </FormItem>
                        </FormField>
                    </div>

                    <div v-if="formValues.actionType === actionTypes.send_slack_notification" class="space-y-4">
                        <FormField name="config.channel" v-slot="{ field }">
                            <FormItem>
                                <FormLabel>Channel / Type</FormLabel>
                                <FormControl><Input v-bind="field" placeholder="e.g., slack, email" /></FormControl>
                                <FormMessage />
                            </FormItem>
                        </FormField>
                        <FormField name="config.recipient" v-slot="{ field }">
                            <FormItem>
                                <FormLabel>Recipient</FormLabel>
                                <FormControl><Input v-bind="field" placeholder="#alerts / admin@example.com" /> </FormControl>
                                <FormMessage />
                            </FormItem>
                        </FormField>
                        <FormField name="config.messageTemplate" v-slot="{ field }">
                            <FormItem>
                                <FormLabel>Message Template</FormLabel>
                                <FormControl><Input v-bind="field" placeholder="User {userId} logged in." /> </FormControl>
                                <FormMessage />
                            </FormItem>
                        </FormField>
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                <Button type="submit" :disabled="!formValues.actionType"> Create Action</Button>
            </CardFooter>
        </form>
    </Card>
</template>
