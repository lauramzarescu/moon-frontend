<template>
    <Sheet :open="isOpen" @update:open="$emit('update:isOpen', $event)">
        <SheetContent side="right" class="min-w-[40%] max-w-[90vw]">
            <SheetHeader class="border-b pb-4">
                <SheetTitle class="flex items-center gap-3">
                    <span class="font-bold text-xl">Audit Log Details</span>
                </SheetTitle>
                <SheetDescription>Detailed information for audit log entry</SheetDescription>
            </SheetHeader>

            <div class="mt-6 overflow-auto h-[calc(100vh-120px)] px-2 pb-5">
                <div v-if="log" class="space-y-6">
                    <!-- Navigation Tabs -->
                    <div v-if="hasDiffData" class="flex space-x-1 bg-muted p-1 rounded-lg">
                        <button
                            @click="$emit('update:activeSection', 'overview')"
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
                            @click="$emit('update:activeSection', 'diff')"
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
                                        getActionBadgeClass(log.action),
                                    ]"
                                >
                                    {{ formatActionName(log.action) }}
                                </div>
                            </div>
                        </div>

                        <!-- User ID -->
                        <div>
                            <label class="text-sm font-medium text-foreground">User ID</label>
                            <div class="mt-2 flex items-center justify-between p-3 bg-muted rounded-lg">
                                <span class="text-sm font-mono">{{ log.userId }}</span>
                                <Button variant="ghost" size="sm" @click="$emit('copyUserId', log.userId)">Copy</Button>
                            </div>
                        </div>

                        <!-- Organization ID -->
                        <div>
                            <label class="text-sm font-medium text-foreground">Organization ID</label>
                            <div class="mt-2 flex items-center justify-between p-3 bg-muted rounded-lg">
                                <span class="text-sm font-mono">{{ log.organizationId }}</span>
                                <Button variant="ghost" size="sm" @click="$emit('copyOrganizationId', log.organizationId)"> Copy </Button>
                            </div>
                        </div>

                        <!-- Created At -->
                        <div>
                            <label class="text-sm font-medium text-foreground">Created At</label>
                            <p class="text-sm text-muted-foreground mt-2 p-3 bg-muted rounded-lg">
                                {{ formatDate(log.createdAt) }}
                            </p>
                        </div>

                        <!-- Updated At -->
                        <div v-if="log.updatedAt && log.updatedAt !== log.createdAt">
                            <label class="text-sm font-medium text-foreground">Updated At</label>
                            <p class="text-sm text-muted-foreground mt-2 p-3 bg-muted rounded-lg">
                                {{ formatDate(log.updatedAt) }}
                            </p>
                        </div>

                        <!-- IP Address -->
                        <div v-if="log.details?.ip">
                            <label class="text-sm font-medium text-foreground">IP Address</label>
                            <p class="text-sm font-mono mt-2 p-3 bg-muted rounded-lg">
                                {{ log.details.ip }}
                            </p>
                        </div>

                        <!-- Additional Information -->
                        <div v-if="log.details?.info && Object.keys(log.details.info).length > 0">
                            <label class="text-sm font-medium text-foreground">Additional Information</label>
                            <div class="mt-2 space-y-3">
                                <div v-for="(value, key) in log.details.info" :key="key" class="space-y-2">
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
                                <span class="text-xs font-mono break-all">{{ log.id }}</span>
                                <Button variant="ghost" size="sm" @click="$emit('copyLogId', log.id)">Copy</Button>
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
                                        v-for="line in diffLines"
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
                                                line.type === 'removed' && 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
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
                                    <div v-for="change in diffSummary" :key="change.field" class="flex items-center gap-2 text-xs">
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
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { type AuditLog } from '../schema.ts';
import {
    formatActionName,
    formatDate,
    formatInfoValue,
    getActionBadgeClass,
    getDiffLines,
    getDiffSummary,
} from '../utils/auditLogHelpers.ts';

interface Props {
    isOpen: boolean;
    log: AuditLog | null;
    activeSection: string;
}

interface Emits {
    (e: 'update:isOpen', value: boolean): void;

    (e: 'update:activeSection', value: string): void;

    (e: 'copyLogId', id: string): void;

    (e: 'copyUserId', userId: string): void;

    (e: 'copyOrganizationId', organizationId: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const hasDiffData = computed(() => {
    return props.log?.details?.info?.objectOld && props.log?.details?.info?.objectNew;
});

const diffLines = computed(() => {
    if (!props.log?.details?.info?.objectOld || !props.log?.details?.info?.objectNew) {
        return [];
    }
    return getDiffLines(props.log.details.info.objectOld, props.log.details.info.objectNew);
});

const diffSummary = computed(() => {
    if (!props.log?.details?.info?.objectOld || !props.log?.details?.info?.objectNew) {
        return [];
    }
    return getDiffSummary(props.log.details.info.objectOld, props.log.details.info.objectNew);
});
</script>
