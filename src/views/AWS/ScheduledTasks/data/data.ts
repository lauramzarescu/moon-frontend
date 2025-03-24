import { h } from 'vue'
import { CircleIcon, CrossCircledIcon } from '@radix-icons/vue'

export const statuses = [
  {
    id: 'enabled',
    value: 'ENABLED',
    label: 'Enabled',
    icon: h(CircleIcon),
    color: 'bg-green-200 text-green-800',
  },
  {
    id: 'disabled',
    value: 'DISABLED',
    label: 'Disabled',
    icon: h(CrossCircledIcon),
    color: 'bg-red-200 text-red-800',
  },
]
