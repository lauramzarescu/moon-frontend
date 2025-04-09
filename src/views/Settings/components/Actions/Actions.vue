<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { type ActionDefinition } from './schema';
import { ActionService } from '@/services/action.service.ts';
import { toast } from '@/components/ui/toast';
import ActionBuilder from './ActionBuilder.vue';
import ActionList from './ActionList.vue';
import { Card, CardContent } from '@/components/ui/card';
import { InfoIcon, Plus } from 'lucide-vue-next';
import { Alert, AlertDescription } from '@/components/ui/alert';

const actionService = new ActionService();
const configuredActions = ref<ActionDefinition[]>([]);
const isLoading = ref(true);
const showActionBuilder = ref(false);

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
    }
};

const handleUpdateActionStatus = async (actionId: string, newStatus: boolean) => {
    try {
        const actionIndex = configuredActions.value.findIndex((a) => a.id === actionId);
        if (actionIndex !== -1) {
            configuredActions.value[actionIndex].enabled = newStatus;
            await actionService.updateOne(actionId, configuredActions.value[actionIndex]);

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
    }
};

const handleDeleteAction = async (actionId: string) => {
    try {
        configuredActions.value = configuredActions.value.filter((a) => a.id !== actionId);
        await actionService.deleteOne(actionId);

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
    }
};

const handleEditAction = async (updatedAction: ActionDefinition) => {
    try {
        // Find and update the action in the local array
        const index = configuredActions.value.findIndex((a) => a.id === updatedAction.id);
        if (index !== -1) {
            // Replace the action with the updated version
            configuredActions.value[index] = updatedAction;

            // Send the update to the backend
            await actionService.updateOne(updatedAction.id, updatedAction);

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
    }
};

const toggleActionBuilder = () => {
    showActionBuilder.value = !showActionBuilder.value;
};

const handleBuilderCancel = () => {
    showActionBuilder.value = false;
};

onMounted(async () => {
    try {
        configuredActions.value = await actionService.getAll();
    } catch (error) {
        console.error('Error fetching actions:', error);
        toast({
            title: 'Error loading actions',
            description: 'There was an error loading your actions. Please refresh the page.',
            variant: 'destructive',
        });
    } finally {
        isLoading.value = false;
    }
});
</script>

<template>
    <div class="container mx-auto py-6 space-y-8">
        <Alert variant="info" class="bg-blue-50 dark:bg-blue-950/30">
            <div class="flex items-center gap-2">
                <InfoIcon class="h-4 w-4" />
                <AlertDescription class="text-muted-foreground">
                    Define automated actions triggered by specific events in your system.
                </AlertDescription>
            </div>
        </Alert>

        <div class="grid gap-8">
            <ActionList
                :actions="configuredActions"
                :loading="isLoading"
                @update-action-status="handleUpdateActionStatus"
                @delete-action="handleDeleteAction"
                @edit-action="handleEditAction"
            />

            <!-- Action Builder (shown conditionally) -->
            <ActionBuilder v-if="showActionBuilder" @action-created="handleActionCreated" @cancel="handleBuilderCancel" />

            <!-- Add New Action Button (shown when builder is hidden) -->
            <Card
                v-if="!showActionBuilder"
                class="border-dashed cursor-pointer hover:border-primary/50 transition-colors group"
                @click="toggleActionBuilder"
            >
                <CardContent class="flex items-center justify-center p-6 group-hover:bg-muted/30 transition-colors">
                    <div class="flex items-center gap-2 text-muted-foreground group-hover:text-primary transition-colors">
                        <Plus class="h-5 w-5" />
                        <span class="font-medium">Add New Action</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
</template>
