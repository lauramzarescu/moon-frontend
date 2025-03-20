import type { ColumnDef } from '@tanstack/vue-table'
import type { Cluster } from '../data/schema.ts'

import { h } from 'vue'
import { statuses } from '../data/data.ts'
import { Checkbox } from '@/components/ui/checkbox'
import DataTableColumnHeader from '@/components/ui/custom-table/DataTableColumnHeader.vue'

export const columns: ColumnDef<Cluster>[] = [
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
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Name' }),
    cell: ({ row }) => {
      return h('div', { class: 'w-20 py-2' }, row.getValue('name'))
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
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: 'runningTasks',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Running Tasks' }),
    cell: ({ row }) => h('div', { class: 'w-10' }, row.getValue('runningTasks')),
  },
  {
    accessorKey: 'pendingTasks',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Pending Tasks' }),
    cell: ({ row }) => h('div', { class: 'w-10' }, row.getValue('pendingTasks')),
  },
  {
    accessorKey: 'registeredContainerInstances',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Running Instances' }),
    cell: ({ row }) => h('div', { class: 'w-10' }, `${row.getValue('registeredContainerInstances')} EC2`),
  },
  {
    accessorKey: 'servicesCount',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Services' }),
    cell: ({ row }) => h('div', { class: 'w-10' }, row.getValue('servicesCount')),
  },
  // {
  //   accessorKey: 'priority',
  //   header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Priority' }),
  //   cell: ({ row }) => {
  //     const priority = priorities.find(
  //       priority => priority.value === row.getValue('priority'),
  //     )
  //
  //     if (!priority)
  //       return null
  //
  //     return h('div', { class: 'flex items-center' }, [
  //       priority.icon && h(priority.icon, { class: 'mr-2 h-4 w-4 text-muted-foreground' }),
  //       h('span', {}, priority.label),
  //     ])
  //   },
  //   filterFn: (row, id, value) => {
  //     return value.includes(row.getValue(id))
  //   },
  // },
  // {
  //     id: 'actions',
  //     cell: ({ row }) => h(DataTableRowActions, { row }),
  // },
]
