// views/PacientesPage.tsx
'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import {
  X, BedDouble, Stethoscope, UserRound, CalendarDays,
  Building2, Filter, Clock, MapPin, ClipboardList, LayoutGrid, Activity,
} from 'lucide-react';

type EstadoSemaforo = 'verde' | 'amarillo' | 'rojo';

export type Paciente = {
  id: string;
  nombre: string;
  apellido: string;
  fecha_nacimiento?: string | null;
  sexo?: string;
  lugar_procedencia?: string | null;
  condicion?: string;
  fecha_ingreso?: string | null;
  hora_ingreso?: string | null;
  servicio_especialidad?: string | null;
  dispositivos?: string[] | null;
  sala?: string | null;
  piso?: string;
  habitacion_id?: string | null;
  medico_id?: string | null;
  enfermero_id?: string | null;
  estado?: EstadoSemaforo;
  activo: boolean;
};

type Profile = {
  id: string;
  nombre: string;
  apellido: string;
  rol: string;
};

const SEMAFORO_CONFIG: Record
  EstadoSemaforo,
  { label: string; color: string; bg: string; ring: string; pulse: boolean }
> = {
  verde:    { label: 'Estable',    color: '#16a34a', bg: '#dcfce7', ring: '#86efac', pulse: false },
  amarillo: { label: 'Precaución', color: '#d97706', bg: '#fef3c7', ring: '#fcd34d', pulse: true  },
  rojo:     { label: 'Crítico',    color: '#dc2626', bg: '#fee2e2', ring: '#fca5a5', pulse: true  },
};

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  if (!y || !m || !d) return dateStr;
  return `${d}/${m}/${y}`;
}

function calcEdad(fechaNac?: string | null): string {
  if (!fechaNac) return '—';
  const [y, m, d] = fechaNac.split('-').map(Number);
  const hoy = new Date();
  let edad = hoy.getFullYear() - y;
  if (
    hoy.getMonth() + 1 < m ||
    (hoy.getMonth() + 1 === m && hoy.getDate() < d)
  ) edad--;
  return `${edad} años`;
}

function TrafficLight({ estado }: { estado: EstadoSemaforo }) {
  return (
    <div className="flex flex-col items-center gap-1.5 py-1">
      {(['rojo', 'amarillo', 'verde'] as EstadoSemaforo[]).map(color => {
        const active = estado === color;
        const cfg = SEMAFORO_CONFIG[color];
        return (
          <div key={color} className="relative flex items-center justify-center w-5 h-5">
            {active && cfg.pulse && (
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-50"
                style={{ backgroundColor: cfg.color }}
              />
            )}
            <div
              className="relative w-4 h-4 rounded-full transition-all"
              style={{
                backgroundColor: active ? cfg.color : '#d1d5db',
                boxShadow: active ? `0 0 10px ${cfg.color}` : 'none',
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

export default function PacientesPage() {
  const { user } = useAuth();
  const [pacientes, setPacientes]   = useState<Paciente[]>([]);
  const [profileMap, setProfileMap] = useState<Record<string, string>>({});
  const [loading, setLoading]       = useState(true);
  const [seleccionado, setSeleccionado] = useState<Paciente | null>(null);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  async function fetchData() {
    setLoading(true);
    try {
      const pacientesSnap = await getDocs(
        query(
          collection(db, 'Pacientes'),
          where('enfermero_id', '==', user!.uid),
          where('activo', '==', true)
        )
      );
      const allPacientes = pacientesSnap.docs.map(
        d => ({ id: d.id, ...d.data() } as Paciente)
      );

      const profSnap = await getDocs(collection(db, 'profiles'));
      const pMap: Record<string, string> = {};
      profSnap.docs.forEach(d => {
        const p = d.data() as Profile;
        pMap[d.id] = `${p.nombre} ${p.apellido}`;
      });

      setPacientes(allPacientes);
      setProfileMap(pMap);
    } catch (err) {
      console.error('Error cargando pacientes:', err);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-white text-lg font-medium">Cargando pacientes…</div>
      </div>
    );
  }

  if (pacientes.length === 0) {
    return (
      <div className="bg-white rounded-xl p-10 text-center text-gray-500 shadow max-w-md mx-auto mt-10">
        No hay pacientes registrados aún.
      </div>
    );
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-center max-w-2xl gap-5 mb-5 rounded-lg px-4 py-2 my-auto mx-auto">
        <div className="flex items-center w-fit gap-5 bg-white bg-opacity-70 rounded-lg px-4 py-2">
          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Estado:</span>
          {(['verde', 'amarillo', 'rojo'] as EstadoSemaforo[]).map(e => {
            const cfg = SEMAFORO_CONFIG[e];
            return (
              <span key={e} className="flex items-center gap-1.5 text-xs text-gray-600">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cfg.color }} />
                {cfg.label}
              </span>
            );
          })}
        </div>
        <button className="flex items-center bg-white rounded-lg px-4 py-2 gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-xs font-semibold text-gray-600">Filtros</span>
        </button>
      </div>

      {/* Tarjetas */}
      <div className="max-w-2xl mx-auto space-y-3">
        {pacientes.map(paciente => {
          const estado = paciente.estado ?? 'verde';
          const cfg    = SEMAFORO_CONFIG[estado];
          const medico    = paciente.medico_id    ? profileMap[paciente.medico_id]    : null;
          const enfermero = paciente.enfermero_id ? profileMap[paciente.enfermero_id] : null;

          return (
            <button
              key={paciente.id}
              onClick={() => setSeleccionado(paciente)}
              className="w-full bg-white rounded-xl shadow hover:shadow-md transition-all p-5 text-left flex items-center gap-4 group"
            >
              <TrafficLight estado={estado} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-bold text-gray-800 text-base truncate">
                    {paciente.nombre} {paciente.apellido}
                  </h3>
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
                    style={{ backgroundColor: cfg.bg, color: cfg.color }}
                  >
                    {cfg.label}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-0.5 truncate italic">
                  {paciente.condicion || <span className="text-gray-300">Sin diagnóstico registrado</span>}
                </p>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
                  {paciente.servicio_especialidad && (
                    <span className="flex items-center gap-1 text-blue-600 font-medium">
                      <Activity className="w-3.5 h-3.5" />{paciente.servicio_especialidad}
                    </span>
                  )}
                  {paciente.piso && (
                    <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />Piso {paciente.piso}</span>
                  )}
                  <span className="flex items-center gap-1"><BedDouble className="w-3.5 h-3.5" />Cama {paciente.habitacion_id || '—'}</span>
                  <span className="flex items-center gap-1"><Stethoscope className="w-3.5 h-3.5" />{medico ?? 'Sin médico'}</span>
                  <span className="flex items-center gap-1"><UserRound className="w-3.5 h-3.5" />{enfermero ?? 'Sin enfermero'}</span>
                </div>
              </div>
              <span className="text-gray-300 group-hover:text-gray-500 text-xl transition-colors">›</span>
            </button>
          );
        })}
      </div>

      {/* Modal detalle */}
      {seleccionado && (
        <PatientDetailModal
          paciente={seleccionado}
          medicoNombre={seleccionado.medico_id ? profileMap[seleccionado.medico_id] ?? '—' : '—'}
          enfermeroNombre={seleccionado.enfermero_id ? profileMap[seleccionado.enfermero_id] ?? '—' : '—'}
          onClose={() => setSeleccionado(null)}
        />
      )}
    </>
  );
}

/* ─── Modal detalle ─────────────────────────────────────────────────────── */

function PatientDetailModal({
  paciente, medicoNombre, enfermeroNombre, onClose,
}: {
  paciente: Paciente;
  medicoNombre: string;
  enfermeroNombre: string;
  onClose: () => void;
}) {
  const estado = paciente.estado ?? 'verde';
  const cfg    = SEMAFORO_CONFIG[estado];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black bg-opacity-40" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-sm mx-auto z-10 overflow-hidden max-h-[92vh] flex flex-col">

        {/* ── Header ── */}
        <div
          className="px-5 pt-5 pb-4 flex items-start justify-between gap-3 flex-shrink-0"
          style={{ backgroundColor: cfg.bg, borderBottom: `2px solid ${cfg.ring}` }}
        >
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Paciente</p>
            <h2 className="text-xl font-bold text-gray-900 leading-tight">
              {paciente.nombre} {paciente.apellido}
            </h2>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span
                className="text-xs font-bold px-2.5 py-0.5 rounded-full text-white"
                style={{ backgroundColor: cfg.color }}
              >
                {cfg.label}
              </span>
              {paciente.servicio_especialidad && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  {paciente.servicio_especialidad}
                </span>
              )}
            </div>
          </div>
          <TrafficLight estado={estado} />
        </div>

        {/* ── Scrollable body ── */}
        <div className="overflow-y-auto flex-1 px-5 py-3 space-y-0.5">

          {/* Datos personales */}
          <SectionLabel label="Datos personales" />
          <DetailRow icon={<UserRound className="w-4 h-4" />} label="Nombre completo"      value={`${paciente.nombre} ${paciente.apellido}`} />
          <DetailRow icon={<CalendarDays className="w-4 h-4" />} label="Edad"              value={calcEdad(paciente.fecha_nacimiento)} />
          <DetailRow icon={<UserRound className="w-4 h-4" />} label="Sexo"                 value={paciente.sexo ?? '—'} />
          {paciente.lugar_procedencia && (
            <DetailRow icon={<MapPin className="w-4 h-4" />} label="Lugar de procedencia"  value={paciente.lugar_procedencia} />
          )}

          {/* Ingreso */}
          <SectionLabel label="Ingreso" />
          <DetailRow icon={<ClipboardList className="w-4 h-4" />} label="Motivo de ingreso" value={paciente.condicion || 'Sin diagnóstico registrado'} />
          <DetailRow icon={<CalendarDays className="w-4 h-4" />} label="Fecha de ingreso"  value={formatDate(paciente.fecha_ingreso)} />
          <DetailRow icon={<Clock className="w-4 h-4" />} label="Hora de ingreso / traslado" value={paciente.hora_ingreso ?? '—'} />

          {/* Ubicación */}
          <SectionLabel label="Ubicación" />
          <DetailRow icon={<Building2 className="w-4 h-4" />}  label="Piso"          value={paciente.piso ?? '—'} />
          <DetailRow icon={<LayoutGrid className="w-4 h-4" />} label="Sala"          value={paciente.sala ?? '—'} />
          <DetailRow icon={<BedDouble className="w-4 h-4" />}  label="Cama / Habitación" value={paciente.habitacion_id ?? '—'} />

          {/* Dispositivos */}
          {paciente.dispositivos && paciente.dispositivos.length > 0 && (
            <>
              <SectionLabel label="Dispositivos adheridos" />
              <div className="flex flex-wrap gap-1.5 pl-7 pb-1">
                {paciente.dispositivos.map((dispositivo, i) => (
                  <span
                    key={i}
                    className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full font-medium border border-gray-200"
                  >
                    {dispositivo}
                  </span>
                ))}
              </div>
            </>
          )}

          {/* Personal asignado */}
          <SectionLabel label="Personal asignado" />
          <DetailRow icon={<Stethoscope className="w-4 h-4" />} label="Médico asignado"        value={medicoNombre} />
          <DetailRow icon={<UserRound className="w-4 h-4" />}   label="Enfermero/a asignado/a" value={enfermeroNombre} />

        </div>

        {/* ── Footer ── */}
        <div className="px-5 pb-5 pt-3 flex-shrink-0 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-white font-semibold hover:opacity-90 flex items-center justify-center gap-2 transition-opacity"
            style={{ backgroundColor: '#1a3a5c' }}
          >
            <X className="w-4 h-4" /> Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Helpers ───────────────────────────────────────────────────────────── */

function SectionLabel({ label }: { label: string }) {
  return (
    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pt-4 pb-1.5">
      {label}
    </p>
  );
}

function DetailRow({
  icon, label, value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 py-1.5">
      <span className="mt-0.5 text-gray-400 flex-shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] text-gray-400 uppercase tracking-wide leading-none mb-0.5">{label}</p>
        <p className="text-sm font-medium text-gray-800 break-words">{value}</p>
      </div>
    </div>
  );
}