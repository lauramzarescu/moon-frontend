<script setup lang="ts" generic="TData">
import type { Column } from '@tanstack/vue-table';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@//utils';

import { ArrowDownIcon, ArrowUpIcon, CaretSortIcon, EyeNoneIcon } from '@radix-icons/vue';

interface DataTableColumnHeaderProps {
    column: Column<TData, any>;
    title: string;
}

defineProps<DataTableColumnHeaderProps>();
</script>

<script lang="ts">
export default {
    inheritAttrs: false,
};
</script>

<template>
    <div v-if="column.getCanSort()" :class="cn('flex items-center space-x-2', $attrs.class ?? '')">
        <DropdownMenu>
            <DropdownMenuTrigger as-child>
                <Button variant="ghost" size="sm" class="-ml-3 h-8 data-[state=open]:bg-accent">
                    <span>{{ title }}</span>
                    <ArrowDownIcon v-if="column.getIsSorted() === 'desc'" class="ml-2 h-4 w-4" />
                    <ArrowUpIcon v-else-if="column.getIsSorted() === 'asc'" class="ml-2 h-4 w-4" />
                    <CaretSortIcon v-else class="ml-2 h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
                <DropdownMenuItem @click="column.toggleSorting(false)">
                    <ArrowUpIcon class="mr-2 h-3.5 w-3.5 text-foreground/70" />
                    Asc
                </DropdownMenuItem>
                <DropdownMenuItem @click="column.toggleSorting(true)">
                    <ArrowDownIcon class="mr-2 h-3.5 w-3.5 text-foreground/70" />
                    Desc
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem v-if="column.getCanHide()" @click="column.toggleVisibility(false)">
                    <EyeNoneIcon class="mr-2 h-3.5 w-3.5 text-foreground/70" />
                    Hide
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    </div>

    <div v-else :class="$attrs.class">
        {{ title }}
    </div>
</template>
