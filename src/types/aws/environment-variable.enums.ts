/**
 * Environment Variables Enums
 * Centralized enums for environment variables management system
 */

/**
 * Variable comparison status for version comparisons
 */
export enum ComparisonStatus {
    ADDED = 'added',
    REMOVED = 'removed',
    MODIFIED = 'modified',
    UNCHANGED = 'unchanged',
}

/**
 * Bulk operation types
 */
export enum BulkOperationType {
    ADD = 'add',
    EDIT = 'edit',
    REPLACE = 'replace',
    REMOVE = 'remove',
    EXPORT = 'export',
    COPY = 'copy',
    MOVE = 'move',
}

/**
 * Export format types
 */
export enum ExportFormat {
    ENV = 'env',
    JSON = 'json',
    YAML = 'yaml',
    DOCKER_COMPOSE = 'docker',
}

/**
 * Variable type for distinguishing between environment variables and secrets
 */
export enum VariableType {
    ENVIRONMENT = 'environment',
    SECRET = 'secret',
}

/**
 * Bulk add method types for BulkAddDialog
 */
export enum BulkAddMethod {
    INDIVIDUAL = 'individual',
    BULK = 'bulk',
    FILE = 'file',
    COPY = 'copy',
}

/**
 * Task definition status
 */
export enum TaskDefinitionStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
}

/**
 * Helper functions for display labels
 * Use isSecret boolean to determine variable type from service interface
 */
export const getVariableTypeLabel = (isSecret: boolean): string => {
    return isSecret ? 'Secret' : 'Public';
};
