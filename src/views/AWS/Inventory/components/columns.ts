import type { ColumnDef } from '@tanstack/vue-table';
import type { Instance } from '../data/schema.ts';

import { h, ref } from 'vue';
import { copyToClipboard as copyToClipboardHelper } from '@/composables/useClipboard';
import { statuses } from '../data/data.ts';
import DataTableColumnHeader from '@/components/ui/custom-table/DataTableColumnHeader.vue';
import { Check, Copy, Server } from 'lucide-vue-next';

export const columns: ColumnDef<Instance>[] = [
    // {
    //     id: 'select',
    //     header: ({ table }) =>
    //         h(Checkbox, {
    //             checked: table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate'),
    //             'onUpdate:checked': (value) => table.toggleAllPageRowsSelected(!!value),
    //             ariaLabel: 'Select all',
    //             class: 'translate-y-0.5',
    //         }),
    //     cell: ({ row }) =>
    //         h(Checkbox, {
    //             checked: row.getIsSelected(),
    //             'onUpdate:checked': (value) => row.toggleSelected(!!value),
    //             ariaLabel: 'Select row',
    //             class: 'translate-y-0.5',
    //         }),
    //     enableSorting: false,
    //     enableHiding: false,
    // },
    {
        accessorKey: 'name',
        header: ({ column }) => h(DataTableColumnHeader, { column, class: 'ml-4', title: 'Name' }),
        cell: ({ row }) => {
            const instanceName = row.getValue('name');
            const services = row.original.services || [];
            const hasServices = services.length > 0;

            return h(
                'div',
                {
                    class: `w-30 py-2 ml-4 flex items-center ${hasServices ? 'font-bold' : ''}`,
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
            const instanceId = row.getValue('id') as string;
            const copied = ref(false);
            const onCopy = async () => {
                const ok = await copyToClipboardHelper(instanceId);
                copied.value = !!ok;
                setTimeout(() => (copied.value = false), 2000);
            };
            return h('div', { class: 'w-40 py-2 group flex items-center gap-2' }, [
                h('span', { class: 'truncate max-w-[160px]' }, instanceId),
                h(
                    'button',
                    {
                        class: 'opacity-0 group-hover:opacity-100 transition-all duration-200 text-muted-foreground hover:text-foreground',
                        'aria-label': () => (copied.value ? 'Copied' : 'Copy instance ID'),
                        title: () => (copied.value ? 'Copied' : 'Copy instance ID'),
                        onClick: (e: MouseEvent) => {
                            e.stopPropagation();
                            onCopy();
                        },
                    },
                    [
                        h(copied.value ? Check : Copy, { class: 'h-3.5 w-3.5' }),
                        copied.value && h('span', { class: 'text-xs ml-1' }, 'Copied'),
                    ],
                ),
            ]);
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
            const ip = row.getValue('publicIp') || '-';
            const copied = ref(false);
            const onCopy = async () => {
                try {
                    await copyToClipboardHelper(ip);
                    copied.value = true;
                    setTimeout(() => (copied.value = false), 2000);
                } catch (e) {
                    copied.value = false;
                    console.warn('Clipboard copy failed', e);
                }
            };
            return h('div', { class: 'w-[160px] py-2 group flex items-center gap-2' }, [
                h('span', { class: 'truncate max-w-[120px]' }, ip),
                ip !== '-' &&
                    h(
                        'button',
                        {
                            class: 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200 text-muted-foreground hover:text-foreground',
                            'aria-label': () => (copied.value ? 'Copied' : 'Copy IP'),
                            title: () => (copied.value ? 'Copied' : 'Copy IP'),
                            onClick: onCopy,
                        },
                        [h(copied.value ? Check : Copy, { class: 'h-3.5 w-3.5' }), h('span', { class: 'sr-only' }, 'Copy')],
                    ),
            ]);
        },
    },
    {
        accessorKey: 'primaryPrivateIp',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Private IP' }),
        cell: ({ row }) => {
            const ip = row.getValue('primaryPrivateIp') || '-';
            const copied = ref(false);
            const onCopy = async () => {
                try {
                    await copyToClipboardHelper(ip);
                    copied.value = true;
                    setTimeout(() => (copied.value = false), 2000);
                } catch (e) {
                    copied.value = false;
                    console.warn('Clipboard copy failed', e);
                }
            };
            return h('div', { class: 'w-[160px] py-2 group flex items-center gap-2' }, [
                h('span', { class: 'truncate max-w-[120px]' }, ip),
                ip !== '-' &&
                    h(
                        'button',
                        {
                            class: 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200 text-muted-foreground hover:text-foreground',
                            'aria-label': () => (copied.value ? 'Copied' : 'Copy IP'),
                            title: () => (copied.value ? 'Copied' : 'Copy IP'),
                            onClick: onCopy,
                        },
                        [h(copied.value ? Check : Copy, { class: 'h-3.5 w-3.5' }), h('span', { class: 'sr-only' }, 'Copy')],
                    ),
            ]);
        },
    },
];
