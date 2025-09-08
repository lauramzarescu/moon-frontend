import { ApiService } from '@/services/generic.service.ts';
import {
    type GithubPullRequestList,
    githubPullRequestListSchema,
    type GithubRepositoryList,
    githubRepositoryListSchema,
    type LatestCommitResponse,
    latestCommitResponseSchema,
    type LinkServiceRepositoryRequest,
    type ServiceRepositoryRecord,
    type ServiceRepositoryRecordList,
    serviceRepositoryRecordListSchema,
    serviceRepositoryRecordSchema,
} from '@/services/github/schema.ts';

export class GithubService extends ApiService {
    async listRepositories(org?: string): Promise<GithubRepositoryList> {
        const response = await this.get('/github/repositories', org ? { org } : undefined, { credentials: 'include' });
        return githubRepositoryListSchema.parse(response);
    }

    async linkServiceRepository(data: LinkServiceRepositoryRequest): Promise<ServiceRepositoryRecord> {
        const response = await this.post('/github/services/repository', data, {
            credentials: 'include',
        });
        return serviceRepositoryRecordSchema.parse(response);
    }

    async listServiceRepositories(): Promise<ServiceRepositoryRecordList> {
        const response = await this.get('/github/services/repositories', undefined, { credentials: 'include' });
        return serviceRepositoryRecordListSchema.parse(response);
    }

    async getServiceRepository(id: string): Promise<ServiceRepositoryRecord> {
        const response = await this.get(`/github/services/${id}/repository`, undefined, { credentials: 'include' });
        return serviceRepositoryRecordSchema.parse(response);
    }

    async deleteServiceRepository(id: string): Promise<ServiceRepositoryRecord> {
        const response = await this.delete(`/github/services/${id}/repository`, { credentials: 'include' });
        return serviceRepositoryRecordSchema.parse(response);
    }

    async getLatestCommitForService(id: string): Promise<LatestCommitResponse> {
        const response = await this.get(`/github/deployments/services/${encodeURIComponent(id)}/latest-commit`, undefined, {
            credentials: 'include',
        });
        return latestCommitResponseSchema.parse(response);
    }

    async getLatestCommitForServiceBranch(id: string, branch: string): Promise<LatestCommitResponse> {
        const response = await this.get(
            `/github/deployments/services/${encodeURIComponent(id)}/latest-commit/${encodeURIComponent(branch)}`,
            undefined,
            { credentials: 'include' },
        );
        return latestCommitResponseSchema.parse(response);
    }

    async getPullRequests(repo: string): Promise<GithubPullRequestList> {
        const response = await this.get(`/github/pull-requests/${encodeURIComponent(repo)}`, undefined, {
            credentials: 'include',
        });
        return githubPullRequestListSchema.parse(response);
    }
}
