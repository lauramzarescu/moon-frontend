<template>
    <div class="flex gap-6 h-full">
        <!-- Left Panel - Available Services -->
        <div class="flex-1 flex flex-col">
            <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-2">
                    <h3 class="text-lg font-semibold">Available Services</h3>
                    <Badge variant="outline">{{ displayedServices.length }} services</Badge>
                </div>
                <Button v-if="hasFilteredServices" variant="ghost" size="sm" @click="$emit('view-toggled')">
                    {{ showAllServices ? 'Show Filtered Only' : 'Show All Services' }}
                </Button>
            </div>

            <!-- Search and Filters -->
            <div class="space-y-3 mb-4 ml-1">
                <div class="relative">
                    <SearchIcon class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input v-model="searchQuery" placeholder="Search by cluster or service name..." class="pl-10 pr-10" />
                    <Button
                        v-if="searchQuery"
                        variant="ghost"
                        size="sm"
                        @click="searchQuery = ''"
                        class="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                    >
                        <XIcon class="h-3 w-3" />
                    </Button>
                </div>

                <!-- Status Filter -->
                <div class="flex items-center gap-2">
                    <Label class="text-sm">Filter by status:</Label>
                    <Select v-model="statusFilter">
                        <SelectTrigger class="w-32">
                            <SelectValue placeholder="All" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <!-- Services List -->
            <div class="flex-1 overflow-y-auto border rounded-lg">
                <div v-if="filteredServices.length > 0" class="p-4 space-y-3">
                    <ServiceCard
                        v-for="service in filteredServices"
                        :key="`${service.clusterName}-${service.serviceName}`"
                        :service="service"
                        :is-selected="isServiceSelected(service)"
                        :is-disabled="!isServiceSelected(service) && selectedServices.length >= maxServices"
                        @toggle="$emit('service-toggled', service)"
                    />
                </div>
                <div v-else class="flex items-center justify-center h-32 text-muted-foreground">
                    <div class="text-center">
                        <ServerIcon class="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No services found</p>
                    </div>
                </div>
            </div>

            <!-- Selection Limit Warning -->
            <div v-if="selectedServices.length >= maxServices" class="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div class="flex items-center gap-2">
                    <AlertTriangleIcon class="h-4 w-4 text-yellow-600" />
                    <p class="text-sm text-yellow-800">Maximum {{ maxServices }} services reached. Remove a service to add another.</p>
                </div>
            </div>
        </div>

        <!-- Right Panel - Selected Services Summary -->
        <div class="w-80 flex flex-col">
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold">Selected Services</h3>
                <Badge>{{ selectedServices.length }}/{{ maxServices }}</Badge>
            </div>

            <div class="flex-1 overflow-y-auto border rounded-lg">
                <div v-if="selectedServices.length > 0" class="p-4 space-y-3">
                    <SelectedServiceCard
                        v-for="service in selectedServices"
                        :key="`selected-${service.clusterName}-${service.serviceName}`"
                        :service="service"
                        @remove="$emit('service-toggled', service)"
                    />
                </div>
                <div v-else class="flex items-center justify-center h-32 text-muted-foreground">
                    <div class="text-center">
                        <CheckSquareIcon class="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p class="text-sm">No services selected</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangleIcon, CheckSquareIcon, SearchIcon, ServerIcon, XIcon } from 'lucide-vue-next';
import type { ServiceInterface } from '@/views/AWS/Services/types/service.interface.ts';
import type { TransformedService } from '../types';
import { useServiceTransform } from '../composables/useServiceTransform';
import ServiceCard from './ServiceCard.vue';
import SelectedServiceCard from './SelectedServiceCard.vue';

const props = defineProps<{
    services: ServiceInterface[];
    filteredServices?: ServiceInterface[];
    showAllServices?: boolean;
    selectedServices: TransformedService[];
    maxServices: number;
}>();

const emit = defineEmits<{
    (e: 'service-toggled', service: TransformedService): void;
    (e: 'view-toggled'): void;
}>();

const { transformServices } = useServiceTransform();

const searchQuery = ref('');
const statusFilter = ref('all');

const allAvailableServices = computed(() => transformServices(props.services || []));
const filteredAvailableServices = computed(() => transformServices(props.filteredServices || []));

const hasFilteredServices = computed(() => {
    return props.filteredServices && props.filteredServices.length > 0;
});

const displayedServices = computed(() => {
    if (props.showAllServices) {
        return allAvailableServices.value;
    }
    return filteredAvailableServices.value.length > 0 ? filteredAvailableServices.value : allAvailableServices.value;
});

const filteredServices = computed(() => {
    let services = displayedServices.value;

    if (searchQuery.value.trim()) {
        const query = searchQuery.value.toLowerCase().trim();
        services = services.filter((service) => {
            const clusterName = service.clusterName.toLowerCase();
            const serviceName = service.serviceName.toLowerCase();
            return clusterName.includes(query) || serviceName.includes(query);
        });
    }

    if (statusFilter.value !== 'all') {
        services = services.filter((service) => service.status.toLowerCase() === statusFilter.value.toLowerCase());
    }

    return services;
});

const isServiceSelected = (service: TransformedService): boolean => {
    return props.selectedServices.some(
        (selected) => selected.clusterName === service.clusterName && selected.serviceName === service.serviceName,
    );
};
</script>
