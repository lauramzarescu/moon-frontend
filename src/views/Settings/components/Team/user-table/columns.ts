import type { ColumnDef } from '@tanstack/vue-table';
import { h } from 'vue';
import { Checkbox } from '@/components/ui/checkbox';
import DataTableColumnHeader from '@/components/ui/custom-table/DataTableColumnHeader.vue';
import type { UserInput } from '@/views/Settings/components/Team/schema.ts';
import { PermissionEnum, UserRole } from '@/enums/user/user.enum.ts';
import { usePermissions } from '@/composables/usePermissions.ts';
import { UserService } from '@/services/user.service.ts';
import DataTableRowActions from '@/components/ui/custom-table/DataTableRowActions.vue';
import { loginTypes } from '@/views/Settings/components/Team/user-table/data.ts';

const userService = new UserService();

export const columns: ColumnDef<UserInput>[] = [
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
        accessorKey: 'email',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Email' }),
        cell: ({ row }) => {
            return h('div', { class: 'w-60' }, row.getValue('email'));
        },
        enableSorting: true,
        enableHiding: false,
    },
    {
        accessorKey: 'role',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Role' }),
        filterFn: (row, id, value) => {
            return value.includes(row.getValue(id));
        },
        cell: ({ row }) => {
            const role = row.getValue('role') as UserRole;
            const roleStyles = {
                [UserRole.root]: 'bg-blue-50 text-blue-700 border border-blue-200',
                [UserRole.admin]: 'bg-purple-50 text-purple-700 border border-purple-200',
                [UserRole.user]: 'bg-gray-50 text-gray-600 border border-gray-200',
            };

            return h(
                'span',
                {
                    class: `inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${roleStyles[role]}`,
                },
                role,
            );
        },
    },
    {
        accessorKey: 'loginType',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Login type' }),
        cell: ({ row }) => {
            const loginType = loginTypes.find((loginType) => loginType.value === row.getValue('loginType'));

            if (!loginType) return null;

            return h('div', { class: 'flex items-center gap-2' }, [
                h(loginType.icon, { class: 'h-4 w-4' }),
                h('span', { class: 'text-sm text-muted-foreground' }, loginType.label),
            ]);
        },
        filterFn: (row, id, value) => {
            return value.includes(row.getValue(id));
        },
    },
    {
        id: 'actions',
        cell: ({ row }) => {
            const { hasPermission } = usePermissions();

            const actions = [
                {
                    // enable: hasPermission(PermissionEnum.USER_WRITE),
                    enable: false,
                    trigger: 'Edit',
                    shortcut: '⌘E',
                },
                {
                    enable: hasPermission(PermissionEnum.USER_WRITE),
                    trigger: 'Inactivate',
                    shortcut: '⌘I',
                    onClick: () => userService.inactivate(row.original.id),
                },
                {
                    enable: hasPermission(PermissionEnum.USER_DELETE),
                    trigger: 'Delete',
                    shortcut: '⌘⌫',
                    onClick: () => userService.deleteUser(row.original.id),
                },
            ];

            return h(DataTableRowActions, {
                row,
                actions,
            });
        },
    },
];
