import { createPersistedState } from 'pinia-plugin-persistedstate'
import Cookies from 'js-cookie'

export const piniaPersistedState = createPersistedState({
    storage: {
        getItem: (key: string): string | null => Cookies.get(key) ?? null,
        setItem: (key: string, value: string) => Cookies.set(key, value, { expires: 7 }), // Expires in 7 days
        removeItem: (key: string) => Cookies.remove(key),
    } as Storage,
})
