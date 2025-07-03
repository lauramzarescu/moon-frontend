import { ApiService } from '@/services/generic.service.ts';
import type { OrganizationDetailsResponse, UpdateOrganizationInput } from '@/views/Settings/components/Organization/schema.ts';

export class OrganizationService extends ApiService {
    public resource = '/organizations';

    async getDetails(): Promise<OrganizationDetailsResponse> {
        return this.get<OrganizationDetailsResponse>(`${this.resource}`);
    }

    async updateSettings(id: string, data: UpdateOrganizationInput): Promise<OrganizationDetailsResponse> {
        return this.put(`${this.resource}/${id}`, data);
    }
}
