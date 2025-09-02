/**
 * Utility functions for environment variable operations
 */

export enum VariableDataType {
    TEXT = 'text',
    JSON = 'json',
    NUMBER = 'number',
    BOOLEAN = 'boolean',
}

export interface VariableTypeInfo {
    type: VariableDataType;
    label: string;
    description: string;
    icon?: string;
}

export const VARIABLE_TYPES: VariableTypeInfo[] = [
    {
        type: VariableDataType.TEXT,
        label: 'Text',
        description: 'Plain text value',
    },
    {
        type: VariableDataType.JSON,
        label: 'JSON',
        description: 'JSON object or array',
    },
    {
        type: VariableDataType.NUMBER,
        label: 'Number',
        description: 'Numeric value',
    },
    {
        type: VariableDataType.BOOLEAN,
        label: 'Boolean',
        description: 'True or false value',
    },
];

/**
 * Check if a string is valid JSON
 */
export const isJsonString = (str: string): boolean => {
    if (!str || typeof str !== 'string') return false;
    try {
        const parsed = JSON.parse(str);
        return typeof parsed === 'object' && parsed !== null;
    } catch {
        return false;
    }
};

/**
 * Check if a value is a number
 */
export const isNumber = (value: string): boolean => {
    if (!value || typeof value !== 'string') return false;
    const trimmed = value.trim();
    return !isNaN(Number(trimmed)) && trimmed !== '';
};

/**
 * Check if a value is a boolean
 */
export const isBoolean = (value: string): boolean => {
    if (!value || typeof value !== 'string') return false;
    const trimmed = value.trim().toLowerCase();
    return trimmed === 'true' || trimmed === 'false';
};

/**
 * Check if a value is considered long (over 100 characters)
 */
export const isLongValue = (value: string): boolean => {
    return !!value && value.length > 100;
};

/**
 * Auto-detect the variable type based on its value
 */
export const detectVariableType = (value: string): VariableDataType => {
    if (!value || typeof value !== 'string') {
        return VariableDataType.TEXT;
    }

    const trimmed = value.trim();
    
    // Check for JSON first (most specific)
    if (isJsonString(trimmed)) {
        return VariableDataType.JSON;
    }
    
    // Check for boolean
    if (isBoolean(trimmed)) {
        return VariableDataType.BOOLEAN;
    }
    
    // Check for number
    if (isNumber(trimmed)) {
        return VariableDataType.NUMBER;
    }
    
    // Default to text
    return VariableDataType.TEXT;
};

/**
 * Format JSON string with pretty printing
 */
export const formatJson = (jsonString: string, pretty: boolean = false): string => {
    try {
        const parsed = JSON.parse(jsonString);
        return pretty ? JSON.stringify(parsed, null, 2) : JSON.stringify(parsed);
    } catch {
        return jsonString;
    }
};

/**
 * Validate if a value is valid for its detected type
 */
export const isValidForType = (value: string, type: VariableDataType): boolean => {
    if (!value || typeof value !== 'string') {
        return true; // Empty values are generally valid
    }

    switch (type) {
        case VariableDataType.JSON:
            return isJsonString(value);
        case VariableDataType.NUMBER:
            return isNumber(value);
        case VariableDataType.BOOLEAN:
            return isBoolean(value);
        case VariableDataType.TEXT:
        default:
            return true; // Text is always valid
    }
};

/**
 * Get validation message for a value and type
 */
export const getValidationMessage = (value: string, type: VariableDataType): string | null => {
    if (!value || typeof value !== 'string') {
        return null;
    }

    if (!isValidForType(value, type)) {
        switch (type) {
            case VariableDataType.JSON:
                return 'Invalid JSON syntax';
            case VariableDataType.NUMBER:
                return 'Invalid number format';
            case VariableDataType.BOOLEAN:
                return 'Must be "true" or "false"';
            default:
                return 'Invalid value';
        }
    }

    return null;
};

/**
 * Check if a value looks like it might be JSON (starts with { or [)
 */
export const looksLikeJson = (value: string): boolean => {
    if (!value || typeof value !== 'string') return false;
    const trimmed = value.trim();
    return trimmed.startsWith('{') || trimmed.startsWith('[');
};
