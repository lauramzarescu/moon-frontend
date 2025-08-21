import type { ColumnDef } from '@tanstack/vue-table';
import type { Service } from '../data/schema.ts';

import { h, ref } from 'vue';
import { copyToClipboard as copyToClipboardHelper } from '@/composables/useClipboard';
import { lastDeploymentStatuses, statuses } from '@/views/AWS/Services/data/data.ts';
import type { ServiceInterface } from '@/views/AWS/Services/types/service.interface.ts';
import DataTableColumnHeader from '@/components/ui/custom-table/DataTableColumnHeader.vue';
import { AlertTriangle, Check, Copy } from 'lucide-vue-next';

export const columns: ColumnDef<Service>[] = [
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
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Name', class: 'ml-4' }),
        cell: ({ row }) => {
            const service = row.original as unknown as ServiceInterface;
            const isStuck = service.deploymentStatus?.isStuck === true;

            const nameVal = row.getValue('name') as string;
            const copied = ref(false);
            const onCopy = async () => {
                const ok = await copyToClipboardHelper(nameVal);
                copied.value = !!ok;
                setTimeout(() => (copied.value = false), 2000);
            };

            return h(
                'div',
                {
                    class: `w-25 py-2 ml-4 flex items-center gap-2 group ${isStuck ? 'font-bold text-yellow-700 dark:text-yellow-100' : ''}`,
                },
                [
                    isStuck &&
                        h(AlertTriangle, {
                            class: 'h-4 w-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0',
                        }),
                    h('span', { class: 'truncate max-w-[220px]' }, nameVal),
                    h(
                        'button',
                        {
                            class:
                                'opacity-0 group-hover:opacity-100 transition-all duration-200 text-muted-foreground hover:text-foreground',
                            'aria-label': () => (copied.value ? 'Copied' : 'Copy name'),
                            title: () => (copied.value ? 'Copied' : 'Copy name'),
                            onClick: (e: MouseEvent) => {
                                e.stopPropagation();
                                onCopy();
                            },
                        },
                        [h(copied.value ? Check : Copy, { class: 'h-3.5 w-3.5' }), copied.value && h('span', { class: 'text-xs ml-1' }, 'Copied')],
                    ),
                ],
            );
        },
        enableSorting: true,
        enableHiding: false,
        filterFn: (row, id, filterValues) => {
            const userInfoString = [
                (row.original as unknown as ServiceInterface).name,
                // (row.original as unknown as ServiceInterface).clusterName,
            ]
                .filter(Boolean)
                .join(' ');

            const searchTerms = Array.isArray(filterValues) ? filterValues : [filterValues];

            // Check if any of the search terms are included in the userInfoString
            return searchTerms.some((term) => userInfoString.includes(term.toLowerCase()));
        },
    },
    {
        accessorKey: 'clusterName',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Cluster' }),
        cell: ({ row }) => {
            const service = row.original as unknown as ServiceInterface;
            const isStuck = service.deploymentStatus?.isStuck === true;

            return h(
                'div',
                {
                    class: `w-15 ${isStuck ? 'font-bold text-yellow-700 dark:text-yellow-100' : ''}`,
                },
                row.getValue('clusterName'),
            );
        },
        enableSorting: true,
        enableHiding: true,
        sortingFn: 'alphanumeric',
        sortDescFirst: true,
        filterFn: (row, id, value) => {
            return value?.includes(row.getValue(id));
        },
    },
    {
        accessorKey: 'status',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Status' }),
        cell: ({ row }) => {
            const status = statuses.find((status) => status.value === row.getValue('status'));

            if (!status) return null;

            return h('div', { class: 'w-10 flex w-[100px] items-center' }, [
                h(
                    'span',
                    {
                        class: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
            ${status.color || 'bg-gray-100 text-gray-800'}`,
                    },
                    status.label,
                ),
            ]);
        },
        filterFn: (row, id, value) => {
            return value?.includes(row.getValue(id));
        },
    },
    {
        accessorKey: 'image',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Image' }),
        cell: ({ row }) => {
            const service = row.original as unknown as ServiceInterface;
            const isStuck = service.deploymentStatus?.isStuck === true;

            const imageVal = service.containers[0].image;
            const copied = ref(false);
            const onCopy = async () => {
                try {
                    await copyToClipboardHelper(imageVal);
                    copied.value = true;
                    setTimeout(() => (copied.value = false), 2000);
                } catch (e) {
                    copied.value = false;
                    console.warn('Clipboard copy failed', e);
                }
            };

            return h(
                'div',
                { class: `w-35 group flex items-center gap-2 ${isStuck ? 'font-bold text-yellow-700 dark:text-yellow-100' : ''}` },
                [
                    h('span', { class: 'truncate max-w-[260px]' }, imageVal),
                    h(
                        'button',
                        {
                            class: 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200 text-muted-foreground hover:text-foreground',
                            'aria-label': () => (copied.value ? 'Copied' : 'Copy image'),
                            title: () => (copied.value ? 'Copied' : 'Copy image'),
                            onClick: async (e: MouseEvent) => {
                                e.stopPropagation();
                                await onCopy();
                            },
                        },
                        [h(copied.value ? Check : Copy, { class: 'h-3.5 w-3.5' }), h('span', { class: 'sr-only' }, 'Copy')],
                    ),
                ],
            );
        },
    },
    {
        accessorKey: 'taskRevision',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Task R.' }),
        cell: ({ row }) => {
            const service = row.original as unknown as ServiceInterface;
            const isStuck = service.deploymentStatus?.isStuck === true;

            return h(
                'div',
                {
                    class: `w-10 flex items-center gap-1 ${isStuck ? 'font-bold text-yellow-700 dark:text-yellow-100' : ''}`,
                },
                [service.taskDefinition?.revision, h('i', { class: 'text-sm' })],
            );
        },
    },
    {
        accessorKey: 'runningCount',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Running' }),
        cell: ({ row }) => {
            const service = row.original as unknown as ServiceInterface;
            const isStuck = service.deploymentStatus?.isStuck === true;

            return h(
                'div',
                {
                    class: `w-2 ${isStuck ? 'font-bold text-yellow-700 dark:text-yellow-100' : ''}`,
                },
                row.getValue('runningCount'),
            );
        },
    },
    {
        accessorKey: 'pendingCount',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Pending' }),
        cell: ({ row }) => {
            const service = row.original as unknown as ServiceInterface;
            const isStuck = service.deploymentStatus?.isStuck === true;

            return h(
                'div',
                {
                    class: `w-2 ${isStuck ? 'font-bold text-yellow-700 dark:text-yellow-100' : ''}`,
                },
                row.getValue('pendingCount'),
            );
        },
    },
    {
        accessorKey: 'desiredCount',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Desired' }),
        cell: ({ row }) => {
            const service = row.original as unknown as ServiceInterface;
            const isStuck = service.deploymentStatus?.isStuck === true;

            return h(
                'div',
                {
                    class: `w-2 ${isStuck ? 'font-bold text-yellow-700 dark:text-yellow-100' : ''}`,
                },
                row.getValue('desiredCount'),
            );
        },
    },
    {
        accessorKey: 'lastDeploymentStatus',
        accessorFn: (row) => {
            const deployment = (row as unknown as ServiceInterface).deployments[0];
            return deployment ? deployment.rolloutState : 'N/A';
        },
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Last Deployment Status' }),
        cell: ({ row }) => {
            const deployment = (row.original as unknown as ServiceInterface).deployments[0];
            if (!deployment) return h('div', { class: 'w-10' }, 'N/A');
            const status = lastDeploymentStatuses.find((status) => status.value === deployment.rolloutState);

            if (!status) return null;

            return h('div', { class: 'flex w-[100px] items-center' }, [
                h(
                    'span',
                    {
                        class: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
            ${status.color || 'bg-gray-100 text-gray-800'}`,
                    },
                    status.label,
                ),
            ]);
        },
        filterFn: (row, id, filterValues) => {
            const deployment = (row.original as unknown as ServiceInterface).deployments[0];
            if (!deployment) return false;

            return filterValues?.includes(deployment.rolloutState);
        },
    },
];
