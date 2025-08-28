<template>
  <div class="h-full overflow-y-auto">
    <div class="flex items-center gap-2 mb-3">
      <div class="relative flex-1 min-w-[240px]">
        <Input v-model="searchLocal" placeholder="Search variables..." class="pl-8" />
        <SearchIcon class="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
      </div>
      <Select v-model="typeFilter">
        <SelectTrigger class="w-[160px] hover:shadow-sm transition">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="environment">Environment</SelectItem>
            <SelectItem value="secret">Secret</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>

    <TransitionGroup name="fade-move" tag="div" class="space-y-2">
      <div v-for="row in visibleRows" :key="row.id" class="group border rounded-md p-3 bg-card hover:bg-accent/5 transition-all duration-200">
        <div class="flex items-center justify-between gap-3">
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <span class="font-mono text-sm truncate">{{ row.name }}</span>
              <button @click.stop="copy(row.name)" class="opacity-0 group-hover:opacity-100 transition text-muted-foreground hover:text-foreground" :title="copied === row.name ? 'Copied' : 'Copy name'">
                <component :is="copied === row.name ? Check : Copy" class="h-4 w-4" />
              </button>
            </div>
            <div class="flex items-center gap-2 mt-1">
              <span class="font-mono bg-muted px-2 py-1 rounded text-xs truncate">{{ row.value }}</span>
              <button @click.stop="copy(row.value)" class="opacity-0 group-hover:opacity-100 transition text-muted-foreground hover:text-foreground" :title="copied === row.value ? 'Copied' : 'Copy value'">
                <component :is="copied === row.value ? Check : Copy" class="h-4 w-4" />
              </button>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <Badge :class="row.type === 'secret' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'">
              {{ row.type === 'secret' ? 'Secret' : 'Env' }}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button variant="ghost" size="sm">
                  <MoreHorizontalIcon class="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem v-if="row.type === 'environment'" @click="$emit('edit', row)">
                  <EditIcon class="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem @click="$emit('delete', row)" class="text-red-600">
                  <TrashIcon class="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      <div v-if="visibleRows.length === 0" class="h-24 flex items-center justify-center text-sm text-muted-foreground border rounded-md">No variables found.</div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Check, Copy, EditIcon, MoreHorizontalIcon, SearchIcon, TrashIcon } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'

interface Row { id: string; clusterName: string; serviceName: string; containerName: string; type: 'environment'|'secret'; name: string; value: string }

const props = defineProps<{ rows: Row[]; selected?: { cluster: string | null; service: string | null; container: string | null } | null }>()
const emit = defineEmits<{ (e: 'edit', row: Row): void; (e: 'delete', row: Row): void; (e: 'copy', text: string): void }>()

const searchLocal = ref('')
const typeFilter = ref<'all'|'environment'|'secret'>('all')
const copied = ref<string | null>(null)

const visibleRows = computed(() => {
  const q = searchLocal.value.trim().toLowerCase()
  return props.rows.filter((r) => {
    if (props.selected?.cluster && r.clusterName !== props.selected.cluster) return false
    if (props.selected?.service && r.serviceName !== props.selected.service) return false
    if (props.selected?.container && r.containerName !== props.selected.container) return false
    if (typeFilter.value !== 'all' && r.type !== typeFilter.value) return false
    if (!q) return true
    return r.name.toLowerCase().includes(q) || r.value.toLowerCase().includes(q)
  })
})

const copy = async (text: string) => {
  emit('copy', text)
  copied.value = text
  setTimeout(() => { if (copied.value === text) copied.value = null }, 1200)
}
</script>

