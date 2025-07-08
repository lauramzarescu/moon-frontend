<script setup lang="ts">
import type { ServiceInterface } from '@/views/AWS/Services/types/service.interface.ts';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { GitCompareIcon, SearchIcon, XIcon } from 'lucide-vue-next';
import { Checkbox } from '@/components/ui/checkbox';
import { Cross2Icon } from '@radix-icons/vue';
import { computed, reactive, ref, TransitionGroup, watch } from 'vue';
import ServiceComparisonCard from './ServiceComparisonCard.vue';
import ComparisonSummary from './ComparisonSummary.vue';

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
    services: ServiceInterface[];
    filteredServices?: ServiceInterface[];
    showAllServices?: boolean;
}>();

const isOpen = ref(false);
const dialogState = reactive(createInitialDialogState());
const searchQuery = ref('');

const MAX_SERVICES_TO_COMPARE = 8;

const allAvailableServices = computed(() => {
    return transformServices(props.services || []);
});

const filteredAvailableServices = computed(() => {
    const transformed = transformServices(props.filteredServices || []);
    // Strip to first MAX_SERVICES_TO_COMPARE if there are more services than the maximum
    return transformed.length > MAX_SERVICES_TO_COMPARE ? transformed.slice(0, MAX_SERVICES_TO_COMPARE) : transformed;
});

// Services to display in the selection area (before search filtering)
const baseDisplayedServices = computed(() => {
    if (dialogState.showAllServices) {
        return allAvailableServices.value;
    }
    return filteredAvailableServices.value.length > 0 ? filteredAvailableServices.value : allAvailableServices.value;
});

// Services after applying search filter
const displayedServices = computed(() => {
    if (!searchQuery.value.trim()) {
        return baseDisplayedServices.value;
    }

    const query = searchQuery.value.toLowerCase().trim();
    return baseDisplayedServices.value.filter((service) => {
        const clusterName = service.clusterName.toLowerCase();
        const serviceName = service.serviceName.toLowerCase();
        const fullName = `${clusterName} / ${serviceName}`.toLowerCase();

        return clusterName.includes(query) || serviceName.includes(query) || fullName.includes(query);
    });
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

const hasSearchQuery = computed(() => {
    return searchQuery.value.trim().length > 0;
});

const searchResultsCount = computed(() => {
    return displayedServices.value.length;
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

watch(isOpen, (newValue) => {
    if (newValue) {
        resetDialogState(dialogState);
        initializeSelectedServices(dialogState, filteredAvailableServices.value, hasFilteredServices.value ?? false);
        dialogState.showAllServices = props.showAllServices ?? false;
        searchQuery.value = '';
    } else {
        resetDialogState(dialogState);
        searchQuery.value = '';
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

const handleToggleService = (service: any) => {
    // Check if we're trying to add a service and we've reached the limit
    const isCurrentlySelected = isServiceSelected(dialogState, service);
    if (!isCurrentlySelected && !canAddMoreServices.value) {
        return;
    }

    toggleService(dialogState, service);
};

const handleIsServiceSelected = (service: any) => {
    return isServiceSelected(dialogState, service);
};

const toggleServiceView = () => {
    dialogState.showAllServices = !dialogState.showAllServices;
    searchQuery.value = '';
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

const clearSearch = () => {
    searchQuery.value = '';
};

const gridClass = computed(() => {
    return 'flex gap-4';
});

const serviceCardWidth = computed(() => {
    return 'w-[380px] flex-shrink-0';
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
        <DialogContent class="max-w-[80%] min-h-[50%] h-[95%] overflow-hidden">
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

            <div class="flex gap-4 mb-2 h-full">
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
                            <span v-if="hasSearchQuery"> ({{ searchResultsCount }} of {{ baseDisplayedServices.length }}) </span>
                            <span v-else> ({{ displayedServices.length }}) </span>
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

                    <!-- Search input -->
                    <div class="relative mb-2">
                        <SearchIcon class="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            v-model="searchQuery"
                            placeholder="Search services by cluster or service name..."
                            class="pl-8 pr-8 h-8 text-sm"
                        />
                        <Button
                            v-if="hasSearchQuery"
                            variant="ghost"
                            size="sm"
                            @click="clearSearch"
                            class="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted"
                        >
                            <XIcon class="h-3 w-3" />
                        </Button>
                    </div>

                    <div class="max-h-32 overflow-y-auto mt-2 p-2 border rounded-md">
                        <TransitionGroup name="service-filter" tag="div" class="flex flex-wrap gap-2" v-if="displayedServices.length > 0">
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
                        </TransitionGroup>
                        <div v-else class="text-center py-4 text-sm text-muted-foreground">
                            <span v-if="hasSearchQuery"> No services found matching "{{ searchQuery }}" </span>
                            <span v-else> No services available </span>
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
                        <TransitionGroup name="service-filter" tag="div" class="flex flex-wrap gap-2">
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
                        </TransitionGroup>
                        <span v-if="dialogState.selectedServices.length === 0" class="text-sm text-muted-foreground self-center">
                            Select services above to compare
                        </span>
                    </div>
                </div>
            </div>

            <div v-if="dialogState.selectedServices.length > 1" class="flex flex-col overflow-hidden">
                <!-- Scrollable container for cards -->
                <div class="comparison-container flex-grow overflow-y-auto">
                    <TransitionGroup name="service-card" tag="div" :class="gridClass">
                        <ServiceComparisonCard
                            v-for="service in dialogState.selectedServices"
                            :key="`${service.clusterName}-${service.serviceName}`"
                            :service="service"
                            :comparison-data="handleGetServiceComparisonData(service)"
                            :compare-by-value="dialogState.compareByValue"
                            :class="serviceCardWidth"
                        />
                    </TransitionGroup>
                </div>

                <!-- Fixed ComparisonSummary -->
                <ComparisonSummary :stats="comparisonStats" class="mt-4 flex-shrink-0" />
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
.comparison-container {
    max-height: 100%; /* Ensure it respects the parent's height */
    transition: all 0.3s ease;
}

.service-filter-enter-from {
    opacity: 0;
    transform: scale(0.8);
}

.service-filter-leave-to {
    opacity: 0;
    transform: scale(0.8);
}

/* Ensure buttons maintain their position during transitions */
.service-filter-enter-active,
.service-filter-leave-active,
.service-filter-move {
    transition: all 0.3s ease;
}

/* Service card animations */
.service-card-enter-from {
    opacity: 0;
    transform: translateX(-5px) scale(0.01);
}

.service-card-leave-to {
    opacity: 0;
    transform: translateX(5px) scale(0.01);
}

.service-card-enter-active,
.service-card-leave-active,
.service-card-move {
    transition: all 0.4s ease;
}
</style>
