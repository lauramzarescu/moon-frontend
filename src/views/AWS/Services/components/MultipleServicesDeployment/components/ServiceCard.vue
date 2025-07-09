<template>
    <div
        class="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
        :class="{ 'bg-muted/30': isSelected, 'opacity-50': isDisabled }"
    >
        <div class="flex items-center space-x-3 flex-1 min-w-0">
            <Checkbox
                :id="`service-${service.clusterName}-${service.serviceName}`"
                :checked="isSelected"
                :disabled="isDisabled"
                @update:checked="$emit('toggle')"
            />
            <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                    <h4 class="font-medium text-sm truncate">{{ service.serviceName }}</h4>
                    <Badge :variant="getStatusVariant(service.status)" class="text-xs">
                        {{ service.status }}
                    </Badge>
                </div>
                <p class="text-xs text-muted-foreground truncate mb-1">
                    <ServerIcon class="inline h-3 w-3 mr-1" />
                    {{ service.clusterName }}
                </p>
                <p class="text-xs text-muted-foreground truncate">
                    <ContainerIcon class="inline h-3 w-3 mr-1" />
                    {{ service.image }}
                </p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ContainerIcon, ServerIcon } from 'lucide-vue-next';
import type { TransformedService } from '../types';
import { useServiceTransform } from '../composables/useServiceTransform';

const props = defineProps<{
    service: TransformedService;
    isSelected: boolean;
    isDisabled: boolean;
}>();

const emit = defineEmits<{
    (e: 'toggle'): void;
}>();

const { getStatusVariant } = useServiceTransform();
</script>
