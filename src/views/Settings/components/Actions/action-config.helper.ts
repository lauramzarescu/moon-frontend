// src/views/Settings/components/Actions/action-config-helper.ts
import { ActionTypeEnum, addInboundRuleConfigSchema, sendEmailNotificationConfigSchema, sendSlackNotificationConfigSchema } from './schema';
import { z } from 'zod';

// Define the structure for action configuration
interface ActionConfig {
    schema: z.ZodObject<any>;
    defaultValues: Record<string, unknown>;
}

// Map each action type to its schema and default values
const actionConfigMap: Record<ActionTypeEnum, ActionConfig> = {
    [ActionTypeEnum.add_inbound_rule]: {
        schema: addInboundRuleConfigSchema,
        defaultValues: {
            securityGroupId: '',
            protocol: '',
            portRange: '',
            descriptionTemplate: '',
        },
    },
    [ActionTypeEnum.send_slack_notification]: {
        schema: sendSlackNotificationConfigSchema,
        defaultValues: {
            channel: '',
            recipient: '',
            messageTemplate: '',
        },
    },
    [ActionTypeEnum.send_email_notification]: {
        schema: sendEmailNotificationConfigSchema,
        defaultValues: {
            email: '',
            subject: '',
            body: '',
        },
    },
};

/**
 * Get configuration for a specific action type
 * @param actionType The selected action type
 * @returns Configuration object with schema and default values
 */
export function getActionConfig(actionType?: ActionTypeEnum): {
    schema: z.ZodObject<any> | null;
    defaultValues: Record<string, unknown>;
} {
    if (!actionType || !actionConfigMap[actionType]) {
        return {
            schema: null,
            defaultValues: {},
        };
    }

    return actionConfigMap[actionType];
}
