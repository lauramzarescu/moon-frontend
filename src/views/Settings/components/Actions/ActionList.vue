<script setup lang="ts">
import {
    type ActionDefinition,
    actionTypeLabels,
    type AddInboundRuleConfig,
    type SendNotificationConfig,
    triggerTypeLabels,
} from './schema';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-vue-next';
import { Separator } from '@/components/ui/separator';

interface Props {
    actions: ActionDefinition[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
    (e: 'update-action-status', id: string, enabled: boolean): void;
    (e: 'delete-action', id: string): void;
    (e: 'edit-action', action: ActionDefinition): void;
}>();

const handleStatusChange = (actionId: string, newStatus: boolean) => {
    emit('update-action-status', actionId, newStatus);
};

const handleDelete = (actionId: string) => {
    emit('delete-action', actionId);
};

const handleEdit = (action: ActionDefinition) => {
    emit('edit-action', action);
};

const getConfigEntries = (action: ActionDefinition): { key: string; value: string }[] => {
    const config = action.config;
    switch (action.actionType) {
        case 'add_inbound_rule':
            const ruleConfig = config as AddInboundRuleConfig;
            return [
                { key: 'Security Group', value: ruleConfig.securityGroupId },
                { key: 'Protocol', value: ruleConfig.protocol },
                { key: 'Port/Range', value: ruleConfig.portRange },
                { key: 'Description', value: ruleConfig.descriptionTemplate || 'Default' },
            ];
        case 'send_notification':
            const notifyConfig = config as SendNotificationConfig;
            return [
                { key: 'Channel', value: notifyConfig.channel },
                { key: 'Recipient', value: notifyConfig.recipient },
                { key: 'Message', value: notifyConfig.messageTemplate },
            ];
        default:
            return Object.entries(config).map(([key, value]) => ({
                key: key,
                value: typeof value === 'string' ? value : JSON.stringify(value),
            }));
    }
};
</script>

<template>
    <div>
        <h3 class="text-lg font-medium mb-4">Defined Actions</h3>
        <p v-if="props.actions.length === 0" class="text-sm text-muted-foreground text-center py-8">
            No actions defined yet. Create one using the builder above.
        </p>
        <div v-else class="space-y-4">
            <Card v-for="action in props.actions" :key="action.id">
                <CardHeader class="pb-4">
                    <div class="flex items-start justify-between gap-4">
                        <div>
                            <CardTitle class="text-lg mb-1">{{ action.name }}</CardTitle>
                            <div class="flex items-center gap-2 text-muted-foreground">
                                <span
                                    >Trigger:
                                    <Badge variant="outline" class="px-2 py-0.5">{{
                                        triggerTypeLabels[action.triggerType] || action.triggerType
                                    }}</Badge></span
                                >
                                <span
                                    >Action:
                                    <Badge variant="secondary" class="px-2 py-0.5">{{
                                        actionTypeLabels[action.actionType] || action.actionType
                                    }}</Badge></span
                                >
                            </div>
                        </div>
                        <div class="flex items-center space-x-2 flex-shrink-0">
                            <Switch
                                :checked="action.enabled"
                                @update:checked="(newStatus: boolean) => handleStatusChange(action.id, newStatus)"
                                :id="`switch-${action.id}`"
                            />
                            <label
                                :for="`switch-${action.id}`"
                                class="font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                {{ action.enabled ? 'Enabled' : 'Disabled' }}
                            </label>
                        </div>
                    </div>
                </CardHeader>
                <CardContent class="pt-0 pb-4">
                    <Separator class="my-3" />
                    <h4 class="uppercase text-muted-foreground font-semibold mb-2">Configuration Details</h4>
                    <dl class="space-y-1">
                        <div v-for="detail in getConfigEntries(action)" :key="detail.key" class="flex justify-between">
                            <dt class="text-muted-foreground">{{ detail.key }}:</dt>
                            <dd class="font-mono text-right break-all">{{ detail.value }}</dd>
                        </div>
                    </dl>
                </CardContent>
                <CardFooter class="flex justify-end gap-2 pt-4 border-t">
                    <Button variant="outline" size="sm" @click="handleEdit(action)">
                        <Pencil class="h-4 w-4 mr-2" />
                        Edit
                    </Button>
                    <Button variant="outline" size="sm" class="text-destructive hover:text-destructive" @click="handleDelete(action.id)">
                        <Trash2 class="h-4 w-4 mr-2" />
                        Delete
                    </Button>
                </CardFooter>
            </Card>
        </div>
    </div>
</template>
