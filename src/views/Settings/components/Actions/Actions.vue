<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { type ActionDefinition, type ActionExportInput } from './schema';
import { ActionService } from '@/services/action.service.ts';
import { toast } from '@/components/ui/toast';
import ActionBuilder from './ActionBuilder.vue';
import ActionList from './ActionList.vue';
import ImportActionsModal from './ImportActionsModal.vue';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Download, InfoIcon, Loader2, Plus, Upload } from 'lucide-vue-next';
import { Alert, AlertDescription } from '@/components/ui/alert';

const actionService = new ActionService();
const configuredActions = ref<ActionDefinition[]>([]);
const isLoading = ref(true);
const showActionBuilder = ref(false);
const showImportModal = ref(false);
const isExporting = ref(false);

const handleActionCreated = async (newAction: ActionDefinition) => {
    try {
        await actionService.create(newAction);

        configuredActions.value.push(newAction);
        showActionBuilder.value = false;

        toast({
            title: 'Action created',
            description: 'The action has been successfully created.',
            variant: 'success',
        });
    } catch (error) {
        console.error('Error creating action:', error);
        toast({
            title: 'Error creating action',
            description: 'There was an error creating your action. Please try again.',
            variant: 'destructive',
        });
        return;
    }
};

const handleUpdateActionStatus = async (actionId: string, newStatus: boolean) => {
    const actionIndex = configuredActions.value.findIndex((a) => a.id === actionId);

    try {
        if (actionIndex !== -1) {
            await actionService.updateOne(actionId, configuredActions.value[actionIndex]);

            configuredActions.value[actionIndex].enabled = newStatus;

            toast({
                title: 'Action status updated',
                description: `The action has been successfully ${newStatus ? 'enabled' : 'disabled'}.`,
                variant: 'success',
            });
        }
    } catch (error) {
        console.error('Error updating action status:', error);
        toast({
            title: 'Error updating action status',
            description: 'There was an error updating the action status. Please try again.',
            variant: 'destructive',
        });
        return;
    }
};

const handleDeleteAction = async (actionId: string) => {
    try {
        await actionService.deleteOne(actionId);

        const actionIndex = configuredActions.value.findIndex((a) => a.id === actionId);
        if (actionIndex === -1) {
            toast({
                title: 'Action not found',
                description: 'The action you are trying to delete does not exist.',
                variant: 'destructive',
            });
            return;
        }
        configuredActions.value.splice(actionIndex, 1);

        toast({
            title: 'Action deleted',
            description: 'The action has been successfully removed.',
            variant: 'success',
        });
    } catch (error) {
        console.error('Error deleting action:', error);
        toast({
            title: 'Error deleting action',
            description: 'There was an error deleting the action. Please try again.',
            variant: 'destructive',
        });
        return;
    }
};

const handleEditAction = async (updatedAction: ActionDefinition) => {
    const index = configuredActions.value.findIndex((a) => a.id === updatedAction.id);

    try {
        if (index !== -1) {
            await actionService.updateOne(updatedAction.id, updatedAction);
            configuredActions.value[index] = updatedAction;

            toast({
                title: 'Action updated',
                description: 'The action has been successfully updated.',
                variant: 'success',
            });
        }
    } catch (error) {
        console.error('Error updating action:', error);
        toast({
            title: 'Error updating action',
            description: 'There was an error updating the action. Please try again.',
            variant: 'destructive',
        });
        return;
    }
};

const handleCopyAction = async (copiedAction: ActionDefinition) => {
    try {
        await actionService.create(copiedAction);
        configuredActions.value.push(copiedAction);

        toast({
            title: 'Action copied',
            description: 'The action has been successfully copied.',
            variant: 'success',
        });
    } catch (error) {
        console.error('Error copying action:', error);
        toast({
            title: 'Error copying action',
            description: 'There was an error copying the action. Please try again.',
            variant: 'destructive',
        });
        return;
    }
};

const downloadJsonFile = (data: any, filename: string) => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

const handleExportActions = async () => {
    isExporting.value = true;
    try {
        const exportData: ActionExportInput[] = await actionService.exportActions();

        // Generate filename with current date
        const currentDate = new Date().toISOString().split('T')[0];
        const filename = `actions-export-${currentDate}.json`;

        // Download the file
        downloadJsonFile(exportData, filename);

        toast({
            title: 'Export successful',
            description: `${exportData.length} actions exported successfully.`,
            variant: 'success',
        });
    } catch (error) {
        console.error('Failed to export actions:', error);
        toast({
            title: 'Export failed',
            description: error instanceof Error ? error.message : 'Failed to export actions. Please try again.',
            variant: 'destructive',
        });
    } finally {
        isExporting.value = false;
    }
};

const handleActionsImported = async () => {
    await loadActions();
};

const toggleActionBuilder = () => {
    showActionBuilder.value = !showActionBuilder.value;
};

const handleBuilderCancel = () => {
    showActionBuilder.value = false;
};

const loadActions = async () => {
    try {
        configuredActions.value = await actionService.getAll();
    } catch (error) {
        console.error('Error fetching actions:', error);
        toast({
            title: 'Error loading actions',
            description: 'There was an error loading your actions. Please refresh the page.',
            variant: 'destructive',
        });
    }
};

onMounted(async () => {
    try {
        await loadActions();
    } finally {
        isLoading.value = false;
    }
});
</script>

<template>
    <div class="mx-auto py-6 space-y-8">
        <div class="flex justify-between items-center">
            <Alert variant="info" class="bg-blue-50 dark:bg-blue-950/30 flex-1 mr-4">
                <div class="flex items-center gap-2">
                    <InfoIcon class="h-4 w-4" />
                    <AlertDescription class="text-foreground">
                        Define automated actions triggered by specific events in your system.
                    </AlertDescription>
                </div>
            </Alert>

            <div class="flex items-center gap-2">
                <!-- Export Button -->
                <Button variant="outline" :disabled="isExporting || configuredActions.length === 0" @click="handleExportActions">
                    <Loader2 v-if="isExporting" class="mr-2 h-4 w-4 animate-spin" />
                    <Download v-else class="mr-2 h-4 w-4" />
                    Export
                </Button>

                <!-- Add Action Dropdown -->
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button class="flex items-center gap-2" variant="outline">
                            <Plus class="h-4 w-4" />
                            Add Action
                            <ChevronDown class="h-4 w-4 ml-1" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" class="w-56">
                        <DropdownMenuItem @click="toggleActionBuilder">
                            <Plus class="mr-2 h-4 w-4" />
                            <span>Create new action</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem @click="showImportModal = true">
                            <Upload class="mr-2 h-4 w-4" />
                            <span>Import actions</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>

        <div class="grid gap-8">
            <ActionList
                :actions="configuredActions"
                :loading="isLoading"
                @update-action-status="handleUpdateActionStatus"
                @delete-action="handleDeleteAction"
                @edit-action="handleEditAction"
                @copy-action="handleCopyAction"
            />

            <!-- Action Builder (shown conditionally) -->
            <ActionBuilder v-if="showActionBuilder" @action-created="handleActionCreated" @cancel="handleBuilderCancel" />

            <!-- Add New Action Button (shown when builder is hidden) -->
            <Card v-if="!showActionBuilder" class="border-dashed cursor-pointer transition-colors group" @click="toggleActionBuilder">
                <CardContent class="flex items-center justify-center p-6 group-hover:rounded-xl group-hover:bg-accent transition-colors">
                    <div class="flex items-center gap-2 text-foreground group-hover:text-primary transition-colors">
                        <Plus class="h-5 w-5" />
                        <span class="font-medium">Add New Action</span>
                    </div>
                </CardContent>
            </Card>
        </div>

        <!-- Import Actions Modal -->
        <ImportActionsModal v-model:isOpen="showImportModal" @actions-imported="handleActionsImported" />
    </div>
</template>
