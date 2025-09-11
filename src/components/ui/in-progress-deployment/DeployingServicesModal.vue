<template>
    <Dialog :open="isOpen" @update:open="$emit('update:isOpen', $event)">
        <DialogContent class="max-w-5xl w-[95vw] h-[80vh] max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader class="flex-shrink-0">
                <DialogTitle class="flex items-center gap-3">
                    <span class="h-8 w-8 rounded-lg bg-primary/10 text-primary inline-flex items-center justify-center">
                        <Rocket class="h-4 w-4" />
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
                                        <Clock class="h-4 w-4" />
                                        <span>{{ getDeploymentTime(service) }}</span>
                                    </div>
                                    <div>{{ getProgressText(service) }}</div>
                                    <div v-if="getRolloutState(service)" class="capitalize">{{ getRolloutState(service) }}</div>
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
                                                <Badge variant="default" class="text-xs">Deploying</Badge>
                                            </div>
                                            <div class="group relative">
                                                <div
                                                    class="rounded-md border border-primary/20 bg-primary/5 p-3 font-mono text-xs break-all pr-10"
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

            <DialogFooter>
                <Button variant="outline" @click="$emit('update:isOpen', false)">Close</Button>
                <Button @click="handleRefresh" :disabled="isRefreshing" class="gap-2">
                    <RefreshCw :class="['h-4 w-4', isRefreshing && 'animate-spin']" />
                    {{ isRefreshing ? 'Refreshing...' : 'Refresh Data' }}
                </Button>
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
import { ref } from 'vue';
import { useDataStore } from '@/stores/dataStore';
import { useToast } from '@/components/ui/toast/use-toast';
import moment from 'moment';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Box, ChevronDown, Clock, Copy, RefreshCw, Rocket } from 'lucide-vue-next';
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
const { toast } = useToast();
const selectedService = ref<ServiceInterface | null>(null);
const isServiceDrawerOpen = ref(false);
const isRefreshing = ref(false);

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

const getProgressPercentage = (service: ServiceInterface) => {
    const inProgressDeployment = service.deployments?.find((d) => d.rolloutState === 'IN_PROGRESS');
    if (!inProgressDeployment || inProgressDeployment.desiredCount === 0) return null;

    return Math.round((inProgressDeployment.runningCount / inProgressDeployment.desiredCount) * 100);
};

const getRolloutState = (service: ServiceInterface) => {
    const inProgressDeployment = service.deployments?.find((d) => d.rolloutState === 'IN_PROGRESS');
    return inProgressDeployment?.rolloutState?.toLowerCase().replace('_', ' ') || null;
};

const getRolloutStateReason = (service: ServiceInterface) => {
    const inProgressDeployment = service.deployments?.find((d) => d.rolloutState === 'IN_PROGRESS');
    return inProgressDeployment?.rolloutStateReason || null;
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

const handleRefresh = async () => {
    isRefreshing.value = true;
    try {
        await dataStore.manualRefresh();
        toast({
            variant: 'success',
            title: 'Data refreshed',
            description: 'Deployment information has been updated',
        });
    } catch (error) {
        toast({
            title: 'Refresh failed',
            description: 'Could not refresh deployment data',
            variant: 'destructive',
        });
    } finally {
        isRefreshing.value = false;
    }
};

const openServiceDrawer = (service: ServiceInterface) => {
    selectedService.value = service;
    isServiceDrawerOpen.value = true;
};
</script>
