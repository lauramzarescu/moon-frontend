import { ApiService } from '@/services/generic.service.ts';
import type { ServiceRestartInput, ServiceUpdateCountInput, ServiceUpdateImageInput } from '@/views/AWS/Services/components/schema.ts';
import { serviceRestartSchema, serviceUpdateCountSchema, serviceUpdateImageSchema } from '@/views/AWS/Services/components/schema.ts';
import type { ClusterResponseInterface } from '@/types/response/cluster.interface.ts';
import {
    type AddEnvironmentVariablesInput,
    addEnvironmentVariablesSchema,
    type EditEnvironmentVariablesInput,
    editEnvironmentVariablesSchema,
    type GetEnvironmentVariablesInput,
    getEnvironmentVariablesSchema,
    type RemoveEnvironmentVariablesInput,
    removeEnvironmentVariablesSchema,
} from '@/views/AWS/Services/components/environment-variable.schema.ts'; // Keep legacy interfaces for backward compatibility if needed

// Keep legacy interfaces for backward compatibility if needed
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

export interface AddEnvironmentVariableInput {
    clusterName: string;
    serviceName: string;
    containerName: string;
    type: 'environment' | 'secret';
    name: string;
    value: string;
}

export interface RemoveEnvironmentVariableInput {
    clusterName: string;
    serviceName: string;
    containerName: string;
    type: 'environment' | 'secret';
    name: string;
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

    async addEnvironmentVariables(data: AddEnvironmentVariablesInput) {
        try {
            addEnvironmentVariablesSchema.parse(data);

            return await this.post<AddEnvironmentVariablesInput, any>(`${this.resource}/services/environment-variables`, data, {
                credentials: 'include',
            });
        } catch (error) {
            console.error('Failed to add environment variables:', error);
            throw error;
        }
    }

    async editEnvironmentVariables(data: EditEnvironmentVariablesInput) {
        try {
            editEnvironmentVariablesSchema.parse(data);

            return await this.put<EditEnvironmentVariablesInput, any>(`${this.resource}/services/environment-variables`, data, {
                credentials: 'include',
            });
        } catch (error) {
            console.error('Failed to edit environment variables:', error);
            throw error;
        }
    }

    async removeEnvironmentVariables(data: RemoveEnvironmentVariablesInput) {
        try {
            removeEnvironmentVariablesSchema.parse(data);

            return await this.delete<any>(`${this.resource}/services/environment-variables`, {
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
}
