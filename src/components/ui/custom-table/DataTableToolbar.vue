<script setup lang="ts" generic="TData">
import type { Table } from '@tanstack/vue-table'
import { Button } from '@/components/ui/button'

import { Input } from '@/components/ui/input'
import { computed } from 'vue'
import { Cross2Icon } from '@radix-icons/vue'
import DataTableFacetedFilter from './DataTableFacetedFilter.vue'
import DataTableViewOptions from './DataTableViewOptions.vue'

interface DataTableToolbarProps {
    table: Table<TData>
    options: {
        label: string
        value: string
        icon: any
    }[]
}

const props = defineProps<DataTableToolbarProps>()

const isFiltered = computed(() => props.table.getState().columnFilters.length > 0)
</script>

<template>
    <div class="flex items-center justify-between">
        <div class="flex flex-1 items-center space-x-2">
            <Input
                placeholder="Find clusters..."
                :model-value="(table.getColumn('name')?.getFilterValue() as string) ?? ''"
                class="h-8 w-[150px] lg:w-[250px]"
                @input="table.getColumn('name')?.setFilterValue($event.target.value)"
            />
            <DataTableFacetedFilter
                v-if="table.getColumn('status')"
                :column="table.getColumn('status')"
                title="Status"
                :options="options"
            />
            <Button v-if="isFiltered" variant="ghost" class="h-8 px-2 lg:px-3" @click="table.resetColumnFilters()">
                Reset
                <Cross2Icon class="ml-2 h-4 w-4" />
            </Button>
        </div>
        <DataTableViewOptions :table="table" />
    </div>
</template>
