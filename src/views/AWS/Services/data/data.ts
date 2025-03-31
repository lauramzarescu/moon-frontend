import { h } from 'vue'
import { CircleIcon, CrossCircledIcon, StopwatchIcon } from '@radix-icons/vue'

export const statuses = [
    {
        id: 'active',
        value: 'ACTIVE',
        label: 'Active',
        icon: h(CircleIcon),
        color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
    },
    {
        id: 'inactive',
        value: 'INACTIVE',
        label: 'Inactive',
        icon: h(CrossCircledIcon),
        color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100',
    },
]

export const lastDeploymentStatuses = [
    {
        id: 'completed',
        value: 'COMPLETED',
        label: 'Completed',
        icon: h(CircleIcon),
        color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
    },
    {
        id: 'failed',
        value: 'FAILED',
        label: 'Failed',
        icon: h(CrossCircledIcon),
        color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
    },
    {
        id: 'in_progress',
        value: 'IN_PROGRESS',
        label: 'In Progress',
        icon: h(StopwatchIcon),
        color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100',
    },
]
