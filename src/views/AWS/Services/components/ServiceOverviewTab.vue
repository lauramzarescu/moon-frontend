<template>
    <!-- Combined Task Definition and Service Metrics -->
    <Card class="mb-6 overflow-hidden transition-all duration-200 hover:shadow-md" :inert="isDialogOpen">
        <div class="flex">
            <div class="w-1 h-full bg-gradient-to-b from-primary to-primary/60"></div>
            <div class="flex-1">
                <CardHeader class="py-4">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div class="p-2.5 rounded-lg bg-primary/10 transition-colors duration-200 hover:bg-primary/15">
                                <ServerIcon class="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle class="text-lg font-semibold">{{ props.row?.taskDefinition?.family ?? 'N/A' }} </CardTitle>
                                <CardDescription class="text-sm text-muted-foreground">Task Definition Configuration</CardDescription>
                            </div>
                        </div>
                        <Badge class="text-sm px-3 py-1.5 rounded-lg bg-primary/10 text-primary border-none font-medium">
                            Revision {{ props.row?.taskDefinition?.revision ?? 'N/A' }}
                        </Badge>
                    </div>
                </CardHeader>

                <CardContent class="pt-0">
                    <div class="grid grid-cols-2 gap-4 mb-6">
                        <!-- Status -->
                        <div
                            class="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg transition-all duration-200 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                        >
                            <div class="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                                <ActivityIcon class="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <div class="text-sm font-medium text-blue-700 dark:text-blue-300">Status</div>
                                <div class="text-base font-semibold text-blue-600 dark:text-blue-400">
                                    {{ props.row?.taskDefinition?.status ?? 'N/A' }}
                                </div>
                            </div>
                        </div>

                        <!-- Registration Time -->
                        <div
                            class="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg transition-all duration-200 hover:bg-purple-100 dark:hover:bg-purple-900/30"
                        >
                            <div class="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                                <CalendarIcon class="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <div class="text-sm font-medium text-purple-700 dark:text-purple-300">Registered</div>
                                <div class="text-sm font-semibold text-purple-600 dark:text-purple-400">
                                    {{
                                        props.row?.taskDefinition?.registeredAt
                                            ? new Date(props.row.taskDefinition.registeredAt).toLocaleString()
                                            : 'N/A'
                                    }}
                                </div>
                            </div>
                        </div>
                    </div>

                    <Separator class="my-4" />

                    <!-- Service Metrics -->
                    <div class="grid grid-cols-3 gap-4">
                        <!-- Desired Count -->
                        <CustomWidget title="Desired Count" :value="props.row?.desiredCount ?? 'N/A'" :icon="ServerIcon">
                            <template #icon> </template>
                        </CustomWidget>

                        <!-- Running Tasks -->
                        <CustomWidget title="Running tasks" :value="props.row?.runningCount ?? 'N/A'" :icon="ActivityIcon"></CustomWidget>

                        <!-- Pending Tasks -->
                        <CustomWidget title="Pending tasks" :value="props.row?.pendingCount ?? 'N/A'" :icon="Clock8Icon"></CustomWidget>
                    </div>
                </CardContent>
            </div>
        </div>
    </Card>

    <!-- Latest Deployment Status -->
    <Card class="overflow-hidden mb-6 transition-all duration-200 hover:shadow-md" v-if="latestDeployment">
        <div class="flex">
            <div
                class="w-1 h-full transition-all duration-300"
                :class="{
                    'bg-gradient-to-b from-green-500 to-green-400':
                        latestDeployment.status === 'PRIMARY' || latestDeployment.status === 'ACTIVE',
                    'bg-gradient-to-b from-red-500 to-red-400': latestDeployment.status === 'FAILED',
                    'bg-gradient-to-b from-yellow-500 to-yellow-400': latestDeployment.status === 'PENDING',
                }"
            ></div>

            <div class="flex-1">
                <CardHeader class="py-4">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div class="p-2.5 rounded-lg bg-primary/10 transition-colors duration-200 hover:bg-primary/15">
                                <RocketIcon class="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle class="text-lg font-semibold">Latest Deployment</CardTitle>
                                <CardDescription class="text-sm text-muted-foreground">
                                    Deployed {{ new Date(latestDeployment.createdAt).toLocaleString() }}
                                </CardDescription>
                            </div>
                        </div>
                        <Badge :variant="getStatusVariant(latestDeployment.status)" class="text-sm px-3 py-1.5 rounded-lg font-medium">
                            {{ latestDeployment.status }}
                        </Badge>
                    </div>
                </CardHeader>

                <CardContent class="py-2">
                    <div class="grid grid-cols-3 gap-4 mb-4">
                        <!-- Running Tasks -->
                        <CustomWidget title="Running Tasks" :value="latestDeployment.runningCount" :icon="ActivityIcon"></CustomWidget>

                        <CustomWidget title="Failed Tasks" :value="latestDeployment.failedTasks" :icon="XCircleIcon"></CustomWidget>

                        <!-- Rollout State -->
                        <CustomWidget title="Rollout State" :value="latestDeployment.rolloutState" :icon="InfoIcon"></CustomWidget>
                    </div>

                    <div v-if="latestDeployment.rolloutStateReason" class="mt-4 p-4 bg-muted/30 border border-border rounded-lg">
                        <h4 class="text-sm font-medium text-foreground mb-2">Deployment Details</h4>
                        <p class="text-sm text-muted-foreground">
                            {{ latestDeployment.rolloutStateReason }}
                        </p>
                    </div>
                </CardContent>
            </div>
        </div>
    </Card>

    <!-- Failed Tasks Section -->
    <Card class="overflow-hidden mb-4 border-none" v-if="hasFailed">
        <div class="flex">
            <div class="w-2 h-full bg-red-500"></div>
            <div class="flex-1">
                <CardHeader class="py-3">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <div class="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                                <AlertTriangleIcon class="w-4 h-4 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                                <CardTitle class="text-base">Failed Tasks</CardTitle>
                                <CardDescription class="text-xs"> {{ props.row?.failedTasks?.length }} tasks failed </CardDescription>
                            </div>
                        </div>
                        <Button variant="outline" size="sm" @click="expandedTasks = !expandedTasks">
                            {{ expandedTasks ? 'Collapse' : 'Expand' }}
                        </Button>
                    </div>
                </CardHeader>

                <CardContent v-if="expandedTasks">
                    <div
                        v-for="(task, index) in props.row?.failedTasks"
                        :key="index"
                        class="mb-6 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg"
                    >
                        <div class="flex justify-between items-start mb-2">
                            <div class="font-medium text-sm">Task ID: {{ getTaskId(task.taskArn) }}</div>
                            <Badge variant="destructive">Failed</Badge>
                        </div>

                        <div class="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <span class="text-gray-500 dark:text-gray-400">Created:</span>
                                {{ task.createdAt ? new Date(task.createdAt).toLocaleString() : 'N/A' }}
                            </div>
                            <div>
                                <span class="text-gray-500 dark:text-gray-400">Last Status:</span>
                                {{ task.lastStatus || 'N/A' }}
                            </div>
                            <div>
                                <span class="text-gray-500 dark:text-gray-400">Desired Status:</span>
                                {{ task.desiredStatus || 'N/A' }}
                            </div>
                            <div>
                                <span class="text-gray-500 dark:text-gray-400">Connectivity:</span>
                                {{ task.connectivity || 'N/A' }}
                            </div>
                        </div>

                        <div v-if="task.stoppedReason" class="mt-4">
                            <div class="font-medium text-sm text-red-700 dark:text-red-400 mb-2">Stopped Reason:</div>
                            <div class="p-3 bg-white dark:bg-gray-800 rounded-lg border border-red-200 dark:border-red-900/30 shadow-sm">
                                <div class="flex items-start gap-2">
                                    <AlertTriangleIcon class="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                                    <div class="text-sm">{{ task.stoppedReason }}</div>
                                </div>
                            </div>
                        </div>

                        <div class="mt-4">
                            <Separator class="my-2" />
                            <div class="font-medium text-sm mb-2">Additional Details</div>
                            <div class="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <span class="text-gray-500 dark:text-gray-400">Group:</span>
                                    {{ task.group || 'N/A' }}
                                </div>
                                <div>
                                    <span class="text-gray-500 dark:text-gray-400">Launch Type:</span>
                                    {{ task.launchType || 'N/A' }}
                                </div>
                                <div>
                                    <span class="text-gray-500 dark:text-gray-400">Platform Version:</span>
                                    {{ task.platformVersion || 'N/A' }}
                                </div>
                                <div>
                                    <span class="text-gray-500 dark:text-gray-400">Health Status:</span>
                                    <Badge :variant="task.healthStatus === 'HEALTHY' ? 'default' : 'destructive'" class="ml-1">
                                        {{ task.healthStatus || 'UNKNOWN' }}
                                    </Badge>
                                </div>
                                <div>
                                    <span class="text-gray-500 dark:text-gray-400">Stopped At:</span>
                                    {{ task.stoppedAt ? new Date(task.stoppedAt).toLocaleString() : 'N/A' }}
                                </div>
                                <div>
                                    <span class="text-gray-500 dark:text-gray-400">Started At:</span>
                                    {{ task.startedAt ? new Date(task.startedAt).toLocaleString() : 'N/A' }}
                                </div>
                            </div>

                            <div v-if="task.attributes && task.attributes.length > 0" class="mt-3">
                                <div class="font-medium text-sm mb-2">Task Attributes</div>
                                <div class="grid grid-cols-2 gap-2">
                                    <div
                                        v-for="(attr, attrIndex) in task.attributes"
                                        :key="attrIndex"
                                        class="p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700"
                                    >
                                        <div class="text-xs text-gray-500 dark:text-gray-400">{{ attr.name }}</div>
                                        <div class="text-sm font-medium">{{ attr.value }}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </div>
        </div>
    </Card>
</template>

<script setup lang="ts" generic="TData extends ServiceInterface">
import { ActivityIcon, AlertTriangleIcon, CalendarIcon, Clock8Icon, InfoIcon, RocketIcon, ServerIcon, XCircleIcon } from 'lucide-vue-next';
import type { ServiceInterface } from '@/views/AWS/Services/types/service.interface.ts';
import { Badge } from '@/components/ui/badge';
import { computed, ref } from 'vue';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import CustomWidget from '@/components/ui/custom-widget/CustomWidget.vue';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const props = defineProps<{
    row: TData;
    isOpen?: boolean;
}>();

const isDialogOpen = ref(false);
const expandedTasks = ref(true);

const handleDialogToggle = (isOpen: boolean) => {
    isDialogOpen.value = isOpen;
};

const latestDeployment = computed(() => {
    return props.row?.deployments?.[0] ?? null;
});

const hasFailed = computed(() => {
    return props.row?.failedTasks && props.row.failedTasks.length > 0;
});

const emit = defineEmits<{
    (e: 'refresh-service'): void;
}>();

const getStatusVariant = (status: string) => {
    const variants = {
        PRIMARY: 'success',
        ACTIVE: 'success',
        FAILED: 'destructive',
        PENDING: 'warning',
    };
    return variants[status as keyof typeof variants] ?? 'default';
};

const getTaskId = (taskArn: string | undefined) => {
    if (!taskArn) return 'Unknown';
    const parts = taskArn.split('/');
    return parts[parts.length - 1];
};

const handleCountUpdated = () => {
    // Emit an event to refresh the service data
    emit('refresh-service');
};
</script>
