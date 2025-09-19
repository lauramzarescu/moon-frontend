<template>
    <Dialog v-model:open="isOpen">
        <DialogContent class="max-w-[98vw] w-[98vw] max-h-[98vh] h-[98vh] flex flex-col min-h-0">
            <DialogHeader>
                <DialogTitle class="flex items-center gap-2">
                    <SearchIcon class="h-5 w-5" />
                    Global Find and Replace
                </DialogTitle>
                <DialogDescription> Search and replace text across all services and environment variables </DialogDescription>
            </DialogHeader>

            <div class="flex-1 min-h-0 overflow-y-auto">
                <GlobalReplaceOperation
                    :find-replace="findReplace"
                    :find-matches="findMatches"
                    :replace-preview="replacePreview"
                    :pending-changes="pendingChanges"
                    :get-total-matches="getTotalMatches"
                    @update:find-replace="updateFindReplace"
                />
            </div>

            <div class="flex items-center justify-between pt-4 border-t">
                <div class="flex items-center gap-2 text-sm text-muted-foreground">
                    <InfoIcon class="h-4 w-4" />
                    <span>Changes will be applied to all affected services</span>
                </div>
                <div class="flex items-center gap-3">
                    <Button variant="outline" @click="closeDialog"> Cancel </Button>
                    <Button :disabled="findMatches.length === 0 || isReplacing" @click="openConfirmDialog">
                        <CheckIcon class="h-4 w-4 mr-2" />
                        Apply Changes
                    </Button>
                </div>
            </div>
        </DialogContent>
    </Dialog>

    <!-- Confirmation Dialog -->
    <Dialog v-model:open="showConfirmDialog">
        <DialogContent class="max-w-6xl w-[90vw] max-h-[90vh] h-[90vh] flex flex-col min-h-0">
            <DialogHeader>
                <DialogTitle class="flex items-center gap-2">
                    <AlertTriangleIcon class="h-5 w-5 text-destructive" />
                    Confirm Global Replace Operation
                </DialogTitle>
                <DialogDescription> Review the changes that will be applied across all services </DialogDescription>
            </DialogHeader>

            <div class="flex-1 min-h-0 overflow-y-auto space-y-6">
                <!-- Summary -->
                <div class="p-4 bg-accent/20 rounded-lg border border-accent/30">
                    <div class="flex items-start gap-2">
                        <InfoIcon class="h-5 w-5 text-accent-foreground mt-0.5 flex-shrink-0" />
                        <div>
                            <div class="font-medium text-accent-foreground mb-2">Operation Summary</div>
                            <div class="text-muted-foreground space-y-1">
                                <div>
                                    <span class="font-semibold">{{ getTotalMatches() }}</span> occurrence(s) will be replaced
                                </div>
                                <div>
                                    <span class="font-semibold">{{ findMatches.length }}</span> variable(s) will be modified
                                </div>
                                <div>
                                    <span class="font-semibold">{{ pendingChanges.size }}</span> service container(s) will be updated
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Service Containers to Update -->
                <div class="space-y-3">
                    <Label class="text-base font-medium">Service Containers to Update</Label>
                    <div class="border rounded-lg bg-muted/50 max-h-96 overflow-y-auto">
                        <div class="p-4 space-y-3">
                            <div
                                v-for="[key, change] in pendingChanges"
                                :key="key"
                                class="rounded-lg bg-card border shadow-sm p-4 transition-colors"
                            >
                                <!-- Header -->
                                <div class="flex items-center justify-between gap-3 mb-3">
                                    <div class="flex items-center gap-2">
                                        <div
                                            class="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold"
                                        >
                                            {{ change.serviceName[0]?.toUpperCase() || 'S' }}
                                        </div>
                                        <div>
                                            <div class="font-medium">{{ change.serviceName }}</div>
                                            <div class="text-xs text-muted-foreground">{{ change.containerName }}</div>
                                        </div>
                                    </div>
                                    <Badge variant="outline" class="text-xs">{{ change.clusterName }}</Badge>
                                </div>

                                <!-- Variables -->
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div v-if="change.environmentVariables.length > 0" class="space-y-2">
                                        <div class="text-sm font-medium text-muted-foreground">
                                            Environment Variables ({{ change.environmentVariables.length }})
                                        </div>
                                        <div class="space-y-2">
                                            <div
                                                v-for="env in change.environmentVariables"
                                                :key="env.name"
                                                class="bg-muted/50 rounded p-3 border"
                                            >
                                                <div class="font-mono font-medium text-sm">{{ env.name }}</div>
                                                <div class="text-xs text-muted-foreground mt-1">
                                                    {{ env.originalValue }} → {{ env.value }}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div v-if="change.secrets.length > 0" class="space-y-2">
                                        <div class="text-sm font-medium text-muted-foreground">Secrets ({{ change.secrets.length }})</div>
                                        <div class="space-y-2">
                                            <div v-for="secret in change.secrets" :key="secret.name" class="bg-muted/50 rounded p-3 border">
                                                <div class="font-mono font-medium text-sm">{{ secret.name }}</div>
                                                <div class="text-xs text-muted-foreground mt-1">
                                                    {{ secret.originalValue }} → {{ secret.valueFrom }}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="flex items-center justify-between pt-4 border-t">
                <div class="flex items-center gap-2 text-sm text-muted-foreground">
                    <AlertTriangleIcon class="h-4 w-4" />
                    <span>This action cannot be undone</span>
                </div>
                <div class="flex items-center gap-3">
                    <Button variant="outline" @click="showConfirmDialog = false"> Cancel </Button>
                    <Button variant="destructive" :disabled="isReplacing" @click="withDelay(handleReplaceOperation)">
                        <Loader2Icon v-if="isReplacing" class="h-4 w-4 mr-2 animate-spin" />
                        <CheckIcon v-else class="h-4 w-4 mr-2" />
                        {{ isReplacing ? 'Applying Changes...' : 'Confirm & Apply Changes' }}
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
import { AlertTriangleIcon, CheckIcon, InfoIcon, SearchIcon } from 'lucide-vue-next';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import GlobalReplaceOperation from './GlobalReplaceOperation.vue';
import { useGlobalFindReplace } from '../composables/useGlobalFindReplace';
import { withDelay } from '@/utils.ts';

interface Props {
    open: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
    (e: 'update:open', value: boolean): void;
    (e: 'completed'): void;
}>();

const store = useDataStore();
const { services } = storeToRefs(store);

const isOpen = computed({
    get: () => props.open,
    set: (value) => emit('update:open', value),
});

const showConfirmDialog = ref(false);
const servicesRef = toRef(services);

const { findReplace, isReplacing, findMatches, replacePreview, pendingChanges, getTotalMatches, performReplace, resetReplaceState } =
    useGlobalFindReplace(servicesRef);

const closeDialog = () => {
    isOpen.value = false;
    showConfirmDialog.value = false;
    resetReplaceState();
};

const openConfirmDialog = () => {
    showConfirmDialog.value = true;
};

const handleReplaceOperation = async () => {
    const success = await performReplace();
    if (success) {
        showConfirmDialog.value = false;
        emit('completed');
        closeDialog();
    }
};

const updateFindReplace = (value: typeof findReplace) => {
    Object.assign(findReplace, value);
};
</script>
