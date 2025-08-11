<script setup lang="ts">
import { computed, ref } from 'vue';
import type { AuditLog } from '@/views/Settings/components/AuditLogs/schema';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import Progress from '@/components/ui/progress/Progress.vue';
import { Check, X, AlertTriangle, Loader2, Server, Package2, Clock, FileText, Info, RotateCcw, Play } from 'lucide-vue-next';

const props = defineProps<{ deployment: AuditLog }>();
const emits = defineEmits<{
    (e: 'rollback', payload: { id: string; oldImage?: string; newImage?: string }): void;
    (e: 'logs', payload: { id: string }): void;
    (e: 'details', payload: { id: string }): void;
    (e: 'redeploy', payload: { id: string }): void;
}>();

const info = computed(() => (props.deployment.details?.info as Record<string, unknown>) || {});
const email = computed(() => (info.value.email as string) || 'System');
const service = computed(() => (info.value.service as string) || undefined);
const cluster = computed(() => (info.value.cluster as string) || undefined);
const ip = computed(() => (props.deployment.details?.ip as string) || (info.value.ip as string) || undefined);
const oldImage = computed(() => (info.value.oldServiceImage as string) || undefined);
const newImage = computed(() => (info.value.newServiceImage as string) || undefined);

// Status and progress (best-effort from info)
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

const duration = computed(() => info.value.duration as string | undefined);

const statusMeta = computed(() => {
    switch (status.value) {
        case 'success':
            return { color: 'text-emerald-600', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: Check };
        case 'failed':
            return { color: 'text-red-600', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: X };
        case 'warning':
            return { color: 'text-amber-600', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: AlertTriangle };
        case 'in_progress':
            return { color: 'text-sky-600', bg: 'bg-sky-500/10', border: 'border-sky-500/20', icon: Loader2 };
        default:
            return { color: 'text-foreground', bg: 'bg-muted', border: 'border-border', icon: Info };
    }
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

// Expand controls
const openChanges = ref(status.value === 'failed' || status.value === 'in_progress');
const openDetails = ref(false);

// Actions
const onRollback = () => emits('rollback', { id: props.deployment.id, oldImage: oldImage.value, newImage: newImage.value });
const onLogs = () => emits('logs', { id: props.deployment.id });
const onDetails = () => emits('details', { id: props.deployment.id });
const onRedeploy = () => emits('redeploy', { id: props.deployment.id });
</script>

<template>
    <div class="rounded-lg border bg-card p-4 shadow-sm relative overflow-hidden">
        <div
            class="absolute left-0 top-0 h-full w-1"
            :class="[
                status.value === 'success' ? 'bg-emerald-500/80' : '',
                status.value === 'failed' ? 'bg-red-500/80' : '',
                status.value === 'warning' ? 'bg-amber-500/80' : '',
                status.value === 'in_progress' ? 'bg-sky-500/80' : '',
                status.value === 'updated' ? 'bg-primary/60' : '',
            ]"
        />

        <!-- Header -->
        <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-3">
                <div class="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
                    {{ (email[0] || 'S').toUpperCase() }}
                </div>
                <div>
                    <div class="flex items-center gap-2">
                        <span class="font-medium">{{ service || 'Unknown service' }}</span>
                        <span v-if="cluster" class="text-xs px-2 py-0.5 rounded bg-muted border inline-flex items-center gap-1">
                            <Server class="h-3 w-3 text-muted-foreground" /> {{ cluster }}
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
                <span
                    class="text-xs px-2 py-1 rounded-full inline-flex items-center gap-1"
                    :class="[statusMeta.bg, statusMeta.border, statusMeta.color, 'border']"
                >
                    <component :is="statusMeta.icon" class="h-3 w-3" />
                    {{ status.replace('_', ' ') }}
                </span>
                <!-- Quick actions -->
                <Button size="sm" variant="outline" class="h-7 px-2" @click="onLogs"><FileText class="h-3 w-3 mr-1" /> Logs</Button>
                <Button size="sm" variant="outline" class="h-7 px-2" @click="onDetails"><Info class="h-3 w-3 mr-1" /> Details</Button>
                <Button size="sm" variant="outline" class="h-7 px-2" :disabled="!oldImage || oldImage === newImage" @click="onRollback"
                    ><RotateCcw class="h-3 w-3 mr-1" /> Rollback</Button
                >
                <Button size="sm" variant="outline" class="h-7 px-2" @click="onRedeploy"><Play class="h-3 w-3 mr-1" /> Redeploy</Button>
            </div>
        </div>

        <!-- What changed / summary -->
        <div class="mt-3 text-sm">
            <div v-if="oldImage || newImage">
                <span class="text-muted-foreground">Image:</span>
                <span class="font-mono text-xs ml-2 break-all">{{ oldImage || 'N/A' }}</span>
                <span class="mx-2">→</span>
                <span class="font-mono text-xs break-all">{{ newImage || 'N/A' }}</span>
            </div>
            <div class="mt-1 text-xs text-muted-foreground">
                <Clock class="inline h-3 w-3 mr-1" />
                <span v-if="status === 'success' && duration">Completed in {{ duration }}</span>
                <span v-else-if="status === 'failed' && duration">Failed after {{ duration }}</span>
                <span v-else-if="status === 'in_progress'">Deploying…</span>
            </div>
        </div>

        <!-- Progress / health -->
        <div v-if="status === 'in_progress' || progress !== undefined" class="mt-3">
            <Progress :model-value="progress || 0" />
        </div>

        <!-- Context badges -->
        <div class="mt-3 flex flex-wrap gap-2">
            <span v-if="cluster" class="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-muted border">
                <Server class="h-3 w-3 text-muted-foreground" /> {{ cluster }}
            </span>
            <span v-if="service" class="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-muted border">
                <Package2 class="h-3 w-3 text-muted-foreground" /> {{ service }}
            </span>
            <span v-if="ip" class="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-muted border">
                <span class="inline-block w-2 h-2 rounded-full bg-blue-500"></span> {{ ip }}
            </span>
            <span class="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-muted border">
                {{ props.deployment.action }}
            </span>
        </div>

        <!-- Description -->
        <div v-if="props.deployment.details?.info && (info.description as string | undefined)" class="mt-3 text-sm">
            <span class="text-muted-foreground">Description:</span>
            <span class="text-foreground font-medium ml-2">{{ info.description as string }}</span>
        </div>

        <!-- Expandable: Changes / Technical details -->
        <div class="mt-3">
            <Collapsible v-model:open="openChanges">
                <div class="flex items-center justify-between">
                    <div class="text-sm font-medium">Changes</div>
                    <CollapsibleTrigger class="text-xs underline">{{ openChanges ? 'Hide' : 'Show' }}</CollapsibleTrigger>
                </div>
                <CollapsibleContent>
                    <div class="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div class="rounded border bg-muted/30 p-3">
                            <div class="text-xs text-muted-foreground mb-1">Old image</div>
                            <div class="font-mono text-xs break-all">{{ oldImage || '-' }}</div>
                        </div>
                        <div class="rounded border bg-muted/30 p-3">
                            <div class="text-xs text-muted-foreground mb-1">New image</div>
                            <div class="font-mono text-xs break-all">{{ newImage || '-' }}</div>
                        </div>
                    </div>
                </CollapsibleContent>
            </Collapsible>

            <div class="mt-3">
                <Collapsible v-model:open="openDetails">
                    <div class="flex items-center justify-between">
                        <div class="text-sm font-medium">Technical details</div>
                        <CollapsibleTrigger class="text-xs underline">{{ openDetails ? 'Hide' : 'Show' }}</CollapsibleTrigger>
                    </div>
                    <CollapsibleContent>
                        <div class="mt-2 text-xs bg-muted/30 rounded border p-3 overflow-auto">
                            <pre class="whitespace-pre-wrap break-all">{{ JSON.stringify(props.deployment.details, null, 2) }}</pre>
                        </div>
                    </CollapsibleContent>
                </Collapsible>
            </div>
        </div>
    </div>
</template>
