import { createRouter, createWebHistory } from 'vue-router'
import ClustersView from '@/views/AWS/ClustersView.vue'
import ServiceView from '@/views/AWS/ServiceView.vue'
import ScheduledTasksView from '@/views/AWS/ScheduledTasksView.vue'
import SAMLSetup from '@/views/Settings/components/SAML/SAMLSetup.vue'
import AccountView from '@/views/Settings/AccountView.vue'
import ProfileView from '@/views/Settings/ProfileView.vue'
import SettingsView from '@/views/Settings/SettingsView.vue'
import LoginView from '@/views/Login/LoginView.vue'
import Cookies from 'js-cookie'
import { AuthService } from '@/services/auth.service.ts'

const authService = new AuthService()

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/aws/clusters',
    },
    {
      path: '/login',
      name: 'Login',
      component: LoginView,
    },
    {
      path: '/aws/clusters',
      name: 'clusters',
      component: ClustersView,
    },
    {
      path: '/aws/services',
      name: 'services',
      component: ServiceView,
    },
    {
      path: '/aws/scheduled-tasks',
      name: 'scheduled-tasks',
      component: ScheduledTasksView,
    },
    {
      path: '/settings',
      component: SettingsView,
    },
    {
      path: '/settings/saml-setup',
      component: SAMLSetup,
    },
    {
      path: '/settings/profile',
      component: ProfileView,
    },
    {
      path: '/settings/account',
      component: AccountView,
    },
  ],
})

router.beforeEach((to, from, next) => {
  const token = Cookies.get('token')
  const isTokenExpired = authService.isTokenExpired(token || '')
  const isAuthenticated = !!token && !isTokenExpired

  // If token is expired, remove it
  if (token && isTokenExpired) {
    console.log('test token expired')
    Cookies.remove('token')
  }

  if (to.path === '/login' && isAuthenticated) {
    next('/')
  } else if (to.path !== '/login' && !isAuthenticated) {
    next('/login')
  } else {
    next()
  }
})

export default router
