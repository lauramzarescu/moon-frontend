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
                <Button v-if="hasActiveFilters" variant="ghost" size="sm" @click="clearFilters"> Clear</Button>
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
        <Sheet v-model:open="isSheetOpen">
            <SheetContent side="right" class="w-[1400px] sm:w-[1400px] max-w-[90vw]">
                <SheetHeader class="border-b pb-4">
                    <SheetTitle class="flex items-center gap-3">
                        <span class="font-bold text-xl">Audit Log Details</span>
                    </SheetTitle>
                    <SheetDescription> Detailed information for audit log entry</SheetDescription>
                </SheetHeader>

                <div class="mt-6 overflow-auto h-[calc(100vh-120px)]">
                    <div v-if="selectedLog" class="space-y-6">
                        <!-- Navigation Tabs -->
                        <div v-if="hasDiffData" class="flex space-x-1 bg-muted p-1 rounded-lg">
                            <button
                                @click="activeSection = 'overview'"
                                :class="[
                                    'flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                                    activeSection === 'overview'
                                        ? 'bg-background text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground',
                                ]"
                            >
                                Overview
                            </button>
                            <button
                                @click="activeSection = 'diff'"
                                :class="[
                                    'flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                                    activeSection === 'diff'
                                        ? 'bg-background text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground',
                                ]"
                            >
                                Changes
                            </button>
                        </div>

                        <!-- Overview Section -->
                        <div v-if="activeSection === 'overview'" class="space-y-6">
                            <!-- Action -->
                            <div>
                                <label class="text-sm font-medium text-foreground">Action</label>
                                <div class="mt-2">
                                    <div
                                        :class="[
                                            'inline-flex items-center rounded-full px-3 py-1 text-sm font-medium',
                                            getActionBadgeClass(selectedLog.action),
                                        ]"
                                    >
                                        {{ formatActionName(selectedLog.action) }}
                                    </div>
                                </div>
                            </div>

                            <!-- User ID -->
                            <div>
                                <label class="text-sm font-medium text-foreground">User ID</label>
                                <div class="mt-2 flex items-center justify-between p-3 bg-muted rounded-lg">
                                    <span class="text-sm font-mono">{{ selectedLog.userId }}</span>
                                    <Button variant="ghost" size="sm" @click="copyUserId(selectedLog.userId)"> Copy </Button>
                                </div>
                            </div>

                            <!-- Organization ID -->
                            <div>
                                <label class="text-sm font-medium text-foreground">Organization ID</label>
                                <div class="mt-2 flex items-center justify-between p-3 bg-muted rounded-lg">
                                    <span class="text-sm font-mono">{{ selectedLog.organizationId }}</span>
                                    <Button variant="ghost" size="sm" @click="copyOrganizationId(selectedLog.organizationId)">
                                        Copy
                                    </Button>
                                </div>
                            </div>

                            <!-- Created At -->
                            <div>
                                <label class="text-sm font-medium text-foreground">Created At</label>
                                <p class="text-sm text-muted-foreground mt-2 p-3 bg-muted rounded-lg">
                                    {{ formatDate(selectedLog.createdAt) }}
                                </p>
                            </div>

                            <!-- Updated At -->
                            <div v-if="selectedLog.updatedAt && selectedLog.updatedAt !== selectedLog.createdAt">
                                <label class="text-sm font-medium text-foreground">Updated At</label>
                                <p class="text-sm text-muted-foreground mt-2 p-3 bg-muted rounded-lg">
                                    {{ formatDate(selectedLog.updatedAt) }}
                                </p>
                            </div>

                            <!-- IP Address -->
                            <div v-if="selectedLog.details?.ip">
                                <label class="text-sm font-medium text-foreground">IP Address</label>
                                <p class="text-sm font-mono mt-2 p-3 bg-muted rounded-lg">
                                    {{ selectedLog.details.ip }}
                                </p>
                            </div>

                            <!-- Additional Information -->
                            <div v-if="selectedLog.details?.info && Object.keys(selectedLog.details.info).length > 0">
                                <label class="text-sm font-medium text-foreground">Additional Information</label>
                                <div class="mt-2 space-y-3">
                                    <div v-for="(value, key) in selectedLog.details.info" :key="key" class="space-y-2">
                                        <label class="text-xs font-medium text-muted-foreground">{{ key }}</label>
                                        <div class="p-3 bg-muted rounded-lg">
                                            <pre class="text-xs font-mono whitespace-pre-wrap break-all">{{ formatInfoValue(value) }}</pre>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Log ID -->
                            <div>
                                <label class="text-sm font-medium text-foreground">Log ID</label>
                                <div class="mt-2 flex items-center justify-between p-3 bg-muted rounded-lg">
                                    <span class="text-xs font-mono break-all">{{ selectedLog.id }}</span>
                                    <Button variant="ghost" size="sm" @click="copyLogId(selectedLog.id)"> Copy</Button>
                                </div>
                            </div>
                        </div>

                        <!-- Diff Section -->
                        <div v-if="activeSection === 'diff' && hasDiffData" class="space-y-6">
                            <div>
                                <label class="text-sm font-medium text-foreground mb-4 block">Object Changes</label>

                                <!-- GitHub-style Diff View -->
                                <div class="border rounded-lg overflow-hidden bg-background">
                                    <div class="bg-muted px-4 py-2 border-b">
                                        <h4 class="text-sm font-medium text-foreground">Changes</h4>
                                    </div>
                                    <div class="max-h-96 overflow-auto">
                                        <div
                                            v-for="line in getDiffLines()"
                                            :key="line.key"
                                            :class="[
                                                'flex text-xs font-mono leading-5',
                                                line.type === 'removed' && 'bg-red-50 dark:bg-red-950/20',
                                                line.type === 'added' && 'bg-green-50 dark:bg-green-950/20',
                                                line.type === 'unchanged' && 'bg-background',
                                            ]"
                                        >
                                            <div
                                                :class="[
                                                    'w-12 px-2 py-1 text-right border-r select-none flex-shrink-0',
                                                    line.type === 'removed' &&
                                                        'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
                                                    line.type === 'added' &&
                                                        'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
                                                    line.type === 'unchanged' && 'bg-muted/50 text-muted-foreground',
                                                ]"
                                            >
                                                <span v-if="line.type === 'removed'">-</span>
                                                <span v-else-if="line.type === 'added'">+</span>
                                                <span v-else>&nbsp;</span>
                                            </div>
                                            <div
                                                :class="[
                                                    'flex-1 px-3 py-1 whitespace-pre-wrap break-all',
                                                    line.type === 'removed' && 'text-red-800 dark:text-red-200',
                                                    line.type === 'added' && 'text-green-800 dark:text-green-200',
                                                    line.type === 'unchanged' && 'text-foreground',
                                                ]"
                                            >
                                                {{ line.content }}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Diff Summary -->
                                <div class="mt-4 p-4 bg-muted rounded-lg">
                                    <h4 class="text-sm font-medium text-foreground mb-2">Change Summary</h4>
                                    <div class="space-y-2">
                                        <div v-for="change in getDiffSummary()" :key="change.field" class="flex items-center gap-2 text-xs">
                                            <span
                                                :class="[
                                                    'w-2 h-2 rounded-full',
                                                    change.type === 'added'
                                                        ? 'bg-green-500'
                                                        : change.type === 'removed'
                                                          ? 'bg-red-500'
                                                          : 'bg-yellow-500',
                                                ]"
                                            ></span>
                                            <span class="font-mono text-muted-foreground">{{ change.field }}</span>
                                            <span class="text-muted-foreground">
                                                {{ change.type === 'added' ? 'added' : change.type === 'removed' ? 'removed' : 'changed' }}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { DotsHorizontalIcon } from '@radix-icons/vue';
import { toast } from '@/components/ui/toast';
import { AuditLogService } from '@/services/audit-log.service.ts';
import { type AuditLog, AuditLogEnum, type PaginationMeta, type PaginationParams } from './schema.ts'; // Service instance

// Service instance
const auditLogService = new AuditLogService();

// Reactive state
const auditLogs = ref<AuditLog[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const paginationMeta = ref<PaginationMeta | null>(null);

// Sheet state
const isSheetOpen = ref(false);
const selectedLog = ref<AuditLog | null>(null);
const activeSection = ref('overview');

// Filters (removed organizationId)
const filters = reactive({
    userId: '',
    action: '',
});

// Sorting
const sorting = reactive({
    orderBy: 'createdAt',
    order: 'desc' as 'asc' | 'desc',
});

// Available actions for filter dropdown
const availableActions = Object.values(AuditLogEnum);

// Debounced search
let searchTimeout: NodeJS.Timeout;
const debouncedSearch = () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        fetchAuditLogs(1); // Reset to first page when filtering
    }, 500);
};

// Computed properties
const hasActiveFilters = computed(() => {
    return filters.userId.trim() !== '' || filters.action !== '';
});

const hasDiffData = computed(() => {
    return selectedLog.value?.details?.info?.objectOld && selectedLog.value?.details?.info?.objectNew;
});

const visiblePages = computed(() => {
    if (!paginationMeta.value) return [];

    const pages: number[] = [];
    const current = paginationMeta.value.page;
    const total = paginationMeta.value.totalPages;
    const start = Math.max(1, current - 2);
    const end = Math.min(total, current + 2);

    for (let i = start; i <= end; i++) {
        pages.push(i);
    }

    return pages;
});

// Methods
const fetchAuditLogs = async (page: number = paginationMeta.value?.page || 1) => {
    loading.value = true;
    error.value = null;

    try {
        const params: PaginationParams & {
            userId?: string;
            action?: string;
        } = {
            page,
            limit: 20,
            orderBy: sorting.orderBy,
            order: sorting.order,
        };

        if (filters.userId.trim()) {
            params.userId = filters.userId.trim();
        }

        if (filters.action) {
            params.action = filters.action;
        }

        const response = await auditLogService.getAll(params);

        if (response.data) {
            auditLogs.value = response.data;
            paginationMeta.value = response.meta;
        } else {
            throw new Error('Failed to fetch audit logs');
        }
    } catch (err) {
        error.value = err instanceof Error ? err.message : 'An error occurred';
        auditLogs.value = [];
        paginationMeta.value = null;
    } finally {
        loading.value = false;
    }
};

const goToPage = (page: number) => {
    if (paginationMeta.value && page >= 1 && page <= paginationMeta.value.totalPages && page !== paginationMeta.value.page) {
        fetchAuditLogs(page);
    }
};

const clearFilters = () => {
    filters.userId = '';
    filters.action = '';
    sorting.orderBy = 'createdAt';
    sorting.order = 'desc';
    fetchAuditLogs(1);
};

const handleSortChange = () => {
    fetchAuditLogs(1); // Reset to first page when sorting changes
};

const toggleSortOrder = () => {
    sorting.order = sorting.order === 'desc' ? 'asc' : 'desc';
    handleSortChange();
};

const openLogDetails = (log: AuditLog) => {
    selectedLog.value = log;
    activeSection.value = 'overview'; // Reset to overview when opening
    isSheetOpen.value = true;
};

const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleString();
};

const formatActionName = (action: AuditLogEnum) => {
    return action
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, (l) => l.toUpperCase());
};

const getActionBadgeClass = (action: AuditLogEnum) => {
    if (action.includes('login') || action.includes('created')) {
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    } else if (action.includes('deleted')) {
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    } else if (action.includes('updated') || action.includes('changed')) {
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    } else if (action.includes('logout') || action.includes('disabled')) {
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    }
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
};

const formatInfoValue = (value: unknown): string => {
    if (typeof value === 'object' && value !== null) {
        return JSON.stringify(value, null, 2);
    }
    return String(value);
};

const formatDiffValue = (value: unknown): string => {
    if (typeof value === 'object' && value !== null) {
        return JSON.stringify(value, null, 2);
    }
    return String(value);
};

const getDiffLines = () => {
    if (!selectedLog.value?.details?.info?.objectOld || !selectedLog.value?.details?.info.objectNew) {
        return [];
    }

    const oldObj =
        typeof selectedLog.value.details.info.objectOld === 'object'
            ? (selectedLog.value.details.info.objectOld as Record<string, any>)
            : {};
    const newObj =
        typeof selectedLog.value.details.info.objectNew === 'object'
            ? (selectedLog.value.details.info.objectNew as Record<string, any>)
            : {};

    const lines: Array<{ key: string; content: string; type: 'added' | 'removed' | 'unchanged' }> = [];
    const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);

    // Sort keys for consistent display
    const sortedKeys = Array.from(allKeys).sort();

    sortedKeys.forEach((key) => {
        const oldValue = oldObj[key];
        const newValue = newObj[key];
        const oldValueStr = oldValue !== undefined ? JSON.stringify(oldValue, null, 2) : undefined;
        const newValueStr = newValue !== undefined ? JSON.stringify(newValue, null, 2) : undefined;

        if (oldValue === undefined && newValue !== undefined) {
            // Added
            const lines_to_add = newValueStr!.split('\n');
            lines_to_add.forEach((line, index) => {
                lines.push({
                    key: `${key}-added-${index}`,
                    content: index === 0 ? `"${key}": ${line}` : line,
                    type: 'added',
                });
            });
        } else if (oldValue !== undefined && newValue === undefined) {
            // Removed
            const lines_to_remove = oldValueStr!.split('\n');
            lines_to_remove.forEach((line, index) => {
                lines.push({
                    key: `${key}-removed-${index}`,
                    content: index === 0 ? `"${key}": ${line}` : line,
                    type: 'removed',
                });
            });
        } else if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
            // Changed - show both old and new
            const old_lines = oldValueStr!.split('\n');
            const new_lines = newValueStr!.split('\n');

            old_lines.forEach((line, index) => {
                lines.push({
                    key: `${key}-old-${index}`,
                    content: index === 0 ? `"${key}": ${line}` : line,
                    type: 'removed',
                });
            });

            new_lines.forEach((line, index) => {
                lines.push({
                    key: `${key}-new-${index}`,
                    content: index === 0 ? `"${key}": ${line}` : line,
                    type: 'added',
                });
            });
        } else {
            // Unchanged - show context
            const unchanged_lines = oldValueStr!.split('\n');
            unchanged_lines.forEach((line, index) => {
                lines.push({
                    key: `${key}-unchanged-${index}`,
                    content: index === 0 ? `"${key}": ${line}` : line,
                    type: 'unchanged',
                });
            });
        }
    });

    return lines;
};

const getDiffSummary = () => {
    if (!selectedLog.value?.details?.info?.objectOld || !selectedLog.value?.details?.info.objectNew) {
        return [];
    }

    const oldObj =
        typeof selectedLog.value.details.info.objectOld === 'object'
            ? (selectedLog.value.details.info.objectOld as Record<string, any>)
            : {};
    const newObj =
        typeof selectedLog.value.details.info.objectNew === 'object'
            ? (selectedLog.value.details.info.objectNew as Record<string, any>)
            : {};

    const changes: Array<{ field: string; type: 'added' | 'removed' | 'changed' }> = [];
    const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);

    allKeys.forEach((key) => {
        const oldValue = oldObj[key];
        const newValue = newObj[key];

        if (oldValue === undefined && newValue !== undefined) {
            changes.push({ field: key, type: 'added' });
        } else if (oldValue !== undefined && newValue === undefined) {
            changes.push({ field: key, type: 'removed' });
        } else if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
            changes.push({ field: key, type: 'changed' });
        }
    });

    return changes;
};

const copyToClipboard = async (text: string, label: string) => {
    try {
        await navigator.clipboard.writeText(text);
        toast({
            title: 'Copied to clipboard',
            description: `${label} has been copied to your clipboard.`,
            variant: 'default',
        });
    } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        toast({
            title: 'Copy failed',
            description: 'Failed to copy to clipboard. Please try again.',
            variant: 'destructive',
        });
    }
};

const copyLogId = (id: string) => {
    copyToClipboard(id, 'Log ID');
};

const copyUserId = (userId: string) => {
    copyToClipboard(userId, 'User ID');
};

const copyOrganizationId = (organizationId: string) => {
    copyToClipboard(organizationId, 'Organization ID');
};

onMounted(() => {
    fetchAuditLogs();
});
</script>
