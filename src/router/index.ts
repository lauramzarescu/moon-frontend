import { createRouter, createWebHistory } from 'vue-router';
import Cookies from 'js-cookie';
import { AuthService } from '@/services/auth.service.ts';
import { ActionService } from '@/services/action.service.ts';

const authService = new AuthService();
const actionService = new ActionService();

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            redirect: '/aws/clusters',
            meta: {
                title: 'AWS Clusters',
            },
        },
        {
            path: '/login',
            name: 'Login',
            component: () => import('@/views/Login/LoginView.vue'),
            meta: {
                title: 'Login',
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
    ],
});

router.beforeEach(async (to, from, next) => {
    // Make the guard async
    document.title = to.meta.title ? `${to.meta.title} - Moon` : 'Moon';

    const token = Cookies.get('token');
    const isTokenExpired = authService.isTokenExpired(token || '');
    const isAuthenticated = !!token && !isTokenExpired;

    // If token is expired, remove it
    if (token && isTokenExpired) {
        Cookies.remove('token');
    }

    if (to.path === '/login' && isAuthenticated) {
        // If trying to go to login but already authenticated, redirect to home
        next('/');
    } else if (to.path !== '/login' && !isAuthenticated) {
        // If trying to go to a protected route but not authenticated, redirect to login
        next('/login');
    } else {
        next();

        // If authenticated and not going to login, or going to login and not authenticated, proceed
        // Execute the global refresh request if authenticated
        if (isAuthenticated) {
            actionService.refresh().catch((error) => {
                console.error('Failed to refresh actions:', error);
            });
        }
    }
});

export default router;
