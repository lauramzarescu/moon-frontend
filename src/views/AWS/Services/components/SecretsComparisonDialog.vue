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
                <DialogDescription> Side-by-side comparison of environment variables and secrets between services </DialogDescription>
            </DialogHeader>

            <div class="flex gap-4 mb-4">
                <div class="flex-1">
                    <Label>Service A</Label>
                    <Select v-model="selectedServiceA">
                        <SelectTrigger>
                            <SelectValue placeholder="Select first service" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem
                                v-for="service in availableServices"
                                :key="`${service.clusterName}-${service.serviceName}`"
                                :value="`${service.clusterName}|${service.serviceName}`"
                            >
                                {{ service.clusterName }} / {{ service.serviceName }}
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div class="flex-1">
                    <Label>Service B</Label>
                    <Select v-model="selectedServiceB">
                        <SelectTrigger>
                            <SelectValue placeholder="Select second service" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem
                                v-for="service in availableServices"
                                :key="`${service.clusterName}-${service.serviceName}`"
                                :value="`${service.clusterName}|${service.serviceName}`"
                            >
                                {{ service.clusterName }} / {{ service.serviceName }}
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <!-- Comparison Options -->
            <div class="mb-4 p-3 bg-muted/30 rounded-lg">
                <div class="flex items-center space-x-2">
                    <Checkbox id="compare-values" v-model:checked="compareByValue" />
                    <Label for="compare-values" class="text-sm font-medium"> Compare by name and value (strict comparison) </Label>
                </div>
                <p class="text-xs text-muted-foreground mt-1">
                    {{
                        compareByValue
                            ? 'Variables must have the same name AND value to be considered common'
                            : 'Variables with the same name will be considered common (values may differ)'
                    }}
                </p>
            </div>

            <div v-if="selectedServiceA && selectedServiceB" class="overflow-auto max-h-[60vh]">
                <div class="grid grid-cols-2 gap-4">
                    <!-- Service A -->
                    <div class="border rounded-lg">
                        <div class="p-3 border-b bg-muted/50">
                            <h3 class="font-semibold">{{ getServiceName(selectedServiceA) }}</h3>
                        </div>
                        <div class="p-3 space-y-3">
                            <!-- Environment Variables -->
                            <div>
                                <h4 class="text-sm font-medium text-green-600 dark:text-green-400 mb-2 flex items-center gap-2">
                                    <GlobeIcon class="h-4 w-4" />
                                    Environment Variables ({{ serviceAEnvVars.length }})
                                </h4>
                                <div class="space-y-1">
                                    <div
                                        v-for="env in serviceAEnvVars"
                                        :key="env.name"
                                        :class="['p-2 rounded text-sm border', getVariableStatus(env, 'environment', 'A')]"
                                    >
                                        <div class="font-mono font-medium">{{ env.name }}</div>
                                        <div class="text-xs text-muted-foreground truncate">{{ env.value }}</div>
                                        <div
                                            v-if="
                                                !compareByValue &&
                                                hasNameMatch(env, 'environment', 'B') &&
                                                !hasExactMatch(env, 'environment', 'B')
                                            "
                                            class="text-xs text-orange-600 dark:text-orange-400 mt-1"
                                        >
                                            ⚠️ Same name, different value
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Secrets -->
                            <div>
                                <h4 class="text-sm font-medium text-purple-600 dark:text-purple-400 mb-2 flex items-center gap-2">
                                    <KeyIcon class="h-4 w-4" />
                                    Secrets ({{ serviceASecrets.length }})
                                </h4>
                                <div class="space-y-1">
                                    <div
                                        v-for="secret in serviceASecrets"
                                        :key="secret.name"
                                        :class="['p-2 rounded text-sm border', getVariableStatus(secret, 'secret', 'A')]"
                                    >
                                        <div class="font-mono font-medium">{{ secret.name }}</div>
                                        <div class="text-xs text-muted-foreground truncate">{{ secret.value }}</div>
                                        <div
                                            v-if="
                                                !compareByValue &&
                                                hasNameMatch(secret, 'secret', 'B') &&
                                                !hasExactMatch(secret, 'secret', 'B')
                                            "
                                            class="text-xs text-orange-600 dark:text-orange-400 mt-1"
                                        >
                                            ⚠️ Same name, different value
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Service B -->
                    <div class="border rounded-lg">
                        <div class="p-3 border-b bg-muted/50">
                            <h3 class="font-semibold">{{ getServiceName(selectedServiceB) }}</h3>
                        </div>
                        <div class="p-3 space-y-3">
                            <!-- Environment Variables -->
                            <div>
                                <h4 class="text-sm font-medium text-green-600 dark:text-green-400 mb-2 flex items-center gap-2">
                                    <GlobeIcon class="h-4 w-4" />
                                    Environment Variables ({{ serviceBEnvVars.length }})
                                </h4>
                                <div class="space-y-1">
                                    <div
                                        v-for="env in serviceBEnvVars"
                                        :key="env.name"
                                        :class="['p-2 rounded text-sm border', getVariableStatus(env, 'environment', 'B')]"
                                    >
                                        <div class="font-mono font-medium">{{ env.name }}</div>
                                        <div class="text-xs text-muted-foreground truncate">{{ env.value }}</div>
                                        <div
                                            v-if="
                                                !compareByValue &&
                                                hasNameMatch(env, 'environment', 'A') &&
                                                !hasExactMatch(env, 'environment', 'A')
                                            "
                                            class="text-xs text-orange-600 dark:text-orange-400 mt-1"
                                        >
                                            ⚠️ Same name, different value
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Secrets -->
                            <div>
                                <h4 class="text-sm font-medium text-purple-600 dark:text-purple-400 mb-2 flex items-center gap-2">
                                    <KeyIcon class="h-4 w-4" />
                                    Secrets ({{ serviceBSecrets.length }})
                                </h4>
                                <div class="space-y-1">
                                    <div
                                        v-for="secret in serviceBSecrets"
                                        :key="secret.name"
                                        :class="['p-2 rounded text-sm border', getVariableStatus(secret, 'secret', 'B')]"
                                    >
                                        <div class="font-mono font-medium">{{ secret.name }}</div>
                                        <div class="text-xs text-muted-foreground truncate">{{ secret.value }}</div>
                                        <div
                                            v-if="
                                                !compareByValue &&
                                                hasNameMatch(secret, 'secret', 'A') &&
                                                !hasExactMatch(secret, 'secret', 'A')
                                            "
                                            class="text-xs text-orange-600 dark:text-orange-400 mt-1"
                                        >
                                            ⚠️ Same name, different value
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Comparison Summary -->
                <div class="mt-4 p-4 bg-muted/50 rounded-lg">
                    <h4 class="font-semibold mb-2">Comparison Summary</h4>
                    <div class="grid grid-cols-4 gap-4 text-sm">
                        <div class="flex items-center gap-2">
                            <div class="w-3 h-3 bg-green-500 rounded"></div>
                            <span>{{ compareByValue ? 'Exact matches' : 'Common names' }}: {{ commonVariables.length }}</span>
                        </div>
                        <div v-if="!compareByValue" class="flex items-center gap-2">
                            <div class="w-3 h-3 bg-yellow-500 rounded"></div>
                            <span>Same name, diff value: {{ sameNameDiffValue.length }}</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <div class="w-3 h-3 bg-blue-500 rounded"></div>
                            <span>Unique to A: {{ uniqueToA.length }}</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <div class="w-3 h-3 bg-orange-500 rounded"></div>
                            <span>Unique to B: {{ uniqueToB.length }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </DialogContent>
    </Dialog>
</template>

<script setup lang="ts">
import type { ServiceInterface } from '@/views/AWS/Services/types/service.interface.ts';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { GitCompareIcon, GlobeIcon, KeyIcon } from 'lucide-vue-next';
import { computed, ref } from 'vue';

const props = defineProps<{
    services: ServiceInterface[];
}>();

const isOpen = ref(false);
const selectedServiceA = ref<string>('');
const selectedServiceB = ref<string>('');
const compareByValue = ref(false); // New checkbox state

const availableServices = computed(() => {
    return props.services.map((service) => ({
        clusterName: service.clusterName,
        serviceName: service.name,
        containers: service.containers,
    }));
});

const getServiceData = (serviceKey: string) => {
    if (!serviceKey) return null;
    const [clusterName, serviceName] = serviceKey.split('|');
    return availableServices.value.find((s) => s.clusterName === clusterName && s.serviceName === serviceName);
};

const getServiceName = (serviceKey: string) => {
    const service = getServiceData(serviceKey);
    return service ? `${service.clusterName} / ${service.serviceName}` : '';
};

const serviceAData = computed(() => getServiceData(selectedServiceA.value));
const serviceBData = computed(() => getServiceData(selectedServiceB.value));

const serviceAEnvVars = computed(() => {
    if (!serviceAData.value) return [];
    return serviceAData.value.containers.flatMap((c) => c.environmentVariables.environment);
});

const serviceASecrets = computed(() => {
    if (!serviceAData.value) return [];
    return serviceAData.value.containers.flatMap((c) => c.environmentVariables.secrets);
});

const serviceBEnvVars = computed(() => {
    if (!serviceBData.value) return [];
    return serviceBData.value.containers.flatMap((c) => c.environmentVariables.environment);
});

const serviceBSecrets = computed(() => {
    if (!serviceBData.value) return [];
    return serviceBData.value.containers.flatMap((c) => c.environmentVariables.secrets);
});

// Helper function to get all variables from a service
const getAllVariablesA = computed(() => [...serviceAEnvVars.value, ...serviceASecrets.value]);

const getAllVariablesB = computed(() => [...serviceBEnvVars.value, ...serviceBSecrets.value]);

// Updated comparison logic
const commonVariables = computed(() => {
    if (compareByValue.value) {
        // Strict comparison: name AND value must match
        return getAllVariablesA.value.filter((varA) =>
            getAllVariablesB.value.some((varB) => varA.name === varB.name && varA.value === varB.value),
        );
    } else {
        // Name-only comparison
        return getAllVariablesA.value.filter((varA) => getAllVariablesB.value.some((varB) => varA.name === varB.name));
    }
});

// Variables with same name but different values (only relevant when not comparing by value)
const sameNameDiffValue = computed(() => {
    if (compareByValue.value) return [];

    return getAllVariablesA.value.filter((varA) =>
        getAllVariablesB.value.some((varB) => varA.name === varB.name && varA.value !== varB.value),
    );
});

const uniqueToA = computed(() => {
    const bNames = new Set(getAllVariablesB.value.map((v) => v.name));
    return getAllVariablesA.value.filter((varA) => !bNames.has(varA.name));
});
const uniqueToB = computed(() => {
    const aNames = new Set(getAllVariablesA.value.map((v) => v.name));
    return getAllVariablesB.value.filter((varB) => !aNames.has(varB.name));
});

// Helper functions for variable status
const hasNameMatch = (
    variable: {
        name: string;
        value: string;
    },
    type: 'environment' | 'secret',
    otherService: 'A' | 'B',
) => {
    const otherVars =
        otherService === 'A'
            ? type === 'environment'
                ? serviceAEnvVars.value
                : serviceASecrets.value
            : type === 'environment'
              ? serviceBEnvVars.value
              : serviceBSecrets.value;

    return otherVars.some((v) => v.name === variable.name);
};

const hasExactMatch = (
    variable: {
        name: string;
        value: string;
    },
    type: 'environment' | 'secret',
    otherService: 'A' | 'B',
) => {
    const otherVars =
        otherService === 'A'
            ? type === 'environment'
                ? serviceAEnvVars.value
                : serviceASecrets.value
            : type === 'environment'
              ? serviceBEnvVars.value
              : serviceBSecrets.value;

    return otherVars.some((v) => v.name === variable.name && v.value === variable.value);
};

const getVariableStatus = (
    variable: {
        name: string;
        value: string;
    },
    type: 'environment' | 'secret',
    service: 'A' | 'B',
) => {
    const otherService = service === 'A' ? 'B' : 'A';
    const hasName = hasNameMatch(variable, type, otherService);
    const hasExact = hasExactMatch(variable, type, otherService);

    if (compareByValue.value) {
        // Strict comparison mode
        if (hasExact) {
            return 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800';
        } else if (service === 'A' && uniqueToA.value.some((v) => v.name === variable.name)) {
            return 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800';
        } else if (service === 'B' && uniqueToB.value.some((v) => v.name === variable.name)) {
            return 'bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800';
        } else {
            // Same name but different value
            return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800';
        }
    } else {
        // Name-only comparison mode
        if (hasName) {
            if (hasExact) {
                return 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800';
            } else {
                // Same name, different value - show as common but with warning
                return 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800';
            }
        } else if (service === 'A' && uniqueToA.value.some((v) => v.name === variable.name)) {
            return 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800';
        } else if (service === 'B' && uniqueToB.value.some((v) => v.name === variable.name)) {
            return 'bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800';
        }
    }

    return 'bg-muted/50 border-border';
};
</script>
