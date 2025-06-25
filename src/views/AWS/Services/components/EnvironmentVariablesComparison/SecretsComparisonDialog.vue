<template>
    <Dialog v-model:open="isOpen">
        <DialogTrigger as-child>
            <Button variant="outline" size="sm" class="gap-2">
                <GitCompareIcon class="h-4 w-4" />
                Compare Secrets
            </Button>
        </DialogTrigger>
        <DialogContent class="max-w-7xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
                <DialogTitle>Compare Environment Variables & Secrets</DialogTitle>
                <DialogDescription>Multi-service comparison of environment variables and secrets</DialogDescription>
            </DialogHeader>

            <div class="flex gap-4 mb-4">
                <div class="flex-1">
                    <Label>Selected Services ({{ selectedServices.length }})</Label>
                    <div class="flex flex-wrap gap-2 mt-2">
                        <Button
                            v-for="service in availableServices"
                            :key="`${service.clusterName}-${service.serviceName}`"
                            :variant="isServiceSelected(service) ? 'default' : 'outline'"
                            size="sm"
                            @click="toggleService(service)"
                            class="text-xs"
                        >
                            {{ service.clusterName }} / {{ service.serviceName }}
                        </Button>
                    </div>
                </div>
            </div>

            <div class="mb-4 p-3 bg-muted/30 rounded-lg">
                <div class="flex items-center space-x-2">
                    <Checkbox id="compare-values" v-model:checked="compareByValue" />
                    <Label for="compare-values" class="text-sm font-medium">Compare by name and value (strict comparison)</Label>
                </div>
                <p class="text-xs text-muted-foreground mt-1">
                    {{
                        compareByValue
                            ? 'Variables must have the same name AND value to be considered common'
                            : 'Variables with the same name will be considered common (values may differ)'
                    }}
                </p>
            </div>

            <div v-if="selectedServices.length > 1" class="overflow-auto max-h-[60vh]">
                <div class="grid gap-4" :class="getGridClass()">
                    <ServiceComparisonCard
                        v-for="service in selectedServices"
                        :key="`${service.clusterName}-${service.serviceName}`"
                        :service="service"
                        :comparison-data="getServiceComparisonData(service)"
                        :compare-by-value="compareByValue"
                    />
                </div>

                <ComparisonSummary :comparison-stats="comparisonStats" :compare-by-value="compareByValue" class="mt-4" />
            </div>

            <div v-else-if="selectedServices.length === 1" class="text-center py-8 text-muted-foreground">
                Select at least one more service to compare
            </div>

            <div v-else class="text-center py-8 text-muted-foreground">
                Select services to compare their environment variables and secrets
            </div>
        </DialogContent>
    </Dialog>
</template>

<script setup lang="ts">
import type { ServiceInterface } from '@/views/AWS/Services/types/service.interface.ts';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { GitCompareIcon } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import ServiceComparisonCard from './ServiceComparisonCard.vue';
import ComparisonSummary from './ComparisonSummary.vue';
import {
    type ComparisonData,
    type ServiceData,
    type ServiceVariable,
    VariableStatus,
    VariableType,
} from '@/views/AWS/Services/types/comparison.interface.ts';

const props = defineProps<{
    services: ServiceInterface[];
}>();

const isOpen = ref(false);
const selectedServices = ref<ServiceData[]>([]);
const compareByValue = ref(false);

const availableServices = computed(() => {
    return props.services.map((service) => ({
        clusterName: service.clusterName,
        serviceName: service.name,
        containers: service.containers,
    }));
});

const toggleService = (service: ServiceData) => {
    const index = selectedServices.value.findIndex((s) => s.clusterName === service.clusterName && s.serviceName === service.serviceName);

    if (index >= 0) {
        selectedServices.value.splice(index, 1);
    } else {
        selectedServices.value.push(service);
    }
};

const isServiceSelected = (service: ServiceData) => {
    return selectedServices.value.some((s) => s.clusterName === service.clusterName && s.serviceName === service.serviceName);
};

const getGridClass = () => {
    const count = selectedServices.value.length;
    if (count <= 2) return 'grid-cols-2';
    if (count <= 3) return 'grid-cols-3';
    return 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
};

const extractVariables = (service: ServiceData): ServiceVariable[] => {
    const variables: ServiceVariable[] = [];

    service.containers.forEach((container) => {
        container.environmentVariables.environment.forEach((env: any) => {
            variables.push({
                name: env.name,
                value: env.value,
                type: VariableType.ENVIRONMENT,
                serviceName: `${service.clusterName}/${service.serviceName}`,
            });
        });

        container.environmentVariables.secrets.forEach((secret: any) => {
            variables.push({
                name: secret.name,
                value: secret.value,
                type: VariableType.SECRET,
                serviceName: `${service.clusterName}/${service.serviceName}`,
            });
        });
    });

    return variables;
};

const allVariablesByService = computed(() => {
    const result = new Map<string, ServiceVariable[]>();

    selectedServices.value.forEach((service) => {
        const key = `${service.clusterName}/${service.serviceName}`;
        result.set(key, extractVariables(service));
    });

    return result;
});

const variableOccurrences = computed(() => {
    const occurrences = new Map<string, ServiceVariable[]>();

    allVariablesByService.value.forEach((variables) => {
        variables.forEach((variable) => {
            const key = compareByValue.value ? `${variable.name}:${variable.value}` : variable.name;

            if (!occurrences.has(key)) {
                occurrences.set(key, []);
            }
            occurrences.get(key)!.push(variable);
        });
    });

    return occurrences;
});

const getVariableStatus = (variable: ServiceVariable): VariableStatus.COMMON | VariableStatus.UNIQUE | VariableStatus.CONFLICT => {
    const key = compareByValue.value ? `${variable.name}:${variable.value}` : variable.name;

    const occurrences = variableOccurrences.value.get(key) || [];

    if (occurrences.length === 1) return VariableStatus.UNIQUE;
    if (occurrences.length === selectedServices.value.length) return VariableStatus.COMMON;

    // Check for name conflicts (same name, different values)
    if (!compareByValue.value) {
        const nameOccurrences = variableOccurrences.value.get(variable.name) || [];
        const uniqueValues = new Set(nameOccurrences.map((v) => v.value));
        if (uniqueValues.size > 1) return VariableStatus.CONFLICT;
    }

    return VariableStatus.COMMON;
};

const getServiceComparisonData = (service: ServiceData): ComparisonData => {
    const serviceKey = `${service.clusterName}/${service.serviceName}`;
    const variables = allVariablesByService.value.get(serviceKey) || [];

    const envVars = variables.filter((v) => v.type === VariableType.ENVIRONMENT);
    const secrets = variables.filter((v) => v.type === VariableType.SECRET);

    const status = new Map<string, VariableStatus.COMMON | VariableStatus.UNIQUE | VariableStatus.CONFLICT>();
    variables.forEach((variable) => {
        status.set(variable.name, getVariableStatus(variable));
    });

    return { envVars, secrets, status };
};

const comparisonStats = computed(() => {
    const stats = {
        common: 0,
        unique: 0,
        conflicts: 0,
        total: 0,
    };

    const processedKeys = new Set<string>();

    variableOccurrences.value.forEach((occurrences, key) => {
        if (processedKeys.has(key)) return;
        processedKeys.add(key);

        stats.total++;

        if (occurrences.length === 1) {
            stats.unique++;
        } else if (occurrences.length === selectedServices.value.length) {
            stats.common++;
        } else {
            // Partial matches or conflicts
            if (!compareByValue.value) {
                const variableName = key.includes(':') ? key.split(':')[0] : key;
                const nameOccurrences = Array.from(variableOccurrences.value.entries())
                    .filter(([k]) => k.startsWith(variableName))
                    .flatMap(([, vars]) => vars);

                const uniqueValues = new Set(nameOccurrences.map((v) => v.value));
                if (uniqueValues.size > 1) {
                    stats.conflicts++;
                } else {
                    stats.common++;
                }
            } else {
                stats.common++;
            }
        }
    });

    return stats;
});
</script>
