<script setup lang="ts">
import { computed } from 'vue';
import { ActionTypeEnum, TriggerTypeEnum } from '../schema';
import AddInboundRuleConfiguration from './AddInboundRuleConfiguration.vue';
import EmailNotificationConfiguration from './EmailNotificationConfiguration.vue';
import SlackNotificationConfiguration from './SlackNotificationConfiguration.vue';
import RemoveInboundRuleConfiguration from './RemoveInboundRuleConfiguration.vue';
import RemoveAllInboundRulesConfiguration from './RemoveAllInboundRulesConfiguration.vue';
import ScheduledJobConfiguration from './ScheduledJobConfiguration.vue';

const props = defineProps<{
    actionType?: ActionTypeEnum;
    triggerType?: TriggerTypeEnum;
    configPath: string;
    schedulerConfig: Record<string, unknown>;
}>();

const showSchedulerConfig = computed(() => {
    return props.triggerType === TriggerTypeEnum.scheduled_job;
});

const actionConfigComponent = computed(() => {
    switch (props.actionType) {
        case ActionTypeEnum.add_inbound_rule:
            return AddInboundRuleConfiguration;
        case ActionTypeEnum.remove_inbound_rule:
            return RemoveInboundRuleConfiguration;
        case ActionTypeEnum.remove_all_inbound_rules:
            return RemoveAllInboundRulesConfiguration;
        case ActionTypeEnum.send_email_notification:
            return EmailNotificationConfiguration;
        case ActionTypeEnum.send_slack_notification:
            return SlackNotificationConfiguration;
        default:
            return null;
    }
});
</script>

<template>
    <div class="space-y-6">
        <div v-if="showSchedulerConfig" class="pt-4 mt-4 border-t border-border/60">
            <h4 class="text-md font-semibold mb-4">Configure Schedule</h4>
            <ScheduledJobConfiguration
                :schedulerConfig="schedulerConfig"
                @update:schedulerConfig="$emit('update:schedulerConfig', $event)"
            />
        </div>

        <div v-if="actionType" class="pt-4 mt-4 border-t border-border/60">
            <h4 class="text-md font-semibold mb-4">Configure Action Details</h4>
            <component :is="actionConfigComponent" v-if="actionConfigComponent" :configPath="configPath" />
        </div>
    </div>
</template>
