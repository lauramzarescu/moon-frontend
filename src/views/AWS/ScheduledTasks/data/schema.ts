import { z } from 'zod'
import { serviceSchema } from '@/views/AWS/Services/data/schema.ts'

export const scheduledTaskSchema = z.object({
    name: z.string(),
    cron: z.string(),
    command: z.string(),
    state: z.enum(['ENABLED', 'DISABLED']),
    eventBusName: z.string(),
    arn: z.string(),
    service: serviceSchema,
    nextRun: z.string().optional(),
})

export type ScheduledTask = z.infer<typeof scheduledTaskSchema>
