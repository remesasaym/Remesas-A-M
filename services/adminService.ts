import { supabase } from '../supabaseClient'

export const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || '')
export const ADMIN_UID = (process.env.ADMIN_UID || '')
const USE_BACKEND = ((process.env.USE_BACKEND_ADMIN || 'false') === 'true')

export function isAdmin(user: { email?: string; id?: string } | null): boolean {
  if (!user) return false
  const email = ADMIN_EMAIL
  const uid = ADMIN_UID
  return (email && user.email === email) || (uid && user.id === uid)
}

async function authHeaders() {
  const { data } = await supabase.auth.getSession()
  const token = data?.session?.access_token || ''
  return { Authorization: `Bearer ${token}` }
}

async function tryBackend<T>(path: string, options: RequestInit): Promise<T | null> {
  if (!USE_BACKEND) return null
  try {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const res = await fetch(`${API_URL}${path}`, options)
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export async function fetchMetrics(): Promise<any> {
  const headers = await authHeaders()
  const backend = await tryBackend<any>('/api/admin/metrics', { headers })
  if (backend) return backend
  const tx = await supabase.from('transactions').select('amount_sent')
  const users = await supabase.from('profiles').select('id')
  const ver = await supabase.from('verification_requests').select('id')
  const totalTransactions = Array.isArray(tx.data) ? tx.data.length : 0
  const totalAmountSent = Array.isArray(tx.data) ? tx.data.reduce((s, r: any) => s + (Number(r.amount_sent) || 0), 0) : 0
  const totalUsers = Array.isArray(users.data) ? users.data.length : 0
  const totalVerifications = Array.isArray(ver.data) ? ver.data.length : 0
  return { totalTransactions, totalAmountSent, totalUsers, totalVerifications }
}

export async function fetchUsers(): Promise<any[]> {
  const headers = await authHeaders()
  const backend = await tryBackend<any[]>('/api/admin/users', { headers })
  if (backend) return backend
  const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
  return data || []
}

export async function updateUser(id: string, updates: any): Promise<void> {
  const headers = await authHeaders()
  const backend = await tryBackend<any>(`/api/admin/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(updates)
  })
  if (backend === null) {
    await supabase.from('profiles').update(updates).eq('id', id)
  }
}

export async function deleteUser(id: string): Promise<void> {
  const headers = await authHeaders()
  const backend = await tryBackend<any>(`/api/admin/users/${id}`, { method: 'DELETE', headers })
  if (backend === null) {
    await supabase.from('profiles').delete().eq('id', id)
  }
}

export async function fetchSettings(): Promise<any[]> {
  const headers = await authHeaders()
  const backend = await tryBackend<any[]>('/api/admin/settings', { headers })
  if (backend) return backend
  const { data } = await supabase.from('settings').select('*')
  return data || []
}

export async function saveSettings(payload: any): Promise<void> {
  const headers = await authHeaders()
  const backend = await tryBackend<any>('/api/admin/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(payload)
  })
  if (backend === null) {
    await supabase.from('settings').upsert(payload, { onConflict: 'key' })
  }
}

export async function fetchActivity(): Promise<{ transactions: any[]; verifications: any[] }> {
  const headers = await authHeaders()
  const backend = await tryBackend<{ transactions: any[]; verifications: any[] }>('/api/admin/activity', { headers })
  if (backend) return backend
  const tx = await supabase.from('transactions').select('*').order('created_at', { ascending: false }).limit(50)
  const ver = await supabase.from('verification_requests').select('*').order('created_at', { ascending: false }).limit(50)
  return { transactions: tx.data || [], verifications: ver.data || [] }
}