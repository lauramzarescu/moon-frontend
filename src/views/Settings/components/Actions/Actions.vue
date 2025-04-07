<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import FormsLayout from '@/views/Settings/layout/FormsLayout.vue';
import ActionBuilder from './ActionBuilder.vue';
import ActionList from './ActionList.vue';
import { onMounted, ref } from 'vue';
import { type ActionDefinition } from './schema';
import { ActionService } from '@/services/action.service.ts';
import { toast } from '@/components/ui/toast';

const actionService = new ActionService();

const configuredActions = ref<ActionDefinition[]>([]);

const handleActionCreated = async (newAction: ActionDefinition) => {
    try {
        await actionService.create(newAction);
        configuredActions.value.push(newAction);

        toast({
            title: 'Action created',
            description: 'The action has been successfully created.',
            variant: 'success',
        });
    } catch (error) {
        console.log('Error creating action:', error);
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

            console.log(`Action ${actionId} status updated to: ${newStatus}`);
        }
    } catch (error) {
        console.log('Error updating action status:', error);
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
    } catch (error) {
        console.log('Error deleting action:', error);
        toast({
            title: 'Error deleting action',
            description: 'There was an error deleting the action. Please try again.',
            variant: 'destructive',
        });
    }
};

const handleEditAction = async (action: ActionDefinition) => {
    try {
        await actionService.updateOne(action.id, action);
        toast({
            title: 'Action updated',
            description: 'The action has been successfully updated.',
            variant: 'success',
        });
    } catch (error) {
        console.log('Error updating action status:', error);
        toast({
            title: 'Error updating action status',
            description: 'There was an error updating the action status. Please try again.',
            variant: 'destructive',
        });
    }
};

onMounted(async () => {
    configuredActions.value = await actionService.getAll();
});
</script>

<template>
    <FormsLayout>
        <template #header>
            <div class="mb-8">
                <h1 class="text-2xl font-bold dark:text-white">Actions</h1>
                <p class="text-gray-600 dark:text-gray-300 mt-2">Define automated actions triggered by specific events.</p>
            </div>
        </template>

        <div class="space-y-8">
            <ActionBuilder @action-created="handleActionCreated" />

            <hr class="my-8" />

            <ActionList
                :actions="configuredActions"
                @update-action-status="handleUpdateActionStatus"
                @delete-action="handleDeleteAction"
                @edit-action="handleEditAction"
            />
        </div>
    </FormsLayout>
</template>
