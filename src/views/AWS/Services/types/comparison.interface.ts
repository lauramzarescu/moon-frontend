export enum VariableStatus {
    COMMON = 'common',
    UNIQUE = 'unique',
    CONFLICT = 'conflict',
    TOTAL = 'total',
}

export enum IconType {
    GLOBE = 'globe',
    KEY = 'key',
}

export enum ColorType {
    GREEN = 'green',
    PURPLE = 'purple',
}

/**
 * ServiceVariable interface that uses service interface structure
 * - isSecret: boolean to distinguish between environment variables and secrets
 * - Based on ContainerInterface.environmentVariables.environment vs .secrets
 */
export interface ServiceVariable {
    name: string;
    value?: string;
    valueFrom?: string;
    isSecret: boolean;
    serviceName: string;
}

export interface ServiceData {
    clusterName: string;
    serviceName: string;
    containers: any[];
}

/**
 * ComparisonData interface that separates variables by type
 * - envVars: Environment variables (isSecret: false)
 * - secrets: Secret variables (isSecret: true)
 * - Uses isSecret property instead of VariableType enum
 */
export interface ComparisonData {
    envVars: ServiceVariable[];
    secrets: ServiceVariable[];
    status: Map<string, VariableStatus>;
}

export interface ComparisonStats {
    totalServices: number;
    commonVariables: number;
    uniqueVariables: number;
    conflictingVariables: number;
    totalVariables: number;
}
