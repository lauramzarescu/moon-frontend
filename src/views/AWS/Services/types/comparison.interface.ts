export enum VariableType {
    ENVIRONMENT = 'environment',
    SECRET = 'secret',
}

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

export interface ServiceVariable {
    name: string;
    value: string;
    type: VariableType;
    serviceName: string;
}

export interface ServiceData {
    clusterName: string;
    serviceName: string;
    containers: any[];
}

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
