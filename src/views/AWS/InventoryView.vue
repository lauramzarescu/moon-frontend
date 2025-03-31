<template>
  <ProviderHeader />
  <DataTable :data="instances" :columns="inventoryColumns"
             :options="{'state': statuses}"
             :config="config"
             :table-name="TABLE_KEYS.INVENTORY"
             :default-sorting="defaultSorting"
  />
</template>

<script setup lang="ts" generic="TData extends InstanceInterface">
import { columns as inventoryColumns } from '@/views/AWS/Inventory/components/columns.ts'
import DataTable from '@/components/ui/custom-table/DataTable.vue'
import { storeToRefs } from 'pinia'
import { useDataStore } from '@/stores/dataStore.ts'
import { statuses } from '@/views/AWS/Inventory/data/data.ts'
import type { DataTableConfig } from '@/components/ui/drawer/interfaces/custom-table.interface.ts'
import type { InstanceInterface } from '@/views/AWS/Services/types/service.interface.ts'
import { TABLE_KEYS } from '@/stores/filterStore.ts'
import InventoryDataTableToolbar
  from '@/views/AWS/Inventory/components/InventoryDataTableToolbar.vue'
import ProviderHeader from '@/components/ui/provider-header/ProviderHeader.vue'
import type { SortingState } from '@tanstack/vue-table'

const { instances } = storeToRefs(useDataStore())
const defaultSorting: SortingState = [{
  id: 'name',
  desc: false,
}]

const config: DataTableConfig = {
  toolbarComponent: InventoryDataTableToolbar,
}
</script>
