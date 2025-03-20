import { z } from 'zod'
import { serviceSchema } from '@/views/AWS/Services/data/schema.ts'

export const clusterSchema = z.object({
    name: z.string(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'FAILED', 'PROVISIONING', 'DEPROVISIONING']),
    runningTasks: z.number(),
    pendingTasks: z.number(),
    registeredContainerInstances: z.number(),
    servicesCount: z.number(),
    services: serviceSchema,
})

export type Cluster = z.infer<typeof clusterSchema>
