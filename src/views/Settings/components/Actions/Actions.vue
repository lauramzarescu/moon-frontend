<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import FormsLayout from '@/views/Settings/layout/FormsLayout.vue';
import ActionBuilder from './ActionBuilder.vue';
import ActionList from './ActionList.vue';
import { ref } from 'vue';
import type { ActionDefinition } from './schema';

const configuredActions = ref<ActionDefinition[]>([
    {
        id: 'action-1',
        name: 'Allow SSH DEV',
        actionType: 'add_inbound_rule',
        triggerType: 'user_login',
        config: { securityGroupId: 'sg-123', protocol: 'tcp', portRange: '22' },
        enabled: true,
    },
]);

// Handler for when a new action is created by the builder
const handleActionCreated = (newAction: ActionDefinition) => {
    // TODO: Add logic to save the new action (e.g., API call)
    console.log('New Action Created:', newAction);
    configuredActions.value.push(newAction);
};

// Handler for updating action status
const handleUpdateActionStatus = (actionId: string, newStatus: boolean) => {
    // TODO: Add logic to save the status change (e.g., API call)
    const actionIndex = configuredActions.value.findIndex((a) => a.id === actionId);
    if (actionIndex !== -1) {
        configuredActions.value[actionIndex].enabled = newStatus;
        console.log(`Action ${actionId} status updated to: ${newStatus}`);
    }
};

// Handler for deleting an action
const handleDeleteAction = (actionId: string) => {
    // TODO: Add logic to delete the action (e.g., API call)
    console.log('Deleting action:', actionId);
    configuredActions.value = configuredActions.value.filter((a) => a.id !== actionId);
};

// Handler for editing an action (load into builder?)
const handleEditAction = (action: ActionDefinition) => {
    // TODO: Implement editing logic (e.g., populate builder form)
    console.log('Editing action:', action);
    alert('Editing not implemented yet.');
};
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
