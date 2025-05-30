<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useDataStore } from '@/stores/dataStore.ts';
import UserNav from '@/components/ui/custom-table/UserNav.vue';
import { Toaster } from '@/components/ui/toast';
import { useAuthStore } from '@/stores/authStore.ts';
import Cookies from 'js-cookie';
import { AuthService } from '@/services/auth.service.ts';
import { UserService } from '@/services/user.service.ts';
import AppSidebar from '@/components/Sidebar/components/AppSidebar.vue';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';

const store = useDataStore();
const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();
const authService = new AuthService();
const userService = new UserService();

onMounted(async () => {
    store.initializeData();
    await checkAndSetUserFromToken();
});

const checkAndSetUserFromToken = async () => {
    const token = Cookies.get('token');

    if (!token || authService.isTokenExpired(token)) {
        // Clear auth state if token is missing or expired
        authStore.clearUser();
        Cookies.remove('token');
        if (route.path !== '/login') {
            router.push('/login');
        }
        return;
    }

    try {
        const me = await userService.getDetails();
        const decodedToken = authService.decodeToken(token);

        authStore.setUser(me);
        authStore.setPermissions(decodedToken.permissions);
    } catch (error) {
        // authStore.clearUser();
        //
        // Cookies.remove('token');
        //
        // if (route.path !== '/login') {
        //     router.push('/login');
        // }

        console.log('Error checking and setting user from token:', error);
    }
};

setInterval(() => {
    const token = Cookies.get('token');

    if (token && authService.isTokenExpired(token)) {
        authStore.clearUser();
        Cookies.remove('token');

        if (route.path !== '/login') {
            router.push('/login');
        }
    }
}, 60000); // Check every minute

const isLoginPage = computed(() => route.path === '/login');

// Computed property to get the current page title from route meta
const currentPageTitle = computed(() => {
    // Access the title from the route's meta property
    // Fallback to a default title if meta.title is not defined
    return route.meta.title || 'Dashboard'; // Using 'Dashboard' as a common fallback
});
</script>

<template>
    <main vaul-drawer-wrapper autofocus class="h-screen w-screen overflow-hidden">
        <!-- Login page without layout -->
        <router-view v-if="isLoginPage"></router-view>

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
