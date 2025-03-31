<template :inert="showRestartDialog">
    <Drawer :autofocus="true" v-model:open="isOpen">
        <DrawerContent class="h-[calc(100%-theme(spacing.20))]">
            <DrawerHeader class="border-b">
                <DrawerTitle class="flex items-center gap-3">
                    <GearIcon class="h-6 w-6 text-primary" />
                    <span class="font-bold text-xl">{{ props.row.name }}</span>

                    <Button variant="secondary" size="sm" class="h-7 px-2 gap-1" @click="showRestartDialog = true">
                        <RefreshCwIcon class="h-3.5 w-3.5" />
                        <span class="text-xs">Restart</span>
                    </Button>
                </DrawerTitle>

                <DrawerDescription class="sr-only"> Configuration for {{ props.row.name }} service </DrawerDescription>
            </DrawerHeader>

            <div class="flex h-[calc(100%-80px)]">
                <!-- Left Navigation -->
                <div class="w-64 p-4">
                    <div class="space-y-1">
                        <button
                            v-for="section in ['Overview', 'Containers']"
                            :key="section"
                            @click="activeSection = section.toLowerCase()"
                            :class="[
                                'w-full text-left px-4 py-3 rounded-lg font-medium',
                                activeSection === section.toLowerCase() ? 'bg-primary text-primary-foreground' : 'hover:bg-muted/50',
                            ]"
                        >
                            {{ section }}
                        </button>
                    </div>
                </div>

                <!-- Right Content -->
                <div class="flex-1 p-6 overflow-auto">
                    <ServiceOverviewTab :row="props.row" v-if="activeSection === 'overview'" class="space-y-6" />

                    <!-- Container Section -->
                    <div v-if="activeSection === 'containers'" class="space-y-6">
                        <ServiceContainerTab :row="props.row" class="space-y-6" />
                    </div>
                </div>
            </div>
        </DrawerContent>
    </Drawer>

    <!-- Restart Service Confirmation Dialog -->
    <RestartServiceDialog
        v-if="props.row"
        :is-open="showRestartDialog"
        :service-name="props.row.name"
        :cluster-name="props.row.clusterName"
        @dialog-close="handleDialogToggle(false)"
        @dialog-open="handleDialogToggle(true)"
        @confirm="handleRestartService"
    />
</template>

<script setup lang="ts" generic="TData extends ServiceInterface">
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { GearIcon } from '@radix-icons/vue';
import type { ServiceInterface } from '@/views/AWS/Services/types/service.interface.ts';
import { computed, ref } from 'vue';
import ServiceOverviewTab from '@/views/AWS/Services/components/ServiceOverviewTab.vue';
import ServiceContainerTab from '@/views/AWS/Services/components/ServiceContainerTab.vue';
import { Button } from '@/components/ui/button';
import { RefreshCwIcon } from 'lucide-vue-next';
import { AwsService } from '@/services/aws.service.ts';
import RestartServiceDialog from '@/views/AWS/Services/components/RestartServiceDialog.vue';

const activeSection = ref('containers');
const showRestartDialog = ref(false);
const props = defineProps<{
    row: TData;
    isOpen?: boolean;
}>();
const awsService = new AwsService();
const emit = defineEmits(['update:isOpen', 'dialog-open', 'dialog-close']);

const isOpen = computed({
    get: () => props.isOpen,
    set: (value) => emit('update:isOpen', value),
});

const handleDialogToggle = (isOpen: boolean) => {
    showRestartDialog.value = isOpen;
};

const handleRestartService = async (data: { serviceName: string; clusterName: string }) => {
    await awsService.restartService({
        serviceName: data.serviceName,
        clusterName: data.clusterName,
    });
    emit('dialog-close');
};
</script>
