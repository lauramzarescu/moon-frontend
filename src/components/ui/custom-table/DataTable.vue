<script setup lang="ts" generic="TData">
import type { ColumnFiltersState, SortingState, VisibilityState } from '@tanstack/vue-table'
import {
  FlexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useVueTable,
} from '@tanstack/vue-table'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { valueUpdater } from '@/utils'
import { ref } from 'vue'
import DataTablePagination from './DataTablePagination.vue'
import type { DataTableProps } from '@/components/ui/drawer/interfaces/custom-table.interface.ts'
import { onBeforeRouteLeave } from 'vue-router'
import DataTableToolbar from '@/components/ui/custom-table/DataTableToolbar.vue'
import { useColumnSettingsStore } from '@/stores/columnsSettingsStore.ts'
import type { PaginationParams } from '@/types/pagination/pagination.interface.ts'

const props = defineProps<
  DataTableProps<TData> & {
  totalRows?: number
}
>()
const { hiddenColumns, hideColumn } = useColumnSettingsStore()
const sorting = ref<SortingState>([])
const columnFilters = ref<ColumnFiltersState>(props.initialFilters || [])
const columnVisibility = ref<VisibilityState>(hiddenColumns || {})
const rowSelection = ref({})
const isOpen = ref(false)
const selectedRow = ref<TData | null>(null)

const emit = defineEmits<{
  paginationChange: [params: PaginationParams]
}>()

const handlePaginationChange = (params: PaginationParams) => {
  // Only emit if the values actually changed
  if (params.page !== table.getState().pagination.pageIndex + 1 || params.limit !== table.getState().pagination.pageSize) {
    emit('paginationChange', {
      page: params.page,
      limit: params.limit,
      orderBy: sorting.value[0]?.id,
      order: sorting.value[0]?.desc ? 'desc' : 'asc',
      filters: columnFilters.value,
    })
  }
}

const table = useVueTable({
  get data() {
    return props.data
  },
  get columns() {
    return props.columns
  },
  state: {
    get sorting() {
      return sorting.value
    },
    get columnFilters() {
      return columnFilters.value
    },
    get columnVisibility() {
      return columnVisibility.value
    },
    get rowSelection() {
      return rowSelection.value
    },
  },
  enableRowSelection: true,
  onSortingChange: (updaterOrValue) => valueUpdater(updaterOrValue, sorting),
  onColumnFiltersChange: (updaterOrValue) => valueUpdater(updaterOrValue, columnFilters),
  onColumnVisibilityChange: (updaterOrValue) => {
    valueUpdater(updaterOrValue, columnVisibility)
    hideColumn(columnVisibility.value)
  },
  onRowSelectionChange: (updaterOrValue) => valueUpdater(updaterOrValue, rowSelection),
  getCoreRowModel: getCoreRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFacetedRowModel: getFacetedRowModel(),
  getFacetedUniqueValues: getFacetedUniqueValues(),
  autoResetPageIndex: false,
})

const handleComponentOpen = (row: TData) => {
  selectedRow.value = row
  isOpen.value = true
}

const handleRowClick = (row: TData) => {
  if (props.rowAction?.template) {
    handleComponentOpen(row)
    return
  }

  if (typeof props.rowAction?.onClick !== 'undefined') {
    props.rowAction.onClick(row)
    return
  }
}

onBeforeRouteLeave(() => {
  columnFilters.value = []
})
</script>

<template>
  <div class="space-y-4">
    <component v-if="props.config?.toolbarComponent" :is="props.config.toolbarComponent"
               :table="table" :options="props.options" />
    <DataTableToolbar v-else :table="table" :options="props.options" />
    <div class="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
            <TableHead v-for="header in headerGroup.headers" :key="header.id">
              <FlexRender
                v-if="!header.isPlaceholder"
                :render="header.column.columnDef.header"
                :props="header.getContext()"
              />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <template v-if="table.getRowModel().rows?.length">
            <TableRow
              v-for="row in table.getRowModel().rows"
              :key="row.id"
              :data-state="row.getIsSelected() && 'selected'"
              class="cursor-pointer hover:bg-muted/50"
            >
              <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id"
                         @click="handleRowClick(row.original)">
                <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
              </TableCell>
            </TableRow>
          </template>

          <TableRow v-else>
            <TableCell :colspan="columns.length" class="h-24 text-center"> No results.</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <DataTablePagination
      :table="table"
      :total-rows="props.totalRows || table.getRowModel().rows.length"
      :on-pagination-change="handlePaginationChange"
    />

    <template v-if="props.rowAction?.template">
      <!-- For the moment we allow only Drawer component to be passed -->
      <component
        :isOpen="isOpen"
        :is="props.rowAction.template"
        :row="selectedRow"
        @update:isOpen="(value: boolean) => (isOpen = value)"
      />
    </template>
  </div>
</template>
