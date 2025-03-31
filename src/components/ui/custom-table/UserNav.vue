<script setup lang="ts">
import { computed, ref } from 'vue';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoonIcon, SunIcon } from '@radix-icons/vue';
import { Bell, CreditCard, HelpCircle, LogOut, Settings, Shield, User, Users } from 'lucide-vue-next';

import { useTheme } from '@/composables/useTheme.ts';
import { useRouter } from 'vue-router';
import { AuthService } from '@/services/auth.service.ts';
import { useAuthStore } from '@/stores/authStore.ts';
import { usePermissions } from '@/composables/usePermissions.ts';
import { PermissionEnum } from '@/enums/user/user.enum.ts';

const router = useRouter();
const { isDark, toggleTheme } = useTheme();
const authService = new AuthService();
const authStore = useAuthStore();
const { hasPermission } = usePermissions();

// Get user initials for avatar fallback
const userInitials = computed(() => {
    if (!authStore.user?.name) return 'U';

    return authStore.user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase();
});

// Get user role display name
const userRoleDisplay = computed(() => {
    if (!authStore.user?.role) return 'User';

    // Format role name (e.g., "ADMIN" -> "Admin")
    return authStore.user.role.charAt(0).toUpperCase() + authStore.user.role.slice(1).toLowerCase();
});

// Define navigation menu items with dynamic visibility based on permissions
const menuItems = computed(() => [
    {
        label: 'Profile',
        icon: User,
        shortcut: '⇧⌘P',
        action: () => router.push('/settings'),
        enable: false,
        visible: true,
        badge: null,
    },
    {
        label: 'Settings',
        icon: Settings,
        shortcut: '⌘S',
        action: () => router.push('/settings'),
        enable: true,
        visible: true,
        badge: null,
    },
    {
        label: 'Team',
        icon: Users,
        action: () => router.push('/settings?tab=team'),
        enable: true,
        visible: true,
        badge: null,
    },
    {
        label: 'SAML Configuration',
        icon: Shield,
        action: () => router.push('/settings?tab=saml-setup'),
        enable: hasPermission(PermissionEnum.SAML_CONFIGURATION_CREATE),
        visible: false,
        badge: null,
    },
    {
        label: 'Billing',
        icon: CreditCard,
        action: () => router.push('/settings?tab=billing'),
        enable: hasPermission(PermissionEnum.SAML_CONFIGURATION_CREATE),
        visible: false,
        badge: null,
    },
    {
        label: 'Help & Support',
        icon: HelpCircle,
        action: () => window.open('https://docs.example.com', '_blank'),
        enable: false,
        visible: true,
        badge: null,
    },
]);

// Notifications (could be expanded to fetch real notifications)
const hasNotifications = ref(false);

const handleLogout = async () => {
    const response = (await authService.logout()) as { url: string };

    if (response.url) {
        await router.push(response.url);
        return;
    }

    window.location.href = '/';
};
</script>

<template>
    <div class="flex items-center gap-2">
        <!-- Notifications with "Soon" badge -->
        <Button :disabled="true" variant="ghost" size="icon" class="relative">
            <Bell class="h-5 w-5" />
            <span v-if="hasNotifications" class="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
            <!--      <span-->
            <!--        class="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-medium leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full">-->
            <!--        Soon-->
            <!--      </span>-->
        </Button>

        <!-- Theme Toggle -->
        <Button variant="ghost" size="icon" @click="toggleTheme" class="transition-colors duration-200">
            <SunIcon v-if="isDark" class="h-5 w-5" />
            <MoonIcon v-else class="h-5 w-5" />
            <span class="sr-only">Toggle theme</span>
        </Button>

        <!-- User Menu -->
        <DropdownMenu>
            <DropdownMenuTrigger as-child>
                <Button variant="ghost" class="relative h-8 w-8 rounded-full">
                    <Avatar class="h-9 w-9">
                        <AvatarFallback>
                            {{ userInitials }}
                        </AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent class="w-56" align="end">
                <DropdownMenuLabel class="font-normal">
                    <div class="flex flex-col space-y-1">
                        <p class="text-sm font-medium leading-none">
                            {{ authStore.user?.name || 'User' }}
                        </p>
                        <p class="text-xs leading-none text-muted-foreground">
                            {{ authStore.user?.email || 'user@example.com' }}
                        </p>
                        <p v-if="authStore.user?.role" class="text-xs text-muted-foreground mt-1">
                            {{ userRoleDisplay }}
                        </p>
                    </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                    <DropdownMenuItem
                        v-for="item in menuItems.filter((item) => item.visible)"
                        :key="item.label"
                        @click="item.action"
                        class="relative"
                        :disabled="!item.enable"
                    >
                        <component :is="item.icon" class="mr-2 h-4 w-4" />
                        {{ item.label }}
                        <DropdownMenuShortcut v-if="item.shortcut">{{ item.shortcut }}</DropdownMenuShortcut>

                        <!-- "Soon" badge for menu items -->
                        <span
                            v-if="item.badge === 'soon'"
                            class="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium leading-none bg-gradient-to-r from-purple-500 to-blue-500 text-white"
                        >
                            Soon
                        </span>
                    </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                <DropdownMenuItem @click="handleLogout">
                    <LogOut class="mr-2 h-4 w-4" />
                    Log out
                    <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    </div>
</template>

<style scoped>
.dropdown-menu-item {
    cursor: pointer;
}
</style>
