<template>
  <div v-if="hasStuckDeployments" class="w-full">
    <div v-if="!isMinimized" class="relative">
      <Card class="border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800">
        <div class="p-4 flex items-start">
          <AlertCircle
            class="h-6 w-6 mr-4 mt-0.5 flex-shrink-0 text-yellow-600 dark:text-yellow-500" />
          <div class="flex-1">
            <h3 class="text-base font-semibold text-yellow-800 dark:text-yellow-400 mb-2">
              Deployment Warning
            </h3>

            <div v-if="stuckServices.length === 1" class="space-y-3">
              <p class="text-sm text-yellow-700 dark:text-yellow-300">
                {{ singleServiceMessage }}
              </p>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                <div class="bg-white dark:bg-slate-800 rounded-md p-2 shadow-sm">
                  <div class="text-xs font-medium text-slate-500 dark:text-slate-400">Stuck for
                  </div>
                  <div class="font-medium text-sm">{{ stuckTime }}</div>
                </div>

                <div v-if="currentImage"
                     class="bg-white dark:bg-slate-800 rounded-md p-2 shadow-sm">
                  <div class="text-xs font-medium text-slate-500 dark:text-slate-400">Current
                    image
                  </div>
                  <div class="text-xs font-mono truncate" :title="currentImage">{{ currentImage }}
                  </div>
                </div>

                <div v-if="targetImage" class="bg-white dark:bg-slate-800 rounded-md p-2 shadow-sm">
                  <div class="text-xs font-medium text-slate-500 dark:text-slate-400">Target
                    image
                  </div>
                  <div class="text-xs font-mono truncate" :title="targetImage">{{ targetImage }}
                  </div>
                </div>
              </div>
            </div>

            <div v-else>
              <p class="text-sm text-yellow-700 dark:text-yellow-300">
                {{ multipleServicesMessage }}
              </p>
              <Button
                variant="outline"
                size="sm"
                class="mt-3 bg-white dark:bg-slate-800 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-50 dark:hover:bg-slate-700"
                @click="showAffectedServices = true"
              >
                View affected services
                <ChevronRight class="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
      <button
        @click="minimizeBanner"
        class="absolute top-2 right-2 p-1 rounded-md text-yellow-700 dark:text-yellow-300 hover:bg-yellow-100 dark:hover:bg-yellow-800/30"
        title="Minimize"
      >
        <Minimize2 class="h-4 w-4" />
      </button>
    </div>

    <div
      v-else
      @click="isMinimized = false"
      class="flex items-center gap-2 p-2 rounded-md border border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300 cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-800/30 w-fit"
    >
      <AlertCircle class="h-4 w-4 flex-shrink-0" />
      <span class="text-sm font-medium">{{ stuckServices.length
        }} {{ stuckServices.length === 1 ? 'service' : 'services' }} affected</span>
      <Maximize2 class="h-3.5 w-3.5" />
    </div>

    <AffectedServicesModal v-model:isOpen="showAffectedServices" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useDataStore } from '@/stores/dataStore'
import moment from 'moment'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, ChevronRight, Maximize2, Minimize2 } from 'lucide-vue-next'
import AffectedServicesModal from '@/components/ui/stuck-deployment/AffectedServicesModal.vue'

const STORAGE_KEY = 'stuck-deployment-banner-minimized'

const showAffectedServices = ref(false)
const isMinimized = ref(false)
const dataStore = useDataStore()

onMounted(() => {
  const savedState = localStorage.getItem(STORAGE_KEY)
  if (savedState) {
    isMinimized.value = JSON.parse(savedState)
  }
})

watch(isMinimized, (newValue) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newValue))
})

const minimizeBanner = () => {
  isMinimized.value = true
}

const stuckServices = computed(() => {
  return dataStore.services.filter(service =>
    service.deploymentStatus?.isStuck === true,
  )
})

const hasStuckDeployments = computed(() => stuckServices.value.length > 0)

const singleService = computed(() => stuckServices.value[0])

const stuckTime = computed(() => {
  if (!singleService.value?.deploymentStatus?.stuckSince) return 'unknown time'
  return moment(new Date(singleService.value.deploymentStatus.stuckSince)).fromNow(true)
})

const currentImage = computed(() => {
  const images = singleService.value?.deploymentStatus?.currentImages
  if (!images || images.length === 0) return null
  return images[0].image
})

const targetImage = computed(() => {
  const images = singleService.value?.deploymentStatus?.targetImages
  if (!images || images.length === 0) return null
  return images[0].image
})

const singleServiceMessage = computed(() =>
  `Deployment for ${singleService.value?.name} in cluster ${singleService.value?.clusterName} is stuck.`,
)

const multipleServicesMessage = computed(() =>
  `${stuckServices.value.length} services have stuck deployments.`,
)
</script>
