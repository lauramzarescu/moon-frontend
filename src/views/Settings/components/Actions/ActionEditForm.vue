<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { type ActionDefinition, type ActionType, actionTypeLabels, triggerTypeLabels, triggerTypeSchema } from './schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Save, X } from 'lucide-vue-next';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';
import { getActionConfig } from '@/views/Settings/components/Actions/action-config.helper.ts';

const props = defineProps<{
    action: ActionDefinition;
}>();

const emit = defineEmits<{
    (e: 'save', action: ActionDefinition): void;
    (e: 'cancel'): void;
}>();

const formSchema = ref<z.ZodObject<any>>();
const defaultValues = ref<any>({});

onMounted(() => {
    // Get the appropriate schema and default values for this action type
    const { schema } = getActionConfig(props.action.actionType as ActionType);

    // Create a form schema that includes the base fields and the specific config
    formSchema.value = z.object({
        name: z.string().min(1, 'Name is required'),
        triggerType: triggerTypeSchema,
        config: schema || z.any(),
    });

    // Set default values from the current action
    defaultValues.value = {
        name: props.action.name,
        triggerType: props.action.triggerType,
        config: { ...props.action.config },
    };
});

const { handleSubmit, values, errors, resetForm } = useForm({
    validationSchema: computed(() => (formSchema.value ? toTypedSchema(formSchema.value) : undefined)),
    initialValues: defaultValues,
});

const onSubmit = handleSubmit((values) => {
    const updatedAction: ActionDefinition = {
        ...props.action,
        name: values.name,
        triggerType: values.triggerType,
        config: values.config,
    };

    emit('save', updatedAction);
});

const getEnumKeys = <T extends object>(enumObj: T) => Object.keys(enumObj) as Array<keyof T>;
const triggerTypes = triggerTypeSchema.enum;
</script>

<template>
    <form @submit.prevent="onSubmit">
        <Card class="border-primary/20">
            <CardHeader class="pb-4 bg-muted/30">
                <div class="space-y-4">
                    <FormField name="name" v-slot="{ field }">
                        <FormItem>
                            <FormLabel>Action Name</FormLabel>
                            <FormControl>
                                <Input v-bind="field" placeholder="Action name" class="font-medium" />
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
                                            <SelectValue placeholder="Select trigger..." />
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

                        <div class="space-y-2">
                            <FormLabel>Action Type</FormLabel>
                            <Input :value="actionTypeLabels[action.actionType]" disabled class="bg-muted/50" />
                            <p class="text-xs text-foreground">Action type cannot be changed</p>
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent class="pb-4">
                <Separator class="my-2" />

                <div class="mt-3">
                    <h4 class="text-xs uppercase text-foreground font-semibold tracking-wider mb-3">Configuration</h4>

                    <!-- Add Inbound Rule Configuration -->
                    <div v-if="action.actionType === 'add_inbound_rule'" class="space-y-4">
                        <FormField name="config.securityGroupId" v-slot="{ field }">
                            <FormItem>
                                <FormLabel>Security Group ID</FormLabel>
                                <FormControl>
                                    <Input v-bind="field" placeholder="sg-xxxxxxxxxxxxxxxxx" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        </FormField>

                        <FormField name="config.protocol" v-slot="{ field }">
                            <FormItem>
                                <FormLabel>Protocol</FormLabel>
                                <FormControl>
                                    <Input v-bind="field" placeholder="e.g., tcp, udp, icmp" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        </FormField>

                        <FormField name="config.portRange" v-slot="{ field }">
                            <FormItem>
                                <FormLabel>Port / Range</FormLabel>
                                <FormControl>
                                    <Input v-bind="field" placeholder="e.g., 22, 80, 1000-2000" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        </FormField>

                        <FormField name="config.descriptionTemplate" v-slot="{ field }">
                            <FormItem>
                                <FormLabel>Description Template (Optional)</FormLabel>
                                <FormControl>
                                    <Input v-bind="field" placeholder="Access for {email} on {timestamp}" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        </FormField>
                    </div>

                    <!-- Email Notification Configuration -->
                    <div v-if="action.actionType === 'send_email_notification'" class="space-y-4">
                        <FormField name="config.email" v-slot="{ field }">
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input v-bind="field" placeholder="admin@example.com" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        </FormField>

                        <FormField name="config.subject" v-slot="{ field }">
                            <FormItem>
                                <FormLabel>Subject</FormLabel>
                                <FormControl>
                                    <Input v-bind="field" placeholder="Service alert" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        </FormField>

                        <FormField name="config.body" v-slot="{ field }">
                            <FormItem>
                                <FormLabel>Body</FormLabel>
                                <FormControl>
                                    <Textarea v-bind="field" placeholder="User {userId} logged in." class="min-h-[100px]" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        </FormField>
                    </div>

                    <!-- Slack Notification Configuration -->
                    <div v-if="action.actionType === 'send_slack_notification'" class="space-y-4">
                        <FormField name="config.channel" v-slot="{ field }">
                            <FormItem>
                                <FormLabel>Channel</FormLabel>
                                <FormControl>
                                    <Input v-bind="field" placeholder="#alerts" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        </FormField>

                        <FormField name="config.recipient" v-slot="{ field }">
                            <FormItem>
                                <FormLabel>Recipient</FormLabel>
                                <FormControl>
                                    <Input v-bind="field" placeholder="@username or channel name" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        </FormField>

                        <FormField name="config.messageTemplate" v-slot="{ field }">
                            <FormItem>
                                <FormLabel>Message Template</FormLabel>
                                <FormControl>
                                    <Textarea v-bind="field" placeholder="User {userId} logged in at {timestamp}." class="min-h-[100px]" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        </FormField>
                    </div>
                </div>
            </CardContent>

            <CardFooter class="flex justify-between pt-2 pb-3 bg-muted/10">
                <Button type="button" variant="ghost" size="sm" @click="emit('cancel')">
                    <X class="h-4 w-4 mr-2" />
                    Cancel
                </Button>

                <Button type="submit" variant="default" size="sm">
                    <Save class="h-4 w-4 mr-2" />
                    Save Changes
                </Button>
            </CardFooter>
        </Card>
    </form>
</template>
