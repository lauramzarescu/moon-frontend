<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { parseDate } from '@internationalized/date';
import { useAuditLogs } from '@/views/Settings/components/AuditLogs/composables/useAuditLogs';
import { useDeploymentWidgets } from '@/views/AWS/composables/useDeploymentWidgets';
import type { AuditLog } from '@/views/Settings/components/AuditLogs/schema';
import { Activity, SlidersHorizontal, TrendingUp } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import Chart from 'primevue/chart';
import Calendar from '@/components/ui/calendar/Calendar.vue';
import DeploymentCard from '@/components/ui/deployments/DeploymentCard.vue';
import moment from 'moment';

const { auditLogs, loading, error, filters, paginationMeta, pagination, fetchAuditLogs } = useAuditLogs();
const {
    deploymentsCount,
    deploymentsCountLoading,
    deploymentsDelta,
    deploymentsPreviousCount,
    deploymentsTimelineLoading,
    chartData,
    chartOptions,
    hasChartData,
    hasSingleDataPoint,
    fetchAllWidgetData,
} = useDeploymentWidgets();

filters.action = 'aws:service:updated';
pagination.limit = 1000;

const isLoadingMore = ref(false);
const hasMoreData = ref(true);

const formatDate = (dateInput: Date | string | moment.Moment) => {
    const date = moment(dateInput);
    if (!date.isValid()) return 'Invalid Date';
    return date.format('ddd, MMM D, YYYY');
};

const formatDateLong = (dateInput: Date | string | moment.Moment) => {
    const date = moment(dateInput);
    if (!date.isValid()) return 'Invalid Date';
    return date.format('MMM D, YYYY');
};

const toYMD = (dateInput: Date | string | moment.Moment): string => {
    const date = moment(dateInput);
    if (!date.isValid()) return '';
    return date.format('YYYY-MM-DD');
};

// Date range state and management
const trendDays = ref<number>(14);
const trendStartStr = ref<string>('');
const trendEndStr = ref<string>('');
const trendPopoverOpen = ref(false);

const trendOptions = [
    { value: 1, label: 'Last day' },
    { value: 7, label: 'Last 7 days' },
    { value: 14, label: 'Last 14 days' },
    { value: 30, label: 'Last 30 days' },
    { value: 60, label: 'Last 60 days' },
];

// Computed properties for date handling using Moment.js
const trendStartDate = computed(() => (trendStartStr.value ? moment(trendStartStr.value) : undefined));
const trendEndDate = computed(() => (trendEndStr.value ? moment(trendEndStr.value) : undefined));
const trendStartValue = computed(() => (trendStartStr.value ? parseDate(trendStartStr.value) : undefined));
const trendEndValue = computed(() => (trendEndStr.value ? parseDate(trendEndStr.value) : undefined));
const isCustomRangeActive = computed(() => Boolean(trendStartDate.value && trendEndDate.value));
const isPresetActive = (value: number) => !isCustomRangeActive.value && trendDays.value === value;

// Filter management and API calls
const updateFilters = (startISO: string, endISO: string) => {
    filters.startDate = startISO;
    filters.endDate = endISO;
    hasMoreData.value = true;
    isLoadingMore.value = false;
    fetchAuditLogs(1);
    // Fetch widget data with new date range
    fetchAllWidgetData(startISO, endISO);
};

const clearFilters = () => {
    trendStartStr.value = '';
    trendEndStr.value = '';
    updateFilters('', '');
    // Fetch widget data without date filters
    fetchAllWidgetData();
};

// Calendar event handlers
const onCalendarChange = (val: unknown | undefined, isStart: boolean) => {
    if (val && typeof val === 'object' && 'toString' in val) {
        const d = moment(String(val));
        if (d.isValid()) {
            const dateStr = toYMD(d);
            if (isStart) {
                trendStartStr.value = dateStr;
                // Keep end >= start
                if (trendEndDate.value && d.isAfter(trendEndDate.value)) {
                    trendEndStr.value = dateStr;
                }
            } else {
                trendEndStr.value = dateStr;
                // Keep end >= start
                if (trendStartDate.value && d.isBefore(trendStartDate.value)) {
                    trendStartStr.value = dateStr;
                }
            }
        }
    }
};

// Preset and range application
const applyPreset = (days: number) => {
    trendDays.value = days;
    const end = moment();
    const start = moment().subtract(days - 1, 'days');
    trendStartStr.value = '';
    trendEndStr.value = '';
    updateFilters(toYMD(start), toYMD(end));
};

const applyCustomRange = () => {
    if (!trendStartDate.value || !trendEndDate.value) return;
    const start = trendStartDate.value.isSameOrBefore(trendEndDate.value) ? trendStartDate.value : trendEndDate.value;
    const end = trendEndDate.value.isSameOrAfter(trendStartDate.value) ? trendEndDate.value : trendStartDate.value;
    const days = Math.max(1, end.diff(start, 'days') + 1);
    trendDays.value = Math.min(60, Math.max(1, days));
    updateFilters(toYMD(start), toYMD(end));
    trendPopoverOpen.value = false;
};

// UI labels and display
const timeSelectorLabel = computed(() => {
    if (trendStartDate.value && trendEndDate.value) {
        return `Custom: ${formatDateLong(trendStartDate.value)} – ${formatDateLong(trendEndDate.value)}`;
    }
    return trendOptions.find((o) => o.value === trendDays.value)?.label ?? 'Select range';
});

// Initialize with 14-day default range on component mount
onMounted(() => {
    // Set default 14-day range
    trendDays.value = 14;
    const end = moment();
    const start = moment().subtract(13, 'days'); // 13 days ago + today = 14 days total

    // Set the date strings for UI display
    trendStartStr.value = '';
    trendEndStr.value = '';

    // Apply the 14-day filter and fetch data
    const startISO = toYMD(start);
    const endISO = toYMD(end);
    updateFilters(startISO, endISO);
});

const groupedByDay = computed(() => {
    const groups = new Map<string, AuditLog[]>();

    for (const item of auditLogs.value) {
        const d = moment(item.createdAt);
        const key = toYMD(d);
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(item);
    }

    // Sort items within each day by newest first
    for (const [, list] of groups) {
        list.sort((a, b) => moment(b.createdAt).valueOf() - moment(a.createdAt).valueOf());
    }

    // Sort days by newest first
    return Array.from(groups.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));
});

const labelForDay = (key: string) => {
    const today = moment().startOf('day');
    const target = moment(key);
    const diffDays = today.diff(target, 'days');
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return formatDate(target);
};

// Load more data for infinite scroll
const loadMoreData = async () => {
    if (isLoadingMore.value || !hasMoreData.value || !paginationMeta.value) return;
    const nextPage = paginationMeta.value.page + 1;
    if (nextPage > paginationMeta.value.totalPages) {
        hasMoreData.value = false;
        return;
    }
    isLoadingMore.value = true;
    try {
        const currentLogs = [...auditLogs.value];
        await fetchAuditLogs(nextPage);
        auditLogs.value = [...currentLogs, ...auditLogs.value];
        if (paginationMeta.value && paginationMeta.value.page >= paginationMeta.value.totalPages) {
            hasMoreData.value = false;
        }
    } catch (err) {
        console.error('Failed to load more data:', err);
    } finally {
        isLoadingMore.value = false;
    }
};

// Stacked day headers on scroll
const stackedLabels = ref<string[]>([]);
const updateStackedLabels = () => {
    const headings = Array.from(document.querySelectorAll('[data-timeline-day]')) as HTMLElement[];
    const labels: string[] = [];
    for (const h of headings) {
        const rect = h.getBoundingClientRect();
        if (rect.top <= 0) {
            const lbl = h.dataset.dayLabel || h.textContent?.trim() || '';
            if (lbl) labels.push(lbl);
        }
    }
    // keep the most recent few
    stackedLabels.value = labels.slice(-3);
};

// Handle scroll events for infinite loading and stacked labels
const handleScroll = () => {
    const scrollTop = window.scrollY;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = window.innerHeight;
    if (scrollHeight - scrollTop - clientHeight < 200 && hasMoreData.value && !isLoadingMore.value) {
        loadMoreData();
    }
    updateStackedLabels();
};

onMounted(() => {
    fetchAuditLogs(1);
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', updateStackedLabels);
    // initial compute after first paint
    requestAnimationFrame(() => updateStackedLabels());
});

onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll);
    window.removeEventListener('resize', updateStackedLabels);
});

watch(auditLogs, () => {
    requestAnimationFrame(() => updateStackedLabels());
});
</script>

<template>
    <div class="p-6">
        <header class="mb-6 flex items-center justify-between gap-3 max-w-5xl">
            <div>
                <h1 class="text-2xl font-semibold">Activity Feed</h1>
                <p class="text-sm text-muted-foreground mt-1">Recent deployments grouped by day</p>
            </div>
            <!-- Global time selector -->
            <div class="shrink-0">
                <Popover v-model:open="trendPopoverOpen">
                    <PopoverTrigger as-child>
                        <Button
                            variant="outline-default"
                            class="h-9 px-3 text-xs whitespace-nowrap"
                            :class="trendPopoverOpen ? 'bg-accent/40' : ''"
                        >
                            {{ timeSelectorLabel }}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent class="p-3 w-[620px]" align="end" side="bottom">
                        <div class="flex flex-wrap gap-2 mb-3">
                            <button
                                v-for="opt in trendOptions"
                                :key="opt.value"
                                :aria-pressed="isPresetActive(opt.value) ? 'true' : 'false'"
                                :class="[
                                    'px-2 py-1 text-xs rounded border transition-colors',
                                    isPresetActive(opt.value)
                                        ? 'bg-accent/50 border-accent text-foreground ring-1 ring-ring/10 shadow-sm'
                                        : 'hover:bg-accent/40',
                                ]"
                                @click="applyPreset(opt.value)"
                            >
                                {{ opt.label }}
                            </button>
                        </div>
                        <!-- calendars -->
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <div class="text-xs text-muted-foreground mb-1">Start</div>
                                <Calendar
                                    :model-value="trendStartValue"
                                    :range-start="trendStartStr || undefined"
                                    :range-end="trendEndStr || undefined"
                                    @update:model-value="(val) => onCalendarChange(val, true)"
                                    class="rounded-md border"
                                />
                            </div>
                            <div>
                                <div class="text-xs text-muted-foreground mb-1">End</div>
                                <Calendar
                                    :model-value="trendEndValue"
                                    :range-start="trendStartStr || undefined"
                                    :range-end="trendEndStr || undefined"
                                    @update:model-value="(val) => onCalendarChange(val, false)"
                                    class="rounded-md border"
                                />
                            </div>
                        </div>
                        <div class="flex justify-between items-center mt-3 text-xs text-muted-foreground">
                            <span>
                                {{ trendStartDate ? formatDateLong(trendStartDate) : 'Start' }} →
                                {{ trendEndDate ? formatDateLong(trendEndDate) : 'End' }}
                            </span>
                            <div class="flex items-center gap-2">
                                <button
                                    class="px-2 py-1 rounded border text-xs"
                                    :class="isCustomRangeActive ? 'bg-accent/50 border-accent text-foreground' : 'hover:bg-accent'"
                                    @click="applyCustomRange"
                                >
                                    Apply Range
                                </button>
                                <button class="px-2 py-1 rounded border text-xs hover:bg-accent" @click="clearFilters">Clear</button>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
        </header>

        <!-- Top widgets -->
        <div class="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch max-w-5xl">
            <!-- Current window with delta -->
            <div class="rounded-lg border bg-card p-4">
                <div class="flex items-center gap-2 mb-3">
                    <div class="p-2 rounded-md bg-teal-500/10 border border-teal-500/20">
                        <TrendingUp class="h-4 w-4 text-teal-400" />
                    </div>
                    <span class="text-xs text-muted-foreground">Deployments</span>
                </div>
                <div v-if="deploymentsCountLoading" class="flex items-center justify-center mt-2 h-20">
                    <div class="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
                </div>
                <div v-else class="space-y-3">
                    <!-- Current count with delta -->
                    <div class="flex items-baseline gap-2">
                        <div class="text-3xl font-semibold text-foreground">{{ deploymentsCount }}</div>
                        <div
                            :class="[
                                'text-xs font-medium px-1.5 py-0.5 rounded-full',
                                deploymentsDelta >= 0 ? 'text-emerald-600' : 'text-red-600',
                            ]"
                        >
                            {{ deploymentsDelta > 0 ? '+' : '' }}{{ deploymentsDelta || 0 }}%
                        </div>
                    </div>

                    <!-- Previous period comparison -->
                    <div class="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Previous period:</span>
                        <span class="font-medium">{{ deploymentsPreviousCount }}</span>
                    </div>

                    <!-- Change indicator -->
                    <div class="flex items-center justify-between text-xs">
                        <span class="text-muted-foreground">Change:</span>
                        <div class="flex items-center gap-1">
                            <span :class="['font-medium', deploymentsDelta >= 0 ? 'text-emerald-600' : 'text-red-600']">
                                {{ deploymentsDelta > 0 ? '+' : '' }}{{ Math.abs(deploymentsCount - deploymentsPreviousCount) }}
                            </span>
                            <span class="text-muted-foreground">deployments</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Trend sparkline (last N days) -->
            <div class="rounded-lg border bg-card p-4">
                <div class="flex items-center gap-2">
                    <div class="p-2 rounded-md bg-amber-500/10 border border-amber-500/20">
                        <SlidersHorizontal class="h-4 w-4 text-amber-400" />
                    </div>
                    <span class="text-xs text-muted-foreground">Trend</span>
                </div>
                <div v-if="deploymentsTimelineLoading" class="flex items-center justify-center mt-3 h-24">
                    <div class="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
                </div>
                <div v-else-if="!hasChartData" class="flex items-center justify-center mt-3 h-24">
                    <div class="text-center text-muted-foreground">
                        <div class="text-sm">No deployment data available</div>
                        <div class="text-xs mt-1">Try adjusting your date range</div>
                    </div>
                </div>
                <div v-else class="mt-3 h-24">
                    <Chart type="line" :data="chartData" :options="chartOptions" style="width: 100%; height: 100%" />
                </div>
            </div>
        </div>

        <div v-if="loading" class="flex justify-center items-center h-[200px]">
            <div class="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
        </div>

        <div v-else-if="error" class="flex items-center justify-center h-[200px] text-destructive">
            <Activity class="h-5 w-5 mr-2" />
            {{ error }}
        </div>

        <!-- Activity by day (left-aligned) -->
        <div v-else class="max-w-5xl relative">
            <!-- Stacked sticky labels (animated) -->
            <div class="pointer-events-none sticky top-[56px] z-20 flex flex-col gap-1">
                <transition-group name="stack-fade" tag="div">
                    <div
                        v-for="(lbl, idx) in stackedLabels"
                        :key="lbl + idx"
                        class="text-[12px] font-semibold text-foreground bg-accent/50 backdrop-blur supports-[backdrop-filter]:bg-accent/40 px-2 py-0.5 rounded border border-accent w-fit shadow-sm"
                        :style="{ transform: `translateY(${idx * -2}px)` }"
                    >
                        {{ lbl }}
                    </div>
                </transition-group>
            </div>
            <div v-for="[dayKey, items] in groupedByDay" :key="dayKey" class="mb-8">
                <div
                    class="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-2 mb-3"
                    :data-timeline-day="dayKey"
                    :data-day-label="labelForDay(dayKey)"
                >
                    <h3 class="text-base font-semibold text-muted-foreground bg-accent/40 inline-block px-2 py-0.5 rounded">
                        {{ labelForDay(dayKey) }}
                    </h3>
                </div>

                <div class="space-y-4">
                    <DeploymentCard v-for="deployment in items" :key="deployment.id" :deployment="deployment" />
                </div>
            </div>

            <!-- Loading more indicator -->
            <div v-if="isLoadingMore" class="flex justify-center items-center py-8">
                <div class="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
                <span class="ml-2 text-sm text-muted-foreground">Loading more deployments...</span>
            </div>

            <!-- End of data indicator -->
            <div v-else-if="!hasMoreData && auditLogs.length > 0" class="text-center py-8">
                <div class="text-sm text-muted-foreground">You've reached the end of the deployment history</div>
            </div>

            <!-- Empty state -->
            <div v-if="auditLogs.length === 0" class="text-center py-16">
                <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                    <Activity class="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 class="text-lg font-medium">No deployments found</h3>
                <p class="text-sm text-muted-foreground mt-1">No deployment history is available at this time.</p>
            </div>
        </div>
    </div>
</template>

<style scoped>
.stack-fade-enter-active,
.stack-fade-leave-active {
    transition: all 200ms ease;
}
.stack-fade-enter-from,
.stack-fade-leave-to {
    opacity: 0;
    transform: translateY(-4px);
}
</style>
