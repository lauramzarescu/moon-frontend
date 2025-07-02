<template>
    <div v-if="hasInProgressDeployments" class="w-full">
        <div v-if="!isMinimized" class="relative">
            <Card class="border-blue-300 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
                <div class="p-4 flex items-start">
                    <StopwatchIcon class="h-6 w-6 mr-4 mt-0.5 flex-shrink-0 text-blue-600 dark:text-blue-500" />
                    <div class="flex-1">
                        <h3 class="text-base font-semibold text-blue-800 dark:text-blue-400 mb-2">Deployment In Progress</h3>

                        <div v-if="inProgressServices.length === 1" class="space-y-3">
                            <p class="text-sm text-blue-700 dark:text-blue-300">
                                {{ singleServiceMessage }}
                            </p>

                            <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                                <div class="bg-white dark:bg-slate-800 rounded-md p-2 shadow-sm">
                                    <div class="text-xs font-medium text-slate-500 dark:text-slate-400">Deploying for</div>
                                    <div class="font-medium text-sm">{{ deploymentTime }}</div>
                                </div>

                                <div v-if="currentImage" class="bg-white dark:bg-slate-800 rounded-md p-2 shadow-sm">
                                    <div class="text-xs font-medium text-slate-500 dark:text-slate-400">Current image</div>
                                    <div class="text-xs font-mono truncate" :title="currentImage">{{ currentImage }}</div>
                                </div>

                                <div v-if="targetImage" class="bg-white dark:bg-slate-800 rounded-md p-2 shadow-sm">
                                    <div class="text-xs font-medium text-slate-500 dark:text-slate-400">Target image</div>
                                    <div class="text-xs font-mono truncate" :title="targetImage">{{ targetImage }}</div>
                                </div>
                            </div>

                            <!-- Display deployment progress -->
                            <div v-if="deploymentProgress" class="bg-white dark:bg-slate-800 rounded-md p-2 shadow-sm">
                                <div class="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Progress</div>
                                <div class="flex items-center gap-2 text-xs">
                                    <span class="text-green-600 dark:text-green-400">Running: {{ deploymentProgress.running }}</span>
                                    <span class="text-yellow-600 dark:text-yellow-400">Pending: {{ deploymentProgress.pending }}</span>
                                    <span class="text-slate-600 dark:text-slate-400">Desired: {{ deploymentProgress.desired }}</span>
                                </div>
                            </div>

                            <!-- View Service Details Button -->
                            <Button
                                variant="outline"
                                size="sm"
                                class="mt-3 bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-slate-700"
                                @click="openServiceDrawer"
                            >
                                View service details
                                <ChevronRight class="h-3.5 w-3.5 ml-1" />
                            </Button>
                        </div>

                        <div v-else>
                            <p class="text-sm text-blue-700 dark:text-blue-300">
                                {{ multipleServicesMessage }}
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                class="mt-3 bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-slate-700"
                                @click="showDeployingServices = true"
                            >
                                View deploying services
                                <ChevronRight class="h-3.5 w-3.5 ml-1" />
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>
            <button
                @click="minimizeBanner"
                class="absolute top-2 right-2 p-1 rounded-md text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800/30"
                title="Minimize"
            >
                <Minimize2 class="h-4 w-4" />
            </button>
        </div>

        <div
            v-else
            @click="isMinimized = false"
            class="flex items-center gap-2 p-2 rounded-md border border-blue-300 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800 text-blue-700 dark:text-blue-300 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-800/30 w-fit"
        >
            <StopwatchIcon class="h-4 w-4 flex-shrink-0" />
            <span class="text-sm font-medium"
                >{{ inProgressServices.length }} {{ inProgressServices.length === 1 ? 'service' : 'services' }} deploying</span
            >
            <Maximize2 class="h-3.5 w-3.5" />
        </div>

        <DeployingServicesModal v-model:isOpen="showDeployingServices" :deploying-services="inProgressServices" />

        <!-- Service Drawer for the deploying service -->
        <component
            v-if="singleService && isServiceDrawerOpen"
            :is="ServiceDrawer"
            :row="singleService"
            :isOpen="isServiceDrawerOpen"
            :initial-section="'overview'"
            @update:isOpen="isServiceDrawerOpen = $event"
        />
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import moment from 'moment';
import { ChevronRight, Maximize2, Minimize2 } from 'lucide-vue-next';
import { StopwatchIcon } from '@radix-icons/vue';
import ServiceDrawer from '@/views/AWS/Services/components/ServiceDrawer.vue';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { ServiceInterface } from '@/views/AWS/Services/types/service.interface.ts';
import { useDataStore } from '@/stores/dataStore.ts';
import DeployingServicesModal from '@/components/ui/in-progress-deployment/DeployingServicesModal.vue';

const STORAGE_KEY = 'in-progress-deployment-banner-minimized';

const showDeployingServices = ref(false);
const isMinimized = ref(false);
const isServiceDrawerOpen = ref(false);
const dataStore = useDataStore();

onMounted(() => {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
        isMinimized.value = JSON.parse(savedState);
    }
});

watch(isMinimized, (newValue) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newValue));
});

const minimizeBanner = () => {
    isMinimized.value = true;
};

const inProgressServices = computed(() => {
    return dataStore.services.filter((service: ServiceInterface) => {
        // Check if any deployment has IN_PROGRESS status
        return service.deployments?.some((deployment) => deployment.rolloutState === 'IN_PROGRESS');
    });
});

const hasInProgressDeployments = computed(() => inProgressServices.value.length > 0);

const singleService = computed(() => inProgressServices.value[0]);

const deploymentTime = computed(() => {
    if (!singleService.value?.deployments) return 'unknown time';

    const inProgressDeployment = singleService.value.deployments.find((d) => d.status === 'IN_PROGRESS');
    if (!inProgressDeployment?.createdAt) return 'unknown time';

    return moment(new Date(inProgressDeployment.createdAt)).fromNow(true);
});

const currentImage = computed(() => {
    if (!singleService.value?.containers || singleService.value.containers.length === 0) return null;
    return singleService.value.containers[0].image;
});

const targetImage = computed(() => {
    if (!singleService.value?.containers || singleService.value.containers.length === 0) return null;
    return singleService.value.containers[0].image;
});

const deploymentProgress = computed(() => {
    if (!singleService.value) return null;

    const inProgressDeployment = singleService.value.deployments?.find((d) => d.status === 'IN_PROGRESS');
    if (!inProgressDeployment) return null;

    return {
        running: inProgressDeployment.runningCount,
        pending: inProgressDeployment.pendingCount,
        desired: inProgressDeployment.desiredCount,
    };
});

const singleServiceMessage = computed(
    () => `Deployment for ${singleService.value?.name} in cluster ${singleService.value?.clusterName} is in progress.`,
);

const multipleServicesMessage = computed(() => `${inProgressServices.value.length} services are currently deploying.`);

const openServiceDrawer = () => {
    if (inProgressServices.value.length === 1) {
        isServiceDrawerOpen.value = true;
    }
};
</script>
