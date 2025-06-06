<script setup lang="ts" generic="TData">
import type { Column } from '@tanstack/vue-table';
import { type Component, computed } from 'vue';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { cn } from '@//utils';

import { CheckIcon, PlusCircledIcon } from '@radix-icons/vue';
import type { DataTableOptionsProps } from '@/components/ui/drawer/interfaces/custom-table.interface.ts';
import { type TableKey, useFilterStore } from '@/stores/filterStore.ts';

interface DataTableFacetedFilter {
    column?: Column<TData, any>;
    title?: string;
    options: DataTableOptionsProps[];
    tableName: TableKey;
}

const { setFilter, removeFilter } = useFilterStore();
const props = defineProps<DataTableFacetedFilter>();
const facets = computed(() => props.column?.getFacetedUniqueValues());
const selectedValues = computed(() => new Set(props.column?.getFilterValue() as string[]));
</script>

<template>
    <Popover>
        <PopoverTrigger as-child>
            <Button variant="outline" size="sm" class="h-8 border-dashed">
                <PlusCircledIcon class="mr-2 h-4 w-4" />
                {{ title }}
                <template v-if="selectedValues.size > 0">
                    <Separator orientation="vertical" class="mx-2 h-4" />
                    <Badge variant="secondary" class="rounded-sm px-1 font-normal lg:hidden">
                        {{ selectedValues.size }}
                    </Badge>
                    <div class="hidden space-x-1 lg:flex">
                        <Badge v-if="selectedValues.size > 2" variant="secondary" class="rounded-sm px-1 font-normal">
                            {{ selectedValues.size }} selected
                        </Badge>

                        <template v-else>
                            <Badge
                                v-for="option in options.filter((option) => selectedValues.has(option.value))"
                                :key="option.value"
                                variant="secondary"
                                class="rounded-sm px-1 font-normal"
                            >
                                {{ option.label }}
                            </Badge>
                        </template>
                    </div>
                </template>
            </Button>
        </PopoverTrigger>
        <PopoverContent class="w-[200px] p-0" align="start">
            <Command :filter="(value: string, search: string) => value.toLowerCase().includes(search.toLowerCase())">
                <CommandInput :placeholder="title" />
                <CommandList>
                    <CommandEmpty>No results found.</CommandEmpty>
                    <CommandGroup>
                        <CommandItem
                            v-for="option in options"
                            :key="option.value"
                            :value="option.label"
                            @select="
                                (e) => {
                                    const isSelected = selectedValues.has(option.value);
                                    if (isSelected) {
                                        selectedValues.delete(option.value);
                                    } else {
                                        selectedValues.add(option.value);
                                    }
                                    const filterValues = Array.from(selectedValues);
                                    column?.setFilterValue(filterValues.length ? filterValues : undefined);
                                    setFilter(tableName, column?.id || '', filterValues);
                                }
                            "
                        >
                            <div
                                :class="
                                    cn(
                                        'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                                        selectedValues.has(option.value)
                                            ? 'bg-primary text-primary-foreground'
                                            : 'opacity-50 [&_svg]:invisible',
                                    )
                                "
                            >
                                <CheckIcon :class="cn('h-4 w-4')" />
                            </div>
                            <component :is="option.icon" v-if="option.icon" class="mr-2 h-4 w-4 text-foreground" />
                            <span>{{ option.label }}</span>
                            <span
                                v-if="facets?.get(option.value)"
                                class="ml-auto flex h-4 w-4 items-center justify-center font-mono text-xs"
                            >
                                {{ facets.get(option.value) }}
                            </span>
                        </CommandItem>
                    </CommandGroup>

                    <template v-if="selectedValues.size > 0">
                        <CommandSeparator />
                        <CommandGroup>
                            <CommandItem
                                value="clear-filters"
                                class="justify-center text-center"
                                @select="
                                    column?.setFilterValue(undefined);
                                    removeFilter(tableName, column?.id || '');
                                "
                            >
                                Clear filters
                            </CommandItem>
                        </CommandGroup>
                    </template>
                </CommandList>
            </Command>
        </PopoverContent>
    </Popover>
</template>
