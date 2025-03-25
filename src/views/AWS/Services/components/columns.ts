import type { ColumnDef } from '@tanstack/vue-table'
import type { Service } from '../data/schema.ts'

import { h } from 'vue'
import { Checkbox } from '@/components/ui/checkbox'
import { lastDeploymentStatuses, statuses } from '@/views/AWS/Services/data/data.ts'
import type { ServiceInterface } from '@/views/AWS/Services/types/service.interface.ts'
import DataTableColumnHeader from '@/components/ui/custom-table/DataTableColumnHeader.vue'

export const columns: ColumnDef<Service>[] = [
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
      return h('div', { class: 'w-25 py-2' }, row.getValue('name'))
    },
    enableSorting: true,
    enableHiding: false,
    filterFn: (row, id, filterValues) => {
      const userInfoString = [
        (row.original as unknown as ServiceInterface).name,
        // (row.original as unknown as ServiceInterface).clusterName,
      ]
        .filter(Boolean)
        .join(' ')

      const searchTerms = Array.isArray(filterValues) ? filterValues : [filterValues]

      // Check if any of the search terms are included in the userInfoString
      return searchTerms.some((term) => userInfoString.includes(term.toLowerCase()))
    },
  },
  {
    accessorKey: 'clusterName',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Cluster' }),
    cell: ({ row }) => {
      return h('div', { class: 'w-15' }, row.getValue('clusterName'))
    },
    enableSorting: true,
    enableHiding: true,
    filterFn: (row, id, filterValues) => {
      const value = row.getValue(id)
      return filterValues.includes(value)
    },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Status' }),
    cell: ({ row }) => {
      const status = statuses.find((status) => status.value === row.getValue('status'))

      if (!status) return null

      return h('div', { class: 'w-10 flex w-[100px] items-center' }, [
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
  // {
  //   accessorKey: 'cpuUsage',
  //   header: ({ column }) => h(DataTableColumnHeader, { column, title: 'CPU Usage' }),
  //   cell: ({ row }) => {
  //     const cpuValue = (row.original as unknown as ServiceInterface).container.cpu
  //     const barColor = cpuValue > 75 ? 'bg-red-500' : cpuValue > 50 ? 'bg-yellow-500' : 'bg-blue-500'
  //     const textColor = cpuValue > 75 ? 'text-red-600' : cpuValue > 50 ? 'text-yellow-600' : 'text-gray-600'
  //
  //     return h('div', { class: 'w-24 flex items-center gap-2' }, [
  //       h('div', { class: 'flex-1 h-2 bg-gray-200 rounded-full overflow-hidden' }, [
  //         h('div', {
  //           class: `h-full ${barColor} rounded-full`,
  //           style: `width: ${cpuValue}%`,
  //         }),
  //       ]),
  //       h('span', { class: `text-sm ${textColor}` }, `${cpuValue}%`),
  //     ])
  //   },
  // },
  {
    accessorKey: 'image',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Image' }),
    cell: ({ row }) => h('div', { class: 'w-35' }, (row.original as unknown as ServiceInterface).containers[0].image),
  },
  {
    accessorKey: 'taskRevision',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Task R.' }),
    cell: ({ row }) =>
      h('div', { class: 'w-10 flex items-center gap-1' }, [
        (row.original as unknown as ServiceInterface).taskDefinition?.revision,
        h('i', { class: 'text-sm' }),
      ]),
  },
  {
    accessorKey: 'runningCount',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Running' }),
    cell: ({ row }) => h('div', { class: 'w-2' }, row.getValue('runningCount')),
  },
  {
    accessorKey: 'pendingCount',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Pending' }),
    cell: ({ row }) => h('div', { class: 'w-2' }, row.getValue('pendingCount')),
  },
  {
    accessorKey: 'desiredCount',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Desired' }),
    cell: ({ row }) => h('div', { class: 'w-2' }, row.getValue('desiredCount')),
  },
  {
    accessorKey: 'lastDeploymentStatus',
    accessorFn: (row) => {
      const deployment = (row as unknown as ServiceInterface).deployments[0]
      return deployment ? deployment.rolloutState : 'N/A'
    },
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Last Deployment Status' }),
    cell: ({ row }) => {
      const deployment = (row.original as unknown as ServiceInterface).deployments[0]
      if (!deployment) return h('div', { class: 'w-10' }, 'N/A')
      const status = lastDeploymentStatuses.find((status) => status.value === deployment.rolloutState)

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
    filterFn: (row, id, filterValues) => {
      const deployment = (row.original as unknown as ServiceInterface).deployments[0]
      if (!deployment) return false

      return filterValues.includes(deployment.rolloutState)
    },
  },
]
