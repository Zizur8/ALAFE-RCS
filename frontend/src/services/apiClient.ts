const API_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api'

const TOKEN_STORAGE_KEY = 'alafe_token'

/** Devuelve el JWT almacenado en localStorage, o null si no existe. */
export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY)
}

/** Guarda el JWT tras un login exitoso. */
export function storeToken(token: string): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, token)
}

/** Elimina el JWT (logout). */
export function removeToken(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY)
}

/** Error uniforme devuelto por la API (JSON con { statusCode, message }). */
export class ApiError extends Error {
  readonly statusCode: number

  constructor(message: string, statusCode: number) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
  }
}

export interface ApiRequestOptions extends Omit<RequestInit, 'headers'> {
  headers?: Record<string, string>
}

/**
 * Cliente HTTP centralizado.
 * - Lee la base URL desde `import.meta.env.VITE_API_URL`.
 * - Inyecta `Authorization: Bearer <token>` si existe token en localStorage.
 */
export async function apiClient<T>(
  endpoint: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { headers = {}, ...rest } = options
  const token = getStoredToken()

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  }

  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...rest,
    headers: requestHeaders,
  })

  if (!response.ok) {
    let message = `Error ${response.status}`
    try {
      const body = await response.json()
      if (body && typeof body.message === 'string') {
        message = body.message
      }
    } catch {
      // Respuesta sin cuerpo JSON: se conserva el mensaje genérico.
    }
    throw new ApiError(message, response.status)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

/** Atajos verbales sobre el cliente base. */
export const api = {
  get: <T>(endpoint: string) => apiClient<T>(endpoint, { method: 'GET' }),
  post: <T>(endpoint: string, body?: unknown) =>
    apiClient<T>(endpoint, { method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined }),
  put: <T>(endpoint: string, body?: unknown) =>
    apiClient<T>(endpoint, { method: 'PUT', body: body !== undefined ? JSON.stringify(body) : undefined }),
  delete: <T>(endpoint: string) => apiClient<T>(endpoint, { method: 'DELETE' }),
}
