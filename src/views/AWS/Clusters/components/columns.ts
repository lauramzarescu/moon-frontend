import type { ColumnDef } from '@tanstack/vue-table';
import type { Cluster } from '../data/schema.ts';

import { h } from 'vue';
import { statuses } from '../data/data.ts';
import DataTableColumnHeader from '@/components/ui/custom-table/DataTableColumnHeader.vue';
import { AlertTriangle } from 'lucide-vue-next';
import { useDataStore } from '@/stores/dataStore';

const getClusterStuckInfo = (clusterName: string) => {
    const dataStore = useDataStore();

    const stuckServices = dataStore.services.filter(
        (service) => service.clusterName === clusterName && service.deploymentStatus?.isStuck === true,
    );

    return {
        hasStuckDeployments: stuckServices.length > 0,
        stuckServicesCount: stuckServices.length,
    };
};

export const columns: ColumnDef<Cluster>[] = [
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
            const clusterName = row.getValue('name');
            const { hasStuckDeployments, stuckServicesCount } = getClusterStuckInfo(clusterName as string);

            return h(
                'div',
                {
                    class: `w-30 py-2 ml-4 flex items-center ${hasStuckDeployments ? 'font-bold text-yellow-700 dark:text-yellow-100' : ''}`,
                },
                [
                    hasStuckDeployments &&
                        h(AlertTriangle, {
                            class: 'h-4 w-4 mr-1.5 text-yellow-600 dark:text-yellow-400 flex-shrink-0',
                            title: `${stuckServicesCount} stuck deployment${stuckServicesCount > 1 ? 's' : ''}`,
                        }),
                    clusterName,
                ],
            );
        },
        enableSorting: true,
        enableHiding: false,
    },
    {
        accessorKey: 'privateIp',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Private IP' }),
        cell: ({ row }) => {
            const privateIp = row.getValue('privateIp') || '-';
            return h('div', { class: 'w-[80px] py-2' }, privateIp);
        },
    },
    {
        accessorKey: 'status',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Status' }),
        cell: ({ row }) => {
            const status = statuses.find((status) => status.value === row.getValue('status'));

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
        filterFn: (row, id, value) => {
            return value?.includes(row.getValue(id));
        },
    },
    {
        accessorKey: 'runningTasks',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Running Tasks' }),
        cell: ({ row }) => {
            const clusterName = row.getValue('name');
            const { hasStuckDeployments } = getClusterStuckInfo(clusterName as string);

            return h(
                'div',
                {
                    class: `w-10 ${hasStuckDeployments ? 'font-bold text-yellow-700 dark:text-yellow-100' : ''}`,
                },
                row.getValue('runningTasks'),
            );
        },
    },
    {
        accessorKey: 'pendingTasks',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Pending Tasks' }),
        cell: ({ row }) => {
            const clusterName = row.getValue('name');
            const { hasStuckDeployments } = getClusterStuckInfo(clusterName as string);

            return h(
                'div',
                {
                    class: `w-10 ${hasStuckDeployments ? 'font-bold text-yellow-700 dark:text-yellow-100' : ''}`,
                },
                row.getValue('pendingTasks'),
            );
        },
    },
    {
        accessorKey: 'registeredContainerInstances',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Running Instances' }),
        cell: ({ row }) => {
            const clusterName = row.getValue('name');
            const { hasStuckDeployments } = getClusterStuckInfo(clusterName as string);

            return h(
                'div',
                {
                    class: `w-15 ${hasStuckDeployments ? 'font-bold text-yellow-700 dark:text-yellow-100' : ''}`,
                },
                `${row.getValue('registeredContainerInstances')} EC2`,
            );
        },
    },
    {
        accessorKey: 'servicesCount',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Services' }),
        cell: ({ row }) => {
            const clusterName = row.getValue('name');
            const { hasStuckDeployments, stuckServicesCount } = getClusterStuckInfo(clusterName as string);

            return h(
                'div',
                {
                    class: `w-10 flex items-center ${hasStuckDeployments ? 'font-bold text-yellow-700 dark:text-yellow-100' : ''}`,
                },
                [
                    row.getValue('servicesCount'),
                    hasStuckDeployments &&
                        h(
                            'span',
                            {
                                class: 'ml-1.5 text-xs text-yellow-600 dark:text-yellow-400',
                                title: `${stuckServicesCount} stuck deployment${stuckServicesCount > 1 ? 's' : ''}`,
                            },
                            `(${stuckServicesCount})`,
                        ),
                ],
            );
        },
    },
];
