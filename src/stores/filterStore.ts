import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ColumnFiltersState } from '@tanstack/vue-table'

// Define constants for table keys
export const TABLE_KEYS = {
  CLUSTERS: 'clusters',
  SERVICES: 'services',
  SCHEDULED_TASKS: 'scheduledTasks',
} as const

export type TableKey = typeof TABLE_KEYS[keyof typeof TABLE_KEYS]

export const useFilterStore = defineStore('filters', () => {
    const tableFilters = ref<Record<TableKey, ColumnFiltersState>>({
      [TABLE_KEYS.CLUSTERS]: [],
      [TABLE_KEYS.SERVICES]: [],
      [TABLE_KEYS.SCHEDULED_TASKS]: [],
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
        [TABLE_KEYS.CLUSTERS]: [],
        [TABLE_KEYS.SERVICES]: [],
        [TABLE_KEYS.SCHEDULED_TASKS]: [],
      }
    }

    return {
      tableFilters,
      setFilter,
      removeFilter,
      clearFilters,
      clearAllFilters,
    }
  },
  {
    persist: {
      storage: window.localStorage,
    },
  })
