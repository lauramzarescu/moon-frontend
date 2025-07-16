<template>
    <div class="h-full flex flex-col">
        <div class="flex items-center justify-between mb-6">
            <div>
                <h3 class="text-lg font-semibold flex items-center gap-2">
                    <ShieldAlertIcon v-if="hasProductionServices" class="h-5 w-5 text-red-600" />
                    Review & Deploy
                </h3>
                <p class="text-sm text-muted-foreground">
                    Review your deployment configuration and deploy {{ selectedServices.length }} service{{
                        selectedServices.length !== 1 ? 's' : ''
                    }}
                </p>
            </div>
            <div class="flex items-center gap-2">
                <Badge v-if="hasProductionServices" variant="destructive" class="bg-red-100 text-red-800 border-red-300">
                    {{ productionServicesCount }} Production
                </Badge>
                <Badge variant="outline">{{ selectedServices.length }} services</Badge>
            </div>
        </div>

        <!-- Services Review List -->
        <div class="flex-1 overflow-y-auto space-y-4">
            <div
                v-for="service in selectedServices"
                :key="`review-${service.clusterName}-${service.serviceName}`"
                :class="[
                    'border rounded-lg p-4 bg-card',
                    service.isClusterProduction && 'border-red-300 bg-red-50/50 dark:bg-red-950/20 dark:border-red-700',
                ]"
            >
                <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center gap-2">
                        <ShieldAlertIcon v-if="service.isClusterProduction" class="h-4 w-4 text-red-600" />
                        <h4 class="font-medium">{{ service.serviceName }}</h4>
                        <Badge :variant="getStatusVariant(service.status)" class="text-xs">
                            {{ service.status }}
                        </Badge>
                    </div>
                    <div class="flex items-center gap-2">
                        <Badge
                            v-if="service.isClusterProduction"
                            variant="destructive"
                            class="text-xs bg-red-100 text-red-800 border-red-300"
                        >
                            Production
                        </Badge>
                        <Badge variant="outline" class="text-xs">
                            {{ service.clusterName }}
                        </Badge>
                    </div>
                </div>

                <div class="space-y-3">
                    <div class="space-y-2">
                        <div class="flex items-start gap-2">
                            <span class="text-muted-foreground text-xs font-medium mt-1 w-16 flex-shrink-0">FROM:</span>
                            <code
                                class="flex-1 text-xs bg-red-50 border border-red-200 px-2 py-1.5 rounded font-mono break-all dark:bg-red-950 dark:border-red-800"
                            >
                                {{ service.image }}
                            </code>
                        </div>
                        <div class="flex items-start gap-2">
                            <span class="text-muted-foreground text-xs font-medium mt-1 w-16 flex-shrink-0">TO:</span>
                            <code
                                class="flex-1 text-xs bg-green-50 border border-green-200 px-2 py-1.5 rounded font-mono break-all dark:bg-green-950 dark:border-green-800"
                            >
                                {{ getDeploymentData(service)?.newImageUri }}
                            </code>
                        </div>
                    </div>

                    <!-- Container Information -->
                    <div class="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
                        <span><strong>Container:</strong> {{ service.containerName }}</span>
                        <span v-if="service.isClusterProduction" class="text-red-600 font-medium">
                            <ShieldAlertIcon class="inline h-3 w-3 mr-1" />
                            Production Environment
                        </span>
                    </div>
                </div>

                <!-- Change indicator -->
                <div class="mt-2 flex items-center gap-2 text-xs">
                    <div v-if="hasImageChanged(service)" class="flex items-center gap-1 text-amber-600">
                        <AlertTriangleIcon class="h-3 w-3" />
                        <span>Image will be updated</span>
                    </div>
                    <div v-else class="flex items-center gap-1 text-muted-foreground">
                        <InfoIcon class="h-3 w-3" />
                        <span>No image changes</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Deployment Actions -->
        <div class="mt-6 space-y-4">
            <!-- Warning for services without changes -->
            <div v-if="servicesWithoutChanges.length > 0" class="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div class="flex items-center gap-2 mb-1">
                    <AlertTriangleIcon class="h-4 w-4 text-yellow-600" />
                    <span class="text-sm font-medium text-yellow-800">Services without changes</span>
                </div>
                <p class="text-xs text-yellow-700">
                    {{ servicesWithoutChanges.length }} service{{ servicesWithoutChanges.length !== 1 ? 's' : '' }} will be deployed with
                    the same image{{ servicesWithoutChanges.length !== 1 ? 's' : '' }}.
                </p>
            </div>

            <!-- Deploy Button -->
            <Button
                @click="$emit('deploy')"
                :disabled="isDeploying"
                :variant="hasProductionServices ? 'destructive' : 'default'"
                :class="['w-full h-12 text-base', hasProductionServices && 'bg-red-600 hover:bg-red-700 border-red-600']"
                size="lg"
            >
                <Loader2Icon v-if="isDeploying" class="w-5 h-5 mr-2 animate-spin" />
                <AlertTriangleIcon v-else-if="hasProductionServices" class="w-5 h-5 mr-2" />
                <RocketIcon v-else class="w-5 h-5 mr-2" />
                {{
                    isDeploying
                        ? 'Deploying Services...'
                        : hasProductionServices
                          ? `Deploy ${selectedServices.length} Service${selectedServices.length !== 1 ? 's' : ''} (Production)`
                          : `Deploy ${selectedServices.length} Service${selectedServices.length !== 1 ? 's' : ''}`
                }}
            </Button>

            <!-- Deployment Info -->
            <div class="text-center text-xs space-y-1">
                <p class="text-muted-foreground">This action will update the container images for the selected services.</p>
                <p class="text-muted-foreground">Services will be restarted with the new images.</p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangleIcon, InfoIcon, Loader2Icon, RocketIcon, ShieldAlertIcon } from 'lucide-vue-next';
import type { ServiceDeploymentData, TransformedService } from '../types';
import { useServiceTransform } from '../composables/useServiceTransform';

const props = defineProps<{
    selectedServices: TransformedService[];
    deploymentData: Map<string, ServiceDeploymentData>;
    isDeploying: boolean;
}>();

const emit = defineEmits<{
    (e: 'deploy'): void;
}>();

const { getStatusVariant } = useServiceTransform();

const getServiceKey = (service: TransformedService): string => {
    return `${service.clusterName}-${service.serviceName}`;
};

const getDeploymentData = (service: TransformedService): ServiceDeploymentData | undefined => {
    const key = getServiceKey(service);
    return props.deploymentData.get(key);
};

const hasImageChanged = (service: TransformedService): boolean => {
    const data = getDeploymentData(service);
    return data ? data.newImageUri !== service.image : false;
};
const servicesWithoutChanges = computed(() => {
    return props.selectedServices.filter((service) => !hasImageChanged(service));
});

const hasProductionServices = computed(() => {
    return props.selectedServices.some((service) => service.isClusterProduction);
});

const productionServicesCount = computed(() => {
    return props.selectedServices.filter((service) => service.isClusterProduction).length;
});

const productionClusters = computed(() => {
    const clusters = new Set(props.selectedServices.filter((service) => service.isClusterProduction).map((service) => service.clusterName));
    return Array.from(clusters).sort();
});
</script>
