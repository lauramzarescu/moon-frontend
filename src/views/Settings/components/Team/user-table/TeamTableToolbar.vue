<script setup lang="ts" generic="TData">
import type { Table } from '@tanstack/vue-table';
import { Input } from '@/components/ui/input';

interface DataTableToolbarProps {
    table: Table<TData>;
    inputPlaceholder: string;
    options: {
        label: string;
        value: string;
        icon: any;
    }[];
}

defineProps<{
    table: Table<any>;
    options?: DataTableToolbarProps;
}>();
</script>

<template>
    <div class="flex items-center justify-between">
        <div class="flex flex-1 items-center space-x-2">
            <Input
                placeholder="Filter emails..."
                class="h-8 w-[150px] lg:w-[250px]"
                :model-value="(table.getColumn('email')?.getFilterValue() as string) ?? ''"
                @update:model-value="table.getColumn('email')?.setFilterValue($event)"
            />
        </div>
    </div>
</template>
