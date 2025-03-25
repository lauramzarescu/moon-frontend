<template>
  <Dialog :open="isOpen" @update:open="$emit('update:isOpen', $event)">
    <DialogContent class="sm:max-w-[625px]">
      <DialogHeader>
        <DialogTitle class="text-xl font-bold">Schedule Details</DialogTitle>
        <DialogDescription> View upcoming executions and schedule information</DialogDescription>
        <DialogClose />
      </DialogHeader>

      <div class="py-6 space-y-6">
        <!-- Cron Expression Card -->
        <div class="rounded-lg border bg-card text-card-foreground shadow">
          <div class="p-4 border-b">
            <h3 class="font-semibold flex items-center gap-2">
              <ClockIcon class="h-5 w-5 text-primary" />
              Cron Expression - {{ row?.cron }}
            </h3>
          </div>
          <div class="p-4 bg-muted/30">
            <p class="text-primary font-medium">{{ row?.readableCron || 'N/A' }}</p>
          </div>
        </div>

        <!-- Next Runs Timeline -->
        <div class="rounded-lg border bg-card text-card-foreground shadow">
          <div class="p-4 border-b">
            <h3 class="font-semibold flex items-center gap-2">
              <CalendarIcon class="h-5 w-5 text-primary" />
              Upcoming Executions
            </h3>
          </div>
          <div class="p-4">
            <div class="space-y-4 max-h-[250px] overflow-y-auto pr-2">
              <div
                v-if="row.nextRuns?.length"
                v-for="(run, index) in row.nextRuns"
                :key="index"
                class="relative flex items-center gap-4"
              >
                <div
                  class="flex-shrink-0 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span class="text-sm font-medium text-primary">#{{ index + 1 }}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex justify-between items-center">
                    <time class="text-sm font-semibold">
                      {{ moment.utc(run).format('dddd') }}
                    </time>
                    <span class="text-sm text-muted-foreground">
                                            {{ moment.utc(run).format('HH:mm:ss') }}
                                        </span>
                  </div>
                  <p class="text-sm text-muted-foreground">
                    {{ moment.utc(run).format('MMMM D, YYYY') }}
                  </p>
                </div>
              </div>
              <div v-else class="flex items-center justify-center text-muted-foreground">No upcoming
                executions
              </div>
            </div>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts" generic="TData">
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CalendarIcon, ClockIcon } from 'lucide-vue-next'
import moment from 'moment'
import type {
  ScheduledTaskEventInterface,
} from '@/views/AWS/ScheduledTasks/types/scheduled-task.interface.ts'

defineProps<{
  isOpen: boolean
  row: ScheduledTaskEventInterface
}>()

defineEmits<{
  'update:isOpen': [value: boolean]
}>()
</script>

<style scoped>
.overflow-y-auto {
  scrollbar-width: thin;
  scrollbar-color: #e2e8f0 transparent;
}

.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: #e2e8f0;
  border-radius: 3px;
}
</style>
