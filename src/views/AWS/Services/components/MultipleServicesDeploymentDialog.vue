<template>
    <Dialog v-model:open="isOpen">
        <DialogTrigger as-child>
            <Button variant="outline" size="sm" class="h-8">
                <RocketIcon class="h-4 w-4" />
                Deploy Multiple Services
            </Button>
        </DialogTrigger>
        <DialogContent class="max-w-7xl w-[90vw] h-[90vh] max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader class="flex-shrink-0">
                <DialogTitle class="flex items-center gap-2">
                    <RocketIcon class="h-5 w-5" />
                    Deploy Multiple Services
                </DialogTitle>
                <DialogDescription> Select services and configure their container images for deployment </DialogDescription>
            </DialogHeader>

            <div class="flex-1 min-h-0 overflow-hidden">
                <DeploymentWorkflow
                    :services="services"
                    :filtered-services="filteredServices"
                    :show-all-services="showAllServices"
                    @deployment-completed="handleDeploymentCompleted"
                    @close="isOpen = false"
                />
            </div>
        </DialogContent>
    </Dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { ServiceInterface } from '@/views/AWS/Services/types/service.interface.ts';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RocketIcon } from 'lucide-vue-next';
import DeploymentWorkflow from './MultipleServicesDeployment/DeploymentWorkflow.vue';

const props = defineProps<{
    services: ServiceInterface[];
    filteredServices?: ServiceInterface[];
    showAllServices?: boolean;
}>();

const emit = defineEmits<{
    (e: 'deployment-completed'): void;
}>();

const isOpen = ref(false);

const handleDeploymentCompleted = () => {
    emit('deployment-completed');
    isOpen.value = false;
};
</script>
