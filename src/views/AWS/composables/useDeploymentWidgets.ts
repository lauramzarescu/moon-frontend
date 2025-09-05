import { computed, ref } from 'vue';
import moment from 'moment';
import { AuditLogService } from '@/services/audit-log.service';
import { withDelay } from '@/utils.ts';

export function useDeploymentWidgets() {
    const auditLogService = new AuditLogService();

    // State for deployments count widget
    const deploymentsCount = ref<number>(0);
    const deploymentsCountLoading = ref(false);
    const deploymentsCountError = ref<string | null>(null);
    const deploymentsDelta = ref<number>(0);
    const deploymentsPreviousCount = ref<number>(0);

    // State for deployments timeline widget
    const deploymentsTimeline = ref<{ data: number[]; labels?: string[] }>({ data: [] });
    const deploymentsTimelineLoading = ref(false);
    const deploymentsTimelineError = ref<string | null>(null);

    // Computed property to check if chart has data
    const hasChartData = computed(() => {
        return deploymentsTimeline.value.data && deploymentsTimeline.value.data.length > 0;
    });

    // Computed property to check if chart has single data point
    const hasSingleDataPoint = computed(() => {
        return deploymentsTimeline.value.data && deploymentsTimeline.value.data.length === 1;
    });

    const chartData = computed(() => {
        const data = deploymentsTimeline.value.data || [];
        const labels = deploymentsTimeline.value.labels || Array.from({ length: data.length }, (_, i) => i + 1);

        return {
            labels,
            datasets: [
                {
                    data,
                    borderColor: 'hsl(221.2 83.2% 53.3%)',
                    backgroundColor: 'hsl(221.2 83.2% 53.3% / 0.15)',
                    fill: true,
                    tension: hasSingleDataPoint.value ? 0 : 0.35,
                    borderWidth: 2,
                    pointRadius: hasSingleDataPoint.value ? 4 : 0,
                    pointHoverRadius: hasSingleDataPoint.value ? 6 : 4,
                    pointBackgroundColor: 'hsl(221.2 83.2% 53.3%)',
                    pointBorderColor: 'hsl(221.2 83.2% 53.3%)',
                    pointBorderWidth: 2,
                },
            ],
        };
    });

    const chartOptions = computed(() => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                enabled: true,
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: 'white',
                bodyColor: 'white',
                borderColor: 'hsl(221.2 83.2% 53.3%)',
                borderWidth: 1,
                cornerRadius: 6,
                displayColors: false,
                callbacks: {
                    title: function (context: any) {
                        const dataIndex = context[0]?.dataIndex;
                        const labels = deploymentsTimeline.value.labels;

                        if (labels && labels[dataIndex]) {
                            // If we have proper date labels, format them nicely
                            const date = moment(labels[dataIndex]);
                            if (date.isValid()) {
                                return date.format('MMM D, YYYY');
                            }
                            return labels[dataIndex];
                        }

                        // Fallback to generic label
                        return `Data Point ${dataIndex + 1}`;
                    },
                    label: function (context: any) {
                        const value = context.parsed.y;
                        const deploymentText = value === 1 ? 'deployment' : 'deployments';
                        return `${value} ${deploymentText}`;
                    },
                },
            },
        },
        scales: { x: { display: false }, y: { display: false } },
        elements: {
            line: { borderJoinStyle: 'round', capBezierPoints: true },
            point: { radius: hasSingleDataPoint.value ? 4 : 0 },
        },
        interaction: {
            intersect: false,
            mode: 'index',
        },
    }));

    const fetchDeploymentsCount = async (startDate?: string, endDate?: string) => {
        deploymentsCountLoading.value = true;
        deploymentsCountError.value = null;

        try {
            const params: { filter_startDate?: string; filter_endDate?: string; tz?: string } = {};
            if (startDate) params.filter_startDate = startDate;
            if (endDate) params.filter_endDate = endDate;

            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
            if (tz) params.tz = tz;

            const response = await auditLogService.getDeploymentsCount(params);

            // Validate and sanitize response values
            const count = !isNaN(response.count) ? response.count : 0;
            const delta = !isNaN(response.delta) ? response.delta : 0;
            const previousCount = !isNaN(response.previousCount) ? response.previousCount : 0;

            deploymentsCount.value = count;
            deploymentsDelta.value = delta;
            deploymentsPreviousCount.value = previousCount;
        } catch (error) {
            deploymentsCountError.value = error instanceof Error ? error.message : 'Failed to fetch deployments count';
            deploymentsCount.value = 0;
            deploymentsDelta.value = 0;
            deploymentsPreviousCount.value = 0;
        } finally {
            deploymentsCountLoading.value = false;
        }
    };

    const fetchDeploymentsTimeline = async (startDate?: string, endDate?: string) => {
        deploymentsTimelineLoading.value = true;
        deploymentsTimelineError.value = null;

        try {
            const params: { filter_startDate?: string; filter_endDate?: string; tz?: string } = {};
            if (startDate) params.filter_startDate = startDate;
            if (endDate) params.filter_endDate = endDate;

            params.tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

            deploymentsTimeline.value = await auditLogService.getDeploymentsTimeline(params);
        } catch (error) {
            deploymentsTimelineError.value = error instanceof Error ? error.message : 'Failed to fetch deployments timeline';
            deploymentsTimeline.value = { data: [] };
        } finally {
            deploymentsTimelineLoading.value = false;
        }
    };

    const fetchAllWidgetData = async (startDate?: string, endDate?: string) => {
        await withDelay(async () => {
            await Promise.allSettled([
                fetchDeploymentsCount(startDate, endDate),
                fetchDeploymentsTimeline(startDate, endDate),
            ]);
        });
    };

    return {
        // State
        deploymentsCount,
        deploymentsCountLoading,
        deploymentsCountError,
        deploymentsTimeline,
        deploymentsTimelineLoading,
        deploymentsTimelineError,
        deploymentsDelta,
        deploymentsPreviousCount,

        // Computed
        chartData,
        chartOptions,
        hasChartData,
        hasSingleDataPoint,

        // Methods
        fetchDeploymentsCount,
        fetchDeploymentsTimeline,
        fetchAllWidgetData,
    };
}
