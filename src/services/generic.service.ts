import { useAuthStore } from '@/stores/authStore.ts'
import { useRouter } from 'vue-router'
import { jwtDecode } from 'jwt-decode'
import type { JwtInterface } from '@/types/jwt/jwt.interface.ts'
import Cookies from 'js-cookie'
import { config } from '../../app.config.ts'

export class ApiService {
  private baseUrl = config.BACKEND_URL
  protected jwt: string | null | undefined = null

  constructor() {
    this.jwt = Cookies.get('token')
  }

  public isTokenExpired(token: string): boolean {
    try {
      const decoded = jwtDecode<JwtInterface>(token)
      const currentTime = Date.now() / 1000

      return decoded.exp < currentTime
    } catch (error) {
      return true
    }
  }

  private async handleTokenExpiration() {
    const authStore = useAuthStore()
    const router = useRouter()

    // Clear user data
    authStore.clearUser()

    Cookies.remove('token')
    Cookies.remove('auth')

    // Redirect to login page
    await router.push('/login')
  }

  async request<T>(url: string, options: RequestInit = {}): Promise<T> {
    // Check if token exists and is expired before making the request
    if (this.jwt && this.isTokenExpired(this.jwt)) {
      await this.handleTokenExpiration()
      throw new Error('JWT token expired')
    }

    const headers = new Headers(options.headers)
    headers.set('Content-Type', 'application/json')

    // Add JWT token if available
    if (this.jwt) {
      headers.set('Authorization', `Bearer ${this.jwt}`)
    }

    const response = await fetch(`${this.baseUrl}${url}`, {
      ...options,
      headers,
    })

    // Handle 401 Unauthorized responses
    if (response.status === 401) {
      await this.handleTokenExpiration()
      throw new Error('Unauthorized')
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Request failed with status ${response.status}`)
    }

    return await response.json()
  }

  async get<T>(url: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(url, { ...options, method: 'GET' })
  }

  async post<D, T>(url: string, data: D, options: RequestInit = {}): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async put<D, T>(url: string, data: D, options: RequestInit = {}): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async delete<T>(url: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(url, { ...options, method: 'DELETE' })
  }
}
