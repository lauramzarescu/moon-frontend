<template>
  <Select :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" :disabled="isLoading">
    <SelectTrigger :class="['w-[260px]', triggerClass]">
      <SelectValue>
        <div v-if="isLoading" class="flex items-center gap-2">
          <Loader2Icon class="h-3 w-3 animate-spin" />
          Loading...
        </div>
        <span v-else>
          {{ selectedLabel || placeholder }}
        </span>
      </SelectValue>
    </SelectTrigger>
    <SelectContent>
      <SelectGroup>
        <SelectItem
          v-for="(version, idx) in versions"
          :key="version.revision"
          :value="version.revision.toString()"
        >
          <div class="flex items-center justify-between gap-3">
            <span>{{ version.label }}</span>
            <Badge v-if="idx === 0" variant="outline" class="text-[10px]">Latest</Badge>
          </div>
        </SelectItem>

        <div v-if="pagination?.hasNextPage" class="p-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            @click="$emit('load-more')"
            :disabled="isLoadingMore"
            class="w-full text-xs h-8"
          >
            <Loader2Icon v-if="isLoadingMore" class="h-3 w-3 mr-2 animate-spin" />
            <span v-else>Load More ({{ (pagination.totalPages - pagination.page) }} pages left)</span>
          </Button>
        </div>
      </SelectGroup>
    </SelectContent>
  </Select>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2Icon } from 'lucide-vue-next';

interface VersionItem { revision: number; label: string }

const props = withDefaults(defineProps<{
  modelValue: string;
  versions: VersionItem[];
  isLoading: boolean;
  isLoadingMore?: boolean;
  pagination?: { page: number; limit: number; totalPages: number; hasNextPage: boolean; hasPreviousPage: boolean } | null;
  placeholder?: string;
  triggerClass?: string;
}>(), {
  placeholder: 'Select version',
  isLoadingMore: false,
  pagination: null,
  triggerClass: ''
});

const emit = defineEmits<{
  (e: 'update:modelValue', v: string): void;
  (e: 'load-more'): void;
}>();

const selectedLabel = computed(() => props.versions.find(v => v.revision.toString() === props.modelValue)?.label);
</script>

