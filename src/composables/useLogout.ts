import { ref } from 'vue';
import { AuthService } from '@/services/auth.service';
import { useAuthStore } from '@/stores/authStore';
import { LogoutReason } from '@/enums/logout/logout.enum';
import Cookies from 'js-cookie';

// Global state for logout loader
const showLogoutLoader = ref(false);
const logoutReason = ref<LogoutReason>(LogoutReason.MANUAL);

export function useLogout() {
    const authService = new AuthService();
    const authStore = useAuthStore();

    const performLogout = async (reason: LogoutReason = LogoutReason.MANUAL) => {
        console.log('performLogout called with reason:', reason);

        // Show loader immediately
        logoutReason.value = reason;
        showLogoutLoader.value = true;

        console.log('Logout loader state set:', {
            show: showLogoutLoader.value,
            reason: logoutReason.value
        });

        try {
            // For manual logout, call the logout API
            if (reason === LogoutReason.MANUAL) {
                const response = (await authService.logout()) as { url: string };

                // Show loader for a brief moment before redirect
                await new Promise(resolve => setTimeout(resolve, 1000));

                if (response.url) {
                    window.location.href = response.url;
                    return;
                }
            } else {
                // For automatic logouts (session expired, etc.), just clear data
                authStore.clearUser();
                Cookies.remove('token');
                Cookies.remove('auth');
                localStorage.removeItem('data');
                sessionStorage.clear();

                // Show loader for a brief moment before redirect
                await new Promise(resolve => setTimeout(resolve, 800));
            }

            // Redirect to login
            window.location.href = '/login';
        } catch (error) {
            console.error('Logout error:', error);
            // Even if logout API fails, clear local data and redirect
            authStore.clearUser();
            Cookies.remove('token');
            Cookies.remove('auth');
            localStorage.removeItem('data');
            sessionStorage.clear();

            await new Promise(resolve => setTimeout(resolve, 500));
            window.location.href = '/login';
        }
    };

    const clearLogoutLoader = () => {
        showLogoutLoader.value = false;
    };

    return {
        showLogoutLoader,
        logoutReason,
        performLogout,
        clearLogoutLoader,
    };
}

// Export for global access
export const globalLogoutState = {
    showLogoutLoader,
    logoutReason,
};
