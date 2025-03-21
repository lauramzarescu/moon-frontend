<template>
  <ProviderHeader />
  <DataTable
    :data="scheduledTasks as TData[]"
    :columns="scheduledTasksColumns as ColumnDef<TData, any>[]"
    :options="statuses as unknown as DataTableOptionsProps[]"
    :config="config"
    :row-action="rowAction"
    :initial-filters="initialFilters"
  />
  <CronDialog v-model:isOpen="showCronDialog" :detail="selectedCronExpression" />
</template>

<style>
@media (min-width: 1024px) {
  .about {
    min-height: 100vh;
    display: flex;
    align-items: center;
  }
}
</style>

<script setup lang="ts" generic="TData extends ScheduledTaskInterface">
import { columns as scheduledTasksColumns } from '@/views/AWS/ScheduledTasks/components/columns.ts'
import { useDataStore } from '@/stores/dataStore.ts'
import { storeToRefs } from 'pinia'
import DataTable from '@/components/ui/custom-table/DataTable.vue'
import type {
  DataTableConfig,
  DataTableOptionsProps,
  DataTableRowActionProps,
} from '@/components/ui/drawer/interfaces/custom-table.interface.ts'
import { useFilterStore } from '@/stores/filterStore.ts'
import { onMounted, onUnmounted, ref, watch } from 'vue'
import type { ColumnDef, ColumnFiltersState } from '@tanstack/vue-table'
import { onBeforeRouteLeave } from 'vue-router'
import ScheduledTasksDataTableToolbar
  from '@/views/AWS/ScheduledTasks/components/ScheduledTasksDataTableToolbar.vue'
import { statuses } from '@/views/AWS/ScheduledTasks/data/data.ts'
import type {
  ScheduledTaskEventInterface,
  ScheduledTaskInterface,
} from '@/views/AWS/ScheduledTasks/types/scheduled-task.interface.ts'
import CronDialog from '@/views/AWS/ScheduledTasks/components/CronDialog.vue'
import ProviderHeader from '@/components/ui/provider-header/ProviderHeader.vue'

const { scheduledTasks } = storeToRefs(useDataStore())
const initialFilters = ref<ColumnFiltersState>([])

const { filters, clearFilters } = useFilterStore()

const showCronDialog = ref(false)
const selectedCronExpression = ref<ScheduledTaskEventInterface>({})

const rowAction: DataTableRowActionProps<TData> = {
  template: CronDialog,
}

const handleCronDialog = (event: CustomEvent) => {
  selectedCronExpression.value = event.detail as ScheduledTaskEventInterface
  showCronDialog.value = true
}

onMounted(() => {
  window.addEventListener('openCronDialog', handleCronDialog as EventListener)
})

onUnmounted(() => {
  window.removeEventListener('openCronDialog', handleCronDialog as EventListener)
})

const config: DataTableConfig = {
  toolbarComponent: ScheduledTasksDataTableToolbar,
}

watch(
  filters,
  (_filters) => {
    if (_filters.length > 0) {
      initialFilters.value = _filters.map((filter) => ({
        id: filter.id,
        value: [filter.value],
      }))
    }
  },
  { immediate: true },
)

onBeforeRouteLeave(() => {
  clearFilters()
})
</script>
