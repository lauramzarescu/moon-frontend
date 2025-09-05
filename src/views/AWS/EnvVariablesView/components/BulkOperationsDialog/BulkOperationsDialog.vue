<template>
    <Dialog v-model:open="isOpen">
        <DialogContent class="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
                <DialogTitle class="flex items-center gap-3">
                    <SettingsIcon class="h-5 w-5 text-primary" />
                    Bulk Operations
                    <Badge v-if="totalSelectedCount > 0" variant="outline" class="ml-2">
                        {{ isUsingAllVariables ? 'All variables' : `${totalSelectedCount} selected` }}
                    </Badge>
                </DialogTitle>
                <DialogDescription class="mt-2"> Perform bulk operations on selected environment variables and secrets </DialogDescription>
            </DialogHeader>

            <!-- Operation Tabs -->
            <div class="border-b">
                <div class="flex space-x-2 p-2">
                    <button
                        v-for="operation in operations"
                        :key="operation.key"
                        @click="activeOperation = operation.key"
                        :class="[
                            'px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 flex items-center gap-2',
                            activeOperation === operation.key
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                        ]"
                    >
                        <component :is="operation.icon" class="h-4 w-4" />
                        {{ operation.label }}
                    </button>
                </div>
            </div>

            <!-- Content Area -->
            <div class="flex-1 overflow-hidden flex flex-col p-4">
                <!-- Copy/Move Variables -->
                <CopyOperation
                    v-if="activeOperation === BulkOperationType.COPY"
                    :available-services="availableServices"
                    :copy-destination="copyDestination"
                    :copy-selected-only="copySelectedOnly"
                    :destination-containers="destinationContainers"
                    :variables-by-container="getVariablesByContainer"
                    :total-selected-count="totalSelectedCount"
                    @update:copy-destination="updateCopyDestination"
                    @update:copy-selected-only="copySelectedOnly = $event"
                />

                <!-- Export Variables -->
                <ExportOperation
                    v-else-if="activeOperation === BulkOperationType.EXPORT"
                    :export-format="exportFormat"
                    :export-options="exportOptions"
                    :export-preview="exportPreview"
                    :total-selected-count="totalSelectedCount"
                    :variables-by-container="getVariablesByContainer"
                    @update:export-format="exportFormat = $event"
                    @update:export-options="updateExportOptions"
                />

                <!-- Find and Replace -->
                <ReplaceOperation
                    v-else-if="activeOperation === BulkOperationType.REPLACE"
                    :find-replace="findReplace"
                    :find-matches="findMatches"
                    :replace-preview="replacePreview"
                    :get-total-matches="getTotalMatches"
                    @update:find-replace="updateFindReplace"
                />
            </div>

            <!-- Footer -->
            <div class="flex items-center justify-between pt-4 border-t">
                <div class="text-sm text-muted-foreground">
                    {{ isUsingAllVariables ? 'All variables selected' : `${totalSelectedCount} variables selected` }}
                </div>
                <div class="flex items-center gap-2">
                    <Button variant="outline" @click="closeDialog">Cancel</Button>

                    <Button
                        v-if="activeOperation === BulkOperationType.COPY"
                        @click="withDelay(handleCopyOperation)"
                        :disabled="!canPerformCopy || isCopying"
                        class="hover:shadow-sm transition-all duration-200"
                    >
                        <Loader2Icon v-if="isCopying" class="h-4 w-4 mr-2 animate-spin" />
                        <template v-else> {{ copyDestination.operation === BulkOperationType.MOVE ? 'Move' : 'Copy' }} Variables </template>
                    </Button>

                    <Button
                        v-else-if="activeOperation === BulkOperationType.EXPORT"
                        @click="handleExportOperation"
                        :disabled="totalSelectedCount === 0"
                        class="hover:shadow-sm transition-all duration-200"
                    >
                        <DownloadIcon class="h-4 w-4 mr-2" />
                        Export
                    </Button>

                    <Button
                        v-else-if="activeOperation === BulkOperationType.REPLACE"
                        @click="handleReplaceOperation"
                        :disabled="!findReplace.find || findMatches.length === 0 || isReplacing"
                        class="hover:shadow-sm transition-all duration-200"
                    >
                        <div v-if="isReplacing" class="flex items-center gap-2">
                            <Loader2Icon class="h-4 w-4 animate-spin" />
                            Replacing...
                        </div>
                        <div v-else class="flex items-center gap-2">
                            <SearchIcon class="h-4 w-4" />
                            Replace {{ getTotalMatches() }} occurrence(s)
                        </div>
                    </Button>
                </div>
            </div>
        </DialogContent>
    </Dialog>
</template>

<script setup lang="ts">
import { computed, ref, toRef } from 'vue';
import { storeToRefs } from 'pinia';
import { useDataStore } from '@/stores/dataStore';
import { BulkOperationType } from '@/types/aws';
import { CopyIcon, DownloadIcon, Loader2Icon, SearchIcon, SettingsIcon } from 'lucide-vue-next';
import { withDelay } from '@/utils';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import CopyOperation from './CopyOperation.vue';
import ExportOperation from './ExportOperation.vue';
import ReplaceOperation from './ReplaceOperation.vue';
import { useBulkVariables } from './composables/useBulkVariables';
import { useBulkCopy } from './composables/useBulkCopy';
import { useBulkExport } from './composables/useBulkExport';
import { useBulkReplace } from './composables/useBulkReplace';
import type { ServiceInterface } from '@/views/AWS/Services/types/service.interface';

const props = defineProps<{
    open: boolean;
    service: ServiceInterface | null;
    selectedVariables: string[];
}>();

const emit = defineEmits<{
    (e: 'update:open', value: boolean): void;
    (e: 'completed'): void;
}>();

// Store
const store = useDataStore();
const { services } = storeToRefs(store);

// Reactive state
const activeOperation = ref<string>(BulkOperationType.COPY);

// Computed properties
const isOpen = computed({
    get: () => props.open,
    set: (value) => emit('update:open', value),
});

const availableServices = computed(() => services.value);

const operations = computed(() => [
    { key: BulkOperationType.COPY, label: 'Copy/Move', icon: CopyIcon },
    { key: BulkOperationType.EXPORT, label: 'Export', icon: DownloadIcon },
    { key: BulkOperationType.REPLACE, label: 'Find & Replace', icon: SearchIcon },
]);

const serviceRef = toRef(props, 'service');
const selectedVariablesRef = toRef(props, 'selectedVariables');

const { isUsingAllVariables, getVariableData, getVariablesByContainer, totalSelectedCount } = useBulkVariables(
    serviceRef,
    selectedVariablesRef,
);

const { copyDestination, copySelectedOnly, destinationContainers, canPerformCopy, isCopying, performCopyOperation, resetCopyState } =
    useBulkCopy(serviceRef, availableServices, getVariableData);

const { exportFormat, exportOptions, exportPreview, performExport, resetExportState } = useBulkExport(getVariableData);

const { findReplace, isReplacing, findMatches, replacePreview, getTotalMatches, performReplace, resetReplaceState } = useBulkReplace(
    serviceRef,
    getVariableData,
);

// Methods
const closeDialog = () => {
    isOpen.value = false;
    resetAllStates();
};

const resetAllStates = () => {
    activeOperation.value = BulkOperationType.COPY;
    resetCopyState();
    resetExportState();
    resetReplaceState();
};

const handleCopyOperation = async () => {
    const success = await performCopyOperation();
    if (success) {
        emit('completed');
        closeDialog();
    }
};

const handleExportOperation = () => {
    const success = performExport();
    if (success) {
        closeDialog();
    }
};

const handleReplaceOperation = async () => {
    const success = await performReplace();
    if (success) {
        emit('completed');
        closeDialog();
    }
};

const updateCopyDestination = (value: typeof copyDestination) => {
    Object.assign(copyDestination, value);
};

const updateExportOptions = (value: typeof exportOptions) => {
    Object.assign(exportOptions, value);
};

const updateFindReplace = (value: typeof findReplace) => {
    Object.assign(findReplace, value);
};
</script>
