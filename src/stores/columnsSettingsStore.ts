import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { VisibilityState } from '@tanstack/vue-table'

export const useColumnSettingsStore = defineStore(
    'columnSettings',
    () => {
        const hiddenColumns = ref<VisibilityState>({})

        const hideColumn = (column: VisibilityState) => {
            hiddenColumns.value = column
        }

        const showColumn = (column: string) => {}

        return {
            hiddenColumns,
            hideColumn,
            showColumn,
        }
    },
    { persist: true },
)
