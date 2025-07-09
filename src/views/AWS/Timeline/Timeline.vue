<template>
    <div class="space-y-6">
        <div v-if="loading" class="flex flex-col items-center justify-center py-12">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p class="mt-4 text-sm text-muted-foreground">Loading deployment timeline...</p>
        </div>

        <div v-else-if="error" class="text-center py-12">
            <p class="text-destructive mb-4">{{ error }}</p>
            <Button @click="fetchAuditLogs" variant="outline">Retry</Button>
        </div>

        <div v-else-if="timelineEvents.length === 0" class="text-center py-12">
            <p class="text-muted-foreground">No AWS image deployments found.</p>
        </div>

        <div v-else class="space-y-4">
            <Card v-for="event in timelineEvents" :key="event.id" class="relative">
                <CardHeader class="pb-4">
                    <div class="flex items-start justify-between gap-4">
                        <div class="flex items-start gap-3">
                            <div class="rounded-md bg-primary/10 p-2 mt-0.5">
                                <component :is="getEventIcon()" class="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle class="text-lg mb-1">
                                    {{ getEventTitle(event) }}
                                </CardTitle>
                                <CardDescription class="flex flex-wrap items-center gap-x-4 gap-y-2">
                                    <Badge variant="secondary" class="px-2 py-0.5">
                                        {{ event.action }}
                                    </Badge>
                                    <span class="text-xs text-muted-foreground">
                                        {{ formatDate(event.createdAt) }}
                                    </span>
                                </CardDescription>
                            </div>
                        </div>
                    </div>
                </CardHeader>

                <CardContent class="pb-4">
                    <Separator class="my-2" />

                    <div class="mt-3">
                        <div v-if="event.details?.info?.email" class="mb-4">
                            <Badge variant="outline" class="text-xs"> by {{ event.details.info.email }}</Badge>
                        </div>

                        <div v-if="event.details?.info">
                            <h4 class="text-xs uppercase text-foreground font-semibold tracking-wider mb-4">Deployment Details</h4>
                            <div class="space-y-4">
                                <div v-if="event.details.info.description" class="border rounded-md p-3 bg-muted/20">
                                    <div class="text-xs uppercase text-foreground font-semibold mb-2">Deployed Image</div>
                                    <pre class="text-sm font-mono break-all whitespace-pre-wrap">{{ event.details.info.description }}</pre>
                                </div>

                                <div v-if="event.details.info.description" class="border rounded-md p-3 bg-muted/20">
                                    <div class="text-xs uppercase text-foreground font-semibold mb-2">Previous Image</div>
                                    <pre class="text-sm font-mono break-all whitespace-pre-wrap">{{
                                        formatImageInfo(event.details.info.description)
                                    }}</pre>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>

                <CardFooter class="flex justify-between items-center pt-2 pb-3 bg-muted/10">
                    <div class="flex gap-4 text-xs text-muted-foreground">
                        <span v-if="event.details?.ip">IP: {{ event.details.ip }}</span>
                        <span>ID: {{ event.id.slice(0, 8) }}...</span>
                    </div>
                </CardFooter>
            </Card>
        </div>

        <!-- Pagination -->
        <div v-if="paginationMeta && paginationMeta.totalPages > 1" class="flex justify-center items-center gap-4 pt-6">
            <Button @click="changePage(paginationMeta.page - 1)" :disabled="!paginationMeta.hasPreviousPage" variant="outline" size="sm">
                Previous
            </Button>

            <span class="text-sm text-muted-foreground">
                Page {{ paginationMeta.page }} of {{ paginationMeta.totalPages }} ({{ paginationMeta.total }} total events)
            </span>

            <Button @click="changePage(paginationMeta.page + 1)" :disabled="!paginationMeta.hasNextPage" variant="outline" size="sm">
                Next
            </Button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { AuditLogService } from '@/services/audit-log.service';
import { type AuditLog, AuditLogEnum, type PaginationMeta } from '@/views/Settings/components/AuditLogs/schema';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { RefreshCw } from 'lucide-vue-next';

// Service instance
const auditLogService = new AuditLogService();

// Reactive state
const timelineEvents = ref<AuditLog[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const paginationMeta = ref<PaginationMeta | null>(null);

// Filters
const selectedOrganization = ref('');
const dateFilter = ref('');
const currentPage = ref(1);
const pageSize = ref(20);

// AWS-related audit log actions for image updates
const awsImageActions = [
    // AuditLogEnum.AWS_SERVICE_CREATED,
    AuditLogEnum.AWS_SERVICE_UPDATED,
    // AuditLogEnum.AWS_TASK_CREATED,
    // AuditLogEnum.AWS_TASK_UPDATED,
    // AuditLogEnum.AWS_CLUSTER_CREATED,
    // AuditLogEnum.AWS_CLUSTER_UPDATED,
];

// Fetch audit logs
const fetchAuditLogs = async () => {
    loading.value = true;
    error.value = null;

    try {
        const params = {
            page: currentPage.value,
            limit: pageSize.value,
            orderBy: 'createdAt',
            order: 'desc' as const,
            organizationId: selectedOrganization.value || undefined,
            filters: {
                ...(dateFilter.value && {
                    createdAt: dateFilter.value,
                }),
                action: awsImageActions.join(','),
            },
        };

        const response = await auditLogService.getAll(params);

        timelineEvents.value = response.data;
        paginationMeta.value = response.meta;
    } catch (err) {
        error.value = err instanceof Error ? err.message : 'Failed to fetch audit logs';
        console.error('Error fetching audit logs:', err);
    } finally {
        loading.value = false;
    }
};

// Change page
const changePage = (page: number) => {
    currentPage.value = page;
    fetchAuditLogs();
};

// Get event icon
const getEventIcon = () => {
    return RefreshCw;
};

// Get event title
const getEventTitle = (event: AuditLog) => {
    const actionMap: Record<string, string> = {
        [AuditLogEnum.AWS_SERVICE_CREATED]: 'AWS Service Created',
        [AuditLogEnum.AWS_SERVICE_UPDATED]: 'AWS Service Updated',
        [AuditLogEnum.AWS_TASK_CREATED]: 'AWS Task Created',
        [AuditLogEnum.AWS_TASK_UPDATED]: 'AWS Task Updated',
        [AuditLogEnum.AWS_CLUSTER_CREATED]: 'AWS Cluster Created',
        [AuditLogEnum.AWS_CLUSTER_UPDATED]: 'AWS Cluster Updated',
    };

    return actionMap[event.action] || event.action;
};

// Format date
const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    }).format(new Date(date));
};

// Format image information
const formatImageInfo = (imageInfo: any) => {
    if (typeof imageInfo === 'string') return imageInfo;
    if (typeof imageInfo === 'object') {
        return JSON.stringify(imageInfo, null, 2);
    }
    return String(imageInfo);
};

// Initialize component
onMounted(() => {
    fetchAuditLogs();
});
</script>
