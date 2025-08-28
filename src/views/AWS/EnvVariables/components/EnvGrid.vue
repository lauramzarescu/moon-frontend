<template>
    <div class="h-full overflow-hidden">
        <div class="h-full overflow-auto">
            <table class="w-full border-collapse border border-border bg-card text-sm table-fixed">
                <thead class="sticky top-0 bg-muted/40 z-10">
                    <tr class="border-b">
                        <th class="sticky left-0 bg-muted/40 z-20 border-r border-border shadow-sm p-2 text-left font-medium w-48">
                            Cluster
                        </th>
                        <th class="sticky left-48 bg-muted/40 z-20 border-r border-border shadow-sm p-2 text-left font-medium w-56">
                            Service
                        </th>
                        <th class="p-2 text-left font-medium w-48">Container</th>
                        <th class="p-2 text-left font-medium w-24">Type</th>
                        <th class="p-2 text-left font-medium w-96">Name</th>
                        <th class="p-2 text-left font-medium">Value</th>
                        <th class="p-2 text-left font-medium w-24">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <TransitionGroup name="fade-move">
                        <tr
                            v-for="row in rows"
                            :key="row.id"
                            class="group hover:bg-muted/20 transition-all duration-150 border-b"
                        >
                            <td class="sticky left-0 bg-card/95 backdrop-blur-sm z-10 border-r border-border shadow-sm group-hover:bg-muted/30 p-2">
                                <Badge variant="secondary" class="text-xs">{{ row.clusterName }}</Badge>
                            </td>
                            <td class="sticky left-48 bg-card/95 backdrop-blur-sm z-10 border-r border-border shadow-sm group-hover:bg-muted/30 p-2">
                                <span class="font-medium">{{ row.serviceName }}</span>
                            </td>
                            <td class="p-2">
                                <span class="text-muted-foreground">{{ row.containerName }}</span>
                            </td>
                            <td class="p-2">
                                <Badge
                                    :class="
                                        row.type === 'secret'
                                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                                            : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                    "
                                >
                                    {{ row.type === 'secret' ? 'Secret' : 'Env' }}
                                </Badge>
                            </td>
                            <td class="p-2">
                                <div class="flex items-center gap-2">
                                    <span class="font-mono text-sm truncate">{{ row.name }}</span>
                                    <button
                                        @click.stop="copy(row.name)"
                                        class="opacity-0 group-hover:opacity-100 transition text-muted-foreground hover:text-foreground"
                                        :title="copied === row.name ? 'Copied' : 'Copy name'"
                                    >
                                        <component :is="copied === row.name ? Check : Copy" class="h-4 w-4" />
                                    </button>
                                </div>
                            </td>
                            <td
                                @keydown.stop="onKeydown($event, row)"
                                @dblclick="startEdit(row)"
                                class="align-top p-2"
                            >
                                <div v-if="isEditing(row)" class="flex items-start gap-2">
                                    <Textarea
                                        ref="editRef"
                                        v-model="editValue"
                                        rows="3"
                                        class="font-mono text-sm resize-y min-h-[36px] max-h-[320px]"
                                        @keydown.enter.prevent="commit(row)"
                                        @keydown.esc.prevent="cancel()"
                                        @blur="commit(row)"
                                    />
                                </div>
                                <div v-else class="flex items-center gap-2">
                                    <span
                                        class="font-mono bg-muted px-2 py-1 rounded text-xs whitespace-pre-wrap break-all"
                                        :class="{ 'opacity-60 select-none': row.type === 'secret' }"
                                    >
                                        {{ row.type === 'secret' ? '••••••' : displayValue(row) }}
                                    </span>
                                    <button
                                        @click.stop="copy(row.value)"
                                        class="opacity-0 group-hover:opacity-100 transition text-muted-foreground hover:text-foreground"
                                        :title="copied === row.value ? 'Copied' : 'Copy value'"
                                    >
                                        <component :is="copied === row.value ? Check : Copy" class="h-4 w-4" />
                                    </button>
                                </div>
                            </td>
                            <td class="p-2">
                                <DropdownMenu>
                                    <DropdownMenuTrigger as-child>
                                        <Button variant="ghost" size="sm">
                                            <MoreHorizontalIcon class="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem v-if="row.type === 'environment'" @click="startEdit(row)">
                                            <EditIcon class="h-4 w-4 mr-2" />
                                            Inline edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem @click="$emit('delete', row)" class="text-red-600">
                                            <TrashIcon class="h-4 w-4 mr-2" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </td>
                        </tr>
                    </TransitionGroup>
                    <tr v-if="rows.length === 0">
                        <td colspan="7" class="h-24 text-center text-sm text-muted-foreground p-2">No variables found.</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Check, Copy, EditIcon, MoreHorizontalIcon, TrashIcon } from 'lucide-vue-next';
import { nextTick, ref } from 'vue';

interface Row {
    id: string;
    clusterName: string;
    serviceName: string;
    containerName: string;
    type: 'environment' | 'secret';
    name: string;
    value: string;
}

const props = defineProps<{
    rows: Row[];
}>();
const emit = defineEmits<{
    (e: 'commit', payload: { row: Row; newValue: string }): void;
    (e: 'delete', row: Row): void;
    (e: 'copy', text: string): void;
}>();

const copied = ref<string | null>(null);
const editingId = ref<string | null>(null);
const editValue = ref('');
const editRef = ref<HTMLTextAreaElement | null>(null);

const isEditing = (row: Row) => editingId.value === row.id;

const startEdit = async (row: Row) => {
    if (row.type === 'secret') return;
    editingId.value = row.id;
    editValue.value = row.value;
    await nextTick();
    editRef.value?.focus();
};

const cancel = () => {
    editingId.value = null;
};

const commit = (row: Row) => {
    if (row.type === 'secret') return cancel();
    if (editValue.value === row.value) return cancel();
    emit('commit', { row, newValue: editValue.value });
    editingId.value = null;
};

const onKeydown = (e: KeyboardEvent, row: Row) => {
    if ((e.key === 'Enter' || e.key === 'F2') && !isEditing(row) && row.type === 'environment') {
        e.preventDefault();
        startEdit(row);
    }
};

const copy = (text: string) => {
    emit('copy', text);
    copied.value = text;
    setTimeout(() => {
        if (copied.value === text) copied.value = null;
    }, 1200);
};

const displayValue = (row: Row) => {
    if (!row?.value) return '';
    const v = typeof row.value === 'string' ? row.value.trim() : String(row.value);
    if ((v.startsWith('{') && v.endsWith('}')) || (v.startsWith('[') && v.endsWith(']'))) {
        try {
            return JSON.stringify(JSON.parse(v), null, 2);
        } catch {
            return v;
        }
    }
    return v;
};
</script>

<style scoped>
.fade-move-enter-active {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-move-leave-active {
    transition: all 0.2s cubic-bezier(0.4, 0, 1, 1);
}

.fade-move-enter-from {
    opacity: 0;
    transform: translateY(-8px) scale(0.98);
}

.fade-move-leave-to {
    opacity: 0;
    transform: translateY(8px) scale(0.98);
}

.fade-move-move {
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-move-enter-active,
.fade-move-leave-active,
.fade-move-move {
    will-change: transform, opacity;
}
</style>
