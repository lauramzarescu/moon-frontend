<template>
    <div class="h-full flex flex-col">
        <div class="flex items-center justify-between mb-6">
            <div>
                <h3 class="text-lg font-semibold">Review & Deploy</h3>
                <p class="text-sm text-muted-foreground">
                    Review your deployment configuration and deploy {{ selectedServices.length }} service{{
                        selectedServices.length !== 1 ? 's' : ''
                    }}
                </p>
            </div>
            <Badge variant="outline">{{ selectedServices.length }} services</Badge>
        </div>

        <!-- Services Review List -->
        <div class="flex-1 overflow-y-auto space-y-4">
            <div
                v-for="service in selectedServices"
                :key="`review-${service.clusterName}-${service.serviceName}`"
                class="border rounded-lg p-4 bg-card"
            >
                <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center gap-2">
                        <h4 class="font-medium">{{ service.serviceName }}</h4>
                        <Badge :variant="getStatusVariant(service.status)" class="text-xs">
                            {{ service.status }}
                        </Badge>
                    </div>
                    <Badge variant="outline" class="text-xs">
                        {{ service.clusterName }}
                    </Badge>
                </div>

                <div class="space-y-2">
                    <div class="flex items-center gap-2 text-sm">
                        <span class="text-muted-foreground w-20">From:</span>
                        <code class="flex-1 text-xs bg-muted px-2 py-1 rounded font-mono truncate">
                            {{ service.image }}
                        </code>
                    </div>
                    <div class="flex items-center gap-2 text-sm">
                        <span class="text-muted-foreground w-20">To:</span>
                        <code class="flex-1 text-xs bg-primary/10 px-2 py-1 rounded font-mono truncate">
                            {{ getDeploymentData(service)?.newImageUri }}
                        </code>
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
            <Button @click="$emit('deploy')" :disabled="isDeploying" class="w-full h-12 text-base" size="lg">
                <Loader2Icon v-if="isDeploying" class="w-5 h-5 mr-2 animate-spin" />
                <RocketIcon v-else class="w-5 h-5 mr-2" />
                {{
                    isDeploying
                        ? 'Deploying Services...'
                        : `Deploy ${selectedServices.length} Service${selectedServices.length !== 1 ? 's' : ''}`
                }}
            </Button>

            <!-- Deployment Info -->
            <div class="text-center text-xs text-muted-foreground space-y-1">
                <p>This action will update the container images for the selected services.</p>
                <p>Services will be restarted with the new images.</p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangleIcon, InfoIcon, Loader2Icon, RocketIcon } from 'lucide-vue-next';
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
</script>
