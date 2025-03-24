import { h } from 'vue'
import { CircleIcon, CrossCircledIcon, StopwatchIcon } from '@radix-icons/vue'

export const statuses = [
  {
    id: 'active',
    value: 'ACTIVE',
    label: 'Active',
    icon: h(CircleIcon),
    color: 'bg-green-200 text-green-800',
  },
  {
    id: 'inactive',
    value: 'INACTIVE',
    label: 'Inactive',
    icon: h(CrossCircledIcon),
    color: 'bg-gray-200 text-gray-800',
  },
]

export const lastDeploymentStatuses = [
  {
    id: 'completed',
    value: 'COMPLETED',
    label: 'Completed',
    icon: h(CircleIcon),
    color: 'bg-green-200 text-green-800',
  },
  {
    id: 'failed',
    value: 'FAILED',
    label: 'Failed',
    icon: h(CrossCircledIcon),
    color: 'bg-red-200 text-red-800',
  },
  {
    id: 'in_progress',
    value: 'IN_PROGRESS',
    label: 'In Progress',
    icon: h(StopwatchIcon),
    color: 'bg-gray-200 text-gray-800',
  },
]
