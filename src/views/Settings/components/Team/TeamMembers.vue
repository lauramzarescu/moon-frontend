<script setup lang="ts">
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ref, watch } from 'vue';
import { ChevronDownIcon, DotsHorizontalIcon } from '@radix-icons/vue';
import { PermissionEnum, UserRole } from '@/enums/user/user.enum';
import type { UserInput } from './schema';
import { usePermissions } from '@/composables/usePermissions.ts';
import { UserService } from '@/services/user.service.ts';
import { toast } from '@/components/ui/toast';
import { useAuthStore } from '@/stores/authStore.ts';

const { hasPermission } = usePermissions();
const userService = new UserService();
const authStore = useAuthStore();

const props = defineProps<{
    users: UserInput[];
}>();

const emit = defineEmits<{
    (e: 'userDeleted'): void;
}>();

const userRoles = ref<Record<string, UserRole>>({});
const isDeleting = ref<Record<string, boolean>>({});
const isResettingPassword = ref<Record<string, boolean>>({});
const isResetting2FA = ref<Record<string, boolean>>({});

const getInitials = (name: string) => {
    return name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .toUpperCase();
};

const getRoleDescription = (role: UserRole) => {
    const descriptions = {
        [UserRole.root]: 'Full system access with all permissions',
        [UserRole.admin]: 'Administrative access to manage users and settings',
        [UserRole.user]: 'Standard user access to system features',
    };
    return descriptions[role];
};

const isCurrentUser = (user: UserInput) => {
    return authStore.user?.email === user.email;
};

const handleRoleChange = (user: UserInput, newRole: UserRole) => {
    userRoles.value[user.id] = newRole;

    try {
        userService.updateUser(user.id, { ...user, role: newRole });
        toast({
            title: 'User role updated',
            description: `The role for ${user.name || user.nameIDFormat} has been updated to ${newRole}.`,
            variant: 'success',
        });
    } catch (error) {
        console.error(error);
        toast({
            title: 'Error updating user role',
            description: 'An error occurred while updating the user role. Please try again.',
            variant: 'destructive',
        });
    }
};

const handleDeleteUser = async (user: UserInput) => {
    if (isCurrentUser(user)) {
        toast({
            title: 'Cannot delete yourself',
            description: 'You cannot delete your own account.',
            variant: 'destructive',
        });
        return;
    }

    isDeleting.value[user.id] = true;

    try {
        await userService.deleteUser(user.id);
        toast({
            title: 'User deleted',
            description: `${user.name || user.nameIDFormat} has been successfully deleted.`,
            variant: 'success',
        });
        emit('userDeleted');
    } catch (error) {
        console.error(error);
        toast({
            title: 'Error deleting user',
            description: 'An error occurred while deleting the user. Please try again.',
            variant: 'destructive',
        });
    } finally {
        isDeleting.value[user.id] = false;
    }
};

const handleResetPassword = async (user: UserInput) => {
    if (isCurrentUser(user)) {
        toast({
            title: 'Cannot reset your own password',
            description: 'Use the profile settings to change your own password.',
            variant: 'destructive',
        });
        return;
    }

    isResettingPassword.value[user.id] = true;

    try {
        await userService.triggerResetPasswordAsAdmin(user.id);
        toast({
            title: 'Password reset',
            description: `Password reset email has been sent to ${user.email}.`,
            variant: 'success',
        });
    } catch (error) {
        console.error(error);
        toast({
            title: 'Error resetting password',
            description: 'An error occurred while resetting the password. Please try again.',
            variant: 'destructive',
        });
    } finally {
        isResettingPassword.value[user.id] = false;
    }
};

const handleReset2FA = async (user: UserInput) => {
    if (isCurrentUser(user)) {
        toast({
            title: 'Cannot reset your own 2FA',
            description: 'Use the profile settings to manage your own 2FA.',
            variant: 'destructive',
        });
        return;
    }

    isResetting2FA.value[user.id] = true;

    try {
        await userService.triggerReset2FAAsAdmin(user.id);
        toast({
            title: '2FA reset',
            description: `Two-factor authentication has been reset for ${user.name || user.nameIDFormat}.`,
            variant: 'success',
        });
    } catch (error) {
        console.error(error);
        toast({
            title: 'Error resetting 2FA',
            description: 'An error occurred while resetting 2FA. Please try again.',
            variant: 'destructive',
        });
    } finally {
        isResetting2FA.value[user.id] = false;
    }
};

watch(
    () => props.users,
    (newUsers) => {
        newUsers.forEach((user) => {
            userRoles.value[user.id] = user.role;
        });
    },
    { immediate: true },
);
</script>

<template>
    <Card class="border rounded-lg">
        <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription> Invite your team members to collaborate.</CardDescription>
        </CardHeader>
        <CardContent class="grid gap-6">
            <div v-for="user in users" :key="user.id" class="flex items-center justify-between space-x-4">
                <div class="flex items-center space-x-4">
                    <Avatar>
                        <AvatarFallback>{{ getInitials(user?.name || user?.nameIDFormat || 'NA') }}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p class="text-sm font-medium leading-none">
                            {{ user?.name || user?.nameIDFormat }}
                            <span v-if="isCurrentUser(user)" class="text-xs text-muted-foreground ml-2">(You)</span>
                        </p>
                        <p class="text-sm text-foreground">
                            {{ user.email }}
                        </p>
                    </div>
                </div>
                <div class="flex items-center space-x-2">
                    <Popover>
                        <PopoverTrigger as-child>
                            <Button variant="outline" class="ml-auto">
                                {{ userRoles[user.id] }}
                                <ChevronDownIcon class="ml-2 h-4 w-4 text-foreground" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent class="p-0" align="end">
                            <Command>
                                <CommandInput placeholder="Select new role..." />
                                <CommandList>
                                    <CommandEmpty>No roles found.</CommandEmpty>
                                    <CommandGroup>
                                        <CommandItem
                                            v-for="role in Object.values(UserRole)"
                                            :key="role"
                                            :value="role"
                                            :disabled="!hasPermission(PermissionEnum.USER_WRITE)"
                                            @select="() => handleRoleChange(user, role)"
                                            class="space-y-1 flex flex-col items-start px-4 py-2"
                                        >
                                            <p>{{ role }}</p>
                                            <p class="text-sm text-foreground">
                                                {{ getRoleDescription(role) }}
                                            </p>
                                        </CommandItem>
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>

                    <DropdownMenu>
                        <DropdownMenuTrigger as-child>
                            <Button variant="ghost" size="sm">
                                <DotsHorizontalIcon class="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <!-- Reset Password with Confirmation -->
                            <AlertDialog>
                                <AlertDialogTrigger as-child>
                                    <DropdownMenuItem
                                        :disabled="
                                            isCurrentUser(user) || !hasPermission(PermissionEnum.USER_WRITE) || isResettingPassword[user.id]
                                        "
                                        @select="(e) => e.preventDefault()"
                                    >
                                        {{ isResettingPassword[user.id] ? 'Resetting...' : 'Reset Password' }}
                                    </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Reset Password</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Are you sure you want to reset the password for
                                            {{ user.name || user.nameIDFormat }}? A password reset email will be sent to {{ user.email }}.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction :disabled="isResettingPassword[user.id]" @click="handleResetPassword(user)">
                                            {{ isResettingPassword[user.id] ? 'Resetting...' : 'Reset Password' }}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>

                            <!-- Reset 2FA with Confirmation -->
                            <AlertDialog>
                                <AlertDialogTrigger as-child>
                                    <DropdownMenuItem
                                        :disabled="
                                            isCurrentUser(user) || !hasPermission(PermissionEnum.USER_WRITE) || isResetting2FA[user.id]
                                        "
                                        @select="(e) => e.preventDefault()"
                                    >
                                        {{ isResetting2FA[user.id] ? 'Resetting...' : 'Reset 2FA' }}
                                    </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Reset Two-Factor Authentication</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Are you sure you want to reset two-factor authentication for
                                            {{ user.name || user.nameIDFormat }}? This will disable their current 2FA setup and they will
                                            need to set it up again.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction :disabled="isResetting2FA[user.id]" @click="handleReset2FA(user)">
                                            {{ isResetting2FA[user.id] ? 'Resetting...' : 'Reset 2FA' }}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>

                            <DropdownMenuSeparator />

                            <!-- Delete User with Confirmation -->
                            <AlertDialog>
                                <AlertDialogTrigger as-child>
                                    <DropdownMenuItem
                                        :disabled="isCurrentUser(user) || !hasPermission(PermissionEnum.USER_WRITE)"
                                        class="text-destructive focus:text-destructive"
                                        @select="(e) => e.preventDefault()"
                                    >
                                        Delete User
                                    </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Delete User</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Are you sure you want to delete {{ user.name || user.nameIDFormat }}? This action cannot be
                                            undone and will permanently remove the user from your organization.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            :disabled="isDeleting[user.id]"
                                            @click="handleDeleteUser(user)"
                                            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                            {{ isDeleting[user.id] ? 'Deleting...' : 'Delete User' }}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </CardContent>
    </Card>
</template>
