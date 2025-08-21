<template>
    <div v-if="hasInProgressDeployments" class="inline-flex">
        <Badge
            variant="secondary"
            class="hover:bg-accent hover:text-accent-foreground cursor-pointer inline-flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/20 transition-all duration-200 rounded-md px-2 py-1 ring-1 ring-primary/10"
            role="button"
            tabindex="0"
            aria-label="View deploying services"
            title="View deploying services"
            @click="showDeployingServices = true"
            @keydown.enter.prevent="showDeployingServices = true"
            @keydown.space.prevent="showDeployingServices = true"
        >
            <Loader2 class="h-3.5 w-3.5 animate-spin" />
            <span class="text-xs font-medium">{{ inProgressServices.length }}</span>
            <span class="hidden md:inline text-xs">Deploying</span>
        </Badge>

        <DeployingServicesModal v-model:isOpen="showDeployingServices" :deploying-services="inProgressServices" />
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { Loader2 } from 'lucide-vue-next';
import { Badge } from '@/components/ui/badge';
import type { ServiceInterface } from '@/views/AWS/Services/types/service.interface.ts';
import { useDataStore } from '@/stores/dataStore.ts';
import DeployingServicesModal from '@/components/ui/in-progress-deployment/DeployingServicesModal.vue';

const dataStore = useDataStore();
const showDeployingServices = ref(false);

const inProgressServices = computed(() => {
    return dataStore.services.filter((service: ServiceInterface) => {
        return service.deployments?.some((deployment) => deployment.rolloutState === 'IN_PROGRESS');
    });
});

const hasInProgressDeployments = computed(() => inProgressServices.value.length > 0);
</script>
