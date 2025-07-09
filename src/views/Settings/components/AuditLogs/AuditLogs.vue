<template>
    <div class="audit-logs">
        <!-- Toolbar - Single Row with Filters and Actions -->
        <div class="flex items-center justify-between py-4">
            <div class="flex flex-1 items-center space-x-2">
                <!-- User ID Filter -->
                <input
                    v-model="filters.userId"
                    type="text"
                    placeholder="Filter by User ID..."
                    class="flex h-9 w-[150px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    @input="debouncedSearch"
                />

                <!-- Action Filter -->
                <select
                    v-model="filters.action"
                    class="flex h-9 w-[180px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    @change="debouncedSearch"
                >
                    <option value="">All Actions</option>
                    <option v-for="action in availableActions" :key="action" :value="action">
                        {{ formatActionName(action) }}
                    </option>
                </select>

                <!-- Clear Filters -->
                <Button v-if="hasActiveFilters" variant="ghost" size="sm" @click="clearFilters">Clear</Button>
            </div>

            <div class="flex items-center space-x-2">
                <!-- Sort Controls -->
                <select
                    v-model="sorting.orderBy"
                    class="flex h-9 w-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    @change="handleSortChange"
                >
                    <option value="createdAt">Date</option>
                    <option value="action">Action</option>
                    <option value="userId">User</option>
                </select>

                <Button variant="outline" size="sm" @click="toggleSortOrder" class="h-9 px-3">
                    {{ sorting.order === 'desc' ? '↓' : '↑' }}
                </Button>
            </div>
        </div>

        <!-- Audit Logs List -->
        <div class="rounded-md border">
            <!-- Loading State -->
            <div v-if="loading" class="flex items-center justify-center py-8">
                <div class="flex items-center gap-3">
                    <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    <p class="text-sm text-muted-foreground">Loading audit logs...</p>
                </div>
            </div>

            <!-- Error State -->
            <div v-else-if="error" class="text-center py-8">
                <p class="text-sm text-destructive mb-4">Error loading audit logs: {{ error }}</p>
                <Button size="sm" @click="fetchAuditLogs">Retry</Button>
            </div>

            <!-- Empty State -->
            <div v-else-if="auditLogs.length === 0" class="text-center py-8">
                <p class="text-sm text-muted-foreground">No audit logs found.</p>
            </div>

            <!-- Audit Logs Cards -->
            <div v-else class="divide-y">
                <div
                    v-for="log in auditLogs"
                    :key="log.id"
                    class="flex items-center justify-between p-3 hover:bg-accent/50 transition-colors cursor-pointer"
                    @click="openLogDetails(log)"
                >
                    <div class="flex items-center space-x-3 flex-1 min-w-0">
                        <!-- Action Badge -->
                        <div
                            :class="[
                                'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium flex-shrink-0',
                                getActionBadgeClass(log.action),
                            ]"
                        >
                            {{ log.action }}
                        </div>

                        <!-- Log Info -->
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2">
                                <p class="text-sm font-medium text-foreground truncate">
                                    {{ formatActionName(log.action) }}
                                </p>
                                <span class="text-xs text-muted-foreground flex-shrink-0">
                                    {{ formatDate(log.createdAt) }}
                                </span>
                            </div>

                            <div class="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                                <div class="flex items-center gap-1">
                                    <span class="font-medium">User:</span>
                                    <span class="font-mono">{{ log.details.info?.email || 'Email unavailable' }}</span>
                                </div>

                                <div v-if="log.details?.ip" class="flex items-center gap-1">
                                    <span class="font-medium">IP:</span>
                                    <span class="font-mono">{{ log.details.ip }}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Actions -->
                    <div class="flex items-center space-x-2">
                        <Button
                            v-if="log.details?.info && Object.keys(log.details.info).length > 0"
                            variant="ghost"
                            size="sm"
                            class="h-6 px-2 text-xs"
                            @click.stop="openLogDetails(log)"
                        >
                            Details
                        </Button>

                        <DropdownMenu>
                            <DropdownMenuTrigger as-child>
                                <Button variant="ghost" size="sm" class="h-6 w-6 p-0" @click.stop>
                                    <DotsHorizontalIcon class="h-3 w-3" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem @click="copyLogId(log.id)">Copy Log ID</DropdownMenuItem>
                                <DropdownMenuItem @click="copyUserId(log.userId)">Copy User ID</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>
        </div>

        <!-- Pagination -->
        <div v-if="paginationMeta && paginationMeta.totalPages > 1" class="flex items-center justify-between mt-4">
            <div class="flex items-center gap-2">
                <Button variant="outline" size="sm" :disabled="!paginationMeta.hasPreviousPage" @click="goToPage(paginationMeta.page - 1)">
                    Previous
                </Button>

                <div class="flex items-center gap-1">
                    <Button
                        v-for="page in visiblePages"
                        :key="page"
                        :variant="page === paginationMeta.page ? 'default' : 'ghost'"
                        size="sm"
                        class="w-8 h-8 p-0"
                        @click="goToPage(page)"
                    >
                        {{ page }}
                    </Button>
                </div>

                <Button variant="outline" size="sm" :disabled="!paginationMeta.hasNextPage" @click="goToPage(paginationMeta.page + 1)">
                    Next
                </Button>
            </div>

            <div class="flex items-center gap-4">
                <div class="text-sm text-muted-foreground">{{ paginationMeta.total }} total items</div>
                <div class="text-sm text-muted-foreground">
                    Page {{ paginationMeta.page }} of
                    {{ paginationMeta.totalPages }}
                </div>
            </div>
        </div>

        <!-- Audit Log Details Sheet -->
        <AuditLogDetails
            :is-open="isSheetOpen"
            :active-section="activeSection"
            :log="selectedLog"
            @update:is-open="isSheetOpen = $event"
            @update:active-section="activeSection = $event"
            @copy-log-id="copyLogId"
            @copy-user-id="copyUserId"
            @copy-organization-id="copyOrganizationId"
        />
    </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DotsHorizontalIcon } from '@radix-icons/vue';
import { useAuditLogs } from './composables/useAuditLogs.ts';
import { formatActionName, formatDate, getActionBadgeClass } from './utils/auditLogHelpers.ts';
import AuditLogDetails from './components/AuditLogDetails.vue';

const {
    // State
    auditLogs,
    loading,
    error,
    paginationMeta,
    isSheetOpen,
    selectedLog,
    activeSection,
    filters,
    sorting,
    availableActions,

    // Computed
    hasActiveFilters,
    visiblePages,

    // Methods
    fetchAuditLogs,
    goToPage,
    clearFilters,
    handleSortChange,
    toggleSortOrder,
    openLogDetails,
    debouncedSearch,
    copyLogId,
    copyUserId,
    copyOrganizationId,
} = useAuditLogs();

// Lifecycle
onMounted(() => {
    fetchAuditLogs();
});
</script>
