<template>
    <Dialog :open="isOpen" @update:open="$emit('update:isOpen', $event)">
        <DialogContent class="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle class="flex items-center gap-2">
                    <StopwatchIcon class="h-5 w-5 text-blue-600 dark:text-blue-500" />
                    Services Currently Deploying
                </DialogTitle>
                <DialogDescription> The following services have deployments in progress</DialogDescription>
            </DialogHeader>

            <div class="space-y-4 mt-4">
                <div
                    v-for="service in deployingServices"
                    :key="`${service.clusterName}-${service.name}`"
                    class="border rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                >
                    <div class="flex items-start justify-between">
                        <div class="flex-1">
                            <h4 class="font-semibold text-blue-900 dark:text-blue-100">{{ service.name }}</h4>
                            <p class="text-sm text-blue-700 dark:text-blue-300 mt-1">Cluster: {{ service.clusterName }}</p>

                            <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                                <div class="bg-white dark:bg-slate-800 rounded-md p-2 shadow-sm">
                                    <div class="text-xs font-medium text-slate-500 dark:text-slate-400">Deploying for</div>
                                    <div class="font-medium text-sm">{{ getDeploymentTime(service) }}</div>
                                </div>

                                <div class="bg-white dark:bg-slate-800 rounded-md p-2 shadow-sm">
                                    <div class="text-xs font-medium text-slate-500 dark:text-slate-400">Progress</div>
                                    <div class="text-sm">{{ getProgressText(service) }}</div>
                                </div>

                                <div class="bg-white dark:bg-slate-800 rounded-md p-2 shadow-sm">
                                    <div class="text-xs font-medium text-slate-500 dark:text-slate-400">Status</div>
                                    <div class="text-sm font-medium text-blue-600 dark:text-blue-400">In Progress</div>
                                </div>
                            </div>
                        </div>

                        <Button variant="outline" size="sm" class="ml-4 bg-white dark:bg-slate-800" @click="openServiceDrawer(service)">
                            View Details
                        </Button>
                    </div>
                </div>
            </div>
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
import { ref } from 'vue';
import { useDataStore } from '@/stores/dataStore';
import moment from 'moment';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { StopwatchIcon } from '@radix-icons/vue';
import ServiceDrawer from '@/views/AWS/Services/components/ServiceDrawer.vue';
import type { ServiceInterface } from '@/views/AWS/Services/types/service.interface';

defineProps<{
    isOpen: boolean;
    deployingServices: ServiceInterface[];
}>();

defineEmits<{
    'update:isOpen': [value: boolean];
}>();

const dataStore = useDataStore();
const selectedService = ref<ServiceInterface | null>(null);
const isServiceDrawerOpen = ref(false);

const getDeploymentTime = (service: ServiceInterface) => {
    const inProgressDeployment = service.deployments?.find((d) => d.rolloutState === 'IN_PROGRESS');
    if (!inProgressDeployment?.createdAt) return 'unknown time';
    return moment(new Date(inProgressDeployment.createdAt)).fromNow(true);
};

const getProgressText = (service: ServiceInterface) => {
    const inProgressDeployment = service.deployments?.find((d) => d.rolloutState === 'IN_PROGRESS');
    if (!inProgressDeployment) return 'N/A';

    return `${inProgressDeployment.runningCount}/${inProgressDeployment.desiredCount} running`;
};

const openServiceDrawer = (service: ServiceInterface) => {
    selectedService.value = service;
    isServiceDrawerOpen.value = true;
};
</script>
