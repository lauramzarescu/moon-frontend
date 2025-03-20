import { io, Socket } from 'socket.io-client'
import { ref } from 'vue'
import type { ClusterInterface } from '@/views/AWS/Clusters/types/cluster.interface.ts'
import type {
  DeploymentInterface,
  ServiceInterface,
  TaskDefinitionInterface,
} from '@/views/AWS/Services/types/service.interface.ts'
import type { ClusterResponseInterface } from '@/types/response/cluster.interface.ts'
import type {
  ScheduledTaskInterface,
} from '@/views/AWS/ScheduledTasks/types/scheduled-task.interface.ts'

let socket: Socket | null = null

export function useSocket() {
  if (!socket) {
    socket = io(import.meta.env.VITE_SOCKET_URL, {
      withCredentials: true,
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    })
  }

  const data = ref<ClusterResponseInterface | null>(null)

  const processClusters = (_clusters: ClusterInterface[]) => {
    const clusters = ref<ClusterInterface[]>([])
    const services = ref<ServiceInterface[]>([])
    const scheduledTasks = ref<ScheduledTaskInterface[]>([])
    const deployments = ref<DeploymentInterface[]>([])
    const taskDefinitions = ref<TaskDefinitionInterface[]>([])

    for (const cluster of _clusters) {
      clusters.value.push(cluster)
      scheduledTasks.value.push(...cluster.scheduledTasks)

      for (const service of cluster.services) {
        services.value.push(service)

        for (const deployment of service.deployments) {
          deployments.value.push(deployment)
        }

        taskDefinitions.value.push(service.taskDefinition)
      }
    }

    return {
      clusters: clusters.value,
      services: services.value,
      scheduledTasks: scheduledTasks.value,
      deployments: deployments.value,
      taskDefinitions: taskDefinitions.value,
    }
  }

  const setRefreshInterval = (intervalTime: number) => {
    socket?.emit('set-interval', intervalTime)
  }

  return {
    socket,
    data,
    processClusters,
    setRefreshInterval,
  }
}
