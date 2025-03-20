import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useSocket } from '@/composables/useSocket.ts'
import type { ClusterResponseInterface } from '@/types/response/cluster.interface.ts'
import type { ServiceInterface } from '@/views/AWS/Services/types/service.interface.ts'
import type { ClusterInterface } from '@/views/AWS/Clusters/types/cluster.interface.ts'
import type {
  ScheduledTaskInterface,
} from '@/views/AWS/ScheduledTasks/types/scheduled-task.interface.ts'
import * as LZString from 'lz-string'

export const useDataStore = defineStore(
  'data',
  () => {
    const { socket, processClusters, setRefreshInterval } = useSocket()
    const services = ref<ServiceInterface[]>([])
    const clusters = ref<ClusterInterface[]>([])
    const scheduledTasks = ref<ScheduledTaskInterface[]>([])
    const updatedOn = ref<Date | null>(null)
    const refreshInterval = ref<number>(15)
    const refreshIsDynamic = ref<boolean>(false)

    const initializeData = () => {
      socket.on('connect', () => {
        setTimeout(() => setRefreshInterval(refreshInterval.value), 2000)
      })

      socket.on('clusters-update', (receivedData: ClusterResponseInterface) => {
        processData(receivedData)
      })

      socket.on('interval-updated', (interval: number) => {
        refreshInterval.value = interval / 1000
      })
    }

    // Ensure socket is connected
    if (!socket.connected) {
      socket.connect()
    }

    const manualRefresh = async () => {
      socket.emit('manual-refresh')
    }

    const processData = (receivedData: ClusterResponseInterface) => {
      const processedData = processClusters(receivedData.clusters.clusters)

      if (processedData) {
        services.value = processedData.services
        clusters.value = processedData.clusters
        scheduledTasks.value = processedData.scheduledTasks
        updatedOn.value = receivedData.updatedOn
      }
    }

    return {
      services,
      clusters,
      scheduledTasks,
      updatedOn,
      refreshInterval,
      refreshIsDynamic,
      initializeData,
      setRefreshInterval,
      manualRefresh,
    }
  },
  {
    persist: {
      storage: window.localStorage,
      serializer: {
        serialize: (value: any) => {
          const stringified = JSON.stringify(value)
          return LZString.compress(stringified)
        },
        deserialize: (value: string) => {
          const decompressed = LZString.decompress(value)
          return JSON.parse(decompressed || '{}')
        },
      },
    },
  },
)
