import { z } from 'zod';

export const serviceUpdateImageSchema = z.object({
    clusterName: z.string().min(1, 'Cluster name is required'),
    serviceName: z.string().min(1, 'Service name is required'),
    containerName: z.string().min(1, 'Container name is required'),
    newImageUri: z.string().min(1, 'Image URI is required'),
});

export type ServiceUpdateImageInput = z.infer<typeof serviceUpdateImageSchema>;
