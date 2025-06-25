<template>
    <div class="p-4 bg-muted/50 rounded-lg">
        <h4 class="font-semibold mb-2">Comparison Summary</h4>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div class="flex items-center gap-2">
                <div class="w-3 h-3 bg-green-500 rounded"></div>
                <span>{{ compareByValue ? 'Exact matches' : 'Common names' }}: {{ comparisonStats.common }}</span>
            </div>
            <div v-if="!compareByValue" class="flex items-center gap-2">
                <div class="w-3 h-3 bg-yellow-500 rounded"></div>
                <span>Name conflicts: {{ comparisonStats.conflicts }}</span>
            </div>
            <div class="flex items-center gap-2">
                <div class="w-3 h-3 bg-blue-500 rounded"></div>
                <span>Unique variables: {{ comparisonStats.unique }}</span>
            </div>
            <div class="flex items-center gap-2">
                <div class="w-3 h-3 bg-gray-500 rounded"></div>
                <span>Total variables: {{ comparisonStats.total }}</span>
            </div>
        </div>

        <!-- Coverage percentage for multi-service comparison -->
        <div v-if="comparisonStats.total > 0" class="mt-3 pt-3 border-t">
            <div class="text-xs text-muted-foreground mb-1">Configuration consistency: {{ consistencyPercentage }}%</div>
            <div class="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                <div
                    class="bg-green-600 h-2 rounded-full transition-all duration-300"
                    :style="{ width: `${consistencyPercentage}%` }"
                ></div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ComparisonStats } from '@/views/AWS/Services/types/comparison.interface.ts';

const props = defineProps<{
    comparisonStats: ComparisonStats;
    compareByValue: boolean;
}>();

const consistencyPercentage = computed(() => {
    if (props.comparisonStats.total === 0) return 0;

    // Calculate consistency as the ratio of common variables to total
    const consistency = (props.comparisonStats.common / props.comparisonStats.total) * 100;
    return Math.round(consistency);
});
</script>
