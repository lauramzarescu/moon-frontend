import { ApiService } from '@/services/generic.service.ts';
import type { AuditLogsResponse, PaginationParams } from '@/views/Settings/components/AuditLogs/schema.ts';
import { AuditLogEnum } from '@/views/Settings/components/AuditLogs/schema.ts';

export class AuditLogService extends ApiService {
    public resource = '/audit-logs';

    async getAll(
        params?: PaginationParams & {
            userId?: string;
            organizationId?: string;
            action?: AuditLogEnum | string;
        },
    ) {
        const queryParams = new URLSearchParams();

        if (params?.page) {
            queryParams.append('page', params.page.toString());
        }

        if (params?.limit) {
            queryParams.append('limit', params.limit.toString());
        }

        if (params?.orderBy) {
            queryParams.append('orderBy', params.orderBy);
        }

        if (params?.order) {
            queryParams.append('order', params.order);
        }

        // Handle filters
        if (params?.filters) {
            Object.entries(params.filters).forEach(([key, value]) => {
                if (value) {
                    queryParams.append(`filter_${key}`, value);
                }
            });
        }

        // Handle specific audit log filters
        if (params?.userId) {
            queryParams.append('filter_userId', params.userId);
        }

        if (params?.organizationId) {
            queryParams.append('filter_organizationId', params.organizationId);
        }

        if (params?.action) {
            queryParams.append('filter_action', params.action);
        }

        const queryString = queryParams.toString();
        const url = queryString ? `${this.resource}?${queryString}` : this.resource;

        return this.get<AuditLogsResponse>(url);
    }

    async getById(id: string) {
        return this.get(`${this.resource}/${id}`);
    }
}
