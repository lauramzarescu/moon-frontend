import { computed, reactive, ref } from 'vue';
import { AuditLogService } from '@/services/audit-log.service.ts';
import { type AuditLog, AuditLogEnum, type PaginationMeta, type PaginationParams } from '../schema.ts';
import { toast } from '@/components/ui/toast';

export function useAuditLogs() {
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

    // Pagination state
    const pagination = reactive({
        limit: 10,
    });

    // Filters
    const filters = reactive({
        userId: '',
        userEmail: '',
        action: '',
        startDate: '',
        endDate: '',
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
            fetchAuditLogs(1);
        }, 500);
    };

    // Computed properties
    const hasActiveFilters = computed(() => {
        return filters.userId.trim() !== '' || filters.userEmail.trim() !== '' || filters.action !== '';
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
            const activeFilters: Record<string, any> = {};
            Object.entries(filters).forEach(([key, value]) => {
                if (typeof value === 'string' && value.trim()) {
                    activeFilters[key] = value.trim();
                } else if (value && typeof value !== 'string') {
                    activeFilters[key] = value;
                }
            });

            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const params: PaginationParams & { filters?: Record<string, any> } = {
                page,
                limit: pagination.limit,
                orderBy: sorting.orderBy,
                order: sorting.order,
                filters: activeFilters,
                tz,
            };

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

    const handleItemsPerPageChange = () => {
        // Reset to first page when changing items per page
        fetchAuditLogs(1);
    };

    const clearFilters = () => {
        filters.userId = '';
        filters.userEmail = '';
        filters.action = '';
        sorting.orderBy = 'createdAt';
        sorting.order = 'desc';
        pagination.limit = 20;
        fetchAuditLogs(1);
    };

    const handleSortChange = () => {
        fetchAuditLogs(1);
    };

    const toggleSortOrder = () => {
        sorting.order = sorting.order === 'desc' ? 'asc' : 'desc';
        handleSortChange();
    };

    const openLogDetails = (log: AuditLog) => {
        selectedLog.value = log;
        activeSection.value = 'overview';
        isSheetOpen.value = true;
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

    return {
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
        hasDiffData,
        visiblePages,

        // Methods
        fetchAuditLogs,
        goToPage,
        handleItemsPerPageChange,
        clearFilters,
        handleSortChange,
        toggleSortOrder,
        openLogDetails,
        debouncedSearch,
        copyLogId,
        copyUserId,
        copyOrganizationId,
    };
}
