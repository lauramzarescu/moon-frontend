import { h } from 'vue'
import { CircleIcon, CrossCircledIcon, StopwatchIcon } from '@radix-icons/vue'

export const statuses = [
    {
        value: 'ACTIVE',
        label: 'Active',
        icon: h(CircleIcon),
        color: 'bg-green-200 text-green-800',
    },
    {
        value: 'INACTIVE',
        label: 'Inactive',
        icon: h(CrossCircledIcon),
        color: 'bg-gray-200 text-gray-800',
    },
]

export const lastDeploymentStatuses = [
    {
        value: 'COMPLETED',
        label: 'Completed',
        icon: h(CircleIcon),
        color: 'bg-green-200 text-green-800',
    },
    {
        value: 'FAILED',
        label: 'Failed',
        icon: h(CrossCircledIcon),
        color: 'bg-red-200 text-red-800',
    },
    {
        value: 'IN_PROGRESS',
        label: 'In Progress',
        icon: h(StopwatchIcon),
        color: 'bg-gray-200 text-gray-800',
    },
]
