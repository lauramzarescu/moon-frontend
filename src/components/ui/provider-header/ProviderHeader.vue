<script setup lang="ts">
import { useDataStore } from '@/stores/dataStore.ts';
import { onMounted, onUnmounted, ref } from 'vue';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronDownIcon } from '@radix-icons/vue';
import { Clock, Cloud, RefreshCw } from 'lucide-vue-next';
import { useSocket } from '@/composables/useSocket.ts';
import StuckDeploymentBanner from '@/components/ui/stuck-deployment/StuckDeploymentBanner.vue';
import InProgressDeploymentBanner from '@/components/ui/in-progress-deployment/InProgressDeploymentBanner.vue';

const store = useDataStore();
const { setRefreshInterval } = useSocket();

const currentDate = ref(new Date());
const lastUpdated = ref('Loading...');
const timeInterval = ref<number>(1000); // milliseconds
const isPopoverOpen = ref(false);

const refreshOptions = [
    { value: 5, label: '5 seconds', description: 'Update every 5 seconds' },
    { value: 10, label: '10 seconds', description: 'Update every 10 seconds' },
    { value: 15, label: '15 seconds', description: 'Update every 15 seconds' },
    { value: 60, label: '1 minute', description: 'Update every minute' },
    { value: 0, label: 'Manual refresh', description: 'Refresh only when requested' },
    {
        value: -1,
        label: 'Dynamic refresh',
        description: 'The refresh interval is updated dynamically by the server.',
    },
];

const handleRefreshIntervalChange = (interval: number) => {
    setRefreshInterval(interval);
    store.refreshInterval = interval;
    store.refreshIsDynamic = interval === -1;
    isPopoverOpen.value = false;
};

const handleManualRefresh = () => {
    store.manualRefresh();
};

onMounted(() => {
    setInterval(() => {
        currentDate.value = new Date();
        lastUpdated.value = store?.updatedOn ? new Date(store.updatedOn).toLocaleString() : 'N/A';
    }, timeInterval.value);
});

onUnmounted(() => {
    if (timeInterval.value) {
        clearInterval(timeInterval.value);
    }
});
</script>
<template>
    <div class="space-y-4">
        <!-- Main Provider Header Card -->
        <Card class="p-3 md:p-3">
            <div class="flex items-center justify-between gap-4">
                <!-- Left Section: Provider Info -->
                <div class="flex items-center gap-3 flex-shrink-0">
                    <div class="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <Cloud class="h-4 w-4" />
                    </div>
                    <div class="min-w-0">
                        <h2 class="text-base font-semibold text-foreground leading-tight">AWS Provider</h2>
                    </div>
                </div>

                <!-- Center Section: Status and Time Info -->
                <div class="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                    <!-- Manual Refresh Button -->
                    <Button
                        @click="handleManualRefresh"
                        variant="outline-default"
                        size="sm"
                        class="h-8 w-8 p-0 hover:shadow-sm group"
                        aria-label="Refresh"
                        title="Refresh data manually"
                    >
                        <RefreshCw class="h-4 w-4 transition-transform duration-200 group-hover:rotate-180" />
                    </Button>

                    <!-- Refresh Mode Badge -->
                    <Badge class="h-6 px-2 hidden sm:inline-flex items-center">
                        {{
                            store.refreshIsDynamic
                                ? `Dynamic (${store.refreshInterval}s)`
                                : store.refreshInterval > 0
                                  ? `Auto: ${store.refreshInterval}s`
                                  : 'Manual'
                        }}
                    </Badge>

                    <!-- Last Updated Chip -->
                    <div class="inline-flex items-center gap-1.5 text-sm rounded-md border bg-background border-input px-4 py-1 min-w-0">
                        <Clock class="h-3.5 w-3.5 text-muted-foreground" />
                        <span class="hidden md:inline text-muted-foreground">Last updated</span>
                        <span class="text-foreground">{{ lastUpdated }}</span>
                    </div>

                    <!-- Current Time Chip -->
                    <div
                        class="hidden md:inline-flex items-center text-sm gap-1.5 rounded-md border bg-background border-input px-4 py-1 min-w-0"
                    >
                        <Clock class="h-3.5 w-3.5 text-muted-foreground" />
                        <span class="hidden md:inline text-muted-foreground">Current time</span>
                        <span class="text-foreground"> {{ currentDate.toLocaleDateString() }} {{ currentDate.toLocaleTimeString() }} </span>
                    </div>
                </div>

                <!-- Right Section: Refresh Settings -->
                <div class="flex-shrink-0">
                    <Popover v-model:open="isPopoverOpen">
                        <PopoverTrigger as-child>
                            <Button variant="outline-default" size="sm" class="hover:shadow-sm">
                                <span class="hidden lg:inline">
                                    {{
                                        store.refreshIsDynamic
                                            ? `Dynamic refresh (${store.refreshInterval}s)`
                                            : refreshOptions.find((option) => option.value === store.refreshInterval)?.label
                                    }}
                                </span>
                                <span class="lg:hidden">
                                    {{ store.refreshIsDynamic ? 'Dynamic' : `${store.refreshInterval}s` }}
                                </span>
                                <ChevronDownIcon
                                    class="ml-2 h-4 w-4 transition-transform duration-200"
                                    :class="{ 'rotate-180': isPopoverOpen }"
                                />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent class="p-0" align="end">
                            <div class="overflow-auto">
                                <div
                                    v-for="option in refreshOptions"
                                    :key="option.value"
                                    :class="{
                                        'bg-accent rounded-lg text-foreground font-medium': store.refreshInterval === option.value,
                                    }"
                                    class="space-y-1 flex flex-col items-start px-4 py-2 cursor-pointer transition-colors hover:bg-muted/40 w-full"
                                    @click="handleRefreshIntervalChange(option.value)"
                                >
                                    <div class="flex items-center justify-between w-full">
                                        <p>{{ option.label }}</p>
                                        <span v-if="store.refreshInterval === option.value" class="ml-2 text-xs">✓</span>
                                    </div>
                                    <p class="text-sm text-muted-foreground">
                                        {{ option.description }}
                                    </p>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>
        </Card>

        <!-- Deployment Banners -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <InProgressDeploymentBanner />
            <StuckDeploymentBanner />
        </div>
    </div>
</template>
