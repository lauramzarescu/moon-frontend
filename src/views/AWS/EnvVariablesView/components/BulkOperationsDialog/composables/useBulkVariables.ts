import { computed, type Ref } from 'vue';
import type { ServiceInterface } from '@/views/AWS/Services/types/service.interface';

export interface VariableData {
    name: string;
    value: string;
    isSecret: boolean;
    container: string;
}

export function useBulkVariables(
    service: Ref<ServiceInterface | null>,
    selectedVariables: Ref<string[]>
) {
    const isUsingAllVariables = computed(() => {
        if (!service.value) return false;

        let totalVariables = 0;
        service.value.containers.forEach((container) => {
            totalVariables += container.environmentVariables.environment?.length || 0;
            totalVariables += container.environmentVariables.secrets?.length || 0;
        });

        return selectedVariables.value.length === totalVariables;
    });

    const getVariableData = computed(() => {
        if (!service.value) return new Map<string, VariableData>();

        const variableData = new Map<string, VariableData>();

        service.value.containers.forEach((container) => {
            container.environmentVariables.environment.forEach((envVar) => {
                const variableId = `env-${envVar.name}`;
                if (selectedVariables.value.includes(variableId)) {
                    variableData.set(variableId, {
                        name: envVar.name,
                        value: envVar.value,
                        isSecret: false,
                        container: container.name,
                    });
                }
            });

            container.environmentVariables.secrets.forEach((secret) => {
                const variableId = `secret-${secret.name}`;
                if (selectedVariables.value.includes(variableId)) {
                    variableData.set(variableId, {
                        name: secret.name,
                        value: secret.valueFrom,
                        isSecret: true,
                        container: container.name,
                    });
                }
            });
        });

        return variableData;
    });

    const getVariablesByContainer = computed(() => {
        const variableData = getVariableData.value;
        const containerMap = new Map<string, VariableData[]>();

        variableData.forEach((variable) => {
            if (!containerMap.has(variable.container)) {
                containerMap.set(variable.container, []);
            }
            containerMap.get(variable.container)!.push(variable);
        });

        return containerMap;
    });

    const totalSelectedCount = computed(() => selectedVariables.value.length);

    return {
        isUsingAllVariables,
        getVariableData,
        getVariablesByContainer,
        totalSelectedCount,
    };
}
