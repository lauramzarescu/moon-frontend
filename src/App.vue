<script setup lang="ts">
import { computed, onMounted } from 'vue'
import Sidebar from '@/components/Sidebar/Sidebar.vue'
import { useRoute, useRouter } from 'vue-router'
import { useDataStore } from '@/stores/dataStore.ts'
import UserNav from '@/components/ui/custom-table/UserNav.vue'
import { Toaster } from '@/components/ui/toast'
import { useAuthStore } from '@/stores/authStore.ts'
import Cookies from 'js-cookie'
import { AuthService } from '@/services/auth.service.ts'
import { UserService } from '@/services/user.service.ts'

const store = useDataStore()
const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()
const authService = new AuthService()
const userService = new UserService()

onMounted(async () => {
  store.initializeData()
  await checkAndSetUserFromToken()
})

const checkAndSetUserFromToken = async () => {
  const token = Cookies.get('token')

  if (!token || authService.isTokenExpired(token)) {
    // Clear auth state if token is missing or expired
    authStore.clearUser()
    Cookies.remove('token')
    if (route.path !== '/login') {
      router.push('/login')
    }
    return
  }

  try {
    const decodedToken = authService.decodeToken(token)
    const me = await userService.getDetails()

    authStore.setUser(me)
    authStore.setPermissions(decodedToken.permissions)
  } catch (error) {
    authStore.clearUser()

    Cookies.remove('token')

    if (route.path !== '/login') {
      router.push('/login')
    }
  }
}

setInterval(() => {
  const token = Cookies.get('token')

  if (token && authService.isTokenExpired(token)) {
    authStore.clearUser()
    Cookies.remove('token')

    if (route.path !== '/login') {
      router.push('/login')
    }
  }
}, 60000) // Check every minute

const isLoginPage = computed(() => route.path === '/login')
</script>

<template>
  <main vaul-drawer-wrapper autofocus class="h-screen w-screen bg-background overflow-hidden">
    <!-- Login page without layout -->
    <router-view v-if="isLoginPage"></router-view>

    <!-- Main layout with sidebar for other routes -->
    <div v-else id="app" class="flex h-full">
      <Sidebar class="h-screen w-64 left-0" />
      <div class="flex-1 flex-col space-y-6 p-6 overflow-auto">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-bold tracking-tight capitalize">
              <!--              {{ route.name }}-->
            </h2>
          </div>
          <div class="flex items-center space-x-2">
            <UserNav />
          </div>
        </div>
        <div class="flex-1 space-y-10">
          <router-view></router-view>
        </div>
      </div>
    </div>
  </main>
  <Toaster />
</template>
