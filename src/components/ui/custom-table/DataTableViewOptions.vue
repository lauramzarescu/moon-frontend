<script setup lang="ts" generic="TData">
import type { Table } from '@tanstack/vue-table'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { computed } from 'vue'
import { MixerHorizontalIcon } from '@radix-icons/vue'

interface DataTableViewOptionsProps {
    table: Table<TData>
}

const props = defineProps<DataTableViewOptionsProps>()

const columns = computed(() =>
    props.table.getAllColumns().filter((column) => typeof column.accessorFn !== 'undefined' && column.getCanHide()),
)
</script>

<template>
    <DropdownMenu>
        <DropdownMenuTrigger as-child>
            <Button variant="outline" size="sm" class="ml-auto hidden h-8 lg:flex">
                <MixerHorizontalIcon class="mr-2 h-4 w-4" />
                View
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="w-[200px]">
            <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
                v-for="column in columns"
                :key="column.id"
                class="capitalize"
                :checked="column.getIsVisible()"
                @update:checked="(value) => column.toggleVisibility(!!value)"
            >
                {{ column.id.replace(/([A-Z])/g, ' $1').trim() }}
            </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
    </DropdownMenu>
</template>
