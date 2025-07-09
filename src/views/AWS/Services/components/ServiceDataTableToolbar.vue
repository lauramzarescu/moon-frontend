<script setup lang="ts" generic="TData">
import type { Table } from '@tanstack/vue-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { computed } from 'vue';
import { Cross2Icon } from '@radix-icons/vue';
import DataTableFacetedFilter from '@/components/ui/custom-table/DataTableFacetedFilter.vue';
import DataTableViewOptions from '@/components/ui/custom-table/DataTableViewOptions.vue';
import SecretsComparisonDialog from './EnvironmentVariablesComparison/SecretsComparisonDialog.vue';
import MultipleServicesDeploymentDialog from './MultipleServicesDeploymentDialog.vue';
import type { DataTableOptionsArray } from '@/components/ui/drawer/interfaces/custom-table.interface.ts';
import type { ServiceInterface } from '@/views/AWS/Services/types/service.interface.ts';
import { TABLE_KEYS, useFilterStore } from '@/stores/filterStore.ts';
import { storeToRefs } from 'pinia';
import { useDataStore } from '@/stores/dataStore.ts';

interface DataTableToolbarProps {
    table: Table<TData>;
    inputPlaceholder: string;
    options: DataTableOptionsArray;
}

const { services } = storeToRefs(useDataStore());
const filterStore = useFilterStore();
const { clearFilters, setFilter } = filterStore;
const props = defineProps<DataTableToolbarProps>();

const isFiltered = computed(() => props.table.getState().columnFilters.length > 0);

const servicesToCompare = computed(() => {
    const allServices = services.value || [];

    if (isFiltered.value) {
        return props.table.getFilteredRowModel().rows.map((row) => row.original as ServiceInterface);
    } else {
        return allServices;
    }
});

const handleFilterChange = (columnId: string, value: any) => {
    props.table.getColumn(columnId)?.setFilterValue(value);

    if (value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
        filterStore.removeFilter(TABLE_KEYS.SERVICES, columnId);
    } else {
        filterStore.setFilter(TABLE_KEYS.SERVICES, columnId, value);
    }
};

const handleDeploymentCompleted = () => {
    console.log('Deployment completed, refreshing data...');
};
</script>

<template>
    <div class="flex items-center justify-between">
        <div class="flex flex-1 items-center space-x-2">
            <Input
                placeholder="Filter services..."
                :model-value="(table.getColumn('name')?.getFilterValue() as string) ?? ''"
                class="h-8 w-[150px] lg:w-[250px]"
                @input="handleFilterChange('name', $event.target.value)"
            />
            <DataTableFacetedFilter
                v-if="table.getColumn('clusterName')"
                :column="table.getColumn('clusterName')"
                :table-name="TABLE_KEYS.SERVICES"
                title="Cluster Name"
                :options="options['clusterName']"
            />
            <DataTableFacetedFilter
                v-if="table.getColumn('status')"
                :column="table.getColumn('status')"
                :table-name="TABLE_KEYS.SERVICES"
                title="Status"
                :options="options['status']"
            />
            <DataTableFacetedFilter
                v-if="table.getColumn('lastDeploymentStatus')"
                :column="table.getColumn('lastDeploymentStatus')"
                :table-name="TABLE_KEYS.SERVICES"
                title="Last Deployment Status"
                :options="options['lastDeploymentStatus']"
            />
            <Button
                v-if="isFiltered"
                variant="ghost"
                class="h-8 px-2 lg:px-3"
                @click="
                    table.resetColumnFilters();
                    clearFilters(TABLE_KEYS.SERVICES);
                "
            >
                Reset
                <Cross2Icon class="ml-2 h-4 w-4" />
            </Button>
        </div>
        <div class="flex items-center space-x-2">
            <MultipleServicesDeploymentDialog :services="services" @deployment-completed="handleDeploymentCompleted" />
            <SecretsComparisonDialog :services="services" :filteredServices="servicesToCompare" :is-filtered="isFiltered" />
            <DataTableViewOptions :table="table" />
        </div>
    </div>
</template>
