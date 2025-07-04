<script setup lang="ts">
// Watch for changes in filtered actions to adjust current page
import { computed, ref, watch } from 'vue';
import { type ActionDefinition } from './schema';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, ChevronLeft, ChevronRight, Search } from 'lucide-vue-next';
import ActionFilter from './ActionFilter.vue';
import ActionCard from './ActionCard.vue';
import ActionDeleteDialog from './ActionDeleteDialog.vue';
import ActionEditForm from './ActionEditForm.vue';

interface Props {
    actions: ActionDefinition[];
    loading?: boolean;
    itemsPerPage?: number;
}

const props = withDefaults(defineProps<Props>(), {
    itemsPerPage: 10,
});

const emit = defineEmits<{
    (e: 'update-action-status', id: string, enabled: boolean): void;
    (e: 'delete-action', id: string): void;
    (e: 'edit-action', action: ActionDefinition): void;
    (e: 'copy-action', action: ActionDefinition): void;
}>();

const searchQuery = ref('');
const selectedFilter = ref<string | null>(null);
const actionToDelete = ref<string | null>(null);
const isDeleteDialogOpen = ref(false);
const editingActionId = ref<string | null>(null);
const currentPage = ref(1);

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

// Pagination computed properties
const totalPages = computed(() => {
    return Math.ceil(filteredActions.value.length / props.itemsPerPage);
});

const paginatedActions = computed(() => {
    const start = (currentPage.value - 1) * props.itemsPerPage;
    const end = start + props.itemsPerPage;
    return filteredActions.value.slice(start, end);
});

const showPagination = computed(() => {
    return filteredActions.value.length > props.itemsPerPage;
});

// Generate page numbers for pagination display
const visiblePages = computed(() => {
    const total = totalPages.value;
    const current = currentPage.value;
    const delta = 2; // Number of pages to show on each side of current page

    if (total <= 7) {
        // Show all pages if total is small
        return Array.from({ length: total }, (_, i) => i + 1);
    }

    const pages: (number | string)[] = [];

    // Always show first page
    pages.push(1);

    // Add ellipsis if needed
    if (current > delta + 2) {
        pages.push('...');
    }

    // Add pages around current page
    const start = Math.max(2, current - delta);
    const end = Math.min(total - 1, current + delta);

    for (let i = start; i <= end; i++) {
        pages.push(i);
    }

    // Add ellipsis if needed
    if (current < total - delta - 1) {
        pages.push('...');
    }

    // Always show last page if total > 1
    if (total > 1) {
        pages.push(total);
    }

    return pages;
});

const handleFilterChange = (query: string, filter: string | null) => {
    searchQuery.value = query;
    selectedFilter.value = filter;
    // Reset to first page when filters change
    currentPage.value = 1;
};

const handleStatusChange = (actionId: string, newStatus: boolean) => {
    emit('update-action-status', actionId, newStatus);
};

const confirmDelete = (actionId: string) => {
    actionToDelete.value = actionId;
    isDeleteDialogOpen.value = true;
};

const handleCopy = (action: ActionDefinition) => {
    const copiedAction = { ...action, id: crypto.randomUUID() };
    emit('copy-action', copiedAction);
};

const handleDelete = () => {
    if (actionToDelete.value) {
        emit('delete-action', actionToDelete.value);
        actionToDelete.value = null;
        isDeleteDialogOpen.value = false;

        // Adjust current page if needed after deletion
        if (paginatedActions.value.length === 0 && currentPage.value > 1) {
            currentPage.value = Math.max(1, currentPage.value - 1);
        }
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

// Pagination methods
const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages.value) {
        currentPage.value = page;
    }
};

const goToPreviousPage = () => {
    if (currentPage.value > 1) {
        currentPage.value--;
    }
};

const goToNextPage = () => {
    if (currentPage.value < totalPages.value) {
        currentPage.value++;
    }
};

watch(filteredActions, () => {
    // If current page is beyond available pages, go to last page
    if (currentPage.value > totalPages.value && totalPages.value > 0) {
        currentPage.value = totalPages.value;
    }
});
</script>

<template>
    <div class="space-y-6 w-full">
        <ActionFilter @filter-change="handleFilterChange" :actions-count="filteredActions.length" />

        <!-- Loading state -->
        <div v-if="loading" class="flex justify-center py-12">
            <div class="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>

        <!-- Empty state -->
        <Card v-else-if="props.actions.length === 0" class="bg-muted/20 border-dashed w-full">
            <CardContent class="flex flex-col items-center justify-center py-12 text-center">
                <div class="rounded-full bg-muted p-3 mb-4">
                    <AlertCircle class="h-6 w-6 text-foreground" />
                </div>
                <h3 class="text-lg font-medium mb-2">No actions defined</h3>
                <p class="text-foreground max-w-md">Get started by creating your first action to automate responses to events.</p>
            </CardContent>
        </Card>

        <!-- No results state -->
        <Card v-else-if="filteredActions.length === 0" class="bg-muted/20 border-dashed w-full">
            <CardContent class="flex flex-col items-center justify-center py-12 text-center">
                <div class="rounded-full bg-muted p-3 mb-4">
                    <Search class="h-6 w-6 text-foreground" />
                </div>
                <h3 class="text-lg font-medium mb-2">No matching actions</h3>
                <p class="text-foreground max-w-md">
                    No actions match your current filters. Try adjusting your search criteria or clear filters.
                </p>
                <Button variant="outline" size="sm" @click="handleFilterChange('', null)" class="mt-4"> Clear filters </Button>
            </CardContent>
        </Card>

        <!-- Action list -->
        <div v-else class="space-y-4">
            <!-- Results info -->
            <div v-if="showPagination" class="text-sm text-muted-foreground">
                Showing {{ (currentPage - 1) * itemsPerPage + 1 }} to {{ Math.min(currentPage * itemsPerPage, filteredActions.length) }} of
                {{ filteredActions.length }} actions
            </div>

            <div class="grid gap-4 w-full">
                <TransitionGroup name="action-list" tag="div" class="grid gap-4 w-full">
                    <template v-for="action in paginatedActions" :key="action?.id">
                        <!-- Edit mode -->
                        <ActionEditForm v-if="editingActionId === action.id" :action="action" @save="saveEdit" @cancel="cancelEditing" />

                        <!-- View mode -->
                        <ActionCard
                            v-else
                            :action="action"
                            @update-status="handleStatusChange"
                            @delete="confirmDelete"
                            @edit="startEditing"
                            @copy="handleCopy"
                        />
                    </template>
                </TransitionGroup>
            </div>
        </div>

        <!-- Pagination -->
        <div v-if="showPagination" class="flex items-center justify-center space-x-2 py-4">
            <!-- Previous button -->
            <Button variant="outline" size="sm" :disabled="currentPage === 1" @click="goToPreviousPage" class="flex items-center gap-1">
                <ChevronLeft class="h-4 w-4" />
                Previous
            </Button>

            <!-- Page numbers -->
            <template v-for="page in visiblePages" :key="page">
                <Button
                    v-if="typeof page === 'number'"
                    variant="outline"
                    size="sm"
                    :class="{
                        'bg-primary text-primary-foreground': page === currentPage,
                        'hover:bg-muted': page !== currentPage,
                    }"
                    @click="goToPage(page)"
                >
                    {{ page }}
                </Button>
                <span v-else class="px-2 text-muted-foreground">{{ page }}</span>
            </template>

            <!-- Next button -->
            <Button
                variant="outline"
                size="sm"
                :disabled="currentPage === totalPages"
                @click="goToNextPage"
                class="flex items-center gap-1"
            >
                Next
                <ChevronRight class="h-4 w-4" />
            </Button>
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
    transform: translateY(5px);
}

/* Transition for list reordering */
.action-list-move,
.action-list-enter-active,
.action-list-leave-active {
    transition: all 0.3s ease;
}

.action-list-enter-from,
.action-list-leave-to {
    opacity: 0;
    transform: translateY(5px);
}

/* Ensure items maintain their position during transitions */
.action-list-leave-active {
    position: absolute;
}
</style>
