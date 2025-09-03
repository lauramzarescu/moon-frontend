<template>
    <div class="env-tree h-full overflow-y-auto pr-2">
        <div class="mb-2 flex items-center justify-between">
            <span class="text-xs text-muted-foreground">Services</span>
            <button class="text-xs text-muted-foreground hover:text-foreground" @click="$emit('collapseAll')">Collapse all</button>
        </div>

        <ul class="space-y-1">
            <li v-for="(group, cluster) in clusters" :key="cluster" class="">
                <div class="px-2 py-1.5 text-xs font-semibold flex items-center gap-2 sticky top-0 bg-background/80 backdrop-blur z-10">
                    <Cloud class="h-3.5 w-3.5" />
                    {{ cluster }}
                </div>
                <ul class="pl-2">
                    <li v-for="svc in group" :key="svc.name">
                        <div
                            class="px-2 py-1 rounded hover:bg-accent/60 cursor-pointer flex items-center justify-between group"
                            :class="selectedKey === keyFor(cluster, svc.name) ? 'bg-accent/70' : ''"
                            @click="onSelect(cluster, svc.name, null)"
                        >
                            <div class="flex items-center gap-2 truncate">
                                <Server class="h-3.5 w-3.5" />
                                <span class="text-sm truncate">{{ svc.name }}</span>
                            </div>
                            <span class="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition">{{
                                svc.containers.length
                            }}</span>
                        </div>
                        <ul class="pl-6">
                            <li v-for="c in svc.containers" :key="c.name">
                                <div
                                    class="px-2 py-1 rounded hover:bg-accent/40 cursor-pointer flex items-center gap-2"
                                    :class="selectedKey === keyFor(cluster, svc.name, c.name) ? 'bg-accent/60' : ''"
                                    @click.stop="onSelect(cluster, svc.name, c.name)"
                                >
                                    <Box class="h-3.5 w-3.5" />
                                    <span class="text-xs truncate">{{ c.name }}</span>
                                </div>
                            </li>
                        </ul>
                    </li>
                </ul>
            </li>
        </ul>
    </div>
</template>

<script setup lang="ts">
import type { ServiceInterface } from '@/views/AWS/Services/types/service.interface';
import { computed } from 'vue';
import { Box, Cloud, Server } from 'lucide-vue-next';

const props = defineProps<{
    services: ServiceInterface[];
    selected?: { cluster: string | null; service: string | null; container: string | null } | null;
}>();
const emit = defineEmits<{
    (e: 'select', payload: { cluster: string | null; service: string | null; container: string | null }): void;
    (e: 'collapseAll'): void;
}>();

const clusters = computed<Record<string, ServiceInterface[]>>(() => {
    const map: Record<string, ServiceInterface[]> = {};
    props.services.forEach((s) => {
        (map[s.clusterName] ||= []).push(s);
    });
    Object.keys(map).forEach((k) => (map[k] = map[k].slice().sort((a, b) => a.name.localeCompare(b.name))));
    return map;
});

const keyFor = (cluster?: string | null, service?: string | null, container?: string | null) =>
    `${cluster || ''}|${service || ''}|${container || ''}`;
const selectedKey = computed(() => keyFor(props.selected?.cluster, props.selected?.service, props.selected?.container));

const onSelect = (cluster: string | null, service: string | null, container: string | null) => {
    emit('select', { cluster, service, container });
};
</script>

<style scoped>
.env-tree {
    scrollbar-width: thin;
}
</style>
