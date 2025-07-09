import { computed, ref } from 'vue';
import type { TransformedService } from '../types';

export function useServiceFiltering(services: TransformedService[]) {
    const searchQuery = ref('');
    const statusFilter = ref('all');
    const clusterFilter = ref('all');

    const filteredServices = computed(() => {
        let filtered = services;

        // Apply search filter
        if (searchQuery.value.trim()) {
            const query = searchQuery.value.toLowerCase().trim();
            filtered = filtered.filter((service) => {
                const clusterName = service.clusterName.toLowerCase();
                const serviceName = service.serviceName.toLowerCase();
                const image = service.image.toLowerCase();
                return clusterName.includes(query) || serviceName.includes(query) || image.includes(query);
            });
        }

        // Apply status filter
        if (statusFilter.value !== 'all') {
            filtered = filtered.filter((service) => service.status.toLowerCase() === statusFilter.value.toLowerCase());
        }

        // Apply cluster filter
        if (clusterFilter.value !== 'all') {
            filtered = filtered.filter((service) => service.clusterName === clusterFilter.value);
        }

        return filtered;
    });

    const availableClusters = computed(() => {
        const clusters = new Set(services.map((s) => s.clusterName));
        return Array.from(clusters).sort();
    });

    const availableStatuses = computed(() => {
        const statuses = new Set(services.map((s) => s.status));
        return Array.from(statuses).sort();
    });

    const clearFilters = () => {
        searchQuery.value = '';
        statusFilter.value = 'all';
        clusterFilter.value = 'all';
    };

    return {
        searchQuery,
        statusFilter,
        clusterFilter,
        filteredServices,
        availableClusters,
        availableStatuses,
        clearFilters,
    };
}
