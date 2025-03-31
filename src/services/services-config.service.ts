import { ApiService } from '@/services/generic.service.ts';
import type { ServicesConfigInput } from '@/views/Settings/components/Workspace/schema.ts';

export class ServicesConfigService extends ApiService {
    public resource = '/services';

    async create(config: ServicesConfigInput) {
        return this.post<ServicesConfigInput, any>(this.resource, config);
    }

    async update(id: string, config: ServicesConfigInput) {
        return this.put<ServicesConfigInput, any>(`${this.resource}/${id}`, config);
    }
}
