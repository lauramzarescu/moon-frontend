import { ApiService } from '@/services/generic.service.ts';
import type { ServiceRestartInput, ServiceUpdateCountInput, ServiceUpdateImageInput } from '@/views/AWS/Services/components/schema.ts';
import { serviceRestartSchema, serviceUpdateCountSchema, serviceUpdateImageSchema } from '@/views/AWS/Services/components/schema.ts';
import type { ClusterResponseInterface } from '@/types/response/cluster.interface.ts';
import {
    type AddEnvironmentVariablesInput,
    addEnvironmentVariablesSchema,
    type CompareEnvironmentVariablesInput,
    compareEnvironmentVariablesSchema,
    type CopyEnvironmentVariablesInput,
    copyEnvironmentVariablesSchema,
    type EditEnvironmentVariablesInput,
    editEnvironmentVariablesSchema,
    type GetEnvironmentVariablesInput,
    getEnvironmentVariablesSchema,
    type GetEnvironmentVariableVersionInput,
    getEnvironmentVariableVersionSchema,
    type GetEnvironmentVariableVersionsInput,
    getEnvironmentVariableVersionsSchema,
    type MoveEnvironmentVariablesInput,
    moveEnvironmentVariablesSchema,
    type RemoveEnvironmentVariablesInput,
    removeEnvironmentVariablesSchema,
    type RollbackEnvironmentVariablesInput,
    rollbackEnvironmentVariablesSchema,
} from '@/views/AWS/Services/components/environment-variable.schema.ts';

// Import API response types
import type {
    AddEnvironmentVariablesResponse,
    CompareVersionsResponse,
    CopyVariablesBetweenServicesResponse,
    EditEnvironmentVariablesResponse,
    GetVariablesFromVersionResponse,
    GetVersionsListResponse,
    MoveVariablesBetweenServicesResponse,
    RemoveEnvironmentVariablesResponse,
    RollbackToVersionResponse,
} from '@/types/aws/environment-variable-api.types';

export interface EnvironmentVariable {
    name: string;
    value: string;
}

export interface Secret {
    name: string;
    value: string;
}

export interface UpdateEnvironmentVariablesInput {
    clusterName: string;
    serviceName: string;
    containerName: string;
    environmentVariables: EnvironmentVariable[];
    secrets: Secret[];
}

export class AwsService extends ApiService {
    public resource = '/aws';

    async getClusters(): Promise<ClusterResponseInterface> {
        try {
            return await this.get<ClusterResponseInterface>(`${this.resource}/clusters`, { credentials: 'include' });
        } catch (error) {
            console.error('Failed to get clusters:', error);
            throw error;
        }
    }

    async updateServiceDesiredCount(data: ServiceUpdateCountInput) {
        try {
            serviceUpdateCountSchema.parse(data);

            return await this.put<ServiceUpdateCountInput, any>(`${this.resource}/services/desired-count`, data, {
                credentials: 'include',
            });
        } catch (error) {
            console.error('Failed to update service desired count:', error);
            throw error;
        }
    }

    async restartService(data: ServiceRestartInput) {
        try {
            serviceRestartSchema.parse(data);

            return await this.post<ServiceRestartInput, any>(`${this.resource}/services/restart`, data, { credentials: 'include' });
        } catch (error) {
            console.error('Failed to restart service:', error);
            throw error;
        }
    }

    async updateServiceImage(data: ServiceUpdateImageInput) {
        try {
            serviceUpdateImageSchema.parse(data);

            return await this.put<ServiceUpdateImageInput, any>(`${this.resource}/services/container-image`, data, {
                credentials: 'include',
            });
        } catch (error) {
            console.error('Failed to update service image:', error);
            throw error;
        }
    }

    async getEnvironmentVariables(data: GetEnvironmentVariablesInput) {
        try {
            getEnvironmentVariablesSchema.parse(data);

            const params = new URLSearchParams({
                clusterName: data.clusterName,
                serviceName: data.serviceName,
                containerName: data.containerName,
            });

            return await this.get<any>(`${this.resource}/services/environment-variables?${params}`, {
                credentials: 'include',
            });
        } catch (error) {
            console.error('Failed to get environment variables:', error);
            throw error;
        }
    }

    async addEnvironmentVariables(data: AddEnvironmentVariablesInput): Promise<AddEnvironmentVariablesResponse> {
        try {
            addEnvironmentVariablesSchema.parse(data);

            return await this.post<AddEnvironmentVariablesInput, AddEnvironmentVariablesResponse>(
                `${this.resource}/services/environment-variables`,
                data,
                {
                    credentials: 'include',
                },
            );
        } catch (error) {
            console.error('Failed to add environment variables:', error);
            throw error;
        }
    }

    async editEnvironmentVariables(data: EditEnvironmentVariablesInput): Promise<EditEnvironmentVariablesResponse> {
        try {
            editEnvironmentVariablesSchema.parse(data);

            return await this.put<EditEnvironmentVariablesInput, EditEnvironmentVariablesResponse>(
                `${this.resource}/services/environment-variables`,
                data,
                {
                    credentials: 'include',
                },
            );
        } catch (error) {
            console.error('Failed to edit environment variables:', error);
            throw error;
        }
    }

    async removeEnvironmentVariables(data: RemoveEnvironmentVariablesInput): Promise<RemoveEnvironmentVariablesResponse> {
        try {
            removeEnvironmentVariablesSchema.parse(data);

            return await this.delete<RemoveEnvironmentVariablesResponse>(`${this.resource}/services/environment-variables`, {
                credentials: 'include',
                body: JSON.stringify(data),
                headers: {
                    'Content-Type': 'application/json',
                },
            });
        } catch (error) {
            console.error('Failed to remove environment variables:', error);
            throw error;
        }
    }

    async getEnvironmentVariableVersions(data: GetEnvironmentVariableVersionsInput): Promise<GetVersionsListResponse> {
        try {
            getEnvironmentVariableVersionsSchema.parse(data);

            const params = new URLSearchParams({
                clusterName: data.clusterName,
                serviceName: data.serviceName,
                containerName: data.containerName,
                limit: data.limit.toString(),
                page: data.page.toString(),
            });

            return await this.get<GetVersionsListResponse>(
                `${this.resource}/services/environment-variables/versions?${params}`,
                {},
                {
                    credentials: 'include',
                },
            );
        } catch (error) {
            console.error('Failed to get environment variable versions:', error);
            throw error;
        }
    }

    async getEnvironmentVariableVersion(data: GetEnvironmentVariableVersionInput): Promise<GetVariablesFromVersionResponse> {
        try {
            getEnvironmentVariableVersionSchema.parse(data);

            const params = new URLSearchParams({
                clusterName: data.clusterName,
                serviceName: data.serviceName,
                containerName: data.containerName,
                revision: data.revision.toString(),
            });

            return await this.get<GetVariablesFromVersionResponse>(
                `${this.resource}/services/environment-variables/version?${params}`,
                {},
                {
                    credentials: 'include',
                },
            );
        } catch (error) {
            console.error('Failed to get environment variable version:', error);
            throw error;
        }
    }

    async copyEnvironmentVariables(data: CopyEnvironmentVariablesInput): Promise<CopyVariablesBetweenServicesResponse> {
        try {
            copyEnvironmentVariablesSchema.parse(data);

            return await this.post<CopyEnvironmentVariablesInput, CopyVariablesBetweenServicesResponse>(
                `${this.resource}/services/environment-variables/copy`,
                data,
                {
                    credentials: 'include',
                },
            );
        } catch (error) {
            console.error('Failed to copy environment variables:', error);
            throw error;
        }
    }

    async moveEnvironmentVariables(data: MoveEnvironmentVariablesInput): Promise<MoveVariablesBetweenServicesResponse> {
        try {
            moveEnvironmentVariablesSchema.parse(data);

            return await this.post<MoveEnvironmentVariablesInput, MoveVariablesBetweenServicesResponse>(
                `${this.resource}/services/environment-variables/move`,
                data,
                {
                    credentials: 'include',
                },
            );
        } catch (error) {
            console.error('Failed to move environment variables:', error);
            throw error;
        }
    }

    async rollbackEnvironmentVariables(data: RollbackEnvironmentVariablesInput): Promise<RollbackToVersionResponse> {
        try {
            rollbackEnvironmentVariablesSchema.parse(data);

            return await this.post<RollbackEnvironmentVariablesInput, RollbackToVersionResponse>(
                `${this.resource}/services/environment-variables/rollback`,
                data,
                {
                    credentials: 'include',
                },
            );
        } catch (error) {
            console.error('Failed to rollback environment variables:', error);
            throw error;
        }
    }

    async compareEnvironmentVariables(data: CompareEnvironmentVariablesInput): Promise<CompareVersionsResponse> {
        try {
            compareEnvironmentVariablesSchema.parse(data);

            const params = new URLSearchParams({
                clusterName: data.clusterName,
                serviceName: data.serviceName,
                containerName: data.containerName,
                revision1: data.revision1.toString(),
                revision2: data.revision2.toString(),
            });

            return await this.get<CompareVersionsResponse>(
                `${this.resource}/services/environment-variables/compare?${params}`,
                {},
                {
                    credentials: 'include',
                },
            );
        } catch (error) {
            console.error('Failed to compare environment variables:', error);
            throw error;
        }
    }
}
