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
  const response = await fetch(`${apiBaseUrl}/${path}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...init,
  })

  if (!response.ok) {
    throw new Error(await response.text())
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
