<script setup lang="ts">
import type { ServiceInterface } from '@/views/AWS/Services/types/service.interface.ts';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { GitCompareIcon } from 'lucide-vue-next';
import { Checkbox } from '@/components/ui/checkbox';
import { Cross2Icon } from '@radix-icons/vue';
import { computed, reactive, ref, watch } from 'vue';
import ServiceComparisonCard from './ServiceComparisonCard.vue';
import ComparisonSummary from './ComparisonSummary.vue';

// Helper imports
import {
    calculateComparisonStats,
    createInitialDialogState,
    getAllVariablesByService,
    getServiceComparisonData,
    getVariableOccurrences,
    initializeSelectedServices,
    isServiceSelected,
    resetDialogState,
    toggleService,
    transformServices,
} from './helpers/comparisonHelpers';

const props = defineProps<{
    services: ServiceInterface[]; // All services
    filteredServices?: ServiceInterface[]; // Filtered services (optional)
    showAllServices?: boolean;
}>();

const isOpen = ref(false);
const dialogState = reactive(createInitialDialogState());

// Maximum number of services that can be compared at once
const MAX_SERVICES_TO_COMPARE = 8;

const allAvailableServices = computed(() => {
    const transformed = transformServices(props.services || []);
    // Strip to first MAX_SERVICES_TO_COMPARE if there are more services than the maximum
    return transformed.length > MAX_SERVICES_TO_COMPARE ? transformed.slice(0, MAX_SERVICES_TO_COMPARE) : transformed;
});

const filteredAvailableServices = computed(() => {
    const transformed = transformServices(props.filteredServices || []);
    // Strip to first MAX_SERVICES_TO_COMPARE if there are more services than the maximum
    return transformed.length > MAX_SERVICES_TO_COMPARE ? transformed.slice(0, MAX_SERVICES_TO_COMPARE) : transformed;
});

// Services to display in the selection area
const displayedServices = computed(() => {
    if (dialogState.showAllServices) {
        return allAvailableServices.value;
    }
    return filteredAvailableServices.value.length > 0 ? filteredAvailableServices.value : allAvailableServices.value;
});

const hasFilteredServices = computed(() => {
    return props.filteredServices && props.filteredServices.length > 0;
});

const canAddMoreServices = computed(() => {
    return dialogState.selectedServices.length < MAX_SERVICES_TO_COMPARE;
});

const isMaxServicesReached = computed(() => {
    return dialogState.selectedServices.length >= MAX_SERVICES_TO_COMPARE;
});

// Reset selected services when available services change
watch(
    () => [props.services, props.filteredServices],
    () => {
        // Keep only selected services that are still available in all services
        dialogState.selectedServices = dialogState.selectedServices.filter((selected) =>
            allAvailableServices.value.some(
                (available) => available.clusterName === selected.clusterName && available.serviceName === selected.serviceName,
            ),
        );

        // If no services are selected after filtering, reinitialize
        if (dialogState.selectedServices.length === 0) {
            initializeSelectedServices(dialogState, filteredAvailableServices.value, hasFilteredServices.value ?? false);
        }
    },
    { deep: true },
);

// Handle dialog open/close
watch(isOpen, (newValue) => {
    if (newValue) {
        // Dialog opened - reset and initialize
        resetDialogState(dialogState);
        initializeSelectedServices(dialogState, filteredAvailableServices.value, hasFilteredServices.value ?? false);
        dialogState.showAllServices = props.showAllServices ?? false;
    } else {
        // Dialog closed - clear all data
        resetDialogState(dialogState);
    }
});

const allVariablesByService = computed(() => {
    return getAllVariablesByService(dialogState.selectedServices);
});

const variableOccurrences = computed(() => {
    return getVariableOccurrences(allVariablesByService.value, dialogState.compareByValue);
});

const comparisonStats = computed(() => {
    return calculateComparisonStats(
        dialogState.selectedServices,
        allVariablesByService.value,
        variableOccurrences.value,
        dialogState.compareByValue,
    );
});

// Component methods
const handleToggleService = (service: any) => {
    // Check if we're trying to add a service and we've reached the limit
    const isCurrentlySelected = isServiceSelected(dialogState, service);
    if (!isCurrentlySelected && !canAddMoreServices.value) {
        return; // Don't add more services if limit is reached
    }

    toggleService(dialogState, service);
};

const handleIsServiceSelected = (service: any) => {
    return isServiceSelected(dialogState, service);
};

const toggleServiceView = () => {
    dialogState.showAllServices = !dialogState.showAllServices;
};

const handleGetServiceComparisonData = (service: any) => {
    return getServiceComparisonData(
        service,
        allVariablesByService.value,
        variableOccurrences.value,
        dialogState.selectedServices.length,
        dialogState.compareByValue,
    );
};

// Always use flex layout for horizontal scrolling
const gridClass = computed(() => {
    return 'flex gap-4';
});

// Fixed width for service cards
const serviceCardWidth = computed(() => {
    return 'w-[380px] flex-shrink-0';
});

// Check if services were truncated
const servicesWereTruncated = computed(() => {
    const originalServices = transformServices(props.services || []);
    const originalFiltered = transformServices(props.filteredServices || []);
    return originalServices.length > MAX_SERVICES_TO_COMPARE || originalFiltered.length > MAX_SERVICES_TO_COMPARE;
});
</script>

<template>
    <Dialog v-model:open="isOpen">
        <DialogTrigger as-child>
            <Button variant="outline" size="sm" class="h-8">
                <GitCompareIcon class="h-4 w-4" />
                Compare Variables
            </Button>
        </DialogTrigger>
        <DialogContent class="max-w-[80%] max-h-[90%] overflow-hidden">
            <DialogHeader>
                <DialogTitle>Compare Environment Variables & Secrets</DialogTitle>
                <DialogDescription>
                    Multi-service comparison of environment variables and secrets
                    <span v-if="hasFilteredServices">
                        ({{ filteredAvailableServices.length }} filtered services, {{ allAvailableServices.length }} total services)
                    </span>
                    <span v-else> ({{ allAvailableServices.length }} total services) </span>
                </DialogDescription>
            </DialogHeader>

            <!-- Warning message when services were truncated -->
            <div v-if="servicesWereTruncated" class="mb-4 p-2 bg-orange-50 border border-orange-200 rounded-md">
                <p class="text-xs text-orange-800">
                    Only showing the first {{ MAX_SERVICES_TO_COMPARE }} services due to performance limitations.
                </p>
            </div>

            <div class="flex gap-4 mb-2">
                <div class="flex-1">
                    <div class="flex items-center justify-between mb-2">
                        <Label>
                            {{
                                dialogState.showAllServices
                                    ? 'All Available Services'
                                    : hasFilteredServices
                                      ? 'Filtered Services'
                                      : 'Available Services'
                            }}
                            ({{ displayedServices.length }})
                        </Label>
                        <div class="flex items-center gap-4">
                            <!-- Compare by value switch -->
                            <div class="flex items-center space-x-2">
                                <Checkbox id="compare-values" v-model:checked="dialogState.compareByValue" />
                                <Label for="compare-values" class="text-xs">Compare by value</Label>
                            </div>
                            <!-- Show all services button -->
                            <Button v-if="hasFilteredServices" variant="ghost" size="sm" @click="toggleServiceView" class="text-xs">
                                {{ dialogState.showAllServices ? 'Show Filtered Only' : 'Show All Services' }}
                            </Button>
                        </div>
                    </div>
                    <div class="max-h-32 overflow-y-auto mt-2 p-2 border rounded-md">
                        <div class="flex flex-wrap gap-2">
                            <Button
                                v-for="service in displayedServices"
                                :key="`${service.clusterName}-${service.serviceName}`"
                                :variant="handleIsServiceSelected(service) ? 'default' : 'outline'"
                                :disabled="!handleIsServiceSelected(service) && !canAddMoreServices"
                                size="sm"
                                @click="handleToggleService(service)"
                                class="text-xs max-w-[200px] min-w-0"
                                :title="`${service.clusterName} / ${service.serviceName}`"
                            >
                                <span class="truncate block"> {{ service.clusterName }} / {{ service.serviceName }} </span>
                            </Button>
                        </div>
                    </div>
                    <!-- Warning message when max services reached -->
                    <div v-if="isMaxServicesReached" class="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                        <p class="text-xs text-yellow-800">
                            Maximum {{ MAX_SERVICES_TO_COMPARE }} services reached. Remove a service to add another one.
                        </p>
                    </div>
                    <!-- Explanation for compare by value -->
                    <div class="mt-2">
                        <p class="text-xs text-muted-foreground">
                            {{
                                dialogState.compareByValue
                                    ? 'Variables must have the same name AND value to be considered common'
                                    : 'Variables with the same name will be considered common (values may differ)'
                            }}
                        </p>
                    </div>
                </div>
            </div>

            <div class="flex gap-4 mb-4">
                <div class="flex-1">
                    <Label>Selected for Comparison ({{ dialogState.selectedServices.length }}/{{ MAX_SERVICES_TO_COMPARE }})</Label>
                    <div class="flex flex-wrap gap-2 mt-2 min-h-[2.5rem] p-2 border rounded-md bg-muted/20">
                        <Button
                            v-for="service in dialogState.selectedServices"
                            :key="`selected-${service.clusterName}-${service.serviceName}`"
                            variant="secondary"
                            size="sm"
                            @click="handleToggleService(service)"
                            class="text-xs max-w-[250px] min-w-0 flex items-center"
                            :title="`${service.clusterName} / ${service.serviceName}`"
                        >
                            <span class="truncate block mr-1"> {{ service.clusterName }} / {{ service.serviceName }} </span>
                            <Cross2Icon class="h-3 w-3 flex-shrink-0" />
                        </Button>
                        <span v-if="dialogState.selectedServices.length === 0" class="text-sm text-muted-foreground self-center">
                            Select services above to compare
                        </span>
                    </div>
                </div>
            </div>

            <div v-if="dialogState.selectedServices.length > 1" class="overflow-auto max-h-[70%]">
                <!-- Performance warning for too many services -->
                <div v-if="dialogState.selectedServices.length > 4" class="mb-4 p-2 bg-blue-50 border border-blue-200 rounded-md">
                    <p class="text-xs text-blue-800">
                        Comparing {{ dialogState.selectedServices.length }} services. Performance may be slower with many services.
                    </p>
                </div>

                <div class="comparison-container overflow-x-auto">
                    <div :class="gridClass">
                        <ServiceComparisonCard
                            v-for="service in dialogState.selectedServices"
                            :key="`${service.clusterName}-${service.serviceName}`"
                            :service="service"
                            :comparison-data="handleGetServiceComparisonData(service)"
                            :compare-by-value="dialogState.compareByValue"
                            :class="serviceCardWidth"
                        />
                    </div>
                </div>

                <ComparisonSummary :stats="comparisonStats" class="mt-4" />
            </div>

            <div v-else-if="dialogState.selectedServices.length === 1" class="text-center py-8 text-muted-foreground">
                Select at least one more service to compare
            </div>

            <div v-else class="text-center py-8 text-muted-foreground">
                Select services to compare their environment variables and secrets
            </div>
        </DialogContent>
    </Dialog>
</template>

<style scoped>
.comparison-container::-webkit-scrollbar {
    height: 8px;
}

.comparison-container::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
}

.comparison-container::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 4px;
}

.comparison-container::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
}
</style>
