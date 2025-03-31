import { h } from 'vue'
import { CircleIcon, CrossCircledIcon } from '@radix-icons/vue'

export const statuses = [
    {
        id: 'enabled',
        value: 'ENABLED',
        label: 'Enabled',
        icon: h(CircleIcon),
        color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
    },
    {
        id: 'disabled',
        value: 'DISABLED',
        label: 'Disabled',
        icon: h(CrossCircledIcon),
        color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
    },
]
