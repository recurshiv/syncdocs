import type { User } from '../types/user.ts'
import { apiFetch } from './client.ts'

export async function fetchCurrentUser() {
  const { user } = await apiFetch<{ user: User }>('/auth/me')
  return user
}

export async function login(email: string, password: string) {
  const { user } = await apiFetch<{ user: User }>('/auth/login', {
    method: 'POST',
    body: { email, password },
  })
  return user
}

export async function signup(name: string, email: string, password: string) {
  const { user } = await apiFetch<{ user: User }>('/auth/signup', {
    method: 'POST',
    body: { name, email, password },
  })
  return user
}

export async function logout() {
  await apiFetch<void>('/auth/logout', { method: 'POST' })
}
