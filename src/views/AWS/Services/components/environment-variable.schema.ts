import { z } from 'zod';

export const environmentVariableSchema = z.object({
    name: z.string().min(1, 'Environment variable name is required'),
    value: z.string(),
});

export const getEnvironmentVariablesSchema = z.object({
    clusterName: z.string().min(1, 'Cluster name is required'),
    serviceName: z.string().min(1, 'Service name is required'),
    containerName: z.string().min(1, 'Container name is required'),
});

export const addEnvironmentVariablesSchema = z.object({
    clusterName: z.string().min(1, 'Cluster name is required'),
    serviceName: z.string().min(1, 'Service name is required'),
    containerName: z.string().min(1, 'Container name is required'),
    environmentVariables: z.array(environmentVariableSchema).min(1, 'At least one environment variable is required'),
});

export const editEnvironmentVariablesSchema = z.object({
    clusterName: z.string().min(1, 'Cluster name is required'),
    serviceName: z.string().min(1, 'Service name is required'),
    containerName: z.string().min(1, 'Container name is required'),
    environmentVariables: z.array(environmentVariableSchema).min(1, 'At least one environment variable is required'),
});

export const removeEnvironmentVariablesSchema = z.object({
    clusterName: z.string().min(1, 'Cluster name is required'),
    serviceName: z.string().min(1, 'Service name is required'),
    containerName: z.string().min(1, 'Container name is required'),
    variableNames: z.array(z.string().min(1, 'Variable name cannot be empty')).min(1, 'At least one variable name is required'),
});

export const replaceEnvironmentVariablesSchema = z.object({
    clusterName: z.string().min(1, 'Cluster name is required'),
    serviceName: z.string().min(1, 'Service name is required'),
    containerName: z.string().min(1, 'Container name is required'),
    environmentVariables: z.array(environmentVariableSchema),
});

export const bulkUpdateEnvironmentVariablesSchema = z.object({
    clusterName: z.string().min(1, 'Cluster name is required'),
    serviceName: z.string().min(1, 'Service name is required'),
    operations: z
        .array(
            z.object({
                containerName: z.string().min(1, 'Container name is required'),
                operation: z.enum(['add', 'edit', 'replace', 'remove']),
                environmentVariables: z.array(environmentVariableSchema).optional(),
                variableNames: z.array(z.string().min(1, 'Variable name cannot be empty')).optional(),
            }),
        )
        .min(1, 'At least one operation is required'),
});

export const getEnvironmentVariableVersionsSchema = z.object({
    clusterName: z.string().min(1, 'Cluster name is required'),
    serviceName: z.string().min(1, 'Service name is required'),
    containerName: z.string().min(1, 'Container name is required'),
});

export const getEnvironmentVariableVersionSchema = z.object({
    clusterName: z.string().min(1, 'Cluster name is required'),
    serviceName: z.string().min(1, 'Service name is required'),
    containerName: z.string().min(1, 'Container name is required'),
    revision: z.number().int().positive('Revision must be a positive integer'),
});

export const copyEnvironmentVariablesSchema = z.object({
    sourceClusterName: z.string().min(1, 'Source cluster name is required'),
    sourceServiceName: z.string().min(1, 'Source service name is required'),
    sourceContainerName: z.string().min(1, 'Source container name is required'),
    targetClusterName: z.string().min(1, 'Target cluster name is required'),
    targetServiceName: z.string().min(1, 'Target service name is required'),
    targetContainerName: z.string().min(1, 'Target container name is required'),
    sourceRevision: z.number().int().positive().optional(),
});

export const rollbackEnvironmentVariablesSchema = z.object({
    clusterName: z.string().min(1, 'Cluster name is required'),
    serviceName: z.string().min(1, 'Service name is required'),
    containerName: z.string().min(1, 'Container name is required'),
    targetRevision: z.number().int().positive('Target revision must be a positive integer'),
});

export const compareEnvironmentVariablesSchema = z.object({
    clusterName: z.string().min(1, 'Cluster name is required'),
    serviceName: z.string().min(1, 'Service name is required'),
    containerName: z.string().min(1, 'Container name is required'),
    revision1: z.number().int().positive('Revision 1 must be a positive integer'),
    revision2: z.number().int().positive('Revision 2 must be a positive integer'),
});

export type EnvironmentVariable = z.infer<typeof environmentVariableSchema>;
export type GetEnvironmentVariablesInput = z.infer<typeof getEnvironmentVariablesSchema>;
export type AddEnvironmentVariablesInput = z.infer<typeof addEnvironmentVariablesSchema>;
export type EditEnvironmentVariablesInput = z.infer<typeof editEnvironmentVariablesSchema>;
export type RemoveEnvironmentVariablesInput = z.infer<typeof removeEnvironmentVariablesSchema>;
export type ReplaceEnvironmentVariablesInput = z.infer<typeof replaceEnvironmentVariablesSchema>;
export type BulkUpdateEnvironmentVariablesInput = z.infer<typeof bulkUpdateEnvironmentVariablesSchema>;

export type GetEnvironmentVariableVersionsInput = z.infer<typeof getEnvironmentVariableVersionsSchema>;
export type GetEnvironmentVariableVersionInput = z.infer<typeof getEnvironmentVariableVersionSchema>;
export type CopyEnvironmentVariablesInput = z.infer<typeof copyEnvironmentVariablesSchema>;
export type RollbackEnvironmentVariablesInput = z.infer<typeof rollbackEnvironmentVariablesSchema>;
export type CompareEnvironmentVariablesInput = z.infer<typeof compareEnvironmentVariablesSchema>;
