<template :inert="showRestartDialog">
    <Dialog v-model:open="isOpen">
        <DialogContent class="max-w-7xl w-[95vw] h-[90vh] max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader class="flex-shrink-0 border-b pb-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                            <GearIcon class="h-5 w-5" />
                        </div>
                        <div>
                            <DialogTitle class="text-xl font-semibold">{{ props.row.name }}</DialogTitle>
                            <DialogDescription class="text-sm text-muted-foreground">
                                Service configuration and management
                            </DialogDescription>
                        </div>
                    </div>

                    <div class="flex items-center gap-3 mr-5">
                        <!-- Update Count Button -->
                        <UpdateDesiredCountDialog
                            :current-count="props.row?.desiredCount"
                            :service-arn="props.row?.taskDefinition.arn"
                            :cluster-name="props.row?.clusterName"
                            :service-name="props.row?.name"
                            @count-updated="handleCountUpdated"
                        />

                        <UpdateServiceImageDialog
                            :current-image="props.row.containers[0].image"
                            :container-name="props.row.containers[0].name"
                            :cluster-name="props.row.clusterName"
                            :service-name="props.row.name"
                            :is-cluster-production="props.row.isClusterProduction"
                        />

                        <!-- Restart Service Button -->
                        <Button
                            :disabled="!hasPermission(PermissionEnum.AWS_SERVICE_WRITE)"
                            variant="outline"
                            size="default"
                            class="transition-all duration-200 hover:shadow-sm group px-4 py-2"
                            @click="showRestartDialog = true"
                        >
                            <RefreshCwIcon class="h-4 w-4 transition-transform duration-200 group-hover:rotate-180" />
                            Restart Service
                        </Button>
                    </div>
                </div>

                <!-- Tab Navigation -->
                <div class="flex gap-2 mt-4">
                    <Button
                        v-for="section in ['Overview', 'Containers']"
                        :key="section"
                        @click="activeSection = section.toLowerCase()"
                        :variant="activeSection === section.toLowerCase() ? 'default' : 'ghost'"
                        size="sm"
                        class="transition-all duration-200"
                        :class="[activeSection === section.toLowerCase() ? 'shadow-sm' : 'hover:bg-muted/50']"
                    >
                        {{ section }}
                    </Button>
                </div>
            </DialogHeader>

            <!-- Content Area -->
            <div class="flex-1 min-h-0 overflow-y-auto p-6 space-y-6">
                <ServiceOverviewTab :row="props.row" v-if="activeSection === 'overview'" />
                <ServiceContainerTab :row="props.row" v-if="activeSection === 'containers'" />
            </div>
        </DialogContent>
    </Dialog>

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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { GearIcon } from '@radix-icons/vue';
import type { ServiceInterface } from '@/views/AWS/Services/types/service.interface.ts';
import { computed, ref, watch } from 'vue';
import ServiceOverviewTab from '@/views/AWS/Services/components/ServiceOverviewTab.vue';
import ServiceContainerTab from '@/views/AWS/Services/components/ServiceContainerTab.vue';
import { Button } from '@/components/ui/button';
import { RefreshCwIcon } from 'lucide-vue-next';
import { AwsService } from '@/services/aws.service.ts';
import RestartServiceDialog from '@/views/AWS/Services/components/RestartServiceDialog.vue';
import UpdateDesiredCountDialog from '@/views/AWS/Services/components/UpdateDesiredCountDialog.vue';
import UpdateServiceImageDialog from '@/views/AWS/Services/components/UpdateServiceImageDialog.vue';
import { usePermissions } from '@/composables/usePermissions.ts';
import { PermissionEnum } from '@/enums/user/user.enum.ts';

const { hasPermission } = usePermissions();
const activeSection = ref('containers');
const showRestartDialog = ref(false);
const props = defineProps<{
    row: TData;
    isOpen?: boolean;
    initialSection?: string;
}>();
const awsService = new AwsService();
const emit = defineEmits(['update:isOpen', 'dialog-open', 'dialog-close']);

const isOpen = computed({
    get: () => props.isOpen,
    set: (value) => emit('update:isOpen', value),
});

// Set the initial section if provided
watch(
    () => props.initialSection,
    (newValue) => {
        if (newValue) {
            activeSection.value = newValue;
        }
    },
    { immediate: true },
);

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

const handleCountUpdated = () => {
    // Handle count update if needed
};

const handleImageUpdated = () => {
    // Handle image update if needed
};
</script>
