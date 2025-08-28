/**
 * Environment Variables API Types
 * Generated from environment-variables-schemas-and-types.json
 */

// Base schemas
export interface EnvironmentVariable {
    name: string;
    value: string;
}

export interface EnvironmentVariableVersion {
    revision: number;
    arn: string;
    registeredAt: string;
    status: string;
    family: string;
    environmentVariables: EnvironmentVariable[];
}

export interface ServiceInfo {
    clusterName: string;
    serviceName: string;
    containerName: string;
    revision: number;
}

export interface ServiceInfoWithoutRevision {
    clusterName: string;
    serviceName: string;
    containerName: string;
}

export interface VariableChange {
    name: string;
    oldValue: string;
    newValue: string;
}

export interface VersionComparison {
    revision1: number;
    revision2: number;
    added: EnvironmentVariable[];
    removed: EnvironmentVariable[];
    modified: VariableChange[];
    unchanged: EnvironmentVariable[];
}

export interface BulkOperation {
    containerName: string;
    operation: 'add' | 'edit' | 'replace' | 'remove';
    environmentVariables?: EnvironmentVariable[];
    variableNames?: string[];
}

export interface ErrorResponse {
    error: string;
    details: string;
}

// Request types
export interface AddEnvironmentVariablesRequest {
    clusterName: string;
    serviceName: string;
    containerName: string;
    environmentVariables: EnvironmentVariable[];
}

export interface EditEnvironmentVariablesRequest {
    clusterName: string;
    serviceName: string;
    containerName: string;
    environmentVariables: EnvironmentVariable[];
}

export interface RemoveEnvironmentVariablesRequest {
    clusterName: string;
    serviceName: string;
    containerName: string;
    variableNames: string[];
}

export interface GetVersionsListRequest {
    clusterName: string;
    serviceName: string;
    containerName: string;
}

export interface GetVariablesFromVersionRequest {
    clusterName: string;
    serviceName: string;
    containerName: string;
    revision: number;
}

export interface CopyVariablesBetweenServicesRequest {
    sourceClusterName: string;
    sourceServiceName: string;
    sourceContainerName: string;
    targetClusterName: string;
    targetServiceName: string;
    targetContainerName: string;
    sourceRevision?: number;
}

export interface RollbackToVersionRequest {
    clusterName: string;
    serviceName: string;
    containerName: string;
    targetRevision: number;
}

export interface CompareVersionsRequest {
    clusterName: string;
    serviceName: string;
    containerName: string;
    revision1: number;
    revision2: number;
}

export interface BulkUpdateWithVersioningRequest {
    clusterName: string;
    serviceName: string;
    operations: BulkOperation[];
}

// Response types
export interface AddEnvironmentVariablesResponse {
    message: string;
    clusterName: string;
    serviceName: string;
    containerName: string;
    addedVariables: number;
    newTaskDefinitionArn: string;
}

export interface EditEnvironmentVariablesResponse {
    message: string;
    clusterName: string;
    serviceName: string;
    containerName: string;
    updatedVariables: number;
    newTaskDefinitionArn: string;
}

export interface RemoveEnvironmentVariablesResponse {
    message: string;
    clusterName: string;
    serviceName: string;
    containerName: string;
    removedVariables: number;
    variableNames: string[];
    newTaskDefinitionArn: string;
}

export interface GetVersionsListResponse {
    message: string;
    clusterName: string;
    serviceName: string;
    containerName: string;
    totalVersions: number;
    versions: EnvironmentVariableVersion[];
}

export interface GetVariablesFromVersionResponse {
    message: string;
    clusterName: string;
    serviceName: string;
    containerName: string;
    revision: number;
    totalVariables: number;
    environmentVariables: EnvironmentVariable[];
}

export interface CopyVariablesBetweenServicesResponse {
    message: string;
    source: ServiceInfo;
    target: ServiceInfoWithoutRevision;
    newTaskDefinitionArn: string;
}

export interface RollbackToVersionResponse {
    message: string;
    clusterName: string;
    serviceName: string;
    containerName: string;
    targetRevision: number;
    newTaskDefinitionArn: string;
}

export interface CompareVersionsResponse {
    message: string;
    clusterName: string;
    serviceName: string;
    containerName: string;
    comparison: VersionComparison;
}

export interface BulkUpdateWithVersioningResponse {
    message: string;
    clusterName: string;
    serviceName: string;
    containersUpdated: number;
    totalVariables: number;
    newTaskDefinitionArn: string;
}
