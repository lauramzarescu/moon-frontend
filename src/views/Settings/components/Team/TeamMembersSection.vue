<template>
    <div class="mt-8">
        <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold">Team Members</h3>

            <div class="flex items-center gap-2">
                <!-- Export Button -->
                <Button
                    variant="outline"
                    size="sm"
                    :disabled="!hasPermission(PermissionEnum.USER_READ) || isExporting"
                    @click="handleExportUsers"
                >
                    <Loader2 v-if="isExporting" class="mr-2 h-4 w-4 animate-spin" />
                    <Download v-else class="mr-2 h-4 w-4" />
                    Export
                </Button>

                <!-- Add User Dropdown -->
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button :disabled="!hasPermission(PermissionEnum.USER_WRITE)" class="flex items-center gap-2">
                            <UserPlus class="h-4 w-4" />
                            Add User
                            <ChevronDown class="h-4 w-4 ml-1" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" class="w-56">
                        <DropdownMenuItem @click="showCreateUserModal = true">
                            <UserPlus class="mr-2 h-4 w-4" />
                            <span>Create new user</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem @click="showInviteUserModal = true">
                            <Mail class="mr-2 h-4 w-4" />
                            <span>Send invitation</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem @click="showImportUsersModal = true">
                            <Upload class="mr-2 h-4 w-4" />
                            <span>Import users</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>

        <TeamMembers :users="users" @user-deleted="loadUsers" />

        <CreateUserModal v-model:isOpen="showCreateUserModal" @user-created="loadUsers" />
        <CreateUserByInvitationModal v-model:isOpen="showInviteUserModal" @invitation-sent="handleInvitationSent" />
        <ImportUsersModal v-model:isOpen="showImportUsersModal" @users-imported="handleUsersImported" />
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { toast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Download, Loader2, Mail, Upload, UserPlus } from 'lucide-vue-next';
import { type UserExportInput, type UserInput } from '@/views/Settings/components/Team/schema.ts';
import { UserService } from '@/services/user.service.ts';
import TeamMembers from '@/views/Settings/components/Team/TeamMembers.vue';
import CreateUserModal from '@/views/Settings/components/Team/CreateUserModal.vue';
import CreateUserByInvitationModal from '@/views/Settings/components/Team/CreateUserByInvitationModal.vue';
import ImportUsersModal from '@/views/Settings/components/Team/ImportUsersModal.vue';
import { usePermissions } from '@/composables/usePermissions.ts';
import { PermissionEnum } from '@/enums/user/user.enum.ts';

const { hasPermission } = usePermissions();
const userService = new UserService();

const showCreateUserModal = ref(false);
const showInviteUserModal = ref(false);
const showImportUsersModal = ref(false);
const isExporting = ref(false);
const users = ref<UserInput[]>([]);

const loadUsers = async () => {
    users.value = await userService.get(userService.resource);
};

const handleInvitationSent = async () => {
    await loadUsers();
};

const handleUsersImported = async () => {
    await loadUsers();
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

    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

const handleExportUsers = async () => {
    if (!hasPermission(PermissionEnum.USER_READ)) {
        toast({
            title: 'Permission denied',
            description: 'You do not have permission to export users.',
            variant: 'destructive',
        });
        return;
    }

    isExporting.value = true;
    try {
        // Call the export API endpoint
        const exportData: UserExportInput[] = await userService.exportUsers();

        // Generate filename with current date
        const currentDate = new Date().toISOString().split('T')[0];
        const filename = `users-export-${currentDate}.json`;

        // Download the file
        downloadJsonFile(exportData, filename);

        toast({
            title: 'Export successful',
            description: `${exportData.length} users exported successfully.`,
            variant: 'success',
        });
    } catch (error) {
        console.error('Failed to export users:', error);
        toast({
            title: 'Export failed',
            description: error instanceof Error ? error.message : 'Failed to export users. Please try again.',
            variant: 'destructive',
        });
    } finally {
        isExporting.value = false;
    }
};

onMounted(async () => {
    await loadUsers();
});
</script>
