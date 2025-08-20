<template>
    <div v-if="hasStuckDeployments" class="inline-flex">
        <Badge
            variant="destructive"
            class="cursor-pointer inline-flex items-center gap-1.5 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 border border-red-200 dark:border-red-900 hover:bg-red-100 dark:hover:bg-red-900 transition-all duration-200 rounded-md px-2 py-1 ring-1 ring-red-500/10"
            role="button"
            tabindex="0"
            aria-label="View affected (stuck) services"
            title="View affected (stuck) services"
            @click="showAffectedServices = true"
            @keydown.enter.prevent="showAffectedServices = true"
            @keydown.space.prevent="showAffectedServices = true"
        >
            <AlertCircle class="h-3.5 w-3.5" />
            <span class="text-xs font-medium">{{ stuckServices.length }}</span>
            <span class="hidden md:inline text-xs">Stuck</span>
        </Badge>

        <AffectedServicesModal v-model:isOpen="showAffectedServices" />
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { AlertCircle } from 'lucide-vue-next';
import { Badge } from '@/components/ui/badge';
import { useDataStore } from '@/stores/dataStore';
import AffectedServicesModal from '@/components/ui/stuck-deployment/AffectedServicesModal.vue';

const dataStore = useDataStore();
const showAffectedServices = ref(false);

const stuckServices = computed(() => {
    return dataStore.services.filter((service) => service.deploymentStatus?.isStuck === true);
});

const hasStuckDeployments = computed(() => stuckServices.value.length > 0);
</script>
