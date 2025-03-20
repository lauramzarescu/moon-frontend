import type { ColumnDef, ColumnFiltersState } from '@tanstack/vue-table'
import type { Component } from 'vue'

export interface DataTableProps<TData> {
    columns: ColumnDef<TData, any>[]
    data: TData[]
    options: DataTableOptionsProps[]
    initialFilters?: ColumnFiltersState
    config: DataTableConfig

    /**
     * This action will be triggered when the user clicks on a row.
     */
    rowAction?: DataTableRowActionProps<TData>

    /**
     * This action will be triggered when the user clicks on an option from the options menu.
     */
    optionsActions?: DataTableActionsProps<TData>[]
}

export interface DataTableRowActionProps<TData> {
    template?: Component
    onClick?: (row: TData) => void
}

export interface DataTableActionsProps<TData> {
    /**
     * If triggerType is 'option', triggerId will be used to identify the option's ID from the DataTableOptionsProps array.
     */
    triggerId: string
    icon?: any
    onClick: (row: TData) => void
}

export interface DataTableOptionsProps {
    id: string
    label: string
    value: string
    icon: any
}

export interface DataTableConfig {
    toolbarComponent?: Component
}
