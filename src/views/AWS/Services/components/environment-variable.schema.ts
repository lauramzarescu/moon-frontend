import { z } from 'zod';
import { BulkOperationType } from '@/types/aws';

export const environmentVariableSchema = z.object({
    name: z.string().min(1, 'Environment variable name is required'),
    value: z.string(),
});

export const secretSchema = z.object({
    name: z.string().min(1, 'Secret name is required'),
    valueFrom: z.string(),
});

export const getEnvironmentVariablesSchema = z.object({
    clusterName: z.string().min(1, 'Cluster name is required'),
    serviceName: z.string().min(1, 'Service name is required'),
    containerName: z.string().min(1, 'Container name is required'),
});

export const addEnvironmentVariablesSchema = z
    .object({
        clusterName: z.string().min(1, 'Cluster name is required'),
        serviceName: z.string().min(1, 'Service name is required'),
        containerName: z.string().min(1, 'Container name is required'),
        environmentVariables: z.array(environmentVariableSchema).optional(),
        secrets: z.array(secretSchema).optional(),
    })
    .refine((data) => (data.environmentVariables && data.environmentVariables.length > 0) || (data.secrets && data.secrets.length > 0), {
        message: 'At least one environment variable or secret is required',
        path: ['environmentVariables'],
    });

export const editEnvironmentVariablesSchema = z
    .object({
        clusterName: z.string().min(1, 'Cluster name is required'),
        serviceName: z.string().min(1, 'Service name is required'),
        containerName: z.string().min(1, 'Container name is required'),
        environmentVariables: z.array(environmentVariableSchema).optional(),
        secrets: z.array(secretSchema).optional(),
    })
    .refine((data) => (data.environmentVariables && data.environmentVariables.length > 0) || (data.secrets && data.secrets.length > 0), {
        message: 'At least one environment variable or secret is required',
        path: ['environmentVariables'],
    });

export const removeEnvironmentVariablesSchema = z
    .object({
        clusterName: z.string().min(1, 'Cluster name is required'),
        serviceName: z.string().min(1, 'Service name is required'),
        containerName: z.string().min(1, 'Container name is required'),
        variableNames: z.array(z.string().min(1, 'Variable name cannot be empty')).optional(),
        secretNames: z.array(z.string().min(1, 'Secret name cannot be empty')).optional(),
    })
    .refine((data) => (data.variableNames && data.variableNames.length > 0) || (data.secretNames && data.secretNames.length > 0), {
        message: 'At least one variable name or secret name is required',
        path: ['variableNames'],
    });

export const replaceEnvironmentVariablesSchema = z.object({
    clusterName: z.string().min(1, 'Cluster name is required'),
    serviceName: z.string().min(1, 'Service name is required'),
    containerName: z.string().min(1, 'Container name is required'),
    environmentVariables: z.array(environmentVariableSchema).optional(),
    secrets: z.array(secretSchema).optional(),
});

export const bulkUpdateEnvironmentVariablesSchema = z.object({
    clusterName: z.string().min(1, 'Cluster name is required'),
    serviceName: z.string().min(1, 'Service name is required'),
    operations: z
        .array(
            z.object({
                containerName: z.string().min(1, 'Container name is required'),
                operation: z.nativeEnum(BulkOperationType),
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
    variableNames: z.array(z.string().min(1, 'Variable name cannot be empty')).optional(),
});

export const moveEnvironmentVariablesSchema = z.object({
    sourceClusterName: z.string().min(1, 'Source cluster name is required'),
    sourceServiceName: z.string().min(1, 'Source service name is required'),
    sourceContainerName: z.string().min(1, 'Source container name is required'),
    targetClusterName: z.string().min(1, 'Target cluster name is required'),
    targetServiceName: z.string().min(1, 'Target service name is required'),
    targetContainerName: z.string().min(1, 'Target container name is required'),
    variableNames: z
        .array(z.string().min(1, 'Variable name cannot be empty'))
        .min(1, 'At least one variable name is required for move operation'),
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
export type MoveEnvironmentVariablesInput = z.infer<typeof moveEnvironmentVariablesSchema>;
export type RollbackEnvironmentVariablesInput = z.infer<typeof rollbackEnvironmentVariablesSchema>;
export type CompareEnvironmentVariablesInput = z.infer<typeof compareEnvironmentVariablesSchema>;
