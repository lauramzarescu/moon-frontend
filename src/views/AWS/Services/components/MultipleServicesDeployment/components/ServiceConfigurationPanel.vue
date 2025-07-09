<template>
    <div class="flex flex-col h-full max-h-full">
        <!-- Header - Fixed -->
        <div class="flex-shrink-0 mb-6">
            <div class="flex items-center justify-between">
                <div>
                    <h3 class="text-lg font-semibold">Configure Container Images</h3>
                    <p class="text-sm text-muted-foreground">
                        Update the container images for {{ selectedServices.length }} selected service{{
                            selectedServices.length !== 1 ? 's' : ''
                        }}
                    </p>
                </div>
                <Badge variant="outline">{{ selectedServices.length }} services</Badge>
            </div>
        </div>

        <!-- Scrollable Content Area -->
        <div class="flex-1 min-h-0 overflow-y-auto pr-2">
            <div class="space-y-6">
                <TransitionGroup name="config-service" tag="div" class="space-y-6">
                    <ServiceConfigurationCard
                        v-for="service in selectedServices"
                        :key="`config-${service.clusterName}-${service.serviceName}`"
                        :service="service"
                        :deployment-data="getDeploymentData(service)"
                        @image-updated="handleImageUpdate(service, $event)"
                        @service-removed="$emit('service-removed', service)"
                    />
                </TransitionGroup>
            </div>
        </div>

        <!-- Configuration Summary - Fixed at bottom -->
        <div class="flex-shrink-0 mt-6 p-4 bg-muted/30 rounded-lg border">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                    <CheckCircleIcon class="h-4 w-4 text-green-600" />
                    <span class="text-sm font-medium">Configuration Status</span>
                </div>
                <Badge :variant="allConfigured ? 'default' : 'secondary'">
                    {{ configuredCount }}/{{ selectedServices.length }} configured
                </Badge>
            </div>
            <p class="text-xs text-muted-foreground mt-1">
                {{ allConfigured ? 'All services are properly configured' : 'Some services need configuration' }}
            </p>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, TransitionGroup } from 'vue';
import { Badge } from '@/components/ui/badge';
import { CheckCircleIcon } from 'lucide-vue-next';
import type { ServiceDeploymentData, TransformedService } from '../types';
import ServiceConfigurationCard from './ServiceConfigurationCard.vue';

const props = defineProps<{
    selectedServices: TransformedService[];
    deploymentData: Map<string, ServiceDeploymentData>;
}>();

const emit = defineEmits<{
    (e: 'image-updated', service: TransformedService, imageUri: string): void;
    (e: 'service-removed', service: TransformedService): void;
}>();

const getServiceKey = (service: TransformedService): string => {
    return `${service.clusterName}-${service.serviceName}`;
};

const getDeploymentData = (service: TransformedService): ServiceDeploymentData | undefined => {
    const key = getServiceKey(service);
    return props.deploymentData.get(key);
};

const handleImageUpdate = (service: TransformedService, imageUri: string) => {
    emit('image-updated', service, imageUri);
};

const configuredCount = computed(() => {
    return props.selectedServices.filter((service) => {
        const data = getDeploymentData(service);
        return data && data.newImageUri && !data.validationError;
    }).length;
});

const allConfigured = computed(() => {
    return configuredCount.value === props.selectedServices.length;
});
</script>

<style scoped>
.config-service-enter-from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
}

.config-service-leave-to {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
}

.config-service-enter-active,
.config-service-leave-active,
.config-service-move {
    transition: all 0.3s ease;
}

/* Custom scrollbar styling */
.overflow-y-auto::-webkit-scrollbar {
    width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
    background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
    background: hsl(var(--border));
    border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
    background: hsl(var(--muted-foreground));
}
</style>
