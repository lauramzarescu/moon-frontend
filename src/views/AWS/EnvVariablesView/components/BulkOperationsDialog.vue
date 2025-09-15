<template>
    <!-- Use the new refactored component -->
    <BulkOperationsDialogNew
        :open="open"
        :service="service"
        :selected-variables="selectedVariables"
        @update:open="$emit('update:open', $event)"
        @completed="$emit('completed')"
    />
</template>

<script setup lang="ts">
import type { ServiceInterface } from '@/views/AWS/Services/types/service.interface';
import BulkOperationsDialogNew from './BulkOperationsDialog/BulkOperationsDialog.vue';

defineProps<{
    open: boolean;
    service: ServiceInterface | null;
    selectedVariables: string[];
}>();

defineEmits<{
    (e: 'update:open', value: boolean): void;
    (e: 'completed'): void;
}>();
</script>
