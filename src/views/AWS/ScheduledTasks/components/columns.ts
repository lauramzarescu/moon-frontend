import type { ColumnDef } from '@tanstack/vue-table'
import type { ScheduledTask } from '../data/schema.ts'

import { h } from 'vue'
import { statuses } from '../data/data.ts'
import { Checkbox } from '@/components/ui/checkbox'
import DataTableColumnHeader from '@/components/ui/custom-table/DataTableColumnHeader.vue'
import moment from 'moment'

export const columns: ColumnDef<ScheduledTask>[] = [
    {
        id: 'select',
        header: ({ table }) =>
            h(Checkbox, {
                checked: table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate'),
                'onUpdate:checked': (value) => table.toggleAllPageRowsSelected(!!value),
                ariaLabel: 'Select all',
                class: 'translate-y-0.5',
            }),
        cell: ({ row }) =>
            h(Checkbox, {
                checked: row.getIsSelected(),
                'onUpdate:checked': (value) => row.toggleSelected(!!value),
                ariaLabel: 'Select row',
                class: 'translate-y-0.5',
            }),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: 'name',
        header: ({ column }) =>
            h(DataTableColumnHeader, {
                column,
                title: 'Name',
            }),
        cell: ({ row }) => {
            return h('div', { class: 'w-40 py-2' }, row.getValue('name'))
        },
        enableSorting: true,
        enableHiding: false,
    },
    {
        accessorKey: 'clusterName',
        header: ({ column }) =>
            h(DataTableColumnHeader, {
                column,
                title: 'Cluster',
            }),
        cell: ({ row }) => {
            return h('div', { class: 'w-40 py-2' }, row.getValue('clusterName'))
        },
        filterFn: (row, id, value) => {
            return value?.includes(row.getValue(id))
        },
        enableSorting: true,
        enableHiding: false,
    },
    {
        accessorKey: 'status',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Status' }),
        cell: ({ row }) => {
            const status = statuses.find((status) => status.value === row.getValue('status'))

            if (!status) return null

            return h('div', { class: 'flex w-[100px] items-center' }, [
                h(
                    'span',
                    {
                        class: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
          ${status.color || 'bg-gray-100 text-gray-800'}`,
                    },
                    status.label,
                ),
            ])
        },
        filterFn: (row, id, value) => {
            return value?.includes(row.getValue(id))
        },
    },
    {
        accessorKey: 'nextRun',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Next Run' }),
        cell: ({ row }) => {
            const nextRun = row.getValue('nextRun')
            return h(
                'div',
                {
                    class: 'w-30 rounded px-2 py-1 transition-colors duration-200 cursor-pointer',
                },
                nextRun ? moment.utc(nextRun).format('DD MMM YYYY, HH:mm ') : 'N/A',
            )
        },
    },
    {
        accessorKey: 'readableCron',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Cron Expression' }),
        cell: ({ row }) =>
            h(
                'div',
                {
                    class: 'w-30 rounded px-2 py-1 transition-colors duration-200 cursor-pointer',
                },
                row.getValue('readableCron'),
            ),
    },
    {
        accessorKey: 'eventBusName',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Event Bus Name' }),
        cell: ({ row }) => h('div', { class: 'w-30' }, row.getValue('eventBusName')),
    },
    // {
    //   id: 'actions',
    //   cell: ({ row }) => h(DataTableRowActions, { row }),
    // },
]
