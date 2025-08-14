<template>
    <div class="audit-logs">
        <!-- Toolbar - Single Row with Filters and Actions -->
        <div class="flex items-center justify-between py-4">
            <div class="flex flex-1 items-center space-x-2">
                <!-- User Email Filter -->
                <div class="relative">
                    <input
                        v-model="filters.userEmail"
                        type="text"
                        placeholder="Filter by User Email..."
                        class="flex h-9 w-[250px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        :disabled="loading"
                        @input="debouncedSearch"
                    />
                    <!-- Loading indicator for search -->
                    <div v-if="loading" class="absolute right-2 top-1/2 -translate-y-1/2">
                        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    </div>
                </div>

                <!-- Action Filter - Enhanced -->
                <div class="relative">
                    <select
                        v-model="filters.action"
                        class="flex h-9 w-[180px] rounded-md border border-input bg-background px-3 py-2 pr-8 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none cursor-pointer hover:bg-accent/50 transition-colors"
                        :disabled="loading"
                        @change="debouncedSearch"
                    >
                        <option value="">All Actions</option>
                        <option v-for="action in availableActions" :key="action" :value="action">
                            {{ formatActionName(action) }}
                        </option>
                    </select>
                    <!-- Dropdown arrow -->
                    <svg
                        class="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                </div>

                <!-- Clear Filters -->
                <Button v-if="hasActiveFilters" variant="ghost" size="sm" :disabled="loading" @click="clearFilters"> Clear </Button>
            </div>

            <div class="flex items-center space-x-2">
                <!-- Sort Controls -->
                <div class="flex items-center space-x-1">
                    <!-- Sort Field Selector -->
                    <div class="relative">
                        <select
                            v-model="sorting.orderBy"
                            class="flex h-9 w-[120px] rounded-md border border-input bg-background px-3 py-2 pr-8 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none cursor-pointer hover:bg-accent/50 transition-colors"
                            :disabled="loading"
                            @change="handleSortChange"
                        >
                            <option value="createdAt">Date</option>
                            <option value="action">Action</option>
                            <option value="userId">User</option>
                        </select>
                        <!-- Dropdown arrow -->
                        <svg
                            class="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>

                    <!-- Sort Direction Toggle -->
                    <Button
                        variant="outline"
                        size="sm"
                        :disabled="loading"
                        @click="toggleSortOrder"
                        class="h-9 px-3 hover:bg-accent/50 transition-all duration-200"
                    >
                        <svg
                            class="h-4 w-4 transition-transform duration-200"
                            :class="{ 'rotate-180': sorting.order === 'asc' }"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                    </Button>
                </div>

                <!-- Global Loading Indicator -->
                <div v-if="loading" class="flex items-center gap-2 text-sm text-muted-foreground">
                    <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    <span>Loading...</span>
                </div>
            </div>
        </div>

        <!-- Audit Logs List -->
        <div class="rounded-md border">
            <!-- Loading State -->
            <div v-if="loading && auditLogs.length === 0" class="flex items-center justify-center py-8">
                <div class="flex items-center gap-3">
                    <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                    <p class="text-sm text-muted-foreground">Loading audit logs...</p>
                </div>
            </div>

            <!-- Error State -->
            <div v-else-if="error" class="text-center py-8">
                <p class="text-sm text-destructive mb-4">Error loading audit logs: {{ error }}</p>
                <Button size="sm" @click="fetchAuditLogs">Retry</Button>
            </div>

            <!-- Empty State -->
            <div v-else-if="auditLogs.length === 0 && !loading" class="text-center py-8">
                <p class="text-sm text-muted-foreground">No audit logs found.</p>
            </div>

            <!-- Audit Logs Cards with Loading Overlay -->
            <div v-else class="relative">
                <!-- Loading Overlay for existing data -->
                <div
                    v-if="loading && auditLogs.length > 0"
                    class="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center"
                >
                    <div class="flex items-center gap-3 bg-background border rounded-lg px-4 py-2 shadow-lg">
                        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        <p class="text-sm text-muted-foreground">Updating...</p>
                    </div>
                </div>

                <!-- Audit Logs List -->
                <div class="divide-y" :class="{ 'opacity-50': loading && auditLogs.length > 0 }">
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
                            <!-- Cluster Info -->
                            <div
                                v-if="log.details.info?.cluster"
                                class="flex items-center gap-1.5 text-sm text-foreground/70 bg-muted/30 rounded-md px-2 py-1"
                            >
                                <template v-if="log.action === AuditLogEnum.AWS_SERVICE_UPDATED">
                                    <svg
                                        class="h-3.5 w-3.5 text-blue-600 dark:text-blue-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                        />
                                    </svg>
                                    <span class="text-xs">{{ log.details.info.cluster }} / {{ log.details.info.service }}</span>
                                </template>
                                <template v-else>
                                    <svg
                                        class="h-3.5 w-3.5 text-gray-500 dark:text-gray-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                                        />
                                    </svg>
                                    <span class="font-medium">{{ log.details.info.cluster }}</span>
                                </template>
                            </div>

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
        </div>

        <!-- Enhanced Pagination -->
        <div v-if="paginationMeta && paginationMeta.totalPages > 1" class="flex items-center justify-between mt-4">
            <!-- Left side - Navigation Controls -->
            <div class="flex items-center gap-2">
                <!-- Go to Start -->
                <Button
                    variant="outline"
                    size="sm"
                    :disabled="paginationMeta.page === 1 || loading"
                    @click="goToPage(1)"
                    class="h-8 px-2"
                    title="Go to first page"
                >
                    <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                    </svg>
                </Button>

                <!-- Previous -->
                <Button
                    variant="outline"
                    size="sm"
                    :disabled="!paginationMeta.hasPreviousPage || loading"
                    @click="goToPage(paginationMeta.page - 1)"
                    class="h-8 px-3"
                >
                    <svg class="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                    </svg>
                </Button>

                <!-- Page Numbers -->
                <div class="flex items-center gap-1">
                    <Button
                        v-for="page in visiblePages"
                        :key="page"
                        :variant="page === paginationMeta.page ? 'default' : 'ghost'"
                        size="sm"
                        class="w-8 h-8 p-0"
                        :disabled="loading"
                        @click="goToPage(page)"
                    >
                        {{ page }}
                    </Button>
                </div>

                <!-- Next -->
                <Button
                    variant="outline"
                    size="sm"
                    :disabled="!paginationMeta.hasNextPage || loading"
                    @click="goToPage(paginationMeta.page + 1)"
                    class="h-8 px-3"
                >
                    <svg class="h-3 w-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                </Button>

                <!-- Go to End -->
                <Button
                    variant="outline"
                    size="sm"
                    :disabled="paginationMeta.page === paginationMeta.totalPages || loading"
                    @click="goToPage(paginationMeta.totalPages)"
                    class="h-8 px-2"
                    title="Go to last page"
                >
                    <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                    </svg>
                </Button>
            </div>

            <!-- Right side - Info and Items per Page -->
            <div class="flex items-center gap-4">
                <!-- Items per Page Selector -->
                <div class="flex items-center gap-2">
                    <span class="text-sm text-muted-foreground">Items per page:</span>
                    <div class="relative">
                        <select
                            v-model="pagination.limit"
                            class="flex h-8 w-[70px] rounded-md border border-input bg-background px-2 py-1 pr-6 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none cursor-pointer hover:bg-accent/50 transition-colors"
                            :disabled="loading"
                            @change="handleItemsPerPageChange"
                        >
                            <option value="10">10</option>
                            <option value="25">25</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                        </select>
                        <!-- Dropdown arrow -->
                        <svg
                            class="absolute right-1 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>

                <!-- Pagination Info -->
                <div class="flex items-center gap-4">
                    <div class="text-sm text-muted-foreground">
                        Showing {{ (paginationMeta.page - 1) * pagination.limit + 1 }} to
                        {{ Math.min(paginationMeta.page * pagination.limit, paginationMeta.total) }} of {{ paginationMeta.total }} items
                    </div>
                    <div class="text-sm text-muted-foreground">
                        Page {{ paginationMeta.page }} of
                        {{ paginationMeta.totalPages }}
                    </div>
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
import { AuditLogEnum } from '@/views/Settings/components/AuditLogs/schema.ts';

const {
    // State
    auditLogs,
    loading,
    error,
    paginationMeta,
    pagination,
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
    handleItemsPerPageChange,
    copyLogId,
    copyUserId,
    copyOrganizationId,
} = useAuditLogs();

onMounted(() => {
    fetchAuditLogs();
});
</script>
