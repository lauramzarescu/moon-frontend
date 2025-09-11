<template>
    <div class="flex items-center justify-between">
        <div class="flex items-center gap-3"></div>
        <div class="flex items-center gap-2">
            <Button
                v-if="selectedCount > 0"
                size="sm"
                variant="destructive"
                @click="onBulkDelete"
                class="transition-all duration-200"
            >
                <TrashIcon class="h-4 w-4 mr-2" />
                Delete Selected ({{ selectedCount }})
            </Button>
            <Button 
                size="sm" 
                variant="outline" 
                @click="onSelectAll" 
                class="transition-all duration-200"
            >
                {{ isAllSelected ? 'Deselect All' : 'Select All' }}
            </Button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { TrashIcon } from 'lucide-vue-next';

interface Props {
    selectedCount: number;
    totalCount: number;
    isAllSelected: boolean;
}

interface Emits {
    (e: 'select-all'): void;
    (e: 'bulk-delete'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const onSelectAll = () => {
    emit('select-all');
};

const onBulkDelete = () => {
    emit('bulk-delete');
};
</script>
