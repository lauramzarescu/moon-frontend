import { h } from 'vue'
import {
  ArrowDownIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  CircleIcon,
  CrossCircledIcon,
  QuestionMarkCircledIcon,
  StopwatchIcon,
} from '@radix-icons/vue'

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
]

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
  {
    id: 'failed',
    value: 'FAILED',
    label: 'Failed',
    icon: h(CrossCircledIcon),
    color: 'bg-red-200 text-red-800',
  },
  {
    id: 'pending',
    value: 'PROVISIONING',
    label: 'Provisioning',
    icon: h(StopwatchIcon),
    color: 'bg-blue-200 text-blue-800',
  },
  {
    id: 'deprovisioning',
    value: 'DEPROVISIONING',
    label: 'Deprovisioning',
    icon: h(QuestionMarkCircledIcon),
    color: 'bg-yellow-200 text-yellow-800',
  },
]

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
]
