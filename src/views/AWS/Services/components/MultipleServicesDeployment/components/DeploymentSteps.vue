<template>
    <div class="flex items-center justify-center space-x-8 py-4 border-b">
        <div v-for="(step, index) in steps" :key="step.id" class="flex items-center space-x-2">
            <!-- Step Circle -->
            <div
                class="flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-200"
                :class="getStepClasses(step.id)"
            >
                <CheckIcon v-if="step.id < currentStep" class="w-4 h-4 text-white" />
                <span v-else class="text-sm font-medium text-muted-foreground">{{ step.id }}</span>
            </div>

            <!-- Step Info -->
            <div class="flex flex-col">
                <span
                    class="text-sm font-medium transition-colors duration-200"
                    :class="step.id === currentStep ? 'text-primary' : step.id < currentStep ? 'text-green-600' : 'text-muted-foreground'"
                >
                    {{ step.title }}
                </span>
                <span class="text-xs text-muted-foreground">{{ step.description }}</span>
            </div>

            <!-- Connector Line -->
            <div
                v-if="index < steps.length - 1"
                class="w-12 h-0.5 mx-4 transition-colors duration-200"
                :class="step.id < currentStep ? 'bg-green-500' : 'bg-border'"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { CheckIcon } from 'lucide-vue-next';
import type { DeploymentStep } from '../types';

const props = defineProps<{
    currentStep: number;
    steps: DeploymentStep[];
}>();

const getStepClasses = (stepId: number) => {
    if (stepId < props.currentStep) {
        return 'bg-green-500 border-green-500';
    } else if (stepId === props.currentStep) {
        return 'bg-primary border-primary text-white';
    } else {
        return 'bg-background border-border text-muted-foreground';
    }
};
</script>
