<template>
    <div class="border rounded-lg">
        <div class="p-3 border-b bg-muted/50">
            <h3 class="font-semibold text-sm">{{ service.clusterName }} / {{ service.serviceName }}</h3>
        </div>
        <div class="p-3 space-y-3">
            <VariableSection
                title="Environment Variables"
                :variables="comparisonData.envVars"
                :status-map="comparisonData.status"
                :compare-by-value="compareByValue"
                :icon="IconType.GLOBE"
                :color="ColorType.GREEN"
            />

            <VariableSection
                title="Secrets"
                :variables="comparisonData.secrets"
                :status-map="comparisonData.status"
                :compare-by-value="compareByValue"
                :icon="IconType.KEY"
                :color="ColorType.PURPLE"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import VariableSection from '@/views/AWS/Services/components/EnvironmentVariablesComparison/VariableSection.vue';
import { ColorType, type ComparisonData, IconType, type ServiceData } from '@/views/AWS/Services/types/comparison.interface.ts';

defineProps<{
    service: ServiceData;
    comparisonData: ComparisonData;
    compareByValue: boolean;
}>();
</script>
