<template>
  <ProviderHeader />
  <DataTable :data="clusters" :columns="clusterColumns"
             :options="{'status': statuses}"
             :row-action="rowAction"
             :config="config" />
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

<script setup lang="ts" generic="TData extends ClusterInterface">
import { columns as clusterColumns } from '@/views/AWS/Clusters/components/columns.ts'
import DataTable from '@/components/ui/custom-table/DataTable.vue'
import { storeToRefs } from 'pinia'
import { useDataStore } from '@/stores/dataStore.ts'
import { statuses } from '@/views/AWS/Clusters/data/data.ts'
import type {
  DataTableConfig,
  DataTableRowActionProps,
} from '@/components/ui/drawer/interfaces/custom-table.interface.ts'
import type { ClusterInterface } from '@/views/AWS/Clusters/types/cluster.interface.ts'
import { useRouter } from 'vue-router'
import { useFilterStore } from '@/stores/filterStore.ts'
import ClusterDataTableToolbar from '@/views/AWS/Clusters/components/ClusterDataTableToolbar.vue'
import ProviderHeader from '@/components/ui/provider-header/ProviderHeader.vue'

const router = useRouter()
const { setFilter } = useFilterStore()

const { clusters } = storeToRefs(useDataStore())

const config: DataTableConfig = {
  toolbarComponent: ClusterDataTableToolbar,
}

const rowAction: DataTableRowActionProps<TData> = {
  onClick: (row: ClusterInterface) => {
    // redirect to Services page with the cluster ID without reloading the page
    router.push({ path: '/aws/services' })

    // set filter
    setFilter('clusterName', row.name)
  },
}
</script>
