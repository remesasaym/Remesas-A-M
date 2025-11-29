import React, { useEffect, useState } from 'react'
import PaginationControls from '../PaginationControls';
import { isAdmin, fetchMetrics, fetchUsers, updateUser, deleteUser, fetchSettings, saveSettings, fetchActivity } from '../../services/adminService'
import KycReviewPanel from './KycReviewPanel';
import Transactions from './Transactions';

type Tab = 'Dashboard' | 'Users' | 'Settings' | 'Operaciones' | 'KYC'

export default function AdminPanel({ user }: { user: { email?: string; id?: string } }) {
  const [tab, setTab] = useState<Tab>('Dashboard')
  const [metrics, setMetrics] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [settings, setSettings] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const USE_BACKEND = ((process.env.USE_BACKEND_ADMIN || 'false') === 'true')
  const [error, setError] = useState<string | null>(null)
  const [usersPage, setUsersPage] = useState(1)
  const [usersPerPage, setUsersPerPage] = useState(10)

  useEffect(() => {
    if (!isAdmin(user)) return
      ; (async () => {
        setLoading(true)
        try {
          const [m, u, s] = await Promise.all([
            fetchMetrics(),
            fetchUsers(),
            fetchSettings(),
          ])
          setMetrics(m)
          setUsers(u)
          setSettings(s)
          setError(null)
        } catch (e) {
          if (USE_BACKEND) {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
            setError(`No se pudo conectar al backend en ${API_URL}. Verifica que el servidor esté iniciado y variables SUPABASE_URL/SERVICE_ROLE estén configuradas.`)
          } else {
            setError(null)
          }
        } finally {
          setLoading(false)
        }
      })()
  }, [user])

  if (!isAdmin(user)) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-bold text-red-600 dark:text-red-400">Acceso denegado</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300">No tienes privilegios de administrador.</p>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Panel de Administración</h2>
        <div className="flex gap-2 overflow-x-auto max-w-full">
          {(['Dashboard', 'Operaciones', 'Users', 'KYC', 'Settings'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-3 py-2 rounded-md text-sm ${tab === t ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}>{t}</button>
          ))}
        </div>
      </div>

      {loading && <div className="text-sm text-gray-500 dark:text-gray-400">Cargando...</div>}
      {error && <div className="text-sm text-red-600 dark:text-red-400 mb-3">{error}</div>}

      {tab === 'Dashboard' && metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <p className="text-sm text-gray-500 dark:text-gray-400">Transacciones</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{metrics.totalTransactions}</p>
          </div>
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <p className="text-sm text-gray-500 dark:text-gray-400">Monto enviado</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{metrics.totalAmountSent}</p>
          </div>
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <p className="text-sm text-gray-500 dark:text-gray-400">Usuarios</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{metrics.totalUsers}</p>
          </div>
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <p className="text-sm text-gray-500 dark:text-gray-400">Verificaciones</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{metrics.totalVerifications}</p>
          </div>
        </div>
      )}

      {tab === 'Users' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-2 sm:p-4">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 dark:text-gray-300">
                  <th className="py-2">Nombre</th>
                  <th className="py-2">Email</th>
                  <th className="py-2">Teléfono</th>
                  <th className="py-2">Verificado</th>
                  <th className="py-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.slice((usersPage - 1) * usersPerPage, (usersPage - 1) * usersPerPage + usersPerPage).map(u => (
                  <tr key={u.id} className="border-t border-gray-200 dark:border-gray-700">
                    <td className="py-2">{u.full_name || ''}</td>
                    <td className="py-2">{u.email || ''}</td>
                    <td className="py-2">{u.phone || ''}</td>
                    <td className="py-2">{u.is_verified ? 'Sí' : 'No'}</td>
                    <td className="py-2 flex gap-2">
                      <button onClick={async () => { await updateUser(u.id, { is_verified: !u.is_verified }); const list = await fetchUsers(); setUsers(list) }} className="px-2 py-1 rounded bg-indigo-600 text-white text-xs sm:text-sm">Toggle</button>
                      <button onClick={async () => { await deleteUser(u.id); const list = await fetchUsers(); setUsers(list) }} className="px-2 py-1 rounded bg-red-600 text-white text-xs sm:text-sm">Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <PaginationControls
            currentPage={usersPage}
            totalPages={Math.max(1, Math.ceil(users.length / usersPerPage))}
            onPageChange={setUsersPage}
            itemsPerPage={usersPerPage}
            onItemsPerPageChange={(n) => { setUsersPerPage(n); setUsersPage(1); }}
          />
        </div>
      )}

      {tab === 'KYC' && (
        <KycReviewPanel user={user as any} />
      )}

      {tab === 'Settings' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="space-y-2">
            {settings.map((s, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <input className="flex-1 bg-gray-100 dark:bg-gray-700 rounded px-2 py-1 text-gray-800 dark:text-gray-200" value={s.value || ''} onChange={e => { const next = [...settings]; next[idx] = { ...s, value: e.target.value }; setSettings(next) }} />
                <button onClick={async () => { await saveSettings(s); const list = await fetchSettings(); setSettings(list) }} className="px-2 py-1 rounded bg-indigo-600 text-white">Guardar</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'Operaciones' && (
        <Transactions />
      )}
    </div>
  )
}
