import { z } from 'zod'

export enum ServiceType {
    aws = 'aws',
    digital_ocean = 'digital_ocean',
    gcp = 'gcp',
}

export const servicesConfigSchema = z.object({
    name: z.string().min(1),
    type: z.nativeEnum(ServiceType),
    config: z.any(),
    organizationId: z.string().optional(),
    canEdit: z.boolean().optional(),
})

export type ServicesConfigInput = z.infer<typeof servicesConfigSchema>
