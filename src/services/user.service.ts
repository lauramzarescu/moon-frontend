import { ApiService } from '@/services/generic.service.ts';
import type {
    ChangePasswordInput,
    ChangePasswordWith2FAInput,
    ForgotPasswordInput,
    ResetPasswordInput,
    TwoFactorMethodSelectInput,
    UserCreateByInvitationInput,
    UserCreateInput,
    UserDetailsResponseInput,
    UserDeviceInfo,
    UserInput,
    YubikeyListInput,
    YubikeyRemoveInput,
    YubikeySetupInput,
    YubikeyVerifyInput,
    WebAuthnRegistrationStartInput,
    WebAuthnRegistrationCompleteInput,
    WebAuthnAuthenticationStartInput,
    WebAuthnAuthenticationCompleteInput,
} from '@/views/Settings/components/Team/schema.ts';
import type { PaginatedResult, PaginationParams } from '@/types/pagination/pagination.interface.ts';
import type { TwoFactorSetupResponse, TwoFactorStatus } from '@/views/Settings/components/Account/schema.ts';

export class UserService extends ApiService {
    public resource = '/users';

    async getDetails() {
        return this.get<UserDetailsResponseInput>(`${this.resource}/me`);
    }

    async getAllPaginated(params?: PaginationParams) {
        const queryParams = new URLSearchParams();

        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.orderBy) queryParams.append('orderBy', params.orderBy);
        if (params?.order) queryParams.append('order', params.order);

        if (params?.filters) {
            Object.entries(params.filters).forEach(([key, value]) => {
                queryParams.append(`filter_${key}`, value.toString());
            });
        }

        const url = `${this.resource}?${queryParams.toString()}`;
        return this.get<PaginatedResult<UserInput>>(url);
    }

    async inactivate(userId: string) {
        return this.post(`${this.resource}/${userId}/inactivate`, {});
    }

    async create(data: UserCreateInput): Promise<UserDetailsResponseInput> {
        return this.post(`${this.resource}`, data);
    }

    async createByInvitation(data: UserCreateByInvitationInput): Promise<UserDetailsResponseInput> {
        return this.post(`${this.resource}/invitation`, data);
    }

    async deleteUser(userId: string): Promise<any> {
        return this.delete(`${this.resource}/${userId}`);
    }

    async updateUser(userId: string, data: Partial<UserInput>): Promise<UserInput> {
        return this.put(`${this.resource}/${userId}`, data);
    }

    async changePassword(data: ChangePasswordInput) {
        return this.post(`${this.resource}/change-password`, data);
    }

    async changePasswordWith2FA(data: ChangePasswordWith2FAInput) {
        return this.post(`${this.resource}/2fa/change-password`, data);
    }

    async triggerResetPasswordAsAdmin(userId: string) {
        return this.post(`${this.resource}/admin/reset-password/${userId}`, {});
    }

    async forgotPassword(data: ForgotPasswordInput) {
        return this.post(`${this.resource}/forgot-password`, data);
    }

    async resetPassword(data: ResetPasswordInput) {
        return this.post(`${this.resource}/reset-password`, data);
    }

    async importUsers(file: File): Promise<any> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = () => {
                const base64String = (reader.result as string).split(',')[1]; // Remove data:application/json;base64, prefix

                this.post(`${this.resource}/import/json`, {
                    file: base64String,
                    filename: file.name,
                    mimetype: file.type,
                })
                    .then(resolve)
                    .catch(reject);
            };

            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }

    async exportUsers(): Promise<any> {
        return this.get(`${this.resource}/export/json`);
    }

    // 2FA Methods

    /**
     * Get the 2FA status for a user
     * @returns Promise with the 2FA status
     */
    async get2FAStatus(): Promise<TwoFactorStatus> {
        return this.get<TwoFactorStatus>(`${this.resource}/2fa/status`);
    }

    /**
     * Set up 2FA for a user
     * @returns Promise with the QR code URL and secret
     */
    async setup2FA(): Promise<TwoFactorSetupResponse> {
        return this.post(`${this.resource}/2fa/setup`, {});
    }

    /**
     * Verify a 2FA code
     * @param code The 6-digit verification code
     * @returns Promise with the verification result
     */
    async verify2FACode(code: string): Promise<any> {
        return this.post(`${this.resource}/2fa/verify`, { code });
    }

    /**
     * Verify a 2FA code for a session
     * @param code
     * @param sessionToken
     */
    async verify2FASession(code: string, sessionToken?: string): Promise<any> {
        const headers: Record<string, string> = {};

        if (sessionToken) {
            headers['Authorization'] = `Bearer ${sessionToken}`;
        }

        return this.post(
            `${this.resource}/2fa/verify-session`,
            { code },
            {
                headers,
                credentials: 'include',
            },
        );
    }

    /**
     * Disable 2FA for a user
     * @param code The 6-digit verification code
     * @returns Promise with the result
     */
    async disable2FA(code: string): Promise<any> {
        return this.post(`${this.resource}/2fa/disable`, { code });
    }

    async triggerReset2FAAsAdmin(userId: string) {
        return this.post(`${this.resource}/admin/2fa/reset/${userId}`, {});
    }

    async confirmReset2FA(token: string) {
        return this.post(`${this.resource}/2fa/reset/confirm/${token}`, {});
    }

    // Device Management Methods

    /**
     * Get all authorized devices for the current user
     * @returns Promise with the list of authorized devices
     */
    async getAuthorizedDevices(): Promise<UserDeviceInfo[]> {
        return this.get(`${this.resource}/devices`);
    }

    /**
     * Remove an authorized device
     * @param deviceId The device ID to remove
     * @returns Promise with the result
     */
    async removeDevice(deviceId: string): Promise<any> {
        return this.delete(`${this.resource}/devices/${deviceId}`);
    }

    // YubiKey Methods

    /**
     * Set up YubiKey 2FA for a user
     * @param data YubiKey setup data containing OTP
     * @returns Promise with the setup result
     */
    async setupYubikey(data: YubikeySetupInput): Promise<any> {
        return this.post(`${this.resource}/2fa/yubikey/setup`, data);
    }

    /**
     * Verify a YubiKey OTP
     * @param data YubiKey verification data containing OTP
     * @returns Promise with the verification result
     */
    async verifyYubikey(data: YubikeyVerifyInput): Promise<any> {
        return this.post(`${this.resource}/2fa/yubikey/verify`, data);
    }

    /**
     * Get all YubiKeys for the current user
     * @returns Promise with the list of user's YubiKeys
     */
    async getUserYubikeys(): Promise<YubikeyListInput> {
        return this.get(`${this.resource}/2fa/yubikey/list`);
    }

    /**
     * Remove a YubiKey from the user's account
     * @param data YubiKey removal data containing YubiKey ID
     * @returns Promise with the removal result
     */
    async removeYubikey(data: YubikeyRemoveInput): Promise<any> {
        return this.delete(`${this.resource}/2fa/yubikey/${data.yubikeyId}`);
    }

    /**
     * Set the 2FA method for the user
     * @param data Two-factor method selection data
     * @returns Promise with the result
     */
    async setTwoFactorMethod(data: TwoFactorMethodSelectInput): Promise<any> {
        return this.post(`${this.resource}/2fa/method`, data);
    }

    // WebAuthn Methods

    /**
     * Start WebAuthn registration process
     * @param data WebAuthn registration start data
     * @returns Promise with registration options
     */
    async startWebAuthnRegistration(data: WebAuthnRegistrationStartInput): Promise<any> {
        return this.post(`${this.resource}/2fa/webauthn/registration/start`, data);
    }

    /**
     * Complete WebAuthn registration process
     * @param data WebAuthn registration complete data
     * @returns Promise with registration result
     */
    async completeWebAuthnRegistration(data: WebAuthnRegistrationCompleteInput): Promise<any> {
        return this.post(`${this.resource}/2fa/webauthn/registration/complete`, data);
    }

    /**
     * Start WebAuthn authentication process
     * @param data WebAuthn authentication start data
     * @param sessionToken Optional session token for login flow
     * @returns Promise with authentication options
     */
    async startWebAuthnAuthentication(data: WebAuthnAuthenticationStartInput, sessionToken?: string): Promise<any> {
        const headers: Record<string, string> = {};

        if (sessionToken) {
            headers['Authorization'] = `Bearer ${sessionToken}`;
        }

        return this.post(`${this.resource}/2fa/webauthn/authentication/start`, data, { headers });
    }

    /**
     * Complete WebAuthn authentication process
     * @param data WebAuthn authentication complete data
     * @param sessionToken Optional session token for login flow
     * @returns Promise with authentication result
     */
    async completeWebAuthnAuthentication(data: WebAuthnAuthenticationCompleteInput, sessionToken?: string): Promise<any> {
        const headers: Record<string, string> = {};

        if (sessionToken) {
            headers['Authorization'] = `Bearer ${sessionToken}`;
        }

        return this.post(`${this.resource}/2fa/webauthn/authentication/complete`, data, { headers });
    }

    // WebAuthn Re-authentication Methods (for authenticated users)

    /**
     * Start WebAuthn re-authentication process for authenticated users
     * @param data WebAuthn authentication start data
     * @returns Promise with authentication options
     */
    async startWebAuthnReAuthentication(data: WebAuthnAuthenticationStartInput): Promise<any> {
        return this.post(`${this.resource}/2fa/webauthn/start`, data);
    }

    /**
     * Complete WebAuthn re-authentication process for authenticated users
     * @param data WebAuthn authentication complete data
     * @returns Promise with authentication result
     */
    async completeWebAuthnReAuthentication(data: WebAuthnAuthenticationCompleteInput): Promise<any> {
        return this.post(`${this.resource}/2fa/webauthn/complete`, data);
    }
}
