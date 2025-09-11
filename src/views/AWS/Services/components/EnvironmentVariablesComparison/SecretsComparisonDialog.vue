<script setup lang="ts">
import type { ServiceInterface } from '@/views/AWS/Services/types/service.interface.ts';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { GitCompareIcon, InfoIcon, Loader2Icon } from 'lucide-vue-next';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Cross2Icon } from '@radix-icons/vue';
import { computed, reactive, ref, Transition, TransitionGroup, watch } from 'vue';
import ServiceComparisonCard from './ServiceComparisonCard.vue';

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
const isLoading = ref(false);

const MAX_SERVICES_TO_COMPARE = 8;

const allAvailableServices = computed(() => {
    return transformServices(props.services || []);
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

watch(isOpen, async (newValue) => {
    if (newValue) {
        isLoading.value = true;
        resetDialogState(dialogState);
        initializeSelectedServices(dialogState, filteredAvailableServices.value, hasFilteredServices.value ?? false);
        dialogState.showAllServices = props.showAllServices ?? false;

        await new Promise((resolve) => setTimeout(resolve, 300));
        isLoading.value = false;
    } else {
        resetDialogState(dialogState);
        isLoading.value = false;
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

const handleToggleService = async (service: any) => {
    const isCurrentlySelected = isServiceSelected(dialogState, service);
    if (!isCurrentlySelected && !canAddMoreServices.value) {
        return;
    }

    isLoading.value = true;
    toggleService(dialogState, service);

    await new Promise((resolve) => setTimeout(resolve, 150));
    isLoading.value = false;
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

const gridClass = computed(() => {
    // Always use horizontal flex with scrolling
    return 'flex gap-4 overflow-x-auto pb-2';
});

const serviceCardWidth = computed(() => {
    // Always use fixed width for consistent comparison
    return 'flex-shrink-0 w-80 min-h-[200px]';
});
</script>

<template>
    <Dialog v-model:open="isOpen">
        <DialogTrigger as-child>
            <Button variant="outline" size="sm" class="h-8 hover:shadow-md" :disabled="isLoading">
                <Loader2Icon v-if="isLoading" class="h-4 w-4 mr-2 animate-spin" />
                <GitCompareIcon v-else class="h-4 w-4" />
                Compare Variables
            </Button>
        </DialogTrigger>
        <DialogContent class="max-w-7xl h-[90vh] flex flex-col">
            <DialogHeader>
                <DialogTitle class="flex items-center gap-3">
                    <GitCompareIcon class="h-5 w-5 text-primary animate-pulse" />
                    <span class="glitch-text">Compare Environment Variables & Secrets</span>
                    <Badge v-if="hasFilteredServices" variant="outline" class="ml-2 transition-all duration-200">
                        {{ filteredAvailableServices.length }} filtered / {{ allAvailableServices.length }} total
                    </Badge>
                    <Badge v-else variant="outline" class="ml-2 transition-all duration-200">
                        {{ allAvailableServices.length }} services
                    </Badge>
                </DialogTitle>
                <DialogDescription class="text-muted-foreground">
                    Multi-service comparison of environment variables and secrets across selected services
                </DialogDescription>
            </DialogHeader>

            <!-- Service Selection Section -->
            <div class="border-b pb-4">
                <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center gap-3">
                        <Label class="text-sm font-medium">Services</Label>
                        <Badge variant="secondary" class="text-xs h-5">
                            {{ dialogState.selectedServices.length }}/{{ MAX_SERVICES_TO_COMPARE }}
                        </Badge>
                        <span class="text-xs text-muted-foreground">({{ displayedServices.length }} available)</span>
                    </div>
                    <div class="flex items-center gap-3">
                        <!-- Compare by value switch with tooltip -->
                        <div class="flex items-center space-x-1">
                            <Checkbox id="compare-values" v-model:checked="dialogState.compareByValue" />
                            <Label for="compare-values" class="text-xs">Compare by value</Label>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger as-child>
                                        <InfoIcon class="h-4 w-4 text-muted-foreground cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p class="max-w-sm text-sm">
                                            {{
                                                dialogState.compareByValue
                                                    ? 'Variables must have the same name AND value to be considered common'
                                                    : 'Variables with the same name will be considered common (values may differ)'
                                            }}
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        <!-- Show all services button -->
                        <Button v-if="hasFilteredServices" variant="ghost" size="sm" @click="toggleServiceView" class="text-xs h-6 px-2">
                            {{ dialogState.showAllServices ? 'Filtered' : 'All' }}
                        </Button>
                    </div>
                </div>

                <div class="max-h-32 overflow-y-auto p-2 border rounded bg-muted/20">
                    <TransitionGroup name="service-filter" tag="div" class="flex flex-wrap gap-1" v-if="displayedServices.length > 0">
                        <Button
                            v-for="service in displayedServices"
                            :key="`${service.clusterName}-${service.serviceName}`"
                            :variant="handleIsServiceSelected(service) ? 'default' : 'outline'"
                            :disabled="!handleIsServiceSelected(service) && !canAddMoreServices"
                            size="sm"
                            @click="handleToggleService(service)"
                            class="text-xs h-7 max-w-[180px] min-w-0 transition-all duration-200 flex items-center gap-1"
                            :title="`${handleIsServiceSelected(service) ? 'Remove' : 'Add'} ${service.clusterName} / ${service.serviceName}`"
                        >
                            <span class="truncate block"> {{ service.clusterName }} / {{ service.serviceName }} </span>
                            <Cross2Icon v-if="handleIsServiceSelected(service)" class="h-2 w-2 flex-shrink-0 opacity-70" />
                        </Button>
                    </TransitionGroup>
                    <div v-else class="text-center py-3 text-xs text-muted-foreground">No services available</div>
                </div>

                <!-- Warning message when max services reached -->
                <Transition name="fade">
                    <div v-if="isMaxServicesReached" class="mt-2 p-1 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                        Max {{ MAX_SERVICES_TO_COMPARE }} services selected
                    </div>
                </Transition>
            </div>

            <!-- Comparison Results -->
            <div v-if="dialogState.selectedServices.length > 1" class="flex-1 flex flex-col min-h-0">
                <!-- Summary Stats -->
                <div class="grid grid-cols-4 gap-4 py-4 border-b flex-shrink-0">
                    <div class="text-center">
                        <div class="text-2xl font-bold text-green-600">{{ comparisonStats.commonVariables }}</div>
                        <div class="text-sm text-muted-foreground">Common</div>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl font-bold text-blue-600">{{ comparisonStats.uniqueVariables }}</div>
                        <div class="text-sm text-muted-foreground">Unique</div>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl font-bold text-yellow-600">{{ comparisonStats.conflictingVariables }}</div>
                        <div class="text-sm text-muted-foreground">Conflicts</div>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl font-bold text-slate-600">{{ comparisonStats.totalVariables }}</div>
                        <div class="text-sm text-muted-foreground">Total</div>
                    </div>
                </div>

                <!-- Main Comparison Table -->
                <div class="flex-1 overflow-y-auto">
                    <div class="p-3">
                        <Transition name="content-fade" mode="out-in">
                            <!-- Loading State -->
                            <div v-if="isLoading" key="loading" class="space-y-4" role="status" aria-label="Loading comparison data">
                                <div :class="gridClass">
                                    <div
                                        v-for="i in dialogState.selectedServices.length"
                                        :key="`skeleton-${i}`"
                                        :class="[serviceCardWidth, 'border rounded-lg p-4 bg-muted/20 animate-pulse hover-lift']"
                                        :style="{ animationDelay: `${i * 0.1}s` }"
                                        role="presentation"
                                    >
                                        <!-- Service header skeleton -->
                                        <div class="border-b pb-3 mb-3">
                                            <div class="h-5 bg-muted-foreground/30 rounded w-3/4"></div>
                                        </div>

                                        <!-- Environment variables section skeleton -->
                                        <div class="space-y-3 mb-4">
                                            <div class="flex items-center gap-2">
                                                <div class="h-4 w-4 bg-muted-foreground/30 rounded"></div>
                                                <div class="h-4 bg-muted-foreground/30 rounded w-32"></div>
                                            </div>
                                            <div class="space-y-2 pl-6">
                                                <div class="h-3 bg-muted-foreground/20 rounded"></div>
                                                <div class="h-3 bg-muted-foreground/20 rounded w-4/5"></div>
                                                <div class="h-3 bg-muted-foreground/20 rounded w-3/5"></div>
                                            </div>
                                        </div>

                                        <!-- Secrets section skeleton -->
                                        <div class="space-y-3">
                                            <div class="flex items-center gap-2">
                                                <div class="h-4 w-4 bg-muted-foreground/30 rounded"></div>
                                                <div class="h-4 bg-muted-foreground/30 rounded w-20"></div>
                                            </div>
                                            <div class="space-y-2 pl-6">
                                                <div class="h-3 bg-muted-foreground/20 rounded w-3/4"></div>
                                                <div class="h-3 bg-muted-foreground/20 rounded w-1/2"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Comparison Results -->
                            <div v-else key="results" class="space-y-4">
                                <TransitionGroup name="service-card" tag="div" :class="gridClass">
                                    <ServiceComparisonCard
                                        v-for="service in dialogState.selectedServices"
                                        :key="`${service.clusterName}-${service.serviceName}`"
                                        :service="service"
                                        :comparison-data="handleGetServiceComparisonData(service)"
                                        :compare-by-value="dialogState.compareByValue"
                                        :class="serviceCardWidth + ' hover-lift'"
                                    />
                                </TransitionGroup>
                            </div>
                        </Transition>
                    </div>
                </div>
            </div>

            <!-- Empty States -->
            <div v-else-if="dialogState.selectedServices.length === 1" class="flex-1 flex items-center justify-center">
                <div class="text-center">
                    <GitCompareIcon class="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <h3 class="text-lg font-medium mb-1">Select More Services</h3>
                    <p class="text-sm text-muted-foreground">Choose at least one more service to compare</p>
                </div>
            </div>

            <div v-else class="flex-1 flex items-center justify-center">
                <div class="text-center">
                    <GitCompareIcon class="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <h3 class="text-lg font-medium mb-1">Select Services to Compare</h3>
                    <p class="text-sm text-muted-foreground">Choose services from the list above</p>
                </div>
            </div>

            <!-- Footer -->
            <div class="flex items-center justify-end gap-2 pt-4 border-t flex-shrink-0">
                <Button variant="outline" @click="isOpen = false" class="transition-all duration-200 hover:shadow-sm hover:scale-[1.02]">
                    Close
                </Button>
            </div>
        </DialogContent>
    </Dialog>
</template>

<style scoped>
/* Content fade transitions */
.content-fade-enter-from,
.content-fade-leave-to {
    opacity: 0;
    transform: translateY(10px);
}

.content-fade-enter-active,
.content-fade-leave-active {
    transition: all 0.3s ease;
}

/* Fade transition for warning messages */
.fade-enter-from,
.fade-leave-to {
    opacity: 0;
    transform: translateY(-10px);
}

.fade-enter-active,
.fade-leave-active {
    transition: all 0.3s ease;
}

/* Service filter animations with improved easing */
.service-filter-enter-from {
    opacity: 0;
    transform: scale(0.9) translateY(-5px);
}

.service-filter-leave-to {
    opacity: 0;
    transform: scale(0.9) translateY(5px);
}

.service-filter-enter-active,
.service-filter-leave-active,
.service-filter-move {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Service card animations with smooth scaling */
.service-card-enter-from {
    opacity: 0;
    transform: translateX(-10px) scale(0.95);
}

.service-card-leave-to {
    opacity: 0;
    transform: translateX(10px) scale(0.95);
}

.service-card-enter-active,
.service-card-leave-active,
.service-card-move {
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Glitch-style animation for primary elements */
.glitch-text {
    position: relative;
}

.glitch-text::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: -2px;
    height: 2px;
    background: linear-gradient(90deg, transparent, rgba(112, 51, 255, 0.4), transparent);
    animation: glitch-line 2s ease-in-out infinite;
}

@keyframes glitch-line {
    0%,
    100% {
        opacity: 0.4;
    }
    50% {
        opacity: 0.8;
    }
}

/* Smooth hover effects */
.hover-lift {
    transition:
        transform 0.2s ease,
        box-shadow 0.2s ease;
}

.hover-lift:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Loading skeleton animations */
@keyframes skeleton-pulse {
    0%,
    100% {
        opacity: 1;
    }
    50% {
        opacity: 0.4;
    }
}

.animate-pulse {
    animation: skeleton-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Custom scrollbar styling for horizontal scroll */
.overflow-x-auto {
    scrollbar-width: thin;
    scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
}

.overflow-x-auto::-webkit-scrollbar {
    height: 8px;
}

.overflow-x-auto::-webkit-scrollbar-track {
    background: transparent;
    border-radius: 4px;
}

.overflow-x-auto::-webkit-scrollbar-thumb {
    background: rgba(156, 163, 175, 0.5);
    border-radius: 4px;
    transition: background 0.2s ease;
}

.overflow-x-auto::-webkit-scrollbar-thumb:hover {
    background: rgba(156, 163, 175, 0.7);
}

/* Smooth scroll behavior */
.overflow-x-auto {
    scroll-behavior: smooth;
}
</style>
