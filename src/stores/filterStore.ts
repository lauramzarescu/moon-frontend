import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ColumnFiltersState, SortingState } from '@tanstack/vue-table'

// Define constants for table keys
export const TABLE_KEYS = {
    INVENTORY: 'inventory',
    CLUSTERS: 'clusters',
    SERVICES: 'services',
    SCHEDULED_TASKS: 'scheduledTasks',
} as const

export type TableKey = (typeof TABLE_KEYS)[keyof typeof TABLE_KEYS]

export interface TableSettings {
    filters: ColumnFiltersState
    sorting: SortingState
    pagination: {
        pageIndex: number
        pageSize: number
    }
}

export const useFilterStore = defineStore(
    'filters',
    () => {
        const tableFilters = ref<Record<TableKey, ColumnFiltersState>>({
            [TABLE_KEYS.INVENTORY]: [],
            [TABLE_KEYS.CLUSTERS]: [],
            [TABLE_KEYS.SERVICES]: [],
            [TABLE_KEYS.SCHEDULED_TASKS]: [],
        })

        // Add new refs for sorting and pagination
        const tableSorting = ref<Record<TableKey, SortingState>>({
            [TABLE_KEYS.INVENTORY]: [],
            [TABLE_KEYS.CLUSTERS]: [],
            [TABLE_KEYS.SERVICES]: [],
            [TABLE_KEYS.SCHEDULED_TASKS]: [],
        })

        const tablePagination = ref<Record<TableKey, { pageIndex: number; pageSize: number }>>({
            [TABLE_KEYS.INVENTORY]: { pageIndex: 0, pageSize: 10 },
            [TABLE_KEYS.CLUSTERS]: { pageIndex: 0, pageSize: 10 },
            [TABLE_KEYS.SERVICES]: { pageIndex: 0, pageSize: 10 },
            [TABLE_KEYS.SCHEDULED_TASKS]: { pageIndex: 0, pageSize: 10 },
        })

        const setFilter = (tableKey: TableKey, id: string, value: any) => {
            if (!tableFilters.value[tableKey]) {
                tableFilters.value[tableKey] = []
            }

            const filters = tableFilters.value[tableKey]
            const index = filters.findIndex((filter) => filter.id === id)

            if (index !== -1) {
                filters[index] = { id, value }
            } else {
                filters.push({
                    id,
                    value,
                })
            }
        }

        const removeFilter = (tableKey: TableKey, id: string) => {
            if (!tableFilters.value[tableKey]) return

            const filters = tableFilters.value[tableKey]
            const index = filters.findIndex((filter) => filter.id === id)

            if (index !== -1) {
                filters.splice(index, 1)
            }
        }

        const clearFilters = (tableKey: TableKey) => {
            if (tableKey) {
                tableFilters.value[tableKey] = []
            }
        }

        const clearAllFilters = () => {
            tableFilters.value = {
                [TABLE_KEYS.INVENTORY]: [],
                [TABLE_KEYS.CLUSTERS]: [],
                [TABLE_KEYS.SERVICES]: [],
                [TABLE_KEYS.SCHEDULED_TASKS]: [],
            }
        }

        const setSorting = (tableKey: TableKey, sorting: SortingState) => {
            tableSorting.value[tableKey] = sorting
        }

        const setPagination = (tableKey: TableKey, pageIndex: number, pageSize: number) => {
            tablePagination.value[tableKey] = { pageIndex, pageSize }
        }

        const clearTableSettings = (tableKey: TableKey) => {
            tableFilters.value[tableKey] = []
            tableSorting.value[tableKey] = []
            tablePagination.value[tableKey] = { pageIndex: 0, pageSize: 10 }
        }

        return {
            tableFilters,
            tableSorting,
            tablePagination,
            setFilter,
            removeFilter,
            clearFilters,
            clearAllFilters,
            setSorting,
            setPagination,
            clearTableSettings,
        }
    },
    {
        persist: {
            storage: window.localStorage,
        },
    },
)
