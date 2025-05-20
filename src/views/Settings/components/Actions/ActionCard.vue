<script setup lang="ts">
import {
    type ActionDefinition,
    ActionTypeEnum,
    actionTypeLabels,
    type AddInboundRuleConfig,
    type RemoveAllInboundRulesConfig,
    type RemoveInboundRuleConfig,
    type SendEmailNotificationConfig,
    type SendSlackNotificationConfig,
    TriggerTypeEnum,
    triggerTypeLabels,
} from './schema';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Copy, Mail, MessageSquare, Pencil, Shield, Trash2 } from 'lucide-vue-next';
import { usePermissions } from '@/composables/usePermissions.ts';
import { PermissionEnum } from '@/enums/user/user.enum.ts';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import moment from 'moment';
import { getActionAlerts } from '@/views/Settings/components/Actions/utils/actionAlerts.ts';

const props = defineProps<{
    action: ActionDefinition;
}>();

const emit = defineEmits<{
    (e: 'update-status', id: string, enabled: boolean): void;
    (e: 'delete', id: string): void;
    (e: 'edit', action: ActionDefinition): void;
    (e: 'copy', action: ActionDefinition): void;
}>();

const { hasPermission } = usePermissions();

const getActionIcon = (actionType: string) => {
    switch (actionType) {
        case ActionTypeEnum.add_inbound_rule:
            return Shield;
        case ActionTypeEnum.remove_all_inbound_rules:
            return Shield;
        case ActionTypeEnum.remove_inbound_rule:
            return Shield;
        case ActionTypeEnum.send_email_notification:
            return Mail;
        case ActionTypeEnum.send_slack_notification:
            return MessageSquare;
        default:
            return AlertCircle;
    }
};

const getConfigEntries = (action: ActionDefinition): { key: string; value: string }[] => {
    const config = action.config;
    const entries = [];

    if (action.triggerType === TriggerTypeEnum.scheduled_job) {
        entries.push(
            {
                key: 'Scheduler',
                value: action.schedulerConfig?.readableCronExpression?.description || 'Default',
            },
            { key: 'Scheduler Cron', value: action.schedulerConfig?.customCronExpression || 'Default' },
            {
                key: 'Next Run',
                value: moment(action.schedulerConfig?.readableCronExpression?.nextRun).format('DD/MM/YYYY HH:mm:ss') || 'Default',
            },
        );
    }

    switch (action.actionType) {
        case ActionTypeEnum.add_inbound_rule:
            const ruleConfig = config as AddInboundRuleConfig;
            return entries.concat([
                { key: 'Security Group', value: ruleConfig.securityGroupId },
                { key: 'Protocol', value: ruleConfig.protocol },
                { key: 'Port/Range', value: ruleConfig.portRange },
                { key: 'Description', value: ruleConfig.descriptionTemplate || 'Default' },
            ]);

        case ActionTypeEnum.remove_inbound_rule:
            const removeRule = config as RemoveInboundRuleConfig;
            return entries.concat([
                { key: 'Security Group', value: removeRule.securityGroupId },
                { key: 'IP', value: removeRule.ip || '0.0.0.0' },
                { key: 'Protocol', value: removeRule.protocol },
                { key: 'Port/Range', value: removeRule.portRange },
            ]);

        case ActionTypeEnum.remove_all_inbound_rules:
            const removeAllRules = config as RemoveAllInboundRulesConfig;
            return entries.concat([
                { key: 'Security Group', value: removeAllRules.securityGroupId },
                { key: 'Protocol', value: removeAllRules.protocol || 'All' },
                { key: 'Port/Range', value: removeAllRules.portRange || 'All' },
            ]);

        case ActionTypeEnum.send_slack_notification:
            const notifyConfig = config as SendSlackNotificationConfig;
            return entries.concat([
                { key: 'Channel', value: notifyConfig.channel },
                { key: 'Recipient', value: notifyConfig.recipient },
                { key: 'Message', value: notifyConfig.messageTemplate },
            ]);

        case ActionTypeEnum.send_email_notification:
            const emailConfig = config as SendEmailNotificationConfig;
            return entries.concat([
                { key: 'Recipient', value: emailConfig.email },
                { key: 'Subject', value: emailConfig.subject },
                { key: 'Body', value: emailConfig.body },
            ]);

        default:
            // Handle potential non-string values in config
            return Object.entries(config).map(([key, value]) => ({
                key: key,
                value: typeof value === 'object' ? JSON.stringify(value) : String(value),
            }));
    }
};
</script>

<template>
    <Card
        class="dark:!bg-card overflow-hidden transition-all duration-200 hover:shadow-md w-full"
        :class="{ 'opacity-60 border-dashed': !action.enabled }"
    >
        <CardHeader class="pb-4">
            <div class="flex items-start justify-between gap-4">
                <div class="flex items-start gap-3">
                    <div class="rounded-md bg-primary/10 p-2 mt-0.5">
                        <component :is="getActionIcon(action.actionType)" class="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <CardTitle class="text-lg mb-1 flex items-center gap-2">
                            {{ action.name }}
                            <Badge v-if="!action.enabled" variant="outline" class="text-xs font-normal"> Disabled </Badge>
                        </CardTitle>
                        <CardDescription class="flex flex-wrap items-center gap-x-4 gap-y-2">
                            <span class="flex items-center gap-1.5">
                                <Badge variant="outline" class="px-2 py-0.5">
                                    {{ triggerTypeLabels[action.triggerType] || action.triggerType }}
                                </Badge>
                            </span>
                            <span class="flex items-center gap-1.5">
                                <Badge variant="secondary" class="px-2 py-0.5">
                                    {{ actionTypeLabels[action.actionType] || action.actionType }}
                                </Badge>
                            </span>
                        </CardDescription>
                    </div>
                </div>
                <div class="flex items-center space-x-2 flex-shrink-0">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div class="flex items-center">
                                    <Switch
                                        :checked="action.enabled"
                                        @update:checked="(newStatus: boolean) => emit('update-status', action.id, newStatus)"
                                        :id="`switch-${action.id}`"
                                        :disabled="!hasPermission(PermissionEnum.ACTIONS_WRITE)"
                                    />
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{{ action.enabled ? 'Disable action' : 'Enable action' }}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>
        </CardHeader>

        <CardContent class="pb-4">
            <Separator class="my-2" />

            <!-- Action-specific alerts -->
            <div v-if="getActionAlerts(action).length > 0" class="mb-3">
                <Alert variant="warning" v-for="(alert, index) in getActionAlerts(action)" :key="index" class="mb-2">
                    <AlertCircle class="h-4 w-4 mr-2" />
                    <AlertDescription>{{ alert.message }}</AlertDescription>
                </Alert>
            </div>

            <div class="mt-3">
                <h4 class="text-xs uppercase text-foreground font-semibold tracking-wider my-6">Configuration</h4>
                <ScrollArea class="rounded-md">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div v-for="detail in getConfigEntries(action)" :key="detail.key" class="border rounded-md p-3 bg-muted/20">
                            <div class="text-xs uppercase text-foreground font-semibold mb-1">{{ detail.key }}</div>
                            <div class="text-sm font-mono break-all">{{ detail.value }}</div>
                        </div>
                    </div>
                </ScrollArea>
            </div>
        </CardContent>

        <CardFooter class="flex justify-end gap-2 pt-2 pb-3 bg-muted/10">
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div>
                            <Button variant="outline" size="sm" @click="emit('copy', action)">
                                <Copy class="h-4 w-4 mr-2" />
                                Copy
                            </Button>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent v-if="!hasPermission(PermissionEnum.ACTIONS_WRITE)">
                        <p>You don't have permission to copy actions</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div>
                            <Button disabled variant="outline" size="sm" @click="emit('edit', action)">
                                <Pencil class="h-4 w-4 mr-2" />
                                Edit
                            </Button>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent v-if="!hasPermission(PermissionEnum.ACTIONS_WRITE)">
                        <p>You don't have permission to edit actions</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div>
                            <Button
                                :disabled="!hasPermission(PermissionEnum.ACTIONS_DELETE)"
                                variant="ghost"
                                size="sm"
                                class="text-destructive dark:hover:bg-red-900/20 hover:bg-destructive/20 hover:text-destructive"
                                @click="emit('delete', action.id)"
                            >
                                <Trash2 class="h-4 w-4 mr-2" />
                                Delete
                            </Button>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent v-if="!hasPermission(PermissionEnum.ACTIONS_DELETE)">
                        <p>You don't have permission to delete actions</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </CardFooter>
    </Card>
</template>
