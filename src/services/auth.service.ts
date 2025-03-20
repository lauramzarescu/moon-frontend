import { ApiService } from '@/services/generic.service.ts'
import type { LoginWithEmailAndPassword } from '@/views/Login/components/schema.ts'
import type { JwtInterface } from '@/types/jwt/jwt.interface.ts'
import { LoginType } from '@/enums/user/user.enum.ts'
import { jwtDecode } from 'jwt-decode'
import { useAuthStore } from '@/stores/authStore.ts'

export class AuthService extends ApiService {
  public resource = '/auth'

  decodeToken(token: string | null | undefined) {
    if (!token) {
      throw new Error('No token provided')
    }

    return jwtDecode(token) as JwtInterface
  }

  async login(data: LoginWithEmailAndPassword) {
    return await this.post<LoginWithEmailAndPassword, any>(`${this.resource}/login`, data, { credentials: 'include' })
  }

  async logout() {
    const authStore = useAuthStore()
    const decodedToken = this.decodeToken(this.jwt)

    // Clear user data from store
    authStore.clearUser()
    // clear all local storage and cookies
    localStorage.removeItem('data')
    sessionStorage.clear()
    document.cookie = ''

    if (decodedToken.loginType === LoginType.saml) {
      return this.post(`${this.resource}/saml/logout`, {}, { credentials: 'include' })
    }

    return this.post(`${this.resource}/logout`, {}, { credentials: 'include' })
  }
}
