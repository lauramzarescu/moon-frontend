import { ApiService } from '@/services/generic.service.ts';

export interface GithubRepository {
    id: number;
    name: string;
    full_name: string;
    private: boolean;
    owner: string;
    default_branch: string;
    html_url: string;
}

export interface ServiceRepositoryRecord {
    id: string;
    serviceArn: string;
    owner: string;
    repo: string;
    createdAt: string;
    updatedAt: string;
    organizationId: string;
}

export interface LatestCommitResponse {
    sha: string;
    message: string;
    authorName: string | null;
    authorEmail: string | null;
    date: string | null;
    url: string;
}

export class GithubService extends ApiService {
    async listRepositories(org?: string) {
        return this.get<GithubRepository[]>('/github/repositories', org ? { org } : undefined, { credentials: 'include' });
    }

    async linkServiceRepository(data: { repo: string; serviceArn: string }) {
        return this.post<typeof data, ServiceRepositoryRecord>('/github/services/repository', data, {
            credentials: 'include',
        });
    }

    async listServiceRepositories() {
        return this.get<ServiceRepositoryRecord[]>('/github/services/repositories', undefined, { credentials: 'include' });
    }

    async getServiceRepository(id: string) {
        return this.get<ServiceRepositoryRecord>(`/github/services/${id}/repository`, undefined, { credentials: 'include' });
    }

    async deleteServiceRepository(id: string) {
        return this.delete<ServiceRepositoryRecord>(`/github/services/${id}/repository`, { credentials: 'include' });
    }

    async getLatestCommitForService(id: string) {
        return this.get<LatestCommitResponse>(`/github/deployments/services/${encodeURIComponent(id)}/latest-commit`, undefined, {
            credentials: 'include',
        });
    }

    async getLatestCommitForServiceBranch(id: string, branch: string) {
        return this.get<LatestCommitResponse>(
            `/github/deployments/services/${encodeURIComponent(id)}/latest-commit/${encodeURIComponent(branch)}`,
            undefined,
            { credentials: 'include' },
        );
    }
}
