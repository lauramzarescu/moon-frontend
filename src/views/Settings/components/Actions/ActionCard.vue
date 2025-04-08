<script setup lang="ts">
import {
    type ActionDefinition,
    ActionTypeEnum,
    actionTypeLabels,
    type AddInboundRuleConfig,
    type SendEmailNotificationConfig,
    type SendSlackNotificationConfig,
    triggerTypeLabels,
} from './schema';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Mail, MessageSquare, Pencil, Shield, Trash2 } from 'lucide-vue-next';
import { usePermissions } from '@/composables/usePermissions.ts';
import { PermissionEnum } from '@/enums/user/user.enum.ts';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';

const props = defineProps<{
    action: ActionDefinition;
}>();

const emit = defineEmits<{
    (e: 'update-status', id: string, enabled: boolean): void;
    (e: 'delete', id: string): void;
    (e: 'edit', action: ActionDefinition): void;
}>();

const { hasPermission } = usePermissions();

const getActionIcon = (actionType: string) => {
    switch (actionType) {
        case ActionTypeEnum.add_inbound_rule:
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
    switch (action.actionType) {
        case ActionTypeEnum.add_inbound_rule:
            const ruleConfig = config as AddInboundRuleConfig;
            return [
                { key: 'Security Group', value: ruleConfig.securityGroupId },
                { key: 'Protocol', value: ruleConfig.protocol },
                { key: 'Port/Range', value: ruleConfig.portRange },
                { key: 'Description', value: ruleConfig.descriptionTemplate || 'Default' },
            ];
        case ActionTypeEnum.send_slack_notification:
            const notifyConfig = config as SendSlackNotificationConfig;
            return [
                { key: 'Channel', value: notifyConfig.channel },
                { key: 'Recipient', value: notifyConfig.recipient },
                { key: 'Message', value: notifyConfig.messageTemplate },
            ];
        case ActionTypeEnum.send_email_notification:
            const emailConfig = config as SendEmailNotificationConfig;
            return [
                { key: 'Recipient', value: emailConfig.email },
                { key: 'Subject', value: emailConfig.subject },
                { key: 'Body', value: emailConfig.body },
            ];
        default:
            return Object.entries(config).map(([key, value]) => ({
                key: key,
                value: value as string,
            }));
    }
};
</script>

<template>
    <Card
        class="overflow-hidden transition-all duration-200 hover:shadow-md w-full"
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
                                    {{ triggerTypeLabels[action.triggerType as any] || action.triggerType }}
                                </Badge>
                            </span>
                            <span class="flex items-center gap-1.5">
                                <Badge variant="secondary" class="px-2 py-0.5">
                                    {{ actionTypeLabels[action.actionType as any] || action.actionType }}
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

            <div class="mt-3">
                <h4 class="text-xs uppercase text-muted-foreground font-semibold tracking-wider mb-3">Configuration</h4>
                <ScrollArea class="h-[120px] rounded-md border p-3">
                    <dl class="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                        <div v-for="detail in getConfigEntries(action)" :key="detail.key" class="flex justify-between">
                            <dt class="text-sm text-muted-foreground font-medium">{{ detail.key }}:</dt>
                            <dd class="text-sm font-mono text-right break-all">{{ detail.value }}</dd>
                        </div>
                    </dl>
                </ScrollArea>
            </div>
        </CardContent>

        <CardFooter class="flex justify-end gap-2 pt-2 pb-3 bg-muted/10">
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div>
                            <Button
                                disabled
                                :disabled="!hasPermission(PermissionEnum.ACTIONS_WRITE)"
                                variant="ghost"
                                size="sm"
                                @click="emit('edit', action)"
                            >
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
                                class="text-destructive hover:bg-destructive/10 hover:text-destructive"
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
