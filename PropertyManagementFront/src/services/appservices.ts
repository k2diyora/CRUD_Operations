function normalizeApiBaseUrl(): string {
  const explicitApiBase = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim()
  if (explicitApiBase) {
    return explicitApiBase.replace(/\/+$/, '')
  }

  const functionsUrl = (import.meta.env.VITE_FUNCTIONS_URL as string | undefined)?.trim()
  if (functionsUrl) {
    const trimmed = functionsUrl.replace(/\/+$/, '')
    return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`
  }

  return '/api'
}

const apiBaseUrl = normalizeApiBaseUrl()

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token')
  const headers = new Headers(init?.headers)
  
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${apiBaseUrl}/${path}`, {
    ...init,
    headers,
  })

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      window.dispatchEvent(new Event('unauthorized'));
    }
    const errorText = await response.text();
    throw new Error(errorText || response.statusText);
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    return (await response.json()) as T
  }

  return undefined as T
}

export const getProperties = (): Promise<unknown[]> => apiRequest<unknown[]>('GetProperties')
export const getTenants = (): Promise<unknown[]> => apiRequest<unknown[]>('GetTenants')
export const getPayments = (): Promise<unknown[]> => apiRequest<unknown[]>('GetPayments')
export const getDashboardSummary = (): Promise<unknown> => apiRequest<unknown>('dashboard/GetDashboardSummary')

export const createProperty = (payload: Record<string, unknown>): Promise<unknown> =>
  apiRequest<unknown>('CreateProperty', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const updateProperty = (payload: Record<string, unknown>): Promise<unknown> =>
  apiRequest<unknown>('UpdateProperty', {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

export const deleteProperty = (id: number): Promise<unknown> =>
  apiRequest<unknown>(`DeleteProperty?id=${id}`, {
    method: 'DELETE',
  })

export const createTenant = (payload: Record<string, unknown>): Promise<unknown> =>
  apiRequest<unknown>('CreateTenant', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const updateTenant = (payload: Record<string, unknown>): Promise<unknown> =>
  apiRequest<unknown>('UpdateTenant', {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

export const deleteTenant = (id: number): Promise<unknown> =>
  apiRequest<unknown>(`DeleteTenant?id=${id}`, {
    method: 'DELETE',
  })

export const createPayment = (payload: Record<string, unknown>): Promise<unknown> =>
  apiRequest<unknown>('CreatePayment', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const updatePayment = (payload: Record<string, unknown>): Promise<unknown> =>
  apiRequest<unknown>('UpdatePayment', {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

export const deletePayment = (id: number): Promise<unknown> =>
  apiRequest<unknown>(`DeletePayment?id=${id}`, {
    method: 'DELETE',
  })

export const login = async (username: string, password: string): Promise<{ token: string, refreshToken: string }> => {
  return apiRequest<{ token: string, refreshToken: string }>('Auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
}

export const refreshTokenApi = async (refreshToken: string): Promise<{ token: string, refreshToken: string }> => {
  return apiRequest<{ token: string, refreshToken: string }>('Auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  })
}

export const register = async (username: string, password: string): Promise<{ message: string }> => {
  return apiRequest<{ message: string }>('Auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
}
