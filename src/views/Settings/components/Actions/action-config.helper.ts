import { z } from 'zod';
import {
    ActionTypeEnum,
    addInboundRuleConfigSchema,
    removeAllInboundRulesConfigSchema,
    removeInboundRuleConfigSchema,
    sendEmailNotificationConfigSchema,
    sendSlackNotificationConfigSchema,
} from './schema';

export function getActionConfig(actionType?: ActionTypeEnum) {
    switch (actionType) {
        case ActionTypeEnum.add_inbound_rule:
            return {
                schema: addInboundRuleConfigSchema,
                defaultValues: {
                    securityGroupId: '',
                    protocol: 'tcp',
                    portRange: '22',
                    descriptionTemplate: 'Access granted on {timestamp}',
                },
            };
        case ActionTypeEnum.remove_inbound_rule:
            return {
                schema: removeInboundRuleConfigSchema,
                defaultValues: {
                    securityGroupId: '',
                    ip: '',
                },
            };
        case ActionTypeEnum.remove_all_inbound_rules:
            return {
                schema: removeAllInboundRulesConfigSchema,
                defaultValues: {
                    securityGroupId: '',
                },
            };
        case ActionTypeEnum.send_slack_notification:
            return {
                schema: sendSlackNotificationConfigSchema,
                defaultValues: {
                    channel: '#alerts',
                    recipient: '',
                    messageTemplate: 'Alert: {message}',
                },
            };
        case ActionTypeEnum.send_email_notification:
            return {
                schema: sendEmailNotificationConfigSchema,
                defaultValues: {
                    email: '',
                    subject: 'Moon Alert Notification',
                    body: 'This is an automated alert from Moon.',
                },
            };
        default:
            return {
                schema: z.object({}),
                defaultValues: {},
            };
    }
}
