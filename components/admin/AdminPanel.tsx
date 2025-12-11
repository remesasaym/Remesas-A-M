import React, { useEffect, useState } from 'react'
import PaginationControls from '../PaginationControls';
import { isAdmin, fetchMetrics, fetchUsers, updateUser, deleteUser, fetchSettings, saveSettings, fetchActivity } from '../../services/adminService'
import KycReviewPanel from './KycReviewPanel';
import Transactions from './Transactions';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { toast } from 'sonner';
import { LayoutDashboard, Users, Settings, Activity, ShieldCheck, Search, Filter } from 'lucide-react';
import { PageTransition } from '../animations/PageTransition';

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
      <div className="p-6 flex flex-col items-center justify-center h-full text-center">
        <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
          <ShieldCheck className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-red-600 dark:text-red-400">Acceso denegado</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">No tienes privilegios de administrador para ver esta sección.</p>
      </div>
    )
  }

  const tabs = [
    { id: 'Dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'Operaciones', label: 'Operaciones', icon: Activity },
    { id: 'Users', label: 'Usuarios', icon: Users },
    { id: 'KYC', label: 'KYC', icon: ShieldCheck },
    { id: 'Settings', label: 'Configuración', icon: Settings },
  ] as const;

  return (
    <PageTransition>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">Panel de Administración</h2>
            <p className="text-slate-500 font-medium">Gestión integral de la plataforma</p>
          </div>

          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-x-auto max-w-full no-scrollbar">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${tab === t.id
                  ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                  }`}
              >
                <t.icon size={16} />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-900/30 flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <>
            {tab === 'Dashboard' && metrics && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card variant="default" padding="md" className="flex flex-col gap-1">
                  <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Transacciones</p>
                  <p className="text-3xl font-extrabold text-slate-800 dark:text-white">{metrics.totalTransactions}</p>
                  <div className="h-1 w-full bg-slate-100 dark:bg-slate-700 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-primary w-3/4 rounded-full"></div>
                  </div>
                </Card>
                <Card variant="default" padding="md" className="flex flex-col gap-1">
                  <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Monto enviado</p>
                  <p className="text-3xl font-extrabold text-slate-800 dark:text-white">{metrics.totalAmountSent}</p>
                  <div className="h-1 w-full bg-slate-100 dark:bg-slate-700 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-secondary w-1/2 rounded-full"></div>
                  </div>
                </Card>
                <Card variant="default" padding="md" className="flex flex-col gap-1">
                  <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Usuarios</p>
                  <p className="text-3xl font-extrabold text-slate-800 dark:text-white">{metrics.totalUsers}</p>
                  <div className="h-1 w-full bg-slate-100 dark:bg-slate-700 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-accent w-2/3 rounded-full"></div>
                  </div>
                </Card>
                <Card variant="default" padding="md" className="flex flex-col gap-1">
                  <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Verificaciones</p>
                  <p className="text-3xl font-extrabold text-slate-800 dark:text-white">{metrics.totalVerifications}</p>
                  <div className="h-1 w-full bg-slate-100 dark:bg-slate-700 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-warning w-4/5 rounded-full"></div>
                  </div>
                </Card>
              </div>
            )}

            {tab === 'Users' && (
              <Card variant="default" padding="none" className="overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                  <h3 className="font-bold text-slate-700 dark:text-slate-200">Gestión de Usuarios</h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Buscar usuario..."
                      className="pl-9 pr-4 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all w-64"
                    />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 text-xs uppercase text-slate-500 font-semibold">
                      <tr>
                        <th className="px-6 py-3">Nombre</th>
                        <th className="px-6 py-3">Email</th>
                        <th className="px-6 py-3">Teléfono</th>
                        <th className="px-6 py-3">Verificado</th>
                        <th className="px-6 py-3 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {users.slice((usersPage - 1) * usersPerPage, (usersPage - 1) * usersPerPage + usersPerPage).map(u => (
                        <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{u.full_name || '-'}</td>
                          <td className="px-6 py-4 text-slate-500">{u.email || '-'}</td>
                          <td className="px-6 py-4 text-slate-500 font-mono">{u.phone || '-'}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${u.is_verified ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                              {u.is_verified ? 'Verificado' : 'Pendiente'}
                            </span>
                          </td>
                          <td className="px-6 py-4 flex justify-end gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                toast.promise(async () => {
                                  await updateUser(u.id, { is_verified: !u.is_verified });
                                  const list = await fetchUsers();
                                  setUsers(list);
                                }, {
                                  loading: 'Actualizando estado...',
                                  success: 'Estado actualizado correctamente',
                                  error: 'Error al actualizar estado'
                                });
                              }}
                            >
                              {u.is_verified ? 'Invalidar' : 'Verificar'}
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => {
                                toast.promise(async () => {
                                  await deleteUser(u.id);
                                  const list = await fetchUsers();
                                  setUsers(list);
                                }, {
                                  loading: 'Eliminando usuario...',
                                  success: 'Usuario eliminado correctamente',
                                  error: 'Error al eliminar usuario'
                                });
                              }}
                            >
                              Eliminar
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-4 border-t border-slate-100 dark:border-slate-700">
                  <PaginationControls
                    currentPage={usersPage}
                    totalPages={Math.max(1, Math.ceil(users.length / usersPerPage))}
                    onPageChange={setUsersPage}
                    itemsPerPage={usersPerPage}
                    onItemsPerPageChange={(n) => { setUsersPerPage(n); setUsersPage(1); }}
                  />
                </div>
              </Card>
            )}

            {tab === 'KYC' && (
              <KycReviewPanel user={user as any} />
            )}

            {tab === 'Settings' && (
              <Card variant="default" padding="lg">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Configuración del Sistema</h3>
                <div className="space-y-4">
                  {settings
                    .sort((a, b) => {
                      // Orden personalizado
                      const order = ['remittance_fee_percentage', 'margen_exchange'];
                      const indexA = order.indexOf(a.key);
                      const indexB = order.indexOf(b.key);

                      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                      if (indexA !== -1) return -1;
                      if (indexB !== -1) return 1;
                      return a.key.localeCompare(b.key);
                    })
                    .map((s, idx) => (
                      <div key={s.key || idx} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            {s.key === 'remittance_fee_percentage' ? 'Comisión de Envío (%)' :
                              s.key === 'margen_exchange' ? 'Margen de Cambio (0.95 = 5%)' :
                                s.key}
                          </label>
                          <input
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            value={s.value || ''}
                            onChange={e => {
                              const newSettings = settings.map(item =>
                                item.key === s.key ? { ...item, value: e.target.value } : item
                              );
                              setSettings(newSettings);
                            }}
                          />
                        </div>
                        <Button
                          onClick={() => {
                            toast.promise(async () => {
                              await saveSettings(s);
                              const list = await fetchSettings();
                              setSettings(list);
                            }, {
                              loading: 'Guardando configuración...',
                              success: 'Configuración guardada',
                              error: 'Error al guardar configuración'
                            });
                          }}
                          className="mt-6 sm:mt-0"
                        >
                          Guardar
                        </Button>
                      </div>
                    ))}
                </div>
              </Card>
            )}

            {tab === 'Operaciones' && (
              <Transactions />
            )}
          </>
        )}
      </div>
    </PageTransition>
  )
}
