<template>
    <!-- Combined Task Definition and Service Metrics -->
    <Card class="mb-4 overflow-hidden border-none" :inert="isDialogOpen">
        <div class="flex">
            <div class="w-2 h-full bg-primary"></div>
            <div class="flex-1">
                <CardHeader class="py-3">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <div class="p-2 rounded-lg bg-primary/10">
                                <ServerIcon class="w-4 h-4 text-primary" />
                            </div>
                            <div>
                                <CardTitle class="text-base">{{ props.row?.taskDefinition?.family ?? 'N/A' }} </CardTitle>
                                <CardDescription class="text-xs">Task Definition Configuration</CardDescription>
                            </div>
                        </div>
                        <Badge class="text-xs px-2 py-1 rounded-md bg-primary/10 text-primary border-none">
                            Revision {{ props.row?.taskDefinition?.revision ?? 'N/A' }}
                        </Badge>
                    </div>
                </CardHeader>

                <CardContent>
                    <div class="grid grid-cols-2 gap-3 mb-4">
                        <!-- Status -->
                        <div class="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <div class="p-1.5 bg-blue-100 dark:bg-blue-900 rounded-md">
                                <ActivityIcon class="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <div class="text-xs text-blue-700 dark:text-blue-300">Status</div>
                                <div class="text-sm font-semibold text-blue-600 dark:text-blue-400">
                                    {{ props.row?.taskDefinition?.status ?? 'N/A' }}
                                </div>
                            </div>
                        </div>

                        <!-- Registration Time -->
                        <div class="flex items-center gap-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                            <div class="p-1.5 bg-purple-100 dark:bg-purple-900 rounded-md">
                                <CalendarIcon class="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <div class="text-xs text-purple-700 dark:text-purple-300">Registered</div>
                                <div class="text-xs font-semibold text-purple-600 dark:text-purple-400">
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
                            <template #icon>
                                <div class="flex items-center gap-2">
                                    <UpdateDesiredCountDialog
                                        inert
                                        autofocus
                                        :current-count="props.row?.desiredCount"
                                        :service-arn="props.row?.taskDefinition.arn"
                                        :cluster-name="props.row?.clusterName"
                                        :service-name="props.row?.name"
                                        @count-updated="handleCountUpdated"
                                        @dialog-close="handleDialogToggle(false)"
                                        @dialog-open="handleDialogToggle(true)"
                                    />
                                </div>
                            </template>
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
    <Card class="overflow-hidden mb-4 border-none" v-if="latestDeployment">
        <div class="flex">
            <div
                class="w-2 h-full"
                :class="{
                    'bg-green-500': latestDeployment.status === 'PRIMARY' || latestDeployment.status === 'ACTIVE',
                    'bg-red-500': latestDeployment.status === 'FAILED',
                    'bg-yellow-500': latestDeployment.status === 'PENDING',
                }"
            ></div>

            <div class="flex-1">
                <CardHeader class="py-3">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <div class="p-2 rounded-lg bg-primary/10">
                                <RocketIcon class="w-4 h-4 text-primary" />
                            </div>
                            <div>
                                <CardTitle class="text-base">Latest Deployment</CardTitle>
                                <CardDescription class="text-xs">
                                    Deployed {{ new Date(latestDeployment.createdAt).toLocaleString() }}
                                </CardDescription>
                            </div>
                        </div>
                        <Badge
                            :variant="getStatusVariant(latestDeployment.status)"
                            class="text-xs px-2 py-1 rounded-md bg-primary/10 text-primary border-none"
                        >
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

                    <Alert v-if="latestDeployment.rolloutStateReason" class="mt-2">
                        <AlertTitle class="text-sm font-medium">Deployment Details</AlertTitle>
                        <AlertDescription class="text-sm mt-1">
                            {{ latestDeployment.rolloutStateReason }}
                        </AlertDescription>
                    </Alert>
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
                        class="mb-4 p-3 bg-red-50 dark:bg-red-900/10 rounded-lg"
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

                        <Collapsible v-if="task.containers && task.containers.length">
                            <CollapsibleTrigger class="w-full text-left mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline">
                                Show container details
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <div
                                    v-for="(container, cIndex) in task.containers"
                                    :key="cIndex"
                                    class="mt-2 p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700"
                                >
                                    <div class="font-medium">{{ container.name }}</div>
                                    <div class="text-xs mt-1">
                                        <div><span class="text-gray-500">Image:</span> {{ container.image }}</div>
                                        <div><span class="text-gray-500">Status:</span> {{ container.lastStatus }}</div>
                                        <div v-if="container.reason" class="text-red-500">{{ container.reason }}</div>
                                    </div>
                                </div>
                            </CollapsibleContent>
                        </Collapsible>
                    </div>
                </CardContent>
            </div>
        </div>
    </Card>
</template>

<script setup lang="ts" generic="TData extends ServiceInterface">
import { ActivityIcon, AlertTriangleIcon, CalendarIcon, Clock8Icon, InfoIcon, RocketIcon, ServerIcon, XCircleIcon } from 'lucide-vue-next';
import UpdateDesiredCountDialog from './UpdateDesiredCountDialog.vue';
import type { ServiceInterface } from '@/views/AWS/Services/types/service.interface.ts';
import { Badge } from '@/components/ui/badge';
import { computed, ref } from 'vue';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import CustomWidget from '@/components/ui/custom-widget/CustomWidget.vue';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';

const props = defineProps<{
    row: TData;
    isOpen?: boolean;
}>();

const isDialogOpen = ref(false);
const expandedTasks = ref(false);

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
