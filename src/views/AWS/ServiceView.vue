<template>
    <ProviderHeader />
    <DataTable
        :data="services"
        :columns="serviceColumns"
        :options="{
            status: statuses,
            clusterName: uniqueClusterNames,
            lastDeploymentStatus: lastDeploymentStatuses,
        }"
        :row-action="rowAction"
        :config="config"
        :table-name="TABLE_KEYS.SERVICES"
        :default-sorting="defaultSorting"
    />
</template>

<style>
@media (min-width: 1024px) {
    .about {
        min-height: 100vh;
        display: flex;
        align-items: center;
    }
}
</style>
<script setup lang="ts" generic="TData extends ServiceInterface">
import { columns as serviceColumns } from '@/views/AWS/Services/components/columns.ts';
import { useDataStore } from '@/stores/dataStore.ts';
import { storeToRefs } from 'pinia';
import DataTable from '@/components/ui/custom-table/DataTable.vue';
import { lastDeploymentStatuses, statuses } from '@/views/AWS/Services/data/data.ts';
import type { DataTableConfig, DataTableRowActionProps } from '@/components/ui/drawer/interfaces/custom-table.interface.ts';
import ClusterDrawer from '@/views/AWS/Services/components/ServiceDrawer.vue';
import { TABLE_KEYS } from '@/stores/filterStore.ts';
import { computed } from 'vue';
import type { SortingState } from '@tanstack/vue-table';
import ServiceDataTableToolbar from '@/views/AWS/Services/components/ServiceDataTableToolbar.vue';
import { onBeforeRouteLeave } from 'vue-router';
import ProviderHeader from '@/components/ui/provider-header/ProviderHeader.vue';
import type { ServiceInterface } from '@/views/AWS/Services/types/service.interface.ts';

const { services } = storeToRefs(useDataStore());
const defaultSorting: SortingState = [
    {
        id: 'clusterName',
        desc: false,
    },
];
const rowAction: DataTableRowActionProps<TData> = {
    template: ClusterDrawer,
};
const config: DataTableConfig = {
    toolbarComponent: ServiceDataTableToolbar,
};

const uniqueClusterNames = computed(() => {
    const clusters = services.value.map((service: ServiceInterface) => ({
        id: service.clusterName,
        label: service.clusterName,
        value: service.clusterName,
    }));

    // Filter out duplicates based on value property
    return Array.from(new Map(clusters.map((item) => [item.value, item])).values());
});

onBeforeRouteLeave(() => {
    // clearFilters()
});
</script>
