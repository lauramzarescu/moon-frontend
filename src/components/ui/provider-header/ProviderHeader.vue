<script setup lang="ts">
import { useDataStore } from '@/stores/dataStore.ts'
import { onMounted, onUnmounted, ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { ChevronDownIcon } from '@radix-icons/vue'
import { useSocket } from '@/composables/useSocket.ts'
import StuckDeploymentBanner from '@/components/ui/stuck-deployment/StuckDeploymentBanner.vue'

const store = useDataStore()
const { setRefreshInterval } = useSocket()

const currentDate = ref(new Date())
const lastUpdated = ref('Loading...')
const timeInterval = ref<number>(1000) // milliseconds
const isPopoverOpen = ref(false) // Add this line to track popover state

const refreshOptions = [
  { value: 5, label: '5 seconds', description: 'Update every 5 seconds' },
  { value: 10, label: '10 seconds', description: 'Update every 10 seconds' },
  { value: 15, label: '15 seconds', description: 'Update every 15 seconds' },
  { value: 60, label: '1 minute', description: 'Update every minute' },
  { value: 0, label: 'Manual refresh', description: 'Refresh only when requested' },
  {
    value: -1,
    label: 'Dynamic refresh',
    description: 'The refresh interval is updated dynamically by the server.',
  },
]

const handleRefreshIntervalChange = (interval: number) => {
  setRefreshInterval(interval)
  store.refreshInterval = interval
  store.refreshIsDynamic = interval === -1
  isPopoverOpen.value = false // Close the popover after selection
}

const handleManualRefresh = () => {
  store.manualRefresh()
  store.refreshInterval = 0
}

onMounted(() => {
  setInterval(() => {
    currentDate.value = new Date()
    lastUpdated.value = store?.updatedOn ? new Date(store.updatedOn).toLocaleString() : 'N/A'
  }, timeInterval.value)
})

onUnmounted(() => {
  if (timeInterval.value) {
    clearInterval(timeInterval.value)
  }
})
</script>

<template>
  <div class="flex gap-4 text-sm text-muted-foreground">
    <div class="flex items-center gap-2">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="lucide lucide-cloud"
      >
        <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
      </svg>
      <span>Provider: AWS</span>
    </div>
    <div class="flex items-center gap-2">
      <button
        @click="handleManualRefresh"
        class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 w-9"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="lucide lucide-refresh-cw"
        >
          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
          <path d="M21 3v5h-5" />
          <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
          <path d="M3 21v-5h5" />
        </svg>
      </button>
      <span>Last updated: {{ lastUpdated }}</span>
    </div>

    <div class="flex items-center gap-2">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="lucide lucide-clock"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      <span>{{ currentDate.toLocaleDateString() }} {{ currentDate.toLocaleTimeString() }}</span>
    </div>

    <Popover v-model:open="isPopoverOpen">
      <PopoverTrigger as-child>
        <Button variant="outline" class="ml-auto">
          {{
            store.refreshIsDynamic
              ? `Dynamic refresh (${store.refreshInterval}s)`
              : refreshOptions.find((option) => option.value === store.refreshInterval)?.label
          }}
          <ChevronDownIcon class="ml-2 h-4 w-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent class="p-0" align="end" side="bottom">
        <Command>
          <CommandInput placeholder="Select refresh interval..." />
          <CommandList>
            <CommandEmpty>No options found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                v-for="option in refreshOptions"
                :key="option.value"
                :value="option.value"
                @select="handleRefreshIntervalChange(option.value)"
                class="space-y-1 flex flex-col items-start px-4 py-2"
              >
                <p>{{ option.label }}</p>
                <p class="text-sm text-muted-foreground">
                  {{ option.description }}
                </p>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  </div>
  <StuckDeploymentBanner />
</template>
