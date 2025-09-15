<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useDataStore } from '@/stores/dataStore.ts';
import UserNav from '@/components/ui/custom-table/UserNav.vue';
import { Toaster } from '@/components/ui/toast';
import AppSidebar from '@/components/Sidebar/components/AppSidebar.vue';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import AuthLayout from '@/layouts/AuthLayout.vue';
import LogoutLoader from '@/components/ui/logout-loader/LogoutLoader.vue';
import { globalLogoutState } from '@/composables/useLogout';
import { performSessionLogout, validateSession } from '@/utils/session-validator';

const store = useDataStore();
const route = useRoute();

onMounted(() => {
    store.initializeData();
});

// Periodic token validation (every 10 seconds for better responsiveness)
setInterval(async () => {
    const requiresAuth = route.meta.requiresAuth !== false;

    const validation = validateSession({
        requiresAuth,
        context: 'interval',
    });

    if (validation.shouldLogout && validation.logoutReason) {
        await performSessionLogout(validation.logoutReason);
    }
}, 10000);

const isAuthLayout = computed(() => {
    return route.meta.layout === 'auth';
});

const currentPageTitle = computed(() => {
    return route.meta.title || 'Dashboard';
});
</script>

<template>
    <main autofocus class="h-screen w-screen overflow-hidden">
        <!-- Auth layout for login, forgot-password, reset-password -->
        <AuthLayout v-if="isAuthLayout">
            <router-view />
        </AuthLayout>

        <!-- Main layout with sidebar for other routes -->
        <div v-else id="app" class="flex h-full">
            <SidebarProvider>
                <AppSidebar class="h-screen w-64 left-0" />
                <SidebarInset>
                    <div class="flex flex-col h-full px-6 py-3 bg-background">
                        <header class="flex h-14 shrink-0 gap-2 items-center justify-between">
                            <!-- Left side: Sidebar trigger, Separator, Breadcrumb -->
                            <div class="flex items-center gap-2">
                                <SidebarTrigger />
                                <Separator orientation="vertical" class="mr-2 h-4" />
                                <Breadcrumb>
                                    <BreadcrumbList>
                                        <BreadcrumbItem>
                                            <BreadcrumbPage class="line-clamp-1"> {{ currentPageTitle }} </BreadcrumbPage>
                                        </BreadcrumbItem>
                                    </BreadcrumbList>
                                </Breadcrumb>
                            </div>
                            <!-- Right side: UserNav -->
                            <div class="flex items-center">
                                <UserNav />
                            </div>
                        </header>
                        <!-- Main content area with vertical padding and overflow -->
                        <div class="flex-1 flex-col space-y-3 px-10 overflow-auto py-6">
                            <div class="flex-1 space-y-8">
                                <router-view></router-view>
                            </div>
                        </div>
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </div>
    </main>
    <Toaster />

    <!-- Global Logout Loader -->
    <LogoutLoader :show="globalLogoutState.showLogoutLoader.value" :reason="globalLogoutState.logoutReason.value" />
</template>
