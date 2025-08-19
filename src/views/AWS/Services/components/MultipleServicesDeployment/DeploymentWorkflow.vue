<template>
    <div class="flex flex-col h-full max-h-full">
        <!-- Progress Steps -->
        <DeploymentSteps :current-step="currentStep" :steps="steps" class="mb-6 flex-shrink-0" />

        <!-- Main Content - Scrollable Container -->
        <div class="flex-1 min-h-0 overflow-hidden">
            <!-- Step 1: Service Selection -->
            <div v-if="currentStep === 1" class="h-full overflow-y-auto">
                <ServiceSelectionPanel
                    :services="services"
                    :filtered-services="filteredServices"
                    :show-all-services="showAllServices"
                    :selected-services="selectedServices"
                    :max-services="MAX_SERVICES_TO_DEPLOY"
                    @service-toggled="handleServiceToggle"
                    @view-toggled="handleViewToggle"
                />
            </div>

            <!-- Step 2: Configuration -->
            <div v-else-if="currentStep === 2" class="h-full overflow-y-auto">
                <div class="h-full">
                    <ServiceConfigurationPanel
                        :selected-services="selectedServices"
                        :deployment-data="deploymentData"
                        @image-updated="handleImageUpdate"
                        @service-removed="handleServiceRemove"
                    />
                </div>
            </div>

            <!-- Step 3: Review & Deploy -->
            <div v-else-if="currentStep === 3" class="h-full overflow-y-auto">
                <DeploymentReviewPanel
                    :selected-services="selectedServices"
                    :deployment-data="deploymentData"
                    :is-deploying="isDeploying"
                    @deploy="handleDeploy"
                />
            </div>
        </div>

        <!-- Navigation Footer -->
        <DeploymentNavigation
            :current-step="currentStep"
            :total-steps="steps.length"
            :can-proceed="canProceed"
            :selected-count="selectedServices.length"
            :is-deploying="isDeploying"
            @next="nextStep"
            @previous="previousStep"
            @cancel="$emit('close')"
            class="flex-shrink-0 mt-4"
        />
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import type { ServiceInterface } from '@/views/AWS/Services/types/service.interface.ts';
import { useDeploymentLogic } from './composables/useDeploymentLogic';
import { useServiceTransform } from './composables/useServiceTransform';
import DeploymentSteps from './components/DeploymentSteps.vue';
import ServiceSelectionPanel from './components/ServiceSelectionPanel.vue';
import ServiceConfigurationPanel from './components/ServiceConfigurationPanel.vue';
import DeploymentReviewPanel from './components/DeploymentReviewPanel.vue';
import DeploymentNavigation from './components/DeploymentNavigation.vue';

const props = defineProps<{
    services: ServiceInterface[];
    filteredServices?: ServiceInterface[];
    showAllServices?: boolean;
}>();

const emit = defineEmits<{
    (e: 'deployment-completed'): void;
    (e: 'close'): void;
}>();

const MAX_SERVICES_TO_DEPLOY = 10;

const currentStep = ref(1);
const isInitialized = ref(false);
const steps = [
    { id: 1, title: 'Select Services', description: 'Choose services to deploy' },
    { id: 2, title: 'Configure Images', description: 'Set container images' },
    { id: 3, title: 'Review & Deploy', description: 'Confirm and deploy' },
];

const { transformServices } = useServiceTransform();
const {
    selectedServices,
    deploymentData,
    isDeploying,
    handleServiceToggle,
    handleImageUpdate,
    handleServiceRemove,
    handleDeploy: performDeploy,
    resetState,
    cleanupInvalidServices,
} = useDeploymentLogic(transformServices(props.services), MAX_SERVICES_TO_DEPLOY);

const canProceed = computed(() => {
    switch (currentStep.value) {
        case 1:
            return selectedServices.value.length > 0;
        case 2:
            return selectedServices.value.every((service) => {
                const key = `${service.clusterName}-${service.serviceName}`;
                const data = deploymentData.get(key);
                return data && data.newImageUri && !data.validationError;
            });
        case 3:
            return true;
        default:
            return false;
    }
});

const nextStep = () => {
    if (currentStep.value < steps.length && canProceed.value) {
        currentStep.value++;
    }
};

const previousStep = () => {
    if (currentStep.value > 1) {
        currentStep.value--;
    }
};

const handleViewToggle = () => {};

const handleDeploy = async () => {
    const success = await performDeploy();
    if (success) {
        emit('deployment-completed');
    }
};

const hasSignificantChange = (newServices: ServiceInterface[], oldServices: ServiceInterface[]) => {
    if (!oldServices || newServices.length !== oldServices.length) {
        return true;
    }

    // Check if any service has been removed or added
    const newServiceKeys = new Set(newServices.map((s) => `${s.clusterName}-${s.name}`));
    const oldServiceKeys = new Set(oldServices.map((s) => `${s.clusterName}-${s.name}`));

    if (newServiceKeys.size !== oldServiceKeys.size) {
        return true;
    }

    for (const key of newServiceKeys) {
        if (!oldServiceKeys.has(key)) {
            return true;
        }
    }

    return false;
};

onMounted(() => {
    resetState();
    currentStep.value = 1;
    isInitialized.value = true;
});

watch(
    () => props.services,
    (newServices, oldServices) => {
        if (!isInitialized.value) {
            return;
        }

        if (hasSignificantChange(newServices, oldServices)) {
            resetState();
            currentStep.value = 1;
        } else {
            cleanupInvalidServices(transformServices(newServices));
        }
    },
    { deep: false },
);

watch(
    () => props.filteredServices,
    () => {
        if (!isInitialized.value) {
            return;
        }
    },
    { deep: false },
);
</script>
