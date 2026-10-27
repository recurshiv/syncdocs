// A failed API call. `status` is the HTTP status, or 0 if the server could not be reached.
export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export function errorMessage(err: unknown) {
  return err instanceof ApiError ? err.message : 'Something went wrong'
}

let onUnauthorized: (() => void) | null = null

// Lets the auth provider react when any request finds the session has expired.
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
}

// Every request goes through here. The session cookie is sent automatically
// because the page and the API share an origin.
export async function apiFetch<T>(path: string, { method = 'GET', body }: RequestOptions = {}): Promise<T> {
  let res: Response
  try {
    res = await fetch(`/api${path}`, {
      method,
      credentials: 'same-origin',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, 'Could not reach the server. Check your connection.')
  }

  if (res.status === 204) return undefined as T

  const data = await res.json().catch(() => null)

  if (!res.ok) {
    if (res.status === 401) onUnauthorized?.()
    throw new ApiError(res.status, data?.error ?? 'Something went wrong')
  }

  return data as T
}
