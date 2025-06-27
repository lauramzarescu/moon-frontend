import type { ServiceInterface } from '@/views/AWS/Services/types/service.interface.ts';
import type { ComparisonData, ComparisonStats, ServiceData, ServiceVariable } from '@/views/AWS/Services/types/comparison.interface.ts';
import { VariableStatus, VariableType } from '@/views/AWS/Services/types/comparison.interface.ts';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface DialogState {
    selectedServices: ServiceData[];
    compareByValue: boolean;
    showAllServices: boolean;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const sortVariables = (variables: ServiceVariable[]): ServiceVariable[] => {
    return variables.sort((a, b) => a.name.localeCompare(b.name));
};

// ============================================================================
// SERVICE TRANSFORMATION
// ============================================================================

export const transformServices = (services: ServiceInterface[]): ServiceData[] => {
    return services
        .filter((service) => service.containers && service.containers.length > 0)
        .map((service) => ({
            clusterName: service.clusterName,
            serviceName: service.name,
            containers: service.containers,
        }));
};

export const extractVariables = (service: ServiceData): ServiceVariable[] => {
    const variables: ServiceVariable[] = [];

    // Ensure containers is defined and is an array
    const containers = service.containers || [];

    containers.forEach((container) => {
        // Ensure environmentVariables exists and has the expected structure
        const envVars = container.environmentVariables?.environment || [];
        const secrets = container.environmentVariables?.secrets || [];

        envVars.forEach((env: any) => {
            variables.push({
                name: env.name,
                value: env.value,
                type: VariableType.ENVIRONMENT,
                serviceName: `${service.clusterName}/${service.serviceName}`,
            });
        });

        secrets.forEach((secret: any) => {
            variables.push({
                name: secret.name,
                value: secret.value,
                type: VariableType.SECRET,
                serviceName: `${service.clusterName}/${service.serviceName}`,
            });
        });
    });

    return sortVariables(variables);
};

// ============================================================================
// DIALOG STATE MANAGEMENT
// ============================================================================

export const createInitialDialogState = (): DialogState => ({
    selectedServices: [],
    compareByValue: false,
    showAllServices: false,
});

export const resetDialogState = (state: DialogState): void => {
    state.selectedServices = [];
    state.compareByValue = false;
    state.showAllServices = false;
};

export const initializeSelectedServices = (state: DialogState, filteredServices: ServiceData[], hasFilteredServices: boolean): void => {
    if (hasFilteredServices) {
        state.selectedServices = [...filteredServices];
    } else {
        state.selectedServices = [];
    }
};

export const toggleService = (state: DialogState, service: ServiceData): void => {
    const index = state.selectedServices.findIndex((s) => s.clusterName === service.clusterName && s.serviceName === service.serviceName);

    if (index >= 0) {
        state.selectedServices.splice(index, 1);
    } else {
        state.selectedServices.push(service);
    }
};

export const isServiceSelected = (state: DialogState, service: ServiceData): boolean => {
    return state.selectedServices.some((s) => s.clusterName === service.clusterName && s.serviceName === service.serviceName);
};

export const getGridClass = (selectedServicesCount: number): string => {
    if (selectedServicesCount <= 2) return 'grid-cols-2';
    if (selectedServicesCount <= 3) return 'grid-cols-3';
    return 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
};

// ============================================================================
// COMPARISON LOGIC
// ============================================================================

export const getAllVariablesByService = (selectedServices: ServiceData[]): Map<string, ServiceVariable[]> => {
    const result = new Map<string, ServiceVariable[]>();

    selectedServices.forEach((service) => {
        const key = `${service.clusterName}/${service.serviceName}`;
        result.set(key, extractVariables(service));
    });

    return result;
};

export const getVariableOccurrences = (
    allVariablesByService: Map<string, ServiceVariable[]>,
    compareByValue: boolean,
): Map<string, ServiceVariable[]> => {
    const occurrences = new Map<string, ServiceVariable[]>();

    allVariablesByService.forEach((variables) => {
        variables.forEach((variable) => {
            const key = compareByValue ? `${variable.name}:${variable.value}` : variable.name;

            if (!occurrences.has(key)) {
                occurrences.set(key, []);
            }
            occurrences.get(key)!.push(variable);
        });
    });

    return occurrences;
};

export const getVariableStatus = (
    variable: ServiceVariable,
    variableOccurrences: Map<string, ServiceVariable[]>,
    selectedServicesCount: number,
    compareByValue: boolean,
): VariableStatus => {
    if (compareByValue) {
        const key = `${variable.name}:${variable.value}`;
        const occurrences = variableOccurrences.get(key) || [];

        if (occurrences.length === 1) return VariableStatus.UNIQUE;
        if (occurrences.length === selectedServicesCount) return VariableStatus.COMMON;
        return VariableStatus.CONFLICT;
    } else {
        const nameOccurrences = variableOccurrences.get(variable.name) || [];

        if (nameOccurrences.length === 1) return VariableStatus.UNIQUE;

        // Check for conflicts (same name, different values)
        const uniqueValues = new Set(nameOccurrences.map((v) => v.value));
        if (uniqueValues.size > 1) return VariableStatus.CONFLICT;

        return VariableStatus.COMMON;
    }
};

export const calculateComparisonStats = (
    selectedServices: ServiceData[],
    allVariablesByService: Map<string, ServiceVariable[]>,
    variableOccurrences: Map<string, ServiceVariable[]>,
    compareByValue: boolean,
): ComparisonStats => {
    const stats: ComparisonStats = {
        totalServices: selectedServices.length,
        commonVariables: 0,
        uniqueVariables: 0,
        conflictingVariables: 0,
        totalVariables: 0,
    };

    if (selectedServices.length === 0) {
        return stats;
    }

    const allVariableNames = new Set<string>();

    // Collect all unique variable names
    allVariablesByService.forEach((variables) => {
        variables.forEach((variable) => {
            allVariableNames.add(variable.name);
        });
    });

    allVariableNames.forEach((variableName) => {
        if (!compareByValue) {
            // When not comparing by value, use the existing logic
            const occurrences = variableOccurrences.get(variableName) || [];

            if (occurrences.length === 1) {
                stats.uniqueVariables++;
            } else if (occurrences.length === selectedServices.length) {
                stats.commonVariables++;
            } else {
                stats.commonVariables++;
            }
        } else {
            // When comparing by value, check if variable name exists in all services
            const servicesWithVariable = new Set<string>();

            allVariablesByService.forEach((variables, serviceKey) => {
                const hasVariable = variables.some((v) => v.name === variableName);
                if (hasVariable) {
                    servicesWithVariable.add(serviceKey);
                }
            });

            if (servicesWithVariable.size === 1) {
                stats.uniqueVariables++;
            } else if (servicesWithVariable.size === selectedServices.length) {
                // Variable exists in all services - check if values are consistent
                const allValuesForVariable: string[] = [];

                allVariablesByService.forEach((variables) => {
                    variables.forEach((variable) => {
                        if (variable.name === variableName) {
                            allValuesForVariable.push(variable.value);
                        }
                    });
                });

                const uniqueValues = new Set(allValuesForVariable);
                if (uniqueValues.size === 1) {
                    stats.commonVariables++;
                } else {
                    stats.conflictingVariables++;
                }
            } else {
                // Variable exists in some but not all services
                stats.conflictingVariables++;
            }
        }
    });

    stats.totalVariables = allVariableNames.size;

    return stats;
};

// ============================================================================
// SERVICE COMPARISON
// ============================================================================

export const getServiceComparisonData = (
    service: ServiceData,
    allVariablesByService: Map<string, ServiceVariable[]>,
    variableOccurrences: Map<string, ServiceVariable[]>,
    selectedServicesCount: number,
    compareByValue: boolean,
): ComparisonData => {
    const serviceKey = `${service.clusterName}/${service.serviceName}`;
    const variables = allVariablesByService.get(serviceKey) || [];

    const envVars = sortVariables(variables.filter((v) => v.type === VariableType.ENVIRONMENT));
    const secrets = sortVariables(variables.filter((v) => v.type === VariableType.SECRET));

    const status = new Map<string, VariableStatus>();
    variables.forEach((variable) => {
        status.set(variable.name, getVariableStatus(variable, variableOccurrences, selectedServicesCount, compareByValue));
    });

    return { envVars, secrets, status };
};
