<script setup lang="ts" generic="TData">
import type { Table } from '@tanstack/vue-table';
import { Button } from '@/components/ui/button';

import { Input } from '@/components/ui/input';
import { computed } from 'vue';
import { Cross2Icon } from '@radix-icons/vue';
import DataTableFacetedFilter from '@/components/ui/custom-table/DataTableFacetedFilter.vue';
import DataTableViewOptions from '@/components/ui/custom-table/DataTableViewOptions.vue';
import type { DataTableOptionsArray } from '@/components/ui/drawer/interfaces/custom-table.interface.ts';
import { TABLE_KEYS, useFilterStore } from '@/stores/filterStore.ts';

interface DataTableToolbarProps {
    table: Table<TData>;
    inputPlaceholder: string;
    options: DataTableOptionsArray;
}

const { clearFilters } = useFilterStore();
const props = defineProps<DataTableToolbarProps>();

const isFiltered = computed(() => props.table.getState().columnFilters.length > 0);
</script>

<template>
    <div class="flex items-center justify-between">
        <div class="flex flex-1 items-center space-x-2">
            <Input
                placeholder="Filter scheduled tasks..."
                :model-value="(table.getColumn('name')?.getFilterValue() as string) ?? ''"
                class="h-8 w-[150px] lg:w-[250px]"
                @input="table.getColumn('name')?.setFilterValue($event.target.value)"
            />
            <DataTableFacetedFilter
                v-if="table.getColumn('status')"
                :column="table.getColumn('status')"
                :table-name="TABLE_KEYS.SCHEDULED_TASKS"
                title="Status"
                :options="options['status']"
            />
            <DataTableFacetedFilter
                v-if="table.getColumn('clusterName')"
                :column="table.getColumn('clusterName')"
                :table-name="TABLE_KEYS.SCHEDULED_TASKS"
                title="Cluster Name"
                :options="options['clusterName']"
            />
            <Button
                v-if="isFiltered"
                variant="ghost"
                class="h-8 px-2 lg:px-3"
                @click="
                    table.resetColumnFilters();
                    clearFilters(TABLE_KEYS.SCHEDULED_TASKS);
                "
            >
                Reset
                <Cross2Icon class="ml-2 h-4 w-4" />
            </Button>
        </div>
        <DataTableViewOptions :table="table" />
    </div>
</template>
