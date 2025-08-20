<template>
    <Dialog :open="isOpen" @update:open="$emit('update:isOpen', $event)">
        <DialogContent class="max-w-5xl w-[95vw] h-[80vh] max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader class="flex-shrink-0">
                <DialogTitle class="flex items-center gap-3">
                    <span class="h-8 w-8 rounded-lg bg-primary/10 text-primary inline-flex items-center justify-center">
                        <StopwatchIcon class="h-4 w-4" />
                    </span>
                    <span>Services Currently Deploying</span>
                </DialogTitle>
                <DialogDescription class="text-muted-foreground">The following services have deployments in progress</DialogDescription>
            </DialogHeader>

            <div class="flex-1 overflow-y-auto p-4 pt-2 space-y-3">
                <div
                    v-if="!deployingServices || deployingServices.length === 0"
                    class="rounded-lg border border-border bg-muted/30 p-6 text-center"
                >
                    <p class="text-sm text-muted-foreground">No active deployments found.</p>
                </div>

                <Card
                    v-for="service in deployingServices"
                    :key="`${service.clusterName}-${service.name}`"
                    class="rounded-lg border border-border bg-card text-card-foreground p-4 transition-all duration-200 hover:bg-muted/40"
                >
                    <div class="flex items-start justify-between gap-4">
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-3">
                                <h4 class="font-semibold text-foreground truncate">{{ service.name }}</h4>
                                <Badge variant="secondary" class="text-xs px-2 py-0.5">{{ service.clusterName }}</Badge>
                            </div>

                            <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                                <div class="rounded-md border border-border bg-background p-3">
                                    <div class="text-xs font-medium text-muted-foreground">Deploying for</div>
                                    <div class="font-medium text-sm text-foreground">{{ getDeploymentTime(service) }}</div>
                                </div>

                                <div class="rounded-md border border-border bg-background p-3">
                                    <div class="text-xs font-medium text-muted-foreground">Progress</div>
                                    <div class="text-sm text-foreground">{{ getProgressText(service) }}</div>
                                </div>

                                <div class="rounded-md border border-border bg-background p-3">
                                    <div class="text-xs font-medium text-muted-foreground">Status</div>
                                    <div class="text-sm text-foreground">In Progress</div>
                                </div>
                            </div>
                        </div>

                        <Button
                            variant="outline-default"
                            size="sm"
                            class="flex-shrink-0 hover:shadow-sm"
                            @click="openServiceDrawer(service)"
                        >
                            View Details
                        </Button>
                    </div>
                </Card>
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
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
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
