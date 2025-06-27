<template>
    <div>
        <h4 :class="headerClass" class="text-sm font-medium mb-2 flex items-center gap-2">
            <component :is="iconComponent" class="h-4 w-4" />
            {{ title }} ({{ variables.length }})
        </h4>
        <div class="space-y-1">
            <div v-for="variable in variables" :key="variable.name" :class="getVariableClass(variable)" class="p-2 rounded text-sm border">
                <div class="font-mono font-medium truncate">{{ variable.name }}</div>
                <div class="text-xs text-muted-foreground truncate">{{ variable.value }}</div>
                <div v-if="shouldShowConflictWarning(variable)" class="text-xs text-orange-600 dark:text-orange-400 mt-1">
                    ⚠️ Same name, different value across services
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { GlobeIcon, KeyIcon } from 'lucide-vue-next';
import { computed } from 'vue';
import { ColorType, IconType, type ServiceVariable, VariableStatus } from '@/views/AWS/Services/types/comparison.interface.ts';

const props = defineProps<{
    title: string;
    variables: ServiceVariable[];
    statusMap: Map<string, VariableStatus>;
    compareByValue: boolean;
    icon: IconType;
    color: ColorType;
}>();

const iconComponent = computed(() => {
    return props.icon === IconType.GLOBE ? GlobeIcon : KeyIcon;
});

const headerClass = computed(() => {
    const baseClass = 'text-sm font-medium mb-2 flex items-center gap-2';
    return props.color === ColorType.GREEN
        ? `${baseClass} text-green-600 dark:text-green-400`
        : `${baseClass} text-purple-600 dark:text-purple-400`;
});

const getVariableClass = (variable: ServiceVariable) => {
    const status = props.statusMap.get(variable.name);

    switch (status) {
        case VariableStatus.COMMON:
            return 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800';
        case VariableStatus.CONFLICT:
            return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800';
        case VariableStatus.UNIQUE:
            return 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800';
        default:
            return 'bg-muted/50 border-border';
    }
};

const shouldShowConflictWarning = (variable: ServiceVariable) => {
    return !props.compareByValue && props.statusMap.get(variable.name) === VariableStatus.CONFLICT;
};
</script>
