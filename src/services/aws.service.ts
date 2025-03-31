import { ApiService } from '@/services/generic.service.ts'
import type { ServiceRestartInput, ServiceUpdateCountInput, ServiceUpdateImageInput } from '@/views/AWS/Services/components/schema.ts'
import { serviceRestartSchema, serviceUpdateCountSchema, serviceUpdateImageSchema } from '@/views/AWS/Services/components/schema.ts'

export class AwsService extends ApiService {
    public resource = '/aws'

    async updateServiceDesiredCount(data: ServiceUpdateCountInput) {
        try {
            serviceUpdateCountSchema.parse(data)

            return await this.put<ServiceUpdateCountInput, any>(`${this.resource}/services/desired-count`, data, { credentials: 'include' })
        } catch (error) {
            console.error('Failed to update service desired count:', error)
            throw error
        }
    }

    async restartService(data: ServiceRestartInput) {
        try {
            serviceRestartSchema.parse(data)

            return await this.post<ServiceRestartInput, any>(`${this.resource}/services/restart`, data, { credentials: 'include' })
        } catch (error) {
            console.error('Failed to restart service:', error)
            throw error
        }
    }

    async updateServiceImage(data: ServiceUpdateImageInput) {
        try {
            serviceUpdateImageSchema.parse(data)

            return await this.put<ServiceUpdateImageInput, any>(`${this.resource}/services/container-image`, data, {
                credentials: 'include',
            })
        } catch (error) {
            console.error('Failed to update service image:', error)
            throw error
        }
    }
}
