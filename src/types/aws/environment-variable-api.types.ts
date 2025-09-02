/**
 * Environment Variables API Types
 * Generated from environment-variables-schemas-and-types.json
 */

import { BulkOperationType, ComparisonStatus, TaskDefinitionStatus } from './environment-variable.enums';

// Base schemas
export interface EnvironmentVariable {
    name: string;
    value: string;
}

export interface Secret {
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
    secrets: Secret[];
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
    addedSecrets: Secret[];
    removedSecrets: Secret[];
    modifiedSecrets: VariableChange[];
    unchangedSecrets: Secret[];
}

export interface BulkOperation {
    containerName: string;
    operation: BulkOperationType;
    environmentVariables?: EnvironmentVariable[];
    secrets?: Secret[];
    variableNames?: string[];
    secretNames?: string[];
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
    environmentVariables?: EnvironmentVariable[];
    secrets?: Secret[];
}

export interface EditEnvironmentVariablesRequest {
    clusterName: string;
    serviceName: string;
    containerName: string;
    environmentVariables?: EnvironmentVariable[];
    secrets?: Secret[];
}

export interface RemoveEnvironmentVariablesRequest {
    clusterName: string;
    serviceName: string;
    containerName: string;
    variableNames?: string[];
    secretNames?: string[];
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
    variableNames?: string[];
}

export interface MoveVariablesBetweenServicesRequest {
    sourceClusterName: string;
    sourceServiceName: string;
    sourceContainerName: string;
    targetClusterName: string;
    targetServiceName: string;
    targetContainerName: string;
    variableNames: string[];
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
    addedSecrets: number;
    newTaskDefinitionArn: string;
}

export interface EditEnvironmentVariablesResponse {
    message: string;
    clusterName: string;
    serviceName: string;
    containerName: string;
    updatedVariables: number;
    updatedSecrets: number;
    newTaskDefinitionArn: string;
}

export interface RemoveEnvironmentVariablesResponse {
    message: string;
    clusterName: string;
    serviceName: string;
    containerName: string;
    removedVariables: number;
    removedSecrets: number;
    variableNames: string[];
    secretNames: string[];
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
    totalSecrets: number;
    environmentVariables: EnvironmentVariable[];
    secrets: Secret[];
}

export interface CopyVariablesBetweenServicesResponse {
    message: string;
    source: ServiceInfo;
    target: ServiceInfoWithoutRevision;
    newTaskDefinitionArn: string;
}

export interface MoveVariablesBetweenServicesResponse {
    message: string;
    source: ServiceInfo;
    target: ServiceInfoWithoutRevision;
    movedVariables: number;
    variableNames: string[];
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
