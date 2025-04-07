// src/views/Settings/components/Actions/schema.ts

// Defines the structure and types for the Actions module

// Supported types of actions the user can configure
export enum ActionType {
    ADD_INBOUND_RULE = 'add_inbound_rule',
    SEND_NOTIFICATION = 'send_notification',
    // Add other action types here (e.g., RUN_SCRIPT, TRIGGER_WEBHOOK)
}

// Supported event triggers that can initiate an action
export enum TriggerType {
    USER_LOGIN = 'user_login',
    USER_LOGOUT = 'user_logout',
    USER_CREATED = 'user_created',
    // Add other trigger types here (e.g., TASK_COMPLETED, DEPLOYMENT_FAILED)
}

// --- Action Specific Configuration Interfaces ---

// Configuration for ADD_INBOUND_RULE
export interface AddInboundRuleConfig {
    securityGroupId: string;
    protocol: string;
    portRange: string; // e.g., '22', '80', '1000-2000'
    descriptionTemplate?: string; // Optional, defaults can be handled elsewhere
}

// Configuration for SEND_NOTIFICATION
export interface SendNotificationConfig {
    channel: string; // e.g., 'slack', 'email'
    recipient: string; // e.g., '#channel-name', 'admin@example.com'
    messageTemplate: string;
}

// --- Union Type for All Configs ---
// Add other config interface names here as you create them
export type ActionConfig = AddInboundRuleConfig | SendNotificationConfig;

// --- Main Action Definition ---
export interface ActionDefinition {
    id: string; // Unique identifier (e.g., generated UUID or from backend)
    name: string; // User-defined name for the action
    actionType: ActionType;
    triggerType: TriggerType;
    config: ActionConfig; // Specific configuration based on actionType
    enabled: boolean;
}

// --- Display Labels (for UI) ---
export const actionTypeLabels: Record<ActionType, string> = {
    [ActionType.ADD_INBOUND_RULE]: 'Add Inbound Security Group Rule',
    [ActionType.SEND_NOTIFICATION]: 'Send Notification',
};

export const triggerTypeLabels: Record<TriggerType, string> = {
    [TriggerType.USER_LOGIN]: 'User Login',
    [TriggerType.USER_LOGOUT]: 'User Logout',
    [TriggerType.USER_CREATED]: 'User Created',
};
