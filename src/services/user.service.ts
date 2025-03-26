import { ApiService } from '@/services/generic.service.ts'
import type {
  UserCreateInput,
  UserDetailsResponseInput,
  UserInput,
} from '@/views/Settings/components/Team/schema.ts'
import type { PaginatedResult, PaginationParams } from '@/types/pagination/pagination.interface.ts'
import type {
  TwoFactorSetupResponse,
  TwoFactorStatus,
} from '@/views/Settings/components/Account/schema.ts'

export class UserService extends ApiService {
  public resource = '/users'

  async getDetails() {
    return this.get<UserDetailsResponseInput>(`${this.resource}/me`)
  }

  async getAllPaginated(params?: PaginationParams) {
    const queryParams = new URLSearchParams()

    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.orderBy) queryParams.append('orderBy', params.orderBy)
    if (params?.order) queryParams.append('order', params.order)

    if (params?.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        queryParams.append(`filter_${key}`, value.toString())
      })
    }

    const url = `${this.resource}?${queryParams.toString()}`
    return this.get<PaginatedResult<UserInput>>(url)
  }

  async inactivate(userId: string) {
    return this.post(`${this.resource}/${userId}/inactivate`, {})
  }

  async deleteUser(userId: string): Promise<any> {
    return this.delete(`${this.resource}/${userId}`)
  }

  async updateUser(userId: string, data: Partial<UserInput>): Promise<UserInput> {
    return this.put(`${this.resource}/${userId}`, data)
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.post(`${this.resource}/change-password`, { currentPassword, newPassword })
  }

  async changePasswordWith2FA(currentPassword: string, newPassword: string, code: string) {
    return this.post(`${this.resource}/2fa/change-password`, {
      currentPassword,
      newPassword,
      code,
    })
  }

  // 2FA Methods

  /**
   * Get the 2FA status for a user
   * @returns Promise with the 2FA status
   */
  async get2FAStatus(): Promise<TwoFactorStatus> {
    return this.get<TwoFactorStatus>(`${this.resource}/2fa/status`)
  }

  /**
   * Set up 2FA for a user
   * @returns Promise with the QR code URL and secret
   */
  async setup2FA(): Promise<TwoFactorSetupResponse> {
    return this.post(`${this.resource}/2fa/setup`, {})
  }

  /**
   * Verify a 2FA code
   * @param code The 6-digit verification code
   * @returns Promise with the verification result
   */
  async verify2FACode(code: string): Promise<any> {
    return this.post(`${this.resource}/2fa/verify`, { code })
  }

  /**
   * Verify a 2FA code for a session
   * @param code
   * @param sessionToken
   */
  // Add this method to the UserService class
  async verify2FASession(code: string, sessionToken?: string): Promise<any> {
    const headers: Record<string, string> = {}

    if (sessionToken) {
      headers['Authorization'] = `Bearer ${sessionToken}`
    }

    return this.post(`${this.resource}/2fa/verify-session`, { code }, {
      headers,
      credentials: 'include',
    })
  }


  /**
   * Disable 2FA for a user
   * @param code The 6-digit verification code
   * @returns Promise with the result
   */
  async disable2FA(code: string): Promise<any> {
    return this.post(`${this.resource}/2fa/disable`, { code })
  }

  async create(data: UserCreateInput): Promise<UserDetailsResponseInput> {
    return this.post(`${this.resource}`, data)
  }
}
