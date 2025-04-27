<script setup lang="ts">
import { computed, ref } from 'vue';
import { type ActionDefinition } from './schema';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Search } from 'lucide-vue-next';
import ActionFilter from './ActionFilter.vue';
import ActionCard from './ActionCard.vue';
import ActionDeleteDialog from './ActionDeleteDialog.vue';
import ActionEditForm from './ActionEditForm.vue';

interface Props {
    actions: ActionDefinition[];
    loading?: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
    (e: 'update-action-status', id: string, enabled: boolean): void;
    (e: 'delete-action', id: string): void;
    (e: 'edit-action', action: ActionDefinition): void;
}>();

const searchQuery = ref('');
const selectedFilter = ref<string | null>(null);
const actionToDelete = ref<string | null>(null);
const isDeleteDialogOpen = ref(false);
const editingActionId = ref<string | null>(null);

const filteredActions = computed(() => {
    let result = props.actions;

    // Apply search filter
    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        result = result.filter(
            (action) =>
                action.name.toLowerCase().includes(query) ||
                action.triggerType.toLowerCase().includes(query) ||
                action.actionType.toLowerCase().includes(query),
        );
    }

    // Apply type filter
    if (selectedFilter.value) {
        result = result.filter((action) => action.actionType === selectedFilter.value);
    }

    return result;
});

const handleFilterChange = (query: string, filter: string | null) => {
    searchQuery.value = query;
    selectedFilter.value = filter;
};

const handleStatusChange = (actionId: string, newStatus: boolean) => {
    emit('update-action-status', actionId, newStatus);
};

const confirmDelete = (actionId: string) => {
    actionToDelete.value = actionId;
    isDeleteDialogOpen.value = true;
};

const handleDelete = () => {
    if (actionToDelete.value) {
        emit('delete-action', actionToDelete.value);
        actionToDelete.value = null;
        isDeleteDialogOpen.value = false;
    }
};

const startEditing = (action: ActionDefinition) => {
    editingActionId.value = action.id;
};

const cancelEditing = () => {
    editingActionId.value = null;
};

const saveEdit = (updatedAction: ActionDefinition) => {
    emit('edit-action', updatedAction);
    editingActionId.value = null;
};
</script>

<template>
    <div class="space-y-6 w-full">
        <ActionFilter @filter-change="handleFilterChange" />

        <!-- Loading state -->
        <div v-if="loading" class="flex justify-center py-12">
            <div class="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>

        <!-- Empty state -->
        <Card v-else-if="props.actions.length === 0" class="bg-muted/20 border-dashed w-full">
            <CardContent class="flex flex-col items-center justify-center py-12 text-center">
                <div class="rounded-full bg-muted p-3 mb-4">
                    <AlertCircle class="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 class="text-lg font-medium mb-2">No actions defined</h3>
                <p class="text-muted-foreground max-w-md">
                    No actions have been defined yet. Create one using the builder above to automate responses to system events.
                </p>
            </CardContent>
        </Card>

        <!-- No results state -->
        <Card v-else-if="filteredActions.length === 0" class="bg-muted/20 border-dashed w-full">
            <CardContent class="flex flex-col items-center justify-center py-12 text-center">
                <div class="rounded-full bg-muted p-3 mb-4">
                    <Search class="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 class="text-lg font-medium mb-2">No matching actions</h3>
                <p class="text-muted-foreground max-w-md">
                    No actions match your current filters. Try adjusting your search criteria or clear filters.
                </p>
                <Button variant="outline" size="sm" @click="handleFilterChange('', null)" class="mt-4"> Clear filters </Button>
            </CardContent>
        </Card>

        <!-- Action list -->
        <div v-else class="grid gap-4 w-full">
            <!-- Using transition-group for animated list changes -->
            <TransitionGroup name="action-list" tag="div" class="grid gap-4 w-full">
                <!-- Regular view mode -->
                <template v-for="action in filteredActions" :key="action.id">
                    <!-- Edit mode -->
                    <ActionEditForm v-if="editingActionId === action.id" :action="action" @save="saveEdit" @cancel="cancelEditing" />

                    <!-- View mode -->
                    <ActionCard v-else :action="action" @update-status="handleStatusChange" @delete="confirmDelete" @edit="startEditing" />
                </template>
            </TransitionGroup>
        </div>

        <!-- Pagination placeholder - can be implemented if needed -->
        <div v-if="filteredActions.length > 10" class="flex items-center justify-center space-x-2 py-4">
            <Button variant="outline" size="sm" disabled>Previous</Button>
            <Button variant="outline" size="sm" class="bg-primary text-primary-foreground">1</Button>
            <Button variant="outline" size="sm">2</Button>
            <Button variant="outline" size="sm">3</Button>
            <Button variant="outline" size="sm">Next</Button>
        </div>

        <!-- Delete confirmation dialog -->
        <ActionDeleteDialog v-model:open="isDeleteDialogOpen" @confirm="handleDelete" />
    </div>
</template>

<style scoped>
.action-card-enter-active,
.action-card-leave-active {
    transition: all 0.3s ease;
}

.action-card-enter-from,
.action-card-leave-to {
    opacity: 0;
    transform: translateY(20px);
}

/* Transition for list reordering */
.action-list-move,
.action-list-enter-active,
.action-list-leave-active {
    transition: all 0.5s ease;
}

.action-list-enter-from,
.action-list-leave-to {
    opacity: 0;
    transform: translateY(30px);
}

/* Ensure items maintain their position during transitions */
.action-list-leave-active {
    position: absolute;
}
</style>
