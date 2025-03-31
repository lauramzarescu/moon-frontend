import { InstanceStateName } from './schema'

export const statuses = [
  {
    id: 'running',
    value: InstanceStateName.RUNNING,
    label: 'Running',
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
  },
  {
    id: 'pending',
    value: InstanceStateName.PENDING,
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
  },
  {
    id: 'stopping',
    value: InstanceStateName.STOPPING,
    label: 'Stopping',
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100',
  },
  {
    id: 'stopped',
    value: InstanceStateName.STOPPED,
    label: 'Stopped',
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
  },
  {
    id: 'shutting-down',
    value: InstanceStateName.SHUTTING_DOWN,
    label: 'Shutting Down',
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100',
  },
  {
    id: 'terminated',
    value: InstanceStateName.TERMINATED,
    label: 'Terminated',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100',
  },
]
