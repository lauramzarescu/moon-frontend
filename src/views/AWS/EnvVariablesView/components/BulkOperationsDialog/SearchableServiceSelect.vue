<template>
    <Popover v-model:open="open">
        <PopoverTrigger as-child>
            <Button
                variant="outline"
                role="combobox"
                :aria-expanded="open"
                class="w-full justify-between"
                :disabled="disabled"
            >
                <span class="truncate">
                    {{ selectedServiceLabel || placeholder }}
                </span>
                <ChevronsUpDownIcon class="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
        </PopoverTrigger>
        <PopoverContent class="w-full p-0" align="start">
            <Command :filter="filterFunction">
                <CommandInput :placeholder="searchPlaceholder" />
                <CommandList>
                    <CommandEmpty>No services found.</CommandEmpty>
                    <template v-for="cluster in sortedServicesByCluster" :key="cluster.clusterName">
                        <CommandGroup :heading="cluster.clusterName">
                            <CommandItem
                                v-for="service in cluster.services"
                                :key="service.name"
                                :value="getServiceSearchValue(service)"
                                @select="selectService(service)"
                                class="cursor-pointer"
                            >
                                <CheckIcon
                                    :class="[
                                        'mr-2 h-4 w-4',
                                        modelValue === service.name ? 'opacity-100' : 'opacity-0'
                                    ]"
                                />
                                <div class="flex items-center justify-between w-full">
                                    <span class="font-medium">{{ service.name }}</span>
                                    <Badge 
                                        :variant="service.isClusterProduction ? 'destructive' : 'secondary'"
                                        class="text-xs ml-2"
                                    >
                                        {{ service.clusterName }}
                                    </Badge>
                                </div>
                            </CommandItem>
                        </CommandGroup>
                    </template>
                </CommandList>
            </Command>
        </PopoverContent>
    </Popover>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { CheckIcon, ChevronsUpDownIcon } from 'lucide-vue-next';
import type { ServiceInterface } from '@/views/AWS/Services/types/service.interface';

interface Props {
    modelValue: string;
    availableServices: ServiceInterface[];
    placeholder?: string;
    searchPlaceholder?: string;
    disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    placeholder: 'Select service',
    searchPlaceholder: 'Search services...',
    disabled: false,
});

const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void;
}>();

const open = ref(false);

// Computed properties
const selectedService = computed(() => 
    props.availableServices.find(service => service.name === props.modelValue)
);

const selectedServiceLabel = computed(() => {
    if (!selectedService.value) return '';
    return `${selectedService.value.name} (${selectedService.value.clusterName})`;
});

const sortedServicesByCluster = computed(() => {
    // Group services by cluster
    const servicesByCluster = new Map<string, ServiceInterface[]>();
    
    props.availableServices.forEach(service => {
        if (!servicesByCluster.has(service.clusterName)) {
            servicesByCluster.set(service.clusterName, []);
        }
        servicesByCluster.get(service.clusterName)!.push(service);
    });
    
    // Sort clusters alphabetically and services within each cluster
    const sortedClusters = Array.from(servicesByCluster.entries())
        .sort(([clusterA], [clusterB]) => clusterA.localeCompare(clusterB))
        .map(([clusterName, services]) => ({
            clusterName,
            services: services.sort((a, b) => a.name.localeCompare(b.name))
        }));
    
    return sortedClusters;
});

// Methods
const getServiceSearchValue = (service: ServiceInterface): string => {
    return `${service.name} ${service.clusterName}`;
};

const selectService = (service: ServiceInterface) => {
    emit('update:modelValue', service.name);
    open.value = false;
};

const filterFunction = (value: string, search: string): number => {
    const searchLower = search.toLowerCase();
    const valueLower = value.toLowerCase();
    
    // Search in both service name and cluster name
    if (valueLower.includes(searchLower)) {
        return 1;
    }
    
    return 0;
};
</script>
