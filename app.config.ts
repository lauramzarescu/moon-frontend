export const config = (() => {
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '/v1'
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '/'

  return {
    BACKEND_URL,
    SOCKET_URL,
  }
})()
