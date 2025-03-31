import { defineStore } from 'pinia'
import { ref } from 'vue'
import { PermissionEnum } from '@/enums/user/user.enum'
import type { UserDetailsResponseInput } from '@/views/Settings/components/Team/schema.ts'

export const useAuthStore = defineStore(
    'auth',
    () => {
        const userPermissions = ref<PermissionEnum[]>([])
        const user = ref<UserDetailsResponseInput | null>(null)

        const setUser = (userData: UserDetailsResponseInput) => {
            user.value = userData
        }

        const setPermissions = (permissions: PermissionEnum[]) => {
            userPermissions.value = permissions
        }

        const clearUser = () => {
            user.value = null
            userPermissions.value = []
        }

        return {
            user,
            userPermissions,
            setUser,
            setPermissions,
            clearUser,
        }
    },
    {
        persist: true,
    },
)
