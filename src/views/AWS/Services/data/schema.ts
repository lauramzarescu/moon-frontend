import { z } from 'zod';

export const serviceSchema = z.object({
    services: z.array(
        z.object({
            name: z.string(),
            clusterName: z.string(),
            desiredCount: z.number(),
            runningCount: z.number(),
            pendingCount: z.number(),
            status: z.enum(['ACTIVE', 'INACTIVE']),
            taskDefinition: z.object({
                family: z.string(),
                revision: z.number(),
                arn: z.string(),
                name: z.string(),
                registeredAt: z.string(),
                environmentVariables: z.object({
                    environment: z.array(
                        z.object({
                            name: z.string(),
                            value: z.string(),
                        }),
                    ),
                    environmentFiles: z.array(z.unknown()),
                    secrets: z.array(z.unknown()),
                }),
            }),
            container: z.object({
                image: z.string(),
                cpu: z.number(),
                memory: z.string(),
                name: z.string(),
            }),
            deployments: z.array(
                z.object({
                    status: z.string(),
                    desiredCount: z.number(),
                    pendingCount: z.number(),
                    runningCount: z.number(),
                    createdAt: z.string(),
                    updatedAt: z.string(),
                    failedTasks: z.number(),
                    rolloutState: z.string(),
                    rolloutStateReason: z.string(),
                }),
            ),
        }),
    ),
});

export type Service = z.infer<typeof serviceSchema>;
