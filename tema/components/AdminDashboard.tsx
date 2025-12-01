
import React from 'react';
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip } from 'recharts';
import { Users, DollarSign, Activity } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const data = [
    { name: 'Lun', envios: 4000 },
    { name: 'Mar', envios: 3000 },
    { name: 'Mie', envios: 2000 },
    { name: 'Jue', envios: 2780 },
    { name: 'Vie', envios: 1890 },
    { name: 'Sab', envios: 2390 },
    { name: 'Dom', envios: 3490 },
  ];

  return (
    <div className="space-y-6 animate-fade-in bg-[#FCFBF8]">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-slate-800">Panel Administrativo</h2>
        <span className="bg-slate-800 text-white text-xs px-3 py-1 rounded-full">Admin</span>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard icon={Users} label="Usuarios Totales" value="1,240" color="bg-stitch-sky" />
        <MetricCard icon={DollarSign} label="Volumen (24h)" value="$45,200" color="bg-stitch-mint" />
        <MetricCard icon={Activity} label="Tasa Conversión" value="2.4%" color="bg-stitch-coral" />
      </div>

      {/* Chart Section */}
      <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-6">Transacciones Semanales</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 12 }} 
                dy={10}
              />
              <Tooltip 
                cursor={{ fill: '#f1f5f9', radius: 8 }}
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="envios" fill="#6EC1E4" radius={[8, 8, 8, 8]} barSize={12} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Verifications */}
      <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-4">Verificaciones Pendientes</h3>
        <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-200 rounded-full" />
                    <div>
                        <p className="text-sm font-bold text-slate-800">Carlos Mendoza</p>
                        <p className="text-xs text-slate-400">ID: 992831</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button className="px-3 py-1 bg-stitch-mint text-white text-xs font-bold rounded-full">Aprobar</button>
                    <button className="px-3 py-1 bg-slate-200 text-slate-500 text-xs font-bold rounded-full">Rechazar</button>
                </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-200 rounded-full" />
                    <div>
                        <p className="text-sm font-bold text-slate-800">Ana Lopez</p>
                        <p className="text-xs text-slate-400">ID: 112004</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button className="px-3 py-1 bg-stitch-mint text-white text-xs font-bold rounded-full">Aprobar</button>
                    <button className="px-3 py-1 bg-slate-200 text-slate-500 text-xs font-bold rounded-full">Rechazar</button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ icon: Icon, label, value, color }: { icon: React.ElementType, label: string, value: string, color: string }) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
    <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center text-white mb-4 shadow-lg opacity-90`}>
      <Icon size={20} />
    </div>
    <p className="text-slate-400 text-xs uppercase font-bold tracking-wider">{label}</p>
    <p className="text-2xl font-extrabold text-slate-800 mt-1">{value}</p>
  </div>
);
