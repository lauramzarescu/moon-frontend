import { z } from 'zod';

export const actionTypeSchema = z.enum(['add_inbound_rule', 'send_notification']);
export type ActionType = z.infer<typeof actionTypeSchema>;

export const triggerTypeSchema = z.enum(['user_login', 'user_logout', 'user_created']);
export type TriggerType = z.infer<typeof triggerTypeSchema>;

// Configuration for ADD_INBOUND_RULE
export const addInboundRuleConfigSchema = z.object({
    securityGroupId: z.string().min(1, 'Security Group ID is required'),
    protocol: z.string().min(1, 'Protocol is required'),
    portRange: z.string().min(1, 'Port/Range is required'), // e.g., '22', '80', '1000-2000'
    descriptionTemplate: z.string().optional(), // Optional, defaults can be handled elsewhere
});
export type AddInboundRuleConfig = z.infer<typeof addInboundRuleConfigSchema>;

export const sendNotificationConfigSchema = z.object({
    channel: z.string().min(1, 'Channel/Type is required'), // e.g., 'slack', 'email'
    recipient: z.string().min(1, 'Recipient is required'), // e.g., '#channel-name', 'admin@example.com'
    messageTemplate: z.string().min(1, 'Message Template is required'),
});
export type SendNotificationConfig = z.infer<typeof sendNotificationConfigSchema>;

export const actionConfigUnionSchema = z.discriminatedUnion('actionType', [
    z.object({
        actionType: z.literal(actionTypeSchema.enum.add_inbound_rule),
        config: addInboundRuleConfigSchema,
    }),
    z.object({
        actionType: z.literal(actionTypeSchema.enum.send_notification),
        config: sendNotificationConfigSchema,
    }),
]);

export const actionDefinitionSchema = z.object({
    id: z.string(),
    name: z.string().min(1, 'Action name is required'),
    actionType: actionTypeSchema,
    triggerType: triggerTypeSchema,
    config: z.record(z.string(), z.any()),
    enabled: z.boolean(),
});
export type ActionDefinition = z.infer<typeof actionDefinitionSchema>;

export const actionTypeLabels: Record<ActionType, string> = {
    add_inbound_rule: 'Add Inbound Security Group Rule',
    send_notification: 'Send Notification',
};

export const triggerTypeLabels: Record<TriggerType, string> = {
    user_login: 'User Login',
    user_logout: 'User Logout',
    user_created: 'User Created',
};
