import { AuthService } from '@/services/auth.service';
import { useAuthStore } from '@/stores/authStore';
import { LogoutReason } from '@/enums/logout/logout.enum';
import Cookies from 'js-cookie';

export interface SessionValidationResult {
    shouldLogout: boolean;
    logoutReason?: LogoutReason;
    isAuthenticated: boolean;
}

export interface SessionValidationOptions {
    requiresAuth: boolean;
    context?: 'router' | 'interval' | 'api';
}

/**
 * Centralized session validation logic
 * Used by both router guards and periodic validation
 */
export function validateSession(options: SessionValidationOptions): SessionValidationResult {
    const { requiresAuth, context = 'unknown' } = options;

    const authService = new AuthService();
    const authStore = useAuthStore();

    const token = Cookies.get('token');
    const hasUser = !!authStore.user;

    // Determine authentication status
    const isTokenExpired = token ? authService.isTokenExpired(token) : true;
    const isAuthenticated = !!token && !isTokenExpired;

    let shouldLogout = false;
    let logoutReason: LogoutReason | undefined;

    // Only check for logout scenarios on protected routes
    if (requiresAuth) {
        if (!token && hasUser) {
            // Token is missing but user was authenticated (cookies deleted)
            console.log(`${context}: Session expired - Token missing but user was authenticated`);
            shouldLogout = true;
            logoutReason = LogoutReason.SESSION_EXPIRED;
        } else if (token && isTokenExpired) {
            console.log(`${context}: Session expired - Token is expired`);
            shouldLogout = true;
            logoutReason = LogoutReason.TOKEN_EXPIRED;
        }

        if (shouldLogout) {
            console.log(`${context}: Should logout with reason:`, logoutReason);
        }
    }

    return {
        shouldLogout,
        logoutReason,
        isAuthenticated,
    };
}

/**
 * Performs logout with the shared logout composable
 * Handles dynamic import to avoid circular dependencies
 */
export async function performSessionLogout(reason: LogoutReason): Promise<void> {
    const { useLogout } = await import('@/composables/useLogout');
    const { performLogout } = useLogout();
    await performLogout(reason);
}
