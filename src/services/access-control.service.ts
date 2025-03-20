import { ApiService } from '@/services/generic.service.ts'
import type { AccessControlCreateInput, AccessControlInput } from '@/views/Settings/components/Team/schema.ts'

export class AccessControlService extends ApiService {
    public resource = '/access-control'

    async addToList(data: AccessControlCreateInput) {
        return this.post(this.resource, data)
    }

    async removeFromList(id: string) {
        return this.delete(`${this.resource}/${id}`)
    }

    async getList() {
        return this.get<AccessControlInput[]>(this.resource)
    }

    async disableAccessControl() {
        return this.post(`${this.resource}/disable`, {})
    }
}
