<template>
  <ProviderHeader />
  <DataTable
    :data="scheduledTasks as TData[]"
    :columns="scheduledTasksColumns as ColumnDef<TData, any>[]"
    :options="{'status': statuses, 'clusterName': uniqueClusterNames}"
    :config="config"
    :row-action="rowAction"
    :table-name="TABLE_KEYS.SCHEDULED_TASKS"
    :default-sorting="defaultSorting"
  />
  <CronDialog v-model:isOpen="showCronDialog" :row="selectedCronExpression" />
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
  DataTableRowActionProps,
} from '@/components/ui/drawer/interfaces/custom-table.interface.ts'
import { TABLE_KEYS } from '@/stores/filterStore.ts'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import type { ColumnDef, SortingState } from '@tanstack/vue-table'
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
const showCronDialog = ref(false)
const selectedCronExpression = ref<ScheduledTaskEventInterface>({})
const defaultSorting: SortingState = [{
  id: 'clusterName',
  desc: false,
}]
const rowAction: DataTableRowActionProps<TData> = {
  template: CronDialog,
}

const uniqueClusterNames = computed(() => {
  const clusters = scheduledTasks.value.map((scheduledTask: ScheduledTaskInterface) => ({
    id: scheduledTask.clusterName,
    label: scheduledTask.clusterName,
    value: scheduledTask.clusterName,
  }))

  return Array.from(
    new Map(clusters.map(item => [item.value, item])).values(),
  )
})

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

onBeforeRouteLeave(() => {
  // clearFilters()
})
</script>
