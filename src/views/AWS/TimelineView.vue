<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import type { DateValue } from '@internationalized/date';
import { parseDate } from '@internationalized/date';
import { useAuditLogs } from '@/views/Settings/components/AuditLogs/composables/useAuditLogs';
import type { AuditLog } from '@/views/Settings/components/AuditLogs/schema';
import { Activity, SlidersHorizontal, TrendingUp } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import Chart from 'primevue/chart';
import Calendar from '@/components/ui/calendar/Calendar.vue';
import DeploymentCard from '@/components/ui/deployments/DeploymentCard.vue';

const { auditLogs, loading, error, filters, paginationMeta, pagination, fetchAuditLogs } = useAuditLogs();

filters.action = 'aws:service:updated';
pagination.limit = 1000;

// Infinite scroll state
const isLoadingMore = ref(false);
const hasMoreData = ref(true);

const formatDate = (dateInput: Date | string) => {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

const formatDateLong = (date: Date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

// Widgets: volume & trends
const last24hCount = computed(() => {
    const since = Date.now() - 24 * 60 * 60 * 1000;
    return auditLogs.value.filter((d) => new Date(d.createdAt).getTime() >= since).length;
});
const lastNDaysCount = computed(() => {
    const since = Date.now() - trendDays.value * 24 * 60 * 60 * 1000;
    return auditLogs.value.filter((d) => new Date(d.createdAt).getTime() >= since).length;
});
const prevNDaysCountForTile = computed(() => {
    const startPrev = Date.now() - 2 * trendDays.value * 24 * 60 * 60 * 1000;
    const endPrev = Date.now() - trendDays.value * 24 * 60 * 60 * 1000;
    return auditLogs.value.filter((d) => {
        const ts = new Date(d.createdAt).getTime();
        return ts >= startPrev && ts < endPrev;
    }).length;
});
const nDayDeltaPctTile = computed(() => {
    const prev = prevNDaysCountForTile.value;
    if (prev === 0) return 100;
    return Math.round(((lastNDaysCount.value - prev) / prev) * 100);
});

// Trend sparkline (last N days)
const trendDays = ref<number>(14);
const trendOptions = [
    { value: 1, label: 'Last day' },
    { value: 7, label: 'Last 7 days' },
    { value: 14, label: 'Last 14 days' },
    { value: 30, label: 'Last 30 days' },
    { value: 60, label: 'Last 60 days' },
];
const trendPopoverOpen = ref(false);
const dailyCounts = computed(() => {
    const days = trendDays.value;
    const arr: number[] = [];
    const end = trendEndDate.value ?? new Date();
    for (let i = days - 1; i >= 0; i--) {
        const dayStart = new Date(end.getFullYear(), end.getMonth(), end.getDate() - i).getTime();
        const dayEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate() - i + 1).getTime();
        const count = auditLogs.value.filter((d) => {
            const ts = new Date(d.createdAt).getTime();
            return ts >= dayStart && ts < dayEnd;
        }).length;
        arr.push(count);
    }
    return arr;
});
const trendLabels = computed(() => Array.from({ length: dailyCounts.value.length }, (_, i) => i + 1));
const chartData = computed(() => ({
    labels: trendLabels.value,
    datasets: [
        {
            data: dailyCounts.value,
            borderColor: 'hsl(221.2 83.2% 53.3%)',
            backgroundColor: 'hsl(221.2 83.2% 53.3% / 0.15)',
            fill: true,
            tension: 0.35,
            borderWidth: 2,
            pointRadius: 0,
        },
    ],
}));
const chartOptions = computed(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: true } },
    scales: { x: { display: false }, y: { display: false } },
    elements: { line: { borderJoinStyle: 'round', capBezierPoints: true }, point: { radius: 0 } },
}));

// Calendar-backed trend range
const trendStartStr = ref<string>('');
const trendEndStr = ref<string>('');
const trendStartDate = computed<Date | undefined>(() => (trendStartStr.value ? new Date(trendStartStr.value) : undefined));
const trendEndDate = computed<Date | undefined>(() => (trendEndStr.value ? new Date(trendEndStr.value) : undefined));
// Calendar DateValue bindings for highlighting selected dates
const trendStartValue = computed<DateValue | undefined>(() => (trendStartStr.value ? parseDate(trendStartStr.value) : undefined));
const trendEndValue = computed<DateValue | undefined>(() => (trendEndStr.value ? parseDate(trendEndStr.value) : undefined));
const isCustomRangeActive = computed<boolean>(() => Boolean(trendStartDate.value && trendEndDate.value));
const isPresetActive = (value: number) => !isCustomRangeActive.value && trendDays.value === value;
const onCalendarStartChange = (val: unknown | undefined) => {
    if (val && typeof val === 'object' && 'toString' in val) {
        const d = new Date(String(val));
        if (!isNaN(d.getTime())) trendStartStr.value = d.toISOString().slice(0, 10);
        // Keep end >= start
        if (trendEndDate.value && d.getTime() > trendEndDate.value.getTime()) {
            trendEndStr.value = trendStartStr.value;
        }
    }
};
const onCalendarEndChange = (val: unknown | undefined) => {
    if (val && typeof val === 'object' && 'toString' in val) {
        const d = new Date(String(val));
        if (!isNaN(d.getTime())) trendEndStr.value = d.toISOString().slice(0, 10);
        // Keep end >= start
        if (trendStartDate.value && d.getTime() < trendStartDate.value.getTime()) {
            trendStartStr.value = trendEndStr.value;
            // trigger start calendar to reflect new start
            onCalendarStartChange(val);
        }
    }
};
const applyTrendRange = () => {
    if (!trendStartDate.value || !trendEndDate.value) return;
    const start = trendStartDate.value <= trendEndDate.value ? trendStartDate.value : trendEndDate.value;
    const end = trendEndDate.value >= trendStartDate.value ? trendEndDate.value : trendStartDate.value;
    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (24 * 3600000)) + 1);
    trendDays.value = Math.min(60, Math.max(1, days));
    trendPopoverOpen.value = false;
};

const timeSelectorLabel = computed(() => {
    if (trendStartDate.value && trendEndDate.value) {
        return `Custom: ${formatDateLong(trendStartDate.value)} – ${formatDateLong(trendEndDate.value)}`;
    }
    return trendOptions.find((o) => o.value === trendDays.value)?.label ?? 'Select range';
});

// Group by local day (YYYY-MM-DD)
const groupedByDay = computed(() => {
    const toKey = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    };

    const groups = new Map<string, AuditLog[]>();
    for (const item of auditLogs.value) {
        const d = new Date(item.createdAt);
        const key = toKey(d);
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(item);
    }
    for (const [, list] of groups) {
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return Array.from(groups.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));
});

const labelForDay = (key: string) => {
    const today = new Date();
    const target = new Date(key + 'T00:00:00');
    const msPerDay = 24 * 60 * 60 * 1000;
    const diffDays = Math.floor((new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime() - target.getTime()) / msPerDay);
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
    // Recompute when data changes
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
                                @click="
                                    trendDays = opt.value;
                                    trendStartStr = '';
                                    trendEndStr = '';
                                "
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
                                    @update:model-value="onCalendarStartChange"
                                    class="rounded-md border"
                                />
                            </div>
                            <div>
                                <div class="text-xs text-muted-foreground mb-1">End</div>
                                <Calendar
                                    :model-value="trendEndValue"
                                    @update:model-value="onCalendarEndChange"
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
                                    @click="applyTrendRange"
                                >
                                    Apply Range
                                </button>
                                <button
                                    class="px-2 py-1 rounded border text-xs hover:bg-accent"
                                    @click="
                                        trendStartStr = '';
                                        trendEndStr = '';
                                    "
                                >
                                    Clear
                                </button>
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
                <div class="flex items-center gap-2">
                    <div class="p-2 rounded-md bg-teal-500/10 border border-teal-500/20">
                        <TrendingUp class="h-4 w-4 text-teal-400" />
                    </div>
                    <span class="text-xs text-muted-foreground">Deployments</span>
                </div>
                <div class="flex items-baseline gap-2 mt-2">
                    <div class="text-3xl font-semibold text-foreground">{{ lastNDaysCount }}</div>
                    <div :class="['text-xs font-medium', nDayDeltaPctTile >= 0 ? 'text-emerald-500' : 'text-red-500']">
                        {{ nDayDeltaPctTile >= 0 ? '+' : '' }}{{ nDayDeltaPctTile }}%
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
                <div class="mt-3 h-24">
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
                    <h3 class="text-base font-semibold text-muted-foreground bg-accent/40 inline-block px-2 py-0.5 rounded">{{ labelForDay(dayKey) }}</h3>
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
