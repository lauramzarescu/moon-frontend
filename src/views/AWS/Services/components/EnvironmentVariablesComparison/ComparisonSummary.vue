<script setup lang="ts">
import { computed } from 'vue';
import { type ComparisonStats, VariableStatus } from '@/views/AWS/Services/types/comparison.interface.ts';

const props = defineProps<{
    stats: ComparisonStats;
}>();

const consistencyPercentage = computed(() => {
    if (props.stats.totalVariables === 0) return 100;

    const consistentVariables = props.stats.commonVariables;
    return Math.round((consistentVariables / props.stats.totalVariables) * 100);
});

const getStatusColor = (type: VariableStatus.COMMON | VariableStatus.UNIQUE | VariableStatus.CONFLICT | VariableStatus.TOTAL) => {
    switch (type) {
        case VariableStatus.COMMON:
            return 'text-green-700 bg-green-200 border-green-200';
        case VariableStatus.UNIQUE:
            return 'text-sky-700 bg-sky-50 border-sky-200';
        case VariableStatus.CONFLICT:
            return 'text-red-700 bg-red-50 border-red-200';
        case VariableStatus.TOTAL:
            return 'text-slate-700 bg-slate-50 border-slate-200';
        default:
            return 'text-gray-600 bg-gray-50 border-gray-200';
    }
};

const getProgressBarColor = () => {
    if (consistencyPercentage.value >= 80) return 'bg-green-500';
    if (consistencyPercentage.value >= 60) return 'bg-amber-500';
    return 'bg-red-500';
};
</script>

<template>
    <div class="p-3 rounded-lg border">
        <h3 class="text-base font-semibold mb-3">Comparison Summary</h3>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <!-- Common Variables -->
            <div class="text-center p-2.5 rounded-md border text-sm" :class="getStatusColor(VariableStatus.COMMON)">
                <div class="text-lg font-bold leading-tight">{{ stats.commonVariables }}</div>
                <div class="text-xs font-medium mt-0.5">Common</div>
            </div>

            <!-- Unique Variables -->
            <div class="text-center p-2.5 rounded-md border text-sm" :class="getStatusColor(VariableStatus.UNIQUE)">
                <div class="text-lg font-bold leading-tight">{{ stats.uniqueVariables }}</div>
                <div class="text-xs font-medium mt-0.5">Unique</div>
            </div>

            <!-- Conflicting Variables -->
            <div class="text-center p-2.5 rounded-md border text-sm" :class="getStatusColor(VariableStatus.CONFLICT)">
                <div class="text-lg font-bold leading-tight">{{ stats.conflictingVariables }}</div>
                <div class="text-xs font-medium mt-0.5">Conflicts</div>
            </div>

            <!-- Total Variables -->
            <div class="text-center p-2.5 rounded-md border text-sm" :class="getStatusColor(VariableStatus.TOTAL)">
                <div class="text-lg font-bold leading-tight">{{ stats.totalVariables }}</div>
                <div class="text-xs font-medium mt-0.5">Total</div>
            </div>
        </div>

        <!-- Summary Info -->
        <div class="flex items-center justify-between text-sm mb-2">
            <div class="text-slate-600">
                Comparing <span class="font-medium">{{ stats.totalServices }}</span> services
            </div>
            <div class="font-medium text-slate-600">
                Consistency:
                <span
                    :class="
                        consistencyPercentage >= 80 ? 'text-green-600' : consistencyPercentage >= 60 ? 'text-amber-600' : 'text-red-600'
                    "
                >
                    {{ consistencyPercentage }}%
                </span>
            </div>
        </div>

        <!-- Progress bar for consistency -->
        <div class="w-full rounded-full h-1.5">
            <div
                class="h-1.5 rounded-full transition-all duration-500 ease-out"
                :class="getProgressBarColor()"
                :style="{ width: `${consistencyPercentage}%` }"
            ></div>
        </div>

        <!-- Legend -->
        <div class="flex flex-wrap gap-3 mt-3 text-xs">
            <div class="flex items-center gap-1">
                <div class="w-2 h-2 rounded-full bg-green-500"></div>
                <span class="text-slate-600">Same across all services</span>
            </div>
            <div class="flex items-center gap-1">
                <div class="w-2 h-2 rounded-full bg-sky-500"></div>
                <span class="text-slate-600">Service-specific</span>
            </div>
            <div class="flex items-center gap-1">
                <div class="w-2 h-2 rounded-full bg-amber-500"></div>
                <span class="text-slate-600">Different values</span>
            </div>
        </div>
    </div>
</template>
