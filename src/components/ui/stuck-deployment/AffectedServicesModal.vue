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
                        <div class="space-y-4">
                            <!-- Service Header -->
                            <div class="flex items-start justify-between gap-4">
                                <div class="flex-1 min-w-0">
                                    <div class="flex items-center gap-3 mb-2">
                                        <h4 class="font-semibold text-foreground truncate">{{ service.name }}</h4>
                                        <Badge variant="secondary" class="text-xs px-2 py-0.5">{{ service.clusterName }}</Badge>
                                        <Badge v-if="service.isClusterProduction" variant="destructive" class="text-xs">Production</Badge>
                                    </div>

                                    <div class="flex items-center gap-4 text-sm text-muted-foreground">
                                        <div class="flex items-center gap-1">
                                            <AlertTriangle class="h-4 w-4" />
                                            <span>Stuck for {{ getStuckTime(service) }}</span>
                                        </div>
                                        <div>{{ service.runningCount }}/{{ service.desiredCount }} running</div>
                                        <div
                                            v-if="getServiceFailureReason(service)"
                                            class="capitalize truncate max-w-48"
                                            :title="getServiceFailureReason(service)"
                                        >
                                            {{ getServiceFailureReason(service) }}
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

                            <!-- Image Comparisons -->
                            <div v-if="getImageComparisons(service).length > 0" class="space-y-3">
                                <h5 class="text-sm font-medium text-foreground">Container Images</h5>
                                <div class="space-y-3">
                                    <div
                                        v-for="comparison in getImageComparisons(service)"
                                        :key="comparison.containerName"
                                        class="rounded-md border border-border bg-background/50 p-3"
                                    >
                                        <div class="flex items-center gap-2 mb-3">
                                            <Box class="h-4 w-4 text-muted-foreground" />
                                            <span class="font-medium text-sm">{{ comparison.containerName }}</span>
                                        </div>

                                        <div class="space-y-3">
                                            <!-- Current Image -->
                                            <div>
                                                <div class="flex items-center gap-2 mb-2">
                                                    <span class="text-xs font-medium text-muted-foreground uppercase tracking-wide"
                                                        >Current</span
                                                    >
                                                    <Badge variant="outline" class="text-xs">Running</Badge>
                                                </div>
                                                <div class="group relative">
                                                    <div
                                                        class="rounded-md border border-border bg-background p-3 font-mono text-xs break-all pr-10"
                                                    >
                                                        {{ comparison.currentImage || 'N/A' }}
                                                    </div>
                                                    <Button
                                                        v-if="comparison.currentImage"
                                                        variant="ghost"
                                                        size="sm"
                                                        class="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        @click="copyToClipboard(comparison.currentImage)"
                                                    >
                                                        <Copy class="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>

                                            <!-- Arrow -->
                                            <div class="flex items-center justify-center py-1">
                                                <div class="h-px w-8 bg-border"></div>
                                                <ChevronDown class="h-4 w-4 text-muted-foreground mx-2" />
                                                <div class="h-px w-8 bg-border"></div>
                                            </div>

                                            <!-- Target Image -->
                                            <div>
                                                <div class="flex items-center gap-2 mb-2">
                                                    <span class="text-xs font-medium text-muted-foreground uppercase tracking-wide"
                                                        >Target</span
                                                    >
                                                    <Badge variant="destructive" class="text-xs">Stuck</Badge>
                                                </div>
                                                <div class="group relative">
                                                    <div
                                                        class="rounded-md border border-destructive/20 bg-destructive/5 p-3 font-mono text-xs break-all pr-10"
                                                    >
                                                        {{ comparison.targetImage || 'N/A' }}
                                                    </div>
                                                    <Button
                                                        v-if="comparison.targetImage"
                                                        variant="ghost"
                                                        size="sm"
                                                        class="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        @click="copyToClipboard(comparison.targetImage)"
                                                    >
                                                        <Copy class="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
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
import { useToast } from '@/components/ui/toast/use-toast';
import moment from 'moment';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { ServiceInterface } from '@/views/AWS/Services/types/service.interface.ts';
import { AlertTriangle, Box, ChevronDown, Copy } from 'lucide-vue-next';
import ServiceDrawer from '@/views/AWS/Services/components/ServiceDrawer.vue';

const props = defineProps<{
    isOpen: boolean;
}>();

const emit = defineEmits<{
    'update:isOpen': [value: boolean];
}>();

const dataStore = useDataStore();
const { toast } = useToast();
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

const getImageComparisons = (service: ServiceInterface) => {
    const comparisons: Array<{
        containerName: string;
        currentImage: string;
        targetImage: string;
    }> = [];

    if (service.deploymentStatus?.currentImages && service.deploymentStatus?.targetImages) {
        const currentImages = service.deploymentStatus.currentImages;
        const targetImages = service.deploymentStatus.targetImages;

        // Create a map of target images by container name
        const targetImageMap = new Map(targetImages.map((img) => [img.containerName, img.image]));

        currentImages.forEach((currentImg) => {
            const targetImage = targetImageMap.get(currentImg.containerName);
            if (targetImage) {
                comparisons.push({
                    containerName: currentImg.containerName,
                    currentImage: currentImg.image,
                    targetImage: targetImage,
                });
            }
        });
    } else {
        service.containers?.forEach((container) => {
            comparisons.push({
                containerName: container.name,
                currentImage: container.image,
                targetImage: 'Updating...',
            });
        });
    }

    return comparisons;
};

const copyToClipboard = async (text: string) => {
    try {
        await navigator.clipboard.writeText(text);
        toast({
            variant: 'success',
            title: 'Copied to clipboard',
            description: 'Image URI has been copied to your clipboard',
        });
    } catch (error) {
        toast({
            title: 'Failed to copy',
            description: 'Could not copy to clipboard',
            variant: 'destructive',
        });
    }
};

const openServiceDrawer = (service: ServiceInterface) => {
    selectedService.value = service;
    isServiceDrawerOpen.value = true;
};
</script>
