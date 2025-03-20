import { ApiService } from '@/services/generic.service.ts'
import type { SamlConfigInput } from '@/views/Settings/components/SAML/schema.ts'

export class SamlConfigService extends ApiService {
    public resource = '/saml-config'

    async create(config: SamlConfigInput) {
        return this.post<SamlConfigInput, any>(this.resource, config)
    }

    async update(id: string, config: SamlConfigInput) {
        return this.put<SamlConfigInput, any>(`${this.resource}/${id}`, config)
    }
}
