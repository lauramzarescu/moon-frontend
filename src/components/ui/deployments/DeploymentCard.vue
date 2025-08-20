<script setup lang="ts">
import { computed, ref } from 'vue';
import type { AuditLog } from '@/views/Settings/components/AuditLogs/schema';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import UpdateServiceImageDialog from '@/views/AWS/Services/components/UpdateServiceImageDialog.vue';
import Progress from '@/components/ui/progress/Progress.vue';
import { Check, Clock, Copy, Info, Play, Rocket, RotateCcw, Server } from 'lucide-vue-next';
import { copyToClipboard as copyToClipboardHelper } from '@/composables/useClipboard';

const props = defineProps<{ deployment: AuditLog }>();
const emit = defineEmits<{
    (e: 'rollback', payload: { id: string; oldImage?: string; newImage?: string }): void;
    (e: 'logs', payload: { id: string }): void;
    (e: 'details', payload: { id: string }): void;
    (e: 'redeploy', payload: { id: string }): void;
}>();

const info = computed(() => (props.deployment.details?.info as Record<string, unknown>) || {});
const email = computed(() => (info.value.email as string) || 'System');
const service = computed(() => (info.value.service as string) || 'N/A');
const container = computed(() => (info.value.container as string) || 'N/A');
const cluster = computed(() => (info.value.cluster as string) || 'N/A');
const oldImage = computed(() => (info.value.oldServiceImage as string) || 'N/A');
const newImage = computed(() => (info.value.newServiceImage as string) || 'N/A');

const rawStatus = computed(() => ((info.value.status as string) || '').toLowerCase());
const status = computed<'success' | 'failed' | 'in_progress' | 'warning' | 'updated'>(() => {
    if (rawStatus.value === 'success') return 'success';
    if (rawStatus.value === 'failed' || rawStatus.value === 'error') return 'failed';
    if (rawStatus.value === 'warning') return 'warning';
    if (rawStatus.value === 'in_progress' || rawStatus.value === 'running') return 'in_progress';
    return 'updated';
});

const progress = computed(() => {
    const p = info.value.progress as number | undefined;
    return typeof p === 'number' ? Math.min(100, Math.max(0, Math.round(p))) : undefined;
});

// Relative time
const formatRelative = (date: Date) => {
    const diffMs = date.getTime() - Date.now();
    const sec = Math.round(diffMs / 1000);
    const absSec = Math.abs(sec);
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    if (absSec < 60) return rtf.format(Math.round(sec), 'second');

    const min = Math.round(sec / 60);
    if (Math.abs(min) < 60) return rtf.format(min, 'minute');

    const hr = Math.round(min / 60);
    if (Math.abs(hr) < 24) return rtf.format(hr, 'hour');

    const d = Math.round(hr / 24);
    return rtf.format(d, 'day');
};

const createdAt = computed(() => new Date(props.deployment.createdAt));

const rollbackOpen = ref(false);
const redeployOpen = ref(false);

const copiedDesc = ref(false);
const onCopyDescription = async (text: string) => {
    copiedDesc.value = await copyToClipboardHelper(text);
    setTimeout(() => (copiedDesc.value = false), 2000);
};
</script>

<template>
    <div class="rounded-lg bg-card border p-4 shadow-sm relative overflow-hidden transition-colors">
        <!-- Header -->
        <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-3">
                <div class="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
                    {{ (email[0] || 'S').toUpperCase() }}
                </div>
                <div>
                    <div class="flex items-center gap-2">
                        <span class="font-medium inline-flex items-center gap-1">
                            {{ service || 'Unknown service' }}
                        </span>
                    </div>
                    <div class="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                        <span>{{ email }}</span>
                        <span>•</span>
                        <span :title="createdAt.toLocaleString()">{{ formatRelative(createdAt) }}</span>
                    </div>
                </div>
            </div>
            <div class="flex items-center gap-2">
                <!-- Quick actions -->
                <Tooltip>
                    <TooltipTrigger as-child>
                        <button
                            class="inline-flex items-center text-muted-foreground hover:text-foreground ml-2"
                            title="View technical details"
                        >
                            <Info class="h-3.5 w-3.5" />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent class="max-w-[480px] p-0">
                        <div class="text-xs bg-background rounded border overflow-auto max-h-72">
                            <pre class="text-foreground whitespace-pre-wrap break-all p-3">{{
                                JSON.stringify(props.deployment.details, null, 2)
                            }}</pre>
                        </div>
                    </TooltipContent>
                </Tooltip>
                <Button
                    size="sm"
                    variant="outline"
                    class="h-7 px-3 disabled:cursor-not-allowed border-blue-500/40 dark:text-blue-300 text-blue-600 hover:bg-blue-500/10"
                    :disabled="!oldImage || oldImage === newImage"
                    @click="rollbackOpen = true"
                >
                    <RotateCcw class="h-3 w-3" /> Rollback</Button
                >

                <Button
                    size="sm"
                    variant="outline"
                    class="h-7 px-3 border-red-500/40 dark:text-red-300 text-red-600 hover:bg-red-500/10"
                    @click="redeployOpen = true"
                >
                    <Play class="h-3 w-3" /> Redeploy</Button
                >
                <span v-if="cluster" class="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-muted border">
                    <Server class="h-3 w-3 text-muted-foreground" /> {{ cluster }}
                </span>
                <span
                    v-if="cluster && String(cluster).toLowerCase().includes('prod')"
                    class="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400"
                    title="Production deployment"
                >
                    <Rocket class="h-3 w-3" /> prod
                </span>
            </div>
        </div>

        <!-- What changed / summary -->
        <div class="mt-3 text-sm">
            <div v-if="oldImage || newImage" class="flex flex-wrap items-center gap-2 text-xs">
                <span class="text-muted-foreground">Image:</span>
                <span class="font-mono break-all">{{ oldImage || 'N/A' }}</span>
                <span class="opacity-50">→</span>
                <span class="font-mono break-all">{{ newImage || 'N/A' }}</span>
            </div>
            <div class="mt-1 text-xs text-muted-foreground">
                <Clock class="inline h-3 w-3" :title="createdAt" aria-label="Exact date" />
                {{ createdAt.toLocaleString() }}
            </div>
        </div>

        <!-- Progress / health -->
        <div v-if="status === 'in_progress' || progress !== undefined" class="mt-3">
            <Progress :model-value="progress || 0" />
        </div>

        <!-- Context badges moved near actions -->

        <!-- Description -->
        <div v-if="props.deployment.details?.info && (info.description as string | undefined)" class="mt-3 text-sm group">
            <span class="text-muted-foreground">Description:</span>
            <span class="text-foreground font-medium ml-2 break-all">{{ info.description as string }}</span>
            <button
                v-if="info.description"
                class="inline-flex items-center gap-1 text-xs ml-4 text-muted-foreground hover:text-foreground transition-all duration-200 opacity-0 group-hover:opacity-100"
                :aria-label="copiedDesc ? 'Copied' : 'Copy description'"
                :title="copiedDesc ? 'Copied' : 'Copy description'"
                @click="onCopyDescription(String(info.description))"
            >
                <component :is="copiedDesc ? Check : Copy" class="h-3.5 w-3.5" />
                <span>{{ copiedDesc ? 'Copied' : '' }}</span>
            </button>
        </div>

        <!-- Confirm Rollback Dialog (reuse UpdateServiceImageDialog confirm view) -->
        <UpdateServiceImageDialog
            v-if="service && cluster && oldImage && newImage"
            :open="rollbackOpen"
            :hide-trigger="true"
            :confirm-only="true"
            :current-image="newImage"
            :default-new-image-uri="oldImage"
            :container-name="container"
            :cluster-name="cluster"
            :service-name="service"
            :is-cluster-production="String(cluster).toLowerCase().includes('prod')"
            @update:open="(v) => (rollbackOpen = v)"
            @image-updated="emit('rollback', { id: props.deployment.id, oldImage: oldImage, newImage: newImage })"
        />

        <!-- Confirm Redeploy Dialog (reuse UpdateServiceImageDialog confirm view) -->
        <UpdateServiceImageDialog
            v-if="service && cluster && newImage"
            :open="redeployOpen"
            :hide-trigger="true"
            :confirm-only="true"
            :current-image="newImage"
            :default-new-image-uri="newImage"
            :container-name="container"
            :cluster-name="cluster"
            :service-name="service"
            :is-cluster-production="String(cluster).toLowerCase().includes('prod')"
            @update:open="(v) => (redeployOpen = v)"
            @image-updated="emit('redeploy', { id: props.deployment.id })"
        />
    </div>
</template>
