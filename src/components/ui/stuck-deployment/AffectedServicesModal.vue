<template>
    <Dialog :open="isOpen" @update:open="$emit('update:isOpen', $event)">
        <DialogContent class="sm:max-w-[800px]">
            <DialogHeader>
                <DialogTitle>Affected Services</DialogTitle>
                <DialogDescription> Services with stuck deployments</DialogDescription>
            </DialogHeader>

            <div class="max-h-[60vh] overflow-y-auto">
                <div v-if="stuckServices.length === 0" class="py-4 text-center text-gray-500">No stuck deployments found</div>

                <div v-else class="space-y-4">
                    <Card
                        v-for="service in stuckServices"
                        :key="`${service.clusterName}-${service.name}`"
                        class="border-yellow-300 bg-yellow-50/50 dark:bg-yellow-900/10 dark:border-yellow-800"
                    >
                        <div class="p-4">
                            <div class="flex justify-between items-start mb-3">
                                <h3 class="font-semibold text-base">
                                    {{ service.name }}
                                    <span class="text-xs bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded ml-2">
                                        {{ service.clusterName }}
                                    </span>
                                </h3>
                                <Badge variant="outline" class="text-yellow-700 border-yellow-300 bg-yellow-100">
                                    Stuck for {{ getStuckTime(service) }}
                                </Badge>
                            </div>

                            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div v-if="getServiceCurrentImage(service)" class="bg-white dark:bg-slate-800 rounded-md p-2 shadow-sm">
                                    <div class="text-xs font-medium text-slate-500 dark:text-slate-400">Current image</div>
                                    <div class="text-xs font-mono truncate" :title="getServiceCurrentImage(service)">
                                        {{ getServiceCurrentImage(service) }}
                                    </div>
                                </div>

                                <div v-if="getServiceTargetImage(service)" class="bg-white dark:bg-slate-800 rounded-md p-2 shadow-sm">
                                    <div class="text-xs font-medium text-slate-500 dark:text-slate-400">Target image</div>
                                    <div class="text-xs font-mono truncate" :title="getServiceTargetImage(service)">
                                        {{ getServiceTargetImage(service) }}
                                    </div>
                                </div>
                            </div>

                            <!-- Display failure reason if available -->
                            <div v-if="getServiceFailureReason(service)" class="mt-3 bg-white dark:bg-slate-800 rounded-md p-2 shadow-sm">
                                <div class="text-xs font-medium text-slate-500 dark:text-slate-400">Failure Reason</div>
                                <div class="text-xs text-red-600 dark:text-red-400">{{ getServiceFailureReason(service) }}</div>
                            </div>

                            <div class="mt-3 text-sm">
                                <div class="flex items-center gap-2">
                                    <div class="flex items-center">
                                        <span class="text-xs font-medium text-slate-500 mr-1">Desired:</span>
                                        <span class="text-xs">{{ service.desiredCount }}</span>
                                    </div>
                                    <div class="flex items-center">
                                        <span class="text-xs font-medium text-slate-500 mr-1">Running:</span>
                                        <span class="text-xs">{{ service.runningCount }}</span>
                                    </div>
                                    <div class="flex items-center">
                                        <span class="text-xs font-medium text-slate-500 mr-1">Pending:</span>
                                        <span class="text-xs">{{ service.pendingCount }}</span>
                                    </div>
                                </div>
                            </div>

                            <!-- View Service Details Button -->
                            <Button
                                variant="outline"
                                size="sm"
                                class="mt-3 bg-white dark:bg-slate-800 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-50 dark:hover:bg-slate-700"
                                @click="openServiceDrawer(service)"
                            >
                                View service details
                                <ChevronRight class="h-3.5 w-3.5 ml-1" />
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>

            <DialogFooter>
                <Button variant="outline" @click="$emit('update:isOpen', false)">Close</Button>
                <Button @click="dataStore.manualRefresh">Refresh Data</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>

    <!-- Service Drawer -->
    <component
        v-if="selectedService && isServiceDrawerOpen"
        :is="ServiceDrawer"
        :row="selectedService"
        :isOpen="isServiceDrawerOpen"
        :initial-section="'overview'"
        @update:isOpen="isServiceDrawerOpen = $event"
    />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useDataStore } from '@/stores/dataStore.ts';
import moment from 'moment';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { ServiceInterface } from '@/views/AWS/Services/types/service.interface.ts';
import { ChevronRight } from 'lucide-vue-next';
import ServiceDrawer from '@/views/AWS/Services/components/ServiceDrawer.vue';

const props = defineProps<{
    isOpen: boolean;
}>();

const emit = defineEmits<{
    'update:isOpen': [value: boolean];
}>();

const dataStore = useDataStore();
const isServiceDrawerOpen = ref(false);
const selectedService = ref<ServiceInterface | null>(null);

const stuckServices = computed(() => {
    return dataStore.services.filter((service) => service.deploymentStatus?.isStuck === true);
});

const getStuckTime = (service: ServiceInterface) => {
    if (!service.deploymentStatus?.stuckSince) return 'unknown time';
    return moment(new Date(service.deploymentStatus.stuckSince)).fromNow(true);
};

const getServiceCurrentImage = (service: ServiceInterface) => {
    const images = service.deploymentStatus?.currentImages;
    if (!images || images.length === 0) return undefined;
    return images[0].image;
};

const getServiceTargetImage = (service: ServiceInterface) => {
    const images = service.deploymentStatus?.targetImages;
    if (!images || images.length === 0) return undefined;
    return images[0].image;
};

const getServiceFailureReason = (service: ServiceInterface) => {
    if (service.failedTasks && service.failedTasks.length > 0 && service.failedTasks[0].stoppedReason) {
        return service.failedTasks[0].stoppedReason;
    }
    return null;
};

const openServiceDrawer = (service: ServiceInterface) => {
    selectedService.value = service;
    isServiceDrawerOpen.value = true;
};
</script>
