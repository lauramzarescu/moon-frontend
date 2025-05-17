import { createRouter, createWebHistory } from 'vue-router';
import ClustersView from '@/views/AWS/ClustersView.vue';
import ServiceView from '@/views/AWS/ServiceView.vue';
import ScheduledTasksView from '@/views/AWS/ScheduledTasksView.vue';
import SAMLSetup from '@/views/Settings/components/SAML/SAMLSetup.vue';
import AccountView from '@/views/Settings/AccountView.vue';
import ProfileView from '@/views/Settings/ProfileView.vue';
import SettingsView from '@/views/Settings/SettingsView.vue';
import LoginView from '@/views/Login/LoginView.vue';
import Cookies from 'js-cookie';
import { AuthService } from '@/services/auth.service.ts';
import { ActionService } from '@/services/action.service.ts'; // Import ActionService
import InventoryView from '@/views/AWS/InventoryView.vue';
import ActionView from '@/views/Settings/ActionView.vue';

const authService = new AuthService();
const actionService = new ActionService(); // Instantiate ActionService

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
            component: LoginView,
            meta: {
                title: 'Login',
            },
        },
        {
            path: '/aws/inventory',
            name: 'inventory',
            component: InventoryView,
            meta: {
                title: 'AWS Inventory',
            },
        },
        {
            path: '/aws/clusters',
            name: 'clusters',
            component: ClustersView,
            meta: {
                title: 'AWS Clusters',
            },
        },
        {
            path: '/aws/services',
            name: 'services',
            component: ServiceView,
            meta: {
                title: 'AWS Services',
            },
        },
        {
            path: '/aws/scheduled-tasks',
            name: 'scheduled-tasks',
            component: ScheduledTasksView,
            meta: {
                title: 'AWS Scheduled Tasks',
            },
        },
        {
            path: '/settings',
            component: SettingsView,
            meta: {
                title: 'Settings',
            },
        },
        {
            path: '/settings/saml-setup',
            component: SAMLSetup,
            meta: {
                title: 'SAML Setup',
            },
        },
        {
            path: '/settings/profile',
            component: ProfileView,
            meta: {
                title: 'Profile',
            },
        },
        {
            path: '/settings/actions',
            component: ActionView,
            meta: {
                title: 'Actions',
            },
        },
        {
            path: '/settings/account',
            component: AccountView,
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
        // If authenticated and not going to login, or going to login and not authenticated, proceed
        // Execute the global refresh request if authenticated
        if (isAuthenticated) {
            try {
                console.log('Executing global action refresh...');
                await actionService.refresh();
                console.log('Action refresh successful.');
            } catch (error) {
                console.error('Failed to refresh actions:', error);
            }
        }
        next();
    }
});

export default router;
