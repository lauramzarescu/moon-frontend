import { PermissionEnum } from '@/enums/user/user.enum'
import { useAuthStore } from '@/stores/authStore'

export function usePermissions() {
    const authStore = useAuthStore()

    const hasPermission = (permission: PermissionEnum): boolean => {
        return authStore.userPermissions.includes(permission)
    }

    return {
        hasPermission,
    }
}
