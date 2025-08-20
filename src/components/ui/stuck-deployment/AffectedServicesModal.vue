<template>
    <Dialog :open="isOpen" @update:open="$emit('update:isOpen', $event)">
        <DialogContent class="max-w-5xl w-[95vw] h-[80vh] max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader class="flex-shrink-0">
                <DialogTitle class="flex items-center gap-3">
                    <span class="h-8 w-8 rounded-lg bg-destructive/10 text-destructive inline-flex items-center justify-center">
                        <AlertTriangle class="h-4 w-4" />
                    </span>
                    <span>Affected Services</span>
                </DialogTitle>
                <DialogDescription class="text-muted-foreground">Services with stuck deployments</DialogDescription>
            </DialogHeader>

            <div class="flex-1 overflow-y-auto p-4 pt-2 space-y-3">
                <div v-if="stuckServices.length === 0" class="py-4 text-center text-gray-500">No stuck deployments found</div>

                <div v-else class="space-y-3">
                    <Card
                        v-for="service in stuckServices"
                        :key="`${service.clusterName}-${service.name}`"
                        class="rounded-lg border border-border bg-card text-card-foreground p-4 transition-all duration-200 hover:bg-muted/40"
                    >
                        <div class="flex items-start justify-between gap-4">
                            <div class="flex-1 min-w-0">
                                <div class="flex items-center gap-3">
                                    <h3 class="font-semibold text-foreground truncate">{{ service.name }}</h3>
                                    <Badge variant="secondary" class="text-xs px-2 py-0.5">{{ service.clusterName }}</Badge>
                                </div>

                                <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                                    <div class="rounded-md border border-border bg-background p-2">
                                        <div class="text-xs font-medium text-muted-foreground">Stuck for</div>
                                        <div class="font-medium text-sm text-foreground">{{ getStuckTime(service) }}</div>
                                    </div>

                                    <div class="rounded-md border border-border bg-background p-2">
                                        <div class="text-xs font-medium text-muted-foreground">Status</div>
                                        <Badge variant="destructive" class="text-xs px-2 py-0.5">Stuck</Badge>
                                    </div>

                                    <div v-if="getServiceFailureReason(service)" class="rounded-md border border-border bg-background p-2">
                                        <div class="text-xs font-medium text-muted-foreground">Failure Reason</div>
                                        <div class="text-xs text-destructive truncate" :title="getServiceFailureReason(service)">
                                            {{ getServiceFailureReason(service) }}
                                        </div>
                                    </div>
                                </div>

                                <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                                    <div v-if="getServiceCurrentImage(service)" class="rounded-md border border-border bg-background p-2">
                                        <div class="text-xs font-medium text-muted-foreground">Current image</div>
                                        <div class="text-xs font-mono truncate" :title="getServiceCurrentImage(service)">
                                            {{ getServiceCurrentImage(service) }}
                                        </div>
                                    </div>

                                    <div v-if="getServiceTargetImage(service)" class="rounded-md border border-border bg-background p-2">
                                        <div class="text-xs font-medium text-muted-foreground">Target image</div>
                                        <div class="text-xs font-mono truncate" :title="getServiceTargetImage(service)">
                                            {{ getServiceTargetImage(service) }}
                                        </div>
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
import { AlertTriangle } from 'lucide-vue-next';
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
