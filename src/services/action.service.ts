import { ApiService } from '@/services/generic.service.ts';
import type { ActionDefinition, CreateActionDto, UpdateActionDto } from '@/views/Settings/components/Actions/schema.ts';

export class ActionService extends ApiService {
    public resource = '/actions';

    async getAll() {
        return this.get<ActionDefinition[]>(this.resource);
    }

    async getById(id: string) {
        return this.get<ActionDefinition>(`${this.resource}/${id}`);
    }

    async create(data: CreateActionDto) {
        return this.post<CreateActionDto, ActionDefinition>(this.resource, data);
    }

    async updateOne(id: string, data: UpdateActionDto) {
        return this.put<UpdateActionDto, ActionDefinition>(`${this.resource}/${id}`, data);
    }

    async updateStatus(id: string, enabled: boolean) {
        return this.put<{ enabled: boolean }, ActionDefinition>(`${this.resource}/${id}`, { enabled });
    }

    async deleteOne(id: string) {
        return this.delete(`${this.resource}/${id}`);
    }
}
