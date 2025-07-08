<template>
    <div class="flex items-center justify-between p-3 border rounded-lg bg-primary/5">
        <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
                <h4 class="font-medium text-sm truncate">{{ service.serviceName }}</h4>
                <Badge :variant="getStatusVariant(service.status)" class="text-xs">
                    {{ service.status }}
                </Badge>
            </div>
            <p class="text-xs text-muted-foreground truncate">
                {{ service.clusterName }}
            </p>
        </div>
        <Button variant="ghost" size="sm" @click="$emit('remove')" class="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive">
            <XIcon class="h-3 w-3" />
        </Button>
    </div>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { XIcon } from 'lucide-vue-next';
import type { TransformedService } from '../types';
import { useServiceTransform } from '../composables/useServiceTransform';

const props = defineProps<{
    service: TransformedService;
}>();

const emit = defineEmits<{
    (e: 'remove'): void;
}>();

const { getStatusVariant } = useServiceTransform();
</script>
