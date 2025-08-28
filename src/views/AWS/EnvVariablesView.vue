<template>
    <ProviderHeader />

    <div class="p-3 md:p-4 h-[calc(100vh-140px)] flex flex-col gap-4 w-full overflow-hidden">
        <!-- Header Section -->
        <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-3">
                <div class="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shadow-sm">
                    <SettingsIcon class="h-5 w-5" />
                </div>
                <div>
                    <h2 class="text-lg font-semibold leading-tight tracking-tight glitch-text">Environment Variables & Secrets</h2>
                    <p class="text-sm text-muted-foreground">Service-based environment variable management</p>
                </div>
            </div>
            <div class="flex items-center gap-3">
                <Button size="sm" variant="outline" class="hover:shadow-sm group transition-all duration-200" @click="refreshServices">
                    <RefreshCwIcon class="h-4 w-4 mr-2 transition-transform duration-200 group-hover:rotate-180" />
                    Refresh
                </Button>
                <Button size="sm" class="hover:shadow-sm transition-all duration-200" @click="openVersionComparison">
                    <GitCompareIcon class="h-4 w-4 mr-2" />
                    Compare Versions
                </Button>
            </div>
        </div>

        <!-- Search and Filter Section -->
        <div class="flex items-center gap-3">
            <div class="relative flex-1 max-w-md">
                <Input v-model="searchQuery" placeholder="Search services..." class="pl-10 transition-all duration-200 focus:shadow-md" />
                <SearchIcon class="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            </div>
            <Select v-model="clusterFilter">
                <SelectTrigger class="w-[200px] hover:shadow-sm transition-all duration-200">
                    <SelectValue placeholder="All Clusters" />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        <SelectItem value="all">All Clusters</SelectItem>
                        <SelectItem v-for="cluster in clusterOptions" :key="cluster" :value="cluster">
                            {{ cluster }}
                        </SelectItem>
                    </SelectGroup>
                </SelectContent>
            </Select>
        </div>

        <!-- Services Grid -->
        <div class="flex-1 overflow-hidden">
            <div class="h-full overflow-y-auto">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-1">
                    <TransitionGroup name="service-card" appear>
                        <ServiceCard
                            v-for="service in filteredServices"
                            :key="`${service.clusterName}-${service.name}`"
                            :service="service"
                            @click="openServiceDialog(service)"
                        />
                    </TransitionGroup>
                </div>

                <!-- Empty State -->
                <div v-if="filteredServices.length === 0" class="flex flex-col items-center justify-center h-64 text-center">
                    <div class="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                        <ServerIcon class="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 class="text-lg font-medium mb-2">No services found</h3>
                    <p class="text-muted-foreground max-w-sm">
                        {{ searchQuery ? 'Try adjusting your search criteria' : 'No services available in the selected cluster' }}
                    </p>
                </div>
            </div>
        </div>
    </div>

    <!-- Service Environment Variables Dialog -->
    <ServiceEnvironmentDialog v-model:open="serviceDialog.isOpen" :service="serviceDialog.service" @refresh="handleRefresh" />

    <!-- Version Comparison Dialog -->
    <VersionComparisonDialog v-model:open="versionComparisonDialog.isOpen" :services="filteredServices" />
</template>

<script setup lang="ts">
import ProviderHeader from '@/components/ui/provider-header/ProviderHeader.vue';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GitCompareIcon, RefreshCwIcon, SearchIcon, ServerIcon, SettingsIcon } from 'lucide-vue-next';
import { computed, reactive, ref, TransitionGroup } from 'vue';
import { storeToRefs } from 'pinia';
import { useDataStore } from '@/stores/dataStore.ts';
import { useToast } from '@/components/ui/toast';
import type { ServiceInterface } from '@/views/AWS/Services/types/service.interface';
import ServiceCard from './EnvVariablesView/components/ServiceCard.vue';
import ServiceEnvironmentDialog from './EnvVariablesView/components/ServiceEnvironmentDialog.vue';
import VersionComparisonDialog from './EnvVariablesView/components/VersionComparisonDialog.vue';

const store = useDataStore();
const { services } = storeToRefs(store);
const { toast } = useToast();

// Reactive state
const searchQuery = ref('');
const clusterFilter = ref<string>('all');

// Dialog states
const serviceDialog = reactive({
    isOpen: false,
    service: null as ServiceInterface | null,
});

const versionComparisonDialog = reactive({
    isOpen: false,
});

// Computed properties
const clusterOptions = computed(() => Array.from(new Set(services.value.map((s) => s.clusterName))).sort());

const filteredServices = computed(() => {
    let filtered = services.value;

    // Filter by cluster
    if (clusterFilter.value !== 'all') {
        filtered = filtered.filter((s) => s.clusterName === clusterFilter.value);
    }

    // Filter by search query
    if (searchQuery.value.trim()) {
        const query = searchQuery.value.toLowerCase().trim();
        filtered = filtered.filter((s) => s.name.toLowerCase().includes(query) || s.clusterName.toLowerCase().includes(query));
    }

    return filtered.sort((a, b) => a.name.localeCompare(b.name));
});


const openServiceDialog = (service: ServiceInterface) => {
    serviceDialog.service = service;
    serviceDialog.isOpen = true;
};

const openVersionComparison = () => {
    versionComparisonDialog.isOpen = true;
};

const refreshServices = () => {
    store.manualRefresh();
    toast({
        variant: 'success',
        title: 'Refreshed',
        description: 'Services data has been updated.',
    });
};

const handleRefresh = () => {
    store.manualRefresh();
};
</script>

<style scoped>
/* Service card animations */
.service-card-enter-active,
.service-card-leave-active {
    transition: all 0.3s ease;
}

.service-card-enter-from,
.service-card-leave-to {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
}

.service-card-move {
    transition: transform 0.3s ease;
}

/* Glitch text effect */
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
    background: linear-gradient(90deg, transparent, rgba(124, 58, 237, 0.4), transparent);
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

/* Tilt effect */
.tilt {
    transition: transform 0.2s ease;
}

.tilt:hover {
    transform: rotate(1deg) scale(1.02);
}
</style>
