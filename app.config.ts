export const config = (() => {
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'VITE_BACKEND_URL_PLACEHOLDER'
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'VITE_SOCKET_URL_PLACEHOLDER'

  return {
    BACKEND_URL,
    SOCKET_URL,
  }
})()
