import { createRouter, createWebHistory } from 'vue-router';
import Cookies from 'js-cookie';
import { AuthService } from '@/services/auth.service.ts';
import { ActionService } from '@/services/action.service.ts';
import { UserService } from '@/services/user.service.ts';
import { useAuthStore } from '@/stores/authStore.ts';

const authService = new AuthService();
const actionService = new ActionService();
const userService = new UserService();

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            redirect: '/aws/clusters',
            meta: {
                title: 'AWS Clusters',
                requiresAuth: true,
            },
        },
        {
            path: '/login',
            name: 'Login',
            component: () => import('@/views/Login/LoginView.vue'),
            meta: {
                title: 'Login',
                requiresAuth: false,
                layout: 'auth',
            },
        },
        {
            path: '/forgot-password',
            name: 'ForgotPassword',
            component: () => import('@/views/Login/ForgotPasswordView.vue'),
            meta: {
                title: 'Forgot Password',
                requiresAuth: false,
                layout: 'auth',
            },
        },
        {
            path: '/confirm-reset-2fa',
            name: 'Confirm2FAReset',
            component: () => import('@/views/Login/ConfirmReset2FAView.vue'),
            meta: {
                title: 'Confirm 2FA Reset',
                requiresAuth: false,
                layout: 'auth',
            },
        },
        {
            path: '/reset-password',
            name: 'ResetPassword',
            component: () => import('@/views/Login/ResetPasswordView.vue'),
            meta: {
                title: 'Reset Password',
                requiresAuth: false,
                layout: 'auth',
            },
        },
        {
            path: '/aws/inventory',
            name: 'inventory',
            component: () => import('@/views/AWS/InventoryView.vue'),
            meta: {
                title: 'AWS Inventory',
            },
        },
        {
            path: '/aws/clusters',
            name: 'clusters',
            component: () => import('@/views/AWS/ClustersView.vue'),
            meta: {
                title: 'AWS Clusters',
            },
        },
        {
            path: '/aws/services',
            name: 'services',
            component: () => import('@/views/AWS/ServiceView.vue'),
            meta: {
                title: 'AWS Services',
            },
        },
        {
            path: '/aws/scheduled-tasks',
            name: 'scheduled-tasks',
            component: () => import('@/views/AWS/ScheduledTasksView.vue'),
            meta: {
                title: 'AWS Scheduled Tasks',
            },
        },
        {
            path: '/settings',
            component: () => import('@/views/Settings/SettingsView.vue'),
            meta: {
                title: 'Settings',
            },
        },
        {
            path: '/settings/saml-setup',
            component: () => import('@/views/Settings/SAMLView.vue'),
            meta: {
                title: 'SAML Setup',
            },
        },
        {
            path: '/settings/profile',
            component: () => import('@/views/Settings/ProfileView.vue'),
            meta: {
                title: 'Profile',
            },
        },
        {
            path: '/settings/actions',
            component: () => import('@/views/Settings/ActionView.vue'),
            meta: {
                title: 'Actions',
            },
        },
        {
            path: '/settings/account',
            component: () => import('@/views/Settings/AccountView.vue'),
            meta: {
                title: 'Account',
            },
        },
        {
            path: '/:pathMatch(.*)*',
            name: 'NotFound',
            component: () => import('@/views/NotFoundView.vue'),
            meta: {
                title: '404 - Page Not Found',
                requiresAuth: false,
                layout: 'auth',
            },
        },
    ],
});

router.beforeEach(async (to, from, next) => {
    document.title = to.meta.title ? `${to.meta.title} - Moon` : 'Moon';

    const token = Cookies.get('token');
    const isTokenExpired = authService.isTokenExpired(token || '');
    const isAuthenticated = !!token && !isTokenExpired;
    const requiresAuth = to.meta.requiresAuth !== false; // Default to true if not specified

    // If token is expired, remove it
    if (token && isTokenExpired) {
        Cookies.remove('token');
        const authStore = useAuthStore();
        authStore.clearUser();
    }

    // Handle authentication logic
    if (requiresAuth && !isAuthenticated) {
        // If trying to go to a protected route but not authenticated, redirect to login
        next('/login');
        return;
    } else if (!requiresAuth && isAuthenticated && to.name !== 'NotFound') {
        // If trying to go to public route but already authenticated, redirect to home
        // Exception: Allow access to 404 page even when authenticated
        next('/');
        return;
    }

    // If authenticated and going to a protected route, set user data
    if (isAuthenticated && requiresAuth) {
        try {
            const authStore = useAuthStore();

            // Only fetch user data if not already set
            if (!authStore.user) {
                const me = await userService.getDetails();
                const decodedToken = authService.decodeToken(token!);

                authStore.setUser(me);
                authStore.setPermissions(decodedToken.permissions);
            }

            // Execute the global refresh request
            actionService.refresh().catch((error) => {
                console.error('Failed to refresh actions:', error);
            });
        } catch (error) {
            console.error('Error setting user from token:', error);
            // If there's an error getting user data, clear auth and redirect to login
            Cookies.remove('token');
            const authStore = useAuthStore();
            authStore.clearUser();
            next('/login');
            return;
        }
    }

    next();
});

export default router;
