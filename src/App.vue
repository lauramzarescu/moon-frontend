<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useDataStore } from '@/stores/dataStore.ts';
import UserNav from '@/components/ui/custom-table/UserNav.vue';
import { Toaster } from '@/components/ui/toast';
import { useAuthStore } from '@/stores/authStore.ts';
import Cookies from 'js-cookie';
import { AuthService } from '@/services/auth.service.ts';
import AppSidebar from '@/components/Sidebar/components/AppSidebar.vue';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import AuthLayout from '@/layouts/AuthLayout.vue';

const store = useDataStore();
const authStore = useAuthStore();
const route = useRoute();
const authService = new AuthService();

onMounted(() => {
    store.initializeData();
});

// Periodic token validation (every minute)
setInterval(() => {
    const token = Cookies.get('token');
    const requiresAuth = route.meta.requiresAuth !== false;

    if (token && authService.isTokenExpired(token)) {
        authStore.clearUser();
        Cookies.remove('token');

        // Only redirect to login if the route requires authentication
        if (requiresAuth) {
            window.location.href = '/login';
        }
    }
}, 60000);

// Check if current route uses auth layout
const isAuthLayout = computed(() => {
    return route.meta.layout === 'auth';
});

// Computed property to get the current page title from route meta
const currentPageTitle = computed(() => {
    return route.meta.title || 'Dashboard';
});
</script>

<template>
    <main vaul-drawer-wrapper autofocus class="h-screen w-screen overflow-hidden">
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
</template>
