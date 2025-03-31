import type { ColumnDef } from '@tanstack/vue-table';
import type { Instance } from '../data/schema.ts';

import { h } from 'vue';
import { statuses } from '../data/data.ts';
import { Checkbox } from '@/components/ui/checkbox';
import DataTableColumnHeader from '@/components/ui/custom-table/DataTableColumnHeader.vue';
import { Server } from 'lucide-vue-next';

export const columns: ColumnDef<Instance>[] = [
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
            const instanceName = row.getValue('name');
            const services = row.original.services || [];
            const hasServices = services.length > 0;

            return h(
                'div',
                {
                    class: `w-30 py-2 flex items-center ${hasServices ? 'font-bold' : ''}`,
                },
                [
                    h(Server, {
                        class: 'h-4 w-4 mr-1.5 text-gray-600 dark:text-gray-400 flex-shrink-0',
                    }),
                    instanceName,
                ],
            );
        },
        enableSorting: true,
        enableHiding: false,
    },
    {
        accessorKey: 'id',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Instance ID' }),
        cell: ({ row }) => {
            const instanceId = row.getValue('id');
            return h('div', { class: 'w-40 py-2' }, instanceId);
        },
    },
    {
        accessorKey: 'type',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Type' }),
        cell: ({ row }) => {
            const instanceType = row.getValue('type');
            return h('div', { class: 'w-[100px] py-2' }, instanceType);
        },
    },
    {
        accessorKey: 'state',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'State' }),
        cell: ({ row }) => {
            const state = statuses.find((status) => status.value === row.getValue('state'));

            if (!state) return null;

            return h('div', { class: 'flex w-[100px] items-center' }, [
                h(
                    'span',
                    {
                        class: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
          ${state.color || 'bg-gray-100 text-gray-800'}`,
                    },
                    state.label,
                ),
            ]);
        },
        filterFn: (row, id, value) => {
            return value?.includes(row.getValue(id));
        },
    },
    {
        accessorKey: 'publicIp',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Public IP' }),
        cell: ({ row }) => {
            const publicIp = row.getValue('publicIp');
            return h('div', { class: 'w-[120px] py-2' }, publicIp);
        },
    },
    {
        accessorKey: 'primaryPrivateIp',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Private IP' }),
        cell: ({ row }) => {
            const privateIp = row.getValue('primaryPrivateIp');
            return h('div', { class: 'w-[120px] py-2' }, privateIp);
        },
    },
];
