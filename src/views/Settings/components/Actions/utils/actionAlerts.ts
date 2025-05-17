import { type ActionDefinition, ActionTypeEnum, type RemoveAllInboundRulesConfig } from '../schema';

export const getActionAlerts = (action: ActionDefinition): { message: string }[] => {
    const alerts = [];

    if (action.actionType === ActionTypeEnum.remove_all_inbound_rules) {
        const config = action.config as RemoveAllInboundRulesConfig;

        // Check if Protocol and Port/Range are empty
        if (!config.protocol && !config.portRange) {
            alerts.push({
                message: 'Warning: Empty Protocol and Port/Range fields will remove ALL inbound rules from the security group.',
            });
        } else if (!config.protocol) {
            alerts.push({
                message: 'Warning: Empty Protocol field will remove all rules with the specified port range regardless of protocol.',
            });
        } else if (!config.portRange) {
            alerts.push({
                message: 'Warning: Empty Port/Range field will remove all rules with the specified protocol regardless of port.',
            });
        }
    }

    return alerts;
};

export const getRemoveAllInboundRulesAlerts = (config: RemoveAllInboundRulesConfig): { message: string }[] => {
    const alerts = [];

    // Check if Protocol and Port/Range are empty
    if (!config.protocol && !config.portRange) {
        alerts.push({
            message: 'Warning: Empty Protocol and Port/Range fields will remove ALL inbound rules from the security group.',
        });
    } else if (!config.protocol) {
        alerts.push({
            message: 'Warning: Empty Protocol field will remove all rules with the specified port range regardless of protocol.',
        });
    } else if (!config.portRange) {
        alerts.push({
            message: 'Warning: Empty Port/Range field will remove all rules with the specified protocol regardless of port.',
        });
    }

    return alerts;
};
