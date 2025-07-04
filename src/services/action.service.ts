import { ApiService } from '@/services/generic.service.ts';
import type {
    ActionDefinition,
    ActionExportInput,
    ActionsImportResponseInput,
    CreateActionDto,
    UpdateActionDto,
} from '@/views/Settings/components/Actions/schema.ts';

export class ActionService extends ApiService {
    public resource = '/actions';

    async getAll() {
        console.log(`Fetching all actions from ${this.resource}`);
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

    async refresh() {
        return this.get<{ message: string }>(`${this.resource}/refresh`);
    }

    async exportActions(): Promise<ActionExportInput[]> {
        return this.get(`${this.resource}/export`);
    }

    async importActions(file: File): Promise<ActionsImportResponseInput> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = () => {
                const base64String = (reader.result as string).split(',')[1]; // Remove data:application/json;base64, prefix

                this.post(`${this.resource}/import`, {
                    file: base64String,
                    filename: file.name,
                    mimetype: file.type,
                })
                    .then(resolve)
                    .catch(reject);
            };

            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }
}
