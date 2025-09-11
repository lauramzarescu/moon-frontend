<template>
    <EnvironmentVariablesTable
        ref="environmentVariablesTableRef"
        :container="container"
        :service-name="serviceName"
        :cluster-name="clusterName"
        :selected-version="selectedVersion"
        :is-latest="isLatest"
        @edit="$emit('edit', $event)"
        @delete="$emit('delete', $event)"
        @bulk-select="$emit('bulk-select', $event)"
        @add-new="$emit('add-new', $event)"
        @pending-changes="$emit('pending-changes', $event)"
        @save-all-changes="$emit('save-all-changes', $event)"
    />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { ContainerInterface } from '@/views/AWS/Services/types/service.interface';
import EnvironmentVariablesTable from './EnvironmentVariablesTable/EnvironmentVariablesTable.vue';

defineProps<{
    container: ContainerInterface;
    serviceName?: string;
    clusterName?: string;
    selectedVersion: string;
    isLatest?: boolean;
}>();

defineEmits<{
    (e: 'edit', variable: any): void;
    (e: 'delete', variable: any): void;
    (e: 'bulk-select', variables: string[]): void;
    (e: 'add-new', variable: any): void;
    (e: 'pending-changes', hasPending: boolean): void;
    (e: 'save-all-changes', changes: { newVariables: any[]; editedVariables: any[] }): void;
}>();

const environmentVariablesTableRef = ref<InstanceType<typeof EnvironmentVariablesTable>>();

defineExpose({
    saveAllChanges: () => environmentVariablesTableRef.value?.saveAllChanges(),
    clearPendingChanges: () => environmentVariablesTableRef.value?.clearPendingChanges(),
});
</script>
