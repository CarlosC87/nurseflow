// views/HabitacionesPage.tsx
'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { BedDouble, User, Stethoscope, UserRound, Wrench, CheckCircle, XCircle } from 'lucide-react';

type EstadoCama = 'disponible' | 'ocupada' | 'mantenimiento';

type Cama = {
  id: string;
  sala: string;
  piso: string;
  numero_cama: number;
  estado: EstadoCama;
  paciente_id: string | null;
  medico_id: string | null;
  enfermero_id: string | null;
};

type Profile = {
  id: string;
  nombre: string;
  apellido: string;
  rol: string;
};

const ESTADO_CONFIG: Record<EstadoCama, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  disponible:    { label: 'DISPONIBLE',    color: '#16a34a', bg: '#dcfce7', icon: <CheckCircle className="w-3.5 h-3.5" /> },
  ocupada:       { label: 'OCUPADA',       color: '#dc2626', bg: '#fee2e2', icon: <XCircle className="w-3.5 h-3.5" /> },
  mantenimiento: { label: 'MANTENIMIENTO', color: '#d97706', bg: '#fef3c7', icon: <Wrench className="w-3.5 h-3.5" /> },
};

const SALA_ORDER = ['Sala A', 'Sala B', 'Sala C', 'Aislamiento'];

const SALA_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  'Sala A':      { color: '#1a3a5c', bg: '#e0f0ff', border: '#2b7bb9' },
  'Sala B':      { color: '#6d28d9', bg: '#ede9fe', border: '#7c3aed' },
  'Sala C':      { color: '#065f46', bg: '#d1fae5', border: '#059669' },
  'Aislamiento': { color: '#92400e', bg: '#fef3c7', border: '#d97706' },
};

export default function HabitacionesPage() {
  const [camas, setCamas] = useState<Cama[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    try {
      const [camasSnap, profilesSnap] = await Promise.all([
        getDocs(collection(db, 'Camas')),
        getDocs(collection(db, 'profiles')),
      ]);

      const camasData = camasSnap.docs.map(d => ({ id: d.id, ...d.data() } as Cama));
      camasData.sort((a, b) => {
        const salaA = SALA_ORDER.indexOf(a.sala);
        const salaB = SALA_ORDER.indexOf(b.sala);
        if (salaA !== salaB) return salaA - salaB;
        return a.numero_cama - b.numero_cama;
      });

      setCamas(camasData);
      setProfiles(profilesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Profile)));
    } catch (err) {
      console.error('Error cargando camas:', err);
    }
    setLoading(false);
  }

  function getNombre(id: string | null): string {
    if (!id) return '';
    const p = profiles.find(p => p.id === id);
    return p ? `${p.nombre} ${p.apellido}` : '—';
  }

  // Group camas by sala
  const grouped = SALA_ORDER.reduce<Record<string, Cama[]>>((acc, sala) => {
    acc[sala] = camas.filter(c => c.sala === sala);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-white font-medium animate-pulse">Cargando camas...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Leyenda */}
      <div className="flex items-center gap-5 bg-white bg-opacity-70 rounded-lg px-4 py-2 w-fit mx-auto flex-wrap">
        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Estado:</span>
        {(Object.entries(ESTADO_CONFIG) as [EstadoCama, typeof ESTADO_CONFIG[EstadoCama]][]).map(([key, cfg]) => (
          <span key={key} className="flex items-center gap-1.5 text-xs font-medium" style={{ color: cfg.color }}>
            {cfg.icon}
            {cfg.label.charAt(0) + cfg.label.slice(1).toLowerCase()}
          </span>
        ))}
      </div>

      {/* Salas */}
      {SALA_ORDER.map(sala => {
        const salaCamas = grouped[sala];
        if (salaCamas.length === 0) return null;
        const cfg = SALA_CONFIG[sala] ?? SALA_CONFIG['Sala A'];
        const esAislamiento = sala === 'Aislamiento';

        return (
          <div key={sala} className="bg-white rounded-xl shadow overflow-hidden">

            {/* Header de sala */}
            <div
              className="flex items-center justify-between px-5 py-3 border-b"
              style={{ backgroundColor: cfg.bg, borderColor: cfg.border }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: cfg.border }}
                />
                <span className="text-sm font-bold" style={{ color: cfg.color }}>
                  {sala}
                </span>
                {salaCamas[0]?.piso && (
                  <span className="text-xs text-gray-500 font-medium">
                    · {salaCamas[0].piso}
                  </span>
                )}
                {esAislamiento && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full ml-1"
                    style={{ backgroundColor: cfg.border, color: '#fff' }}>
                    1 paciente por habitación
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-500">
                {salaCamas.filter(c => c.estado === 'ocupada').length} / {salaCamas.length} ocupadas
              </span>
            </div>

            {/* Tabla de camas */}
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Cama</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Paciente</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Médico asignado</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Enfermero/a asignado</th>
                </tr>
              </thead>
              <tbody>
                {salaCamas.map((cama, i) => {
                  const estadoCfg = ESTADO_CONFIG[cama.estado];
                  const esMantenimiento = cama.estado === 'mantenimiento';
                  const esDisponible = cama.estado === 'disponible';

                  return (
                    <tr
                      key={cama.id}
                      className={`border-b border-gray-50 last:border-0 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                    >
                      {/* Cama */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <BedDouble className="w-4 h-4 text-gray-400" />
                          <span className="font-bold text-gray-800">
                            {esAislamiento ? `Hab. ${cama.numero_cama}` : `Cama ${cama.numero_cama}`}
                          </span>
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full"
                          style={{ backgroundColor: estadoCfg.bg, color: estadoCfg.color }}
                        >
                          {estadoCfg.icon}
                          {estadoCfg.label}
                        </span>
                      </td>

                      {/* Paciente */}
                      <td className="px-4 py-3">
                        {esMantenimiento ? (
                          <span className="text-gray-300 text-xs">N/A</span>
                        ) : esDisponible ? (
                          <span className="text-gray-300 italic text-xs">Disponible</span>
                        ) : cama.paciente_id ? (
                          <div className="flex items-center gap-1.5 text-gray-800">
                            <User className="w-3.5 h-3.5 text-gray-400" />
                            <span>{getNombre(cama.paciente_id)}</span>
                          </div>
                        ) : (
                          <span className="text-gray-300 italic text-xs">Sin asignar</span>
                        )}
                      </td>

                      {/* Médico */}
                      <td className="px-4 py-3">
                        {esMantenimiento ? (
                          <span className="text-gray-300 text-xs">N/A</span>
                        ) : esDisponible ? (
                          <span className="text-gray-300 text-xs">—</span>
                        ) : cama.medico_id ? (
                          <div className="flex items-center gap-1.5 text-gray-800">
                            <Stethoscope className="w-3.5 h-3.5 text-gray-400" />
                            <span>{getNombre(cama.medico_id)}</span>
                          </div>
                        ) : (
                          <span className="text-gray-300 italic text-xs">Sin asignar</span>
                        )}
                      </td>

                      {/* Enfermero */}
                      <td className="px-4 py-3">
                        {esMantenimiento ? (
                          <span className="text-gray-300 text-xs">N/A</span>
                        ) : esDisponible ? (
                          <span className="text-gray-300 text-xs">—</span>
                        ) : cama.enfermero_id ? (
                          <div className="flex items-center gap-1.5 text-gray-800">
                            <UserRound className="w-3.5 h-3.5 text-gray-400" />
                            <span>{getNombre(cama.enfermero_id)}</span>
                          </div>
                        ) : (
                          <span className="text-gray-300 italic text-xs">Sin asignar</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}

      {camas.length === 0 && (
        <div className="bg-white rounded-xl p-10 text-center text-gray-400 shadow">
          <BedDouble className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No hay camas registradas</p>
        </div>
      )}
    </div>
  );
}