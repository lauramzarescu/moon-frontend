import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useDataStore } from '@/stores/dataStore';
import { AwsService } from '@/services/aws.service';
import { useToast } from '@/components/ui/toast';
import { VariableType } from '@/types/aws/environment-variable.enums';
import type { ServiceInterface } from '@/views/AWS/Services/types/service.interface';

export function useServiceEnvironmentData() {
    const awsService = new AwsService();
    const { toast } = useToast();
    const store = useDataStore();
    const { services } = storeToRefs(store);

    // Reactive state
    const selectedContainer = ref<string>('');
    const selectedVariables = ref<string[]>([]);
    const hasChanges = ref(false);
    const hasPendingChanges = ref(false);
    const versionEnvironmentVariables = ref<any>(null);
    const isLoadingVersionData = ref(false);

    // Get current service from store
    const getCurrentService = (serviceProps: ServiceInterface | null) => {
        if (!serviceProps) return null;
        
        const currentService = services.value.find(
            (s) => s.name === serviceProps.name && s.clusterName === serviceProps.clusterName
        );
        
        return currentService || serviceProps;
    };

    // Get current container with version data
    const getCurrentContainer = (service: ServiceInterface | null) => {
        if (!service || !selectedContainer.value) return null;

        const baseContainer = service.containers.find((c) => c.name === selectedContainer.value);
        if (!baseContainer) return null;

        // If we have version-specific data, use it; otherwise use base container
        if (versionEnvironmentVariables.value) {
            return {
                ...baseContainer,
                environmentVariables: versionEnvironmentVariables.value,
            };
        }

        return baseContainer;
    };

    // Calculate total variables count
    const getTotalVariablesCount = (service: ServiceInterface | null) => {
        if (!service) return 0;
        return service.containers.reduce((total, container) => {
            return total + (container.environmentVariables.environment?.length || 0);
        }, 0);
    };

    // Calculate total secrets count
    const getTotalSecretsCount = (service: ServiceInterface | null) => {
        if (!service) return 0;
        return service.containers.reduce((total, container) => {
            return total + (container.environmentVariables.secrets?.length || 0);
        }, 0);
    };

    // Generate all variable IDs for bulk operations
    const getAllVariableIds = (service: ServiceInterface | null) => {
        if (!service) return [];

        const variableIds: string[] = [];

        service.containers.forEach((container) => {
            // Add environment variables
            container.environmentVariables.environment?.forEach((envVar) => {
                variableIds.push(`env-${envVar.name}`);
            });

            // Add secrets
            container.environmentVariables.secrets?.forEach((secret) => {
                variableIds.push(`secret-${secret.name}`);
            });
        });

        return variableIds;
    };

    // Use all variables if none are manually selected
    const getEffectiveSelectedVariables = (service: ServiceInterface | null) => {
        const allIds = getAllVariableIds(service);
        return selectedVariables.value.length > 0 ? selectedVariables.value : allIds;
    };

    // Load version data from API
    const loadVersionData = async (
        service: ServiceInterface,
        containerName: string,
        revision: number
    ) => {
        try {
            const response = await awsService.getEnvironmentVariableVersion({
                clusterName: service.clusterName,
                serviceName: service.name,
                containerName,
                revision,
            });

            const base = service.containers.find((c) => c.name === containerName);
            const secrets = base?.environmentVariables?.secrets || [];
            const envList = response.environmentVariables || [];
            return { environment: envList, secrets } as any;
        } catch (error: any) {
            console.error('Failed to load version data:', error);
            return null;
        }
    };

    // AWS Systems Manager parameter name validation
    const validateParameterName = (name: string): { isValid: boolean; error?: string } => {
        if (!name || name.length === 0) {
            return { isValid: false, error: 'Parameter name cannot be empty' };
        }

        if (name.length > 2048) {
            return { isValid: false, error: 'Parameter name cannot exceed 2048 characters' };
        }

        if (!/^[a-zA-Z0-9]/.test(name)) {
            return { isValid: false, error: 'Parameter name must start with a letter or number' };
        }

        if (!/^[a-zA-Z0-9_.\-/]+$/.test(name)) {
            return { isValid: false, error: 'Parameter name can only contain letters, numbers, and the symbols: _ . - /' };
        }

        return { isValid: true };
    };

    return {
        // Reactive state
        selectedContainer,
        selectedVariables,
        hasChanges,
        hasPendingChanges,
        versionEnvironmentVariables,
        isLoadingVersionData,

        // Methods
        getCurrentService,
        getCurrentContainer,
        getTotalVariablesCount,
        getTotalSecretsCount,
        getAllVariableIds,
        getEffectiveSelectedVariables,
        loadVersionData,
        validateParameterName,

        // Store and services
        store,
        awsService,
        toast,
    };
}
