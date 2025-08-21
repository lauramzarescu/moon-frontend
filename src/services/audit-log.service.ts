import { ApiService } from '@/services/generic.service.ts';
import type { AuditLogsResponse, PaginationParams } from '@/views/Settings/components/AuditLogs/schema.ts';
import { AuditLogEnum } from '@/views/Settings/components/AuditLogs/schema.ts';

export interface DeploymentsCountResponse {
    count: number;
}

export interface DeploymentsTimelineResponse {
    data: number[];
    labels?: string[];
}

export class AuditLogService extends ApiService {
    public resource = '/audit-logs';

    async getAll(
        params?: PaginationParams & {
            userId?: string;
            organizationId?: string;
            action?: AuditLogEnum | string;
            filters?: Record<string, any>;
        },
    ) {
        return this.get<AuditLogsResponse>(this.resource, params);
    }

    async getById(id: string) {
        return this.get(`${this.resource}/${id}`);
    }

    async getDeploymentsCount(params?: { filter_startDate?: string; filter_endDate?: string; tz?: string }) {
        return this.get<DeploymentsCountResponse>(`${this.resource}/widgets/deployments-count`, params);
    }

    async getDeploymentsTimeline(params?: { filter_startDate?: string; filter_endDate?: string; tz?: string }) {
        return this.get<DeploymentsTimelineResponse>(`${this.resource}/widgets/deployments-timeline`, params);
    }
}
