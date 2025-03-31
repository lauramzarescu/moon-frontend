import { h } from 'vue';
import {
    ArrowDownIcon,
    ArrowRightIcon,
    ArrowUpIcon,
    CircleIcon,
    CrossCircledIcon,
    QuestionMarkCircledIcon,
    StopwatchIcon,
} from '@radix-icons/vue';

export const labels = [
    {
        value: 'bug',
        label: 'Bug',
    },
    {
        value: 'feature',
        label: 'Feature',
    },
    {
        value: 'documentation',
        label: 'Documentation',
    },
];

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
    {
        id: 'failed',
        value: 'FAILED',
        label: 'Failed',
        icon: h(CrossCircledIcon),
        color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
    },
    {
        id: 'pending',
        value: 'PROVISIONING',
        label: 'Provisioning',
        icon: h(StopwatchIcon),
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
    },
    {
        id: 'deprovisioning',
        value: 'DEPROVISIONING',
        label: 'Deprovisioning',
        icon: h(QuestionMarkCircledIcon),
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
    },
];

export const priorities = [
    {
        value: 'low',
        label: 'Low',
        icon: h(ArrowDownIcon),
    },
    {
        value: 'medium',
        label: 'Medium',
        icon: h(ArrowRightIcon),
    },
    {
        value: 'high',
        label: 'High',
        icon: h(ArrowUpIcon),
    },
];
