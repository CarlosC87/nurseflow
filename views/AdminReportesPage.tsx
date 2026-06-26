// views/AdminReportesPage.tsx
'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { HeartPulse, Brain, SmilePlus, FlaskConical, Droplets, MessageSquare, ChevronDown, ChevronUp, FileText } from 'lucide-react';

type Profile = {
  id: string;
  nombre: string;
  apellido: string;
};

type Reporte = {
  id: string;
  enfermero_id: string;
  paciente_id: string | null;
  tipo: 'clinico' | 'general';
  timestamp: string;
  comentario?: string;
  signosVitales?: { FC: string; FR: string; TA: string; Temp: string; SpO2: string; notas: string };
  estadoNeurologico?: string;
  comportamiento?: string;
  estudiosARealizar?: string;
  ultimoDrenado?: string;
  comentariosGenerales?: string;
};

export default function AdminReportesPage() {
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [pacientes, setPacientes] = useState<Profile[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filtroEnfermero, setFiltroEnfermero] = useState<string>('todos');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    try {
      const [repSnap, profSnap, pacSnap] = await Promise.all([
        getDocs(collection(db, 'reportes')),
        getDocs(collection(db, 'profiles')),
        getDocs(collection(db, 'Pacientes')),
      ]);

      const reps = repSnap.docs.map(d => ({ id: d.id, ...d.data() } as Reporte));
      reps.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setReportes(reps);
      setProfiles(profSnap.docs.map(d => ({ id: d.id, ...d.data() } as Profile)));
      setPacientes(pacSnap.docs.map(d => ({ id: d.id, ...d.data() } as Profile)));
    } catch (err) {
      console.error('Error cargando reportes:', err);
    }
    setLoading(false);
  }

  function getNombre(id: string | null, lista: Profile[]) {
    if (!id) return null;
    const p = lista.find(p => p.id === id);
    return p ? `${p.nombre} ${p.apellido}` : '—';
  }

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleString('es-MX', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return iso; }
  }

  const enfermeros = profiles.filter(p => {
    const reporteIds = new Set(reportes.map(r => r.enfermero_id));
    return reporteIds.has(p.id);
  });

  const reportesFiltrados = filtroEnfermero === 'todos'
    ? reportes
    : reportes.filter(r => r.enfermero_id === filtroEnfermero);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-white font-medium">Cargando reportes...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">

      {/* Filtro */}
      <div className="bg-white rounded-xl shadow px-4 py-3 flex items-center gap-3 flex-wrap">
        <span className="text-sm font-semibold text-gray-700">Filtrar por enfermero:</span>
        <select
          value={filtroEnfermero}
          onChange={e => setFiltroEnfermero(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          <option value="todos">Todos</option>
          {enfermeros.map(e => (
            <option key={e.id} value={e.id}>{e.nombre} {e.apellido}</option>
          ))}
        </select>
        <span className="ml-auto text-xs text-gray-400">{reportesFiltrados.length} reporte(s)</span>
      </div>

      {/* Lista */}
      {reportesFiltrados.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center text-gray-400 shadow">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No hay reportes aún</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          {reportesFiltrados.map((r, i) => {
            const isOpen = expandedId === r.id;
            const enfermeroNombre = getNombre(r.enfermero_id, profiles) ?? '—';
            const pacienteNombre = getNombre(r.paciente_id, pacientes);

            return (
              <div key={r.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <button
                  onClick={() => setExpandedId(isOpen ? null : r.id)}
                  className="w-full text-left hover:bg-blue-50 transition-colors"
                >
                  <div className="grid items-center px-4 py-3 gap-3"
                    style={{ gridTemplateColumns: '2fr 1fr 1fr 160px 36px' }}>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ backgroundColor: '#2b7bb9' }}>
                        {enfermeroNombre[0] ?? 'E'}
                      </div>
                      <span className="text-sm font-medium text-gray-800">{enfermeroNombre}</span>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full w-fit ${r.tipo === 'clinico' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                      {r.tipo === 'clinico' ? '🩺 Clínico' : '💬 General'}
                    </span>
                    <span className="text-sm text-gray-600 truncate">
                      {pacienteNombre ?? <span className="italic text-gray-400">Sin paciente</span>}
                    </span>
                    <span className="text-xs text-gray-400">{formatDate(r.timestamp)}</span>
                    <span className="text-gray-400">
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </span>
                  </div>
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 border-t border-gray-100 space-y-3 pt-3">

                    {/* Comentario general */}
                    {r.tipo === 'general' && (
                      <div className="bg-purple-50 rounded-lg border border-purple-200 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <MessageSquare className="w-4 h-4 text-purple-600" />
                          <span className="text-sm font-semibold text-purple-800">Comentario general</span>
                        </div>
                        <p className="text-sm text-gray-700">{r.comentario}</p>
                      </div>
                    )}

                    {/* Signos vitales */}
                    {r.tipo === 'clinico' && r.signosVitales && (
                      <div className="bg-green-50 rounded-lg border border-green-200 overflow-hidden">
                        <div className="flex items-center gap-2 px-4 py-2 bg-green-100 border-b border-green-200">
                          <HeartPulse className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-semibold text-green-800">Signos vitales</span>
                        </div>
                        <div className="px-4 py-3">
                          <div className="grid grid-cols-3 gap-3 mb-2">
                            {[
                              { label: 'FC', value: r.signosVitales.FC },
                              { label: 'FR', value: r.signosVitales.FR },
                              { label: 'T/A', value: r.signosVitales.TA },
                              { label: 'Temp', value: r.signosVitales.Temp },
                              { label: 'SpO₂', value: r.signosVitales.SpO2 },
                            ].map(item => (
                              <div key={item.label} className="text-xs">
                                <span className="text-gray-500 block">{item.label}</span>
                                <span className="font-semibold text-gray-800">{item.value || '—'}</span>
                              </div>
                            ))}
                          </div>
                          {r.signosVitales.notas && (
                            <p className="text-xs text-gray-600 bg-white rounded p-2 border border-green-100">📝 {r.signosVitales.notas}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Estado neurológico */}
                    {r.tipo === 'clinico' && r.estadoNeurologico && (
                      <div className="bg-indigo-50 rounded-lg border border-indigo-200 overflow-hidden">
                        <div className="flex items-center gap-2 px-4 py-2 bg-indigo-100 border-b border-indigo-200">
                          <Brain className="w-4 h-4 text-indigo-600" />
                          <span className="text-sm font-semibold text-indigo-800">Estado neurológico</span>
                        </div>
                        <div className="px-4 py-3">
                          <p className="text-sm text-gray-700">{r.estadoNeurologico}</p>
                        </div>
                      </div>
                    )}

                    {/* Comportamiento */}
                    {r.tipo === 'clinico' && r.comportamiento && (
                      <div className="bg-orange-50 rounded-lg border border-orange-200 overflow-hidden">
                        <div className="flex items-center gap-2 px-4 py-2 bg-orange-100 border-b border-orange-200">
                          <SmilePlus className="w-4 h-4 text-orange-500" />
                          <span className="text-sm font-semibold text-orange-800">Comportamiento</span>
                        </div>
                        <div className="px-4 py-3">
                          <p className="text-sm text-gray-700">{r.comportamiento}</p>
                        </div>
                      </div>
                    )}

                    {/* Estudios a realizar */}
                    {r.tipo === 'clinico' && r.estudiosARealizar && (
                      <div className="bg-teal-50 rounded-lg border border-teal-200 overflow-hidden">
                        <div className="flex items-center gap-2 px-4 py-2 bg-teal-100 border-b border-teal-200">
                          <FlaskConical className="w-4 h-4 text-teal-600" />
                          <span className="text-sm font-semibold text-teal-800">Estudios a realizar</span>
                        </div>
                        <div className="px-4 py-3">
                          <p className="text-sm text-gray-700">{r.estudiosARealizar}</p>
                        </div>
                      </div>
                    )}

                    {/* Último drenado */}
                    {r.tipo === 'clinico' && r.ultimoDrenado && (
                      <div className="bg-blue-50 rounded-lg border border-blue-200 overflow-hidden">
                        <div className="flex items-center gap-2 px-4 py-2 bg-blue-100 border-b border-blue-200">
                          <Droplets className="w-4 h-4 text-blue-500" />
                          <span className="text-sm font-semibold text-blue-800">Último drenado</span>
                        </div>
                        <div className="px-4 py-3">
                          <p className="text-sm text-gray-700">{r.ultimoDrenado}</p>
                        </div>
                      </div>
                    )}

                    {/* Comentarios generales del reporte clínico */}
                    {r.tipo === 'clinico' && r.comentariosGenerales && (
                      <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                        <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 border-b border-gray-200">
                          <MessageSquare className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-semibold text-gray-700">Comentarios generales</span>
                        </div>
                        <div className="px-4 py-3">
                          <p className="text-sm text-gray-700">{r.comentariosGenerales}</p>
                        </div>
                      </div>
                    )}

                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}