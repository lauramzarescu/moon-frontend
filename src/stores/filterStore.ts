import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ColumnFiltersState } from '@tanstack/vue-table'

export const useFilterStore = defineStore('filters', () => {
    const filters = ref<ColumnFiltersState>([])

    const setFilter = (id: string, value: any) => {
        // if filter does not exist, add it
        const index = filters.value.findIndex((filter) => filter.id === id)
        if (index !== -1) {
            filters.value[index] = { id, value }
            return
        }

        filters.value.push({
            id,
            value,
        })
    }

    const removeFilter = (id: string) => {
        const index = filters.value.findIndex((filter) => filter.id === id)
        if (index !== -1) {
            filters.value.splice(index, 1)
        }
    }

    const clearFilters = () => {
        filters.value = []
    }

    return {
        filters,
        setFilter,
        removeFilter,
        clearFilters,
    }
})
