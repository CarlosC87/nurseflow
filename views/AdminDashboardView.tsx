// views/AdminDashboardView.tsx
'use client';

import { useEffect, useState } from 'react';
import { Menu, X, LogOut, Users, BedDouble, Stethoscope, HeartPulse, FileText, Warehouse, Plus } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import AdminReportesPage from '@/views/AdminReportesPage';
import HabitacionesPage from '@/views/HabitacionesPage';
import EnfermerosPage from '@/views/EnfermerosPage';
import MedicosPage from '@/views/MedicosPage';
import AlmacenPage from '@/views/AlmacenPage';
import AddPacienteForm from '@/components/AddPacienteForm';

type Section = 'panel' | 'pacientes' | 'personal' | 'habitaciones' | 'medicos' | 'reportes' | 'almacen';

const SECTION_LABELS: Record<Section, string> = {
  panel:        'Panel',
  pacientes:    'Pacientes en piso',
  personal:     'Personal de enfermería',
  habitaciones: 'Habitaciones',
  medicos:      'Médicos',
  reportes:     'Reportes',
  almacen:      'Almacén',
};

type Paciente = {
  id: string;
  nombre: string;
  apellido: string;
  estado: string;
  area: string;
  habitacion_id: string | null;
  medico_id: string | null;
  enfermero_id: string | null;
  enfermedades_cronicas: string;
};

type Profile = {
  id: string;
  nombre: string;
  apellido: string;
  rol: string;
  disponible: boolean;
  telefono?: string;
};

type Habitacion = {
  id: string;
  numero: string;
  disponible: boolean;
};

const SEMAFORO: Record<string, { color: string; bg: string; label: string }> = {
  verde:    { color: '#22c55e', bg: '#dcfce7', label: 'Estable'  },
  amarillo: { color: '#f59e0b', bg: '#fef3c7', label: 'Atención' },
  rojo:     { color: '#ef4444', bg: '#fee2e2', label: 'Crítico'  },
};

export default function AdminDashboard() {
  const { profile, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const [activeSection, setActiveSection] = useState<Section>('panel');
  const [pacientes, setPacientes]       = useState<Paciente[]>([]);
  const [profiles, setProfiles]         = useState<Profile[]>([]);
  const [habitaciones, setHabitaciones] = useState<Habitacion[]>([]);
  const [addIsOpen, setAddIsOpen]       = useState(false);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    try {
      const [pacSnap, profSnap, habSnap] = await Promise.all([
        getDocs(query(collection(db, 'Pacientes'), where('activo', '==', true))),
        getDocs(collection(db, 'profiles')),
        getDocs(collection(db, 'habitaciones')),
      ]);
      setPacientes(pacSnap.docs.map(d => ({ id: d.id, ...d.data() } as Paciente)));
      setProfiles(profSnap.docs.map(d => ({ id: d.id, ...d.data() } as Profile)));
      setHabitaciones(habSnap.docs.map(d => ({ id: d.id, ...d.data() } as Habitacion)));
    } catch (err) {
      console.error('Error cargando datos admin:', err);
    }
  }

  function getName(id: string | null) {
    if (!id) return '—';
    const p = profiles.find(p => p.id === id);
    return p ? `${p.nombre} ${p.apellido}` : '—';
  }

  function getHab(id: string | null) {
    if (!id) return '—';
    const h = habitaciones.find(h => h.id === id);
    return h ? h.numero : '—';
  }

  const enfermeros = profiles.filter(p => p.rol === 'enfermero');
  const medicos    = profiles.filter(p => p.rol === 'medico');
  const stats = {
    pacientes:    pacientes.length,
    enfermeros:   enfermeros.filter(e => e.disponible).length,
    medicos:      medicos.filter(m => m.disponible).length,
    habitaciones: habitaciones.filter(h => h.disponible).length,
  };

  function navigateTo(section: Section) {
    setActiveSection(section);
    setSidebarOpen(false);
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#a8d5e2' }}>
      <header className="py-4 text-center" style={{ backgroundColor: '#a8d5e2' }}>
        <h1 className="text-2xl font-bold text-gray-800">NurseFlow — Administración</h1>
      </header>

      <div className="flex flex-1">
        <div className="fixed left-0 top-20 z-40 pl-2">
          <button onClick={() => setSidebarOpen(true)}
            className="w-9 h-9 bg-white bg-opacity-80 rounded flex items-center justify-center shadow hover:bg-opacity-100 transition-all">
            <Menu className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        {sidebarOpen && (
          <div className="fixed inset-0 z-50 flex">
            <div className="absolute inset-0 bg-black bg-opacity-30" onClick={() => setSidebarOpen(false)} />
            <div className="relative w-64 bg-white shadow-xl flex flex-col z-10">
              <div className="flex items-center justify-between px-4 py-4 border-b" style={{ backgroundColor: '#1a3a5c' }}>
                <span className="text-white font-bold text-sm">NURSE FLOW — ADMIN</span>
                <button onClick={() => setSidebarOpen(false)} className="text-white hover:text-gray-300">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 py-4">
                {(['panel', 'pacientes', 'personal', 'habitaciones', 'medicos', 'reportes', 'almacen'] as Section[]).map(section => (
                  <button key={section} onClick={() => navigateTo(section)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${activeSection === section ? 'text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                    style={activeSection === section ? { backgroundColor: '#1a3a5c' } : undefined}>
                    {section === 'panel'        && <Stethoscope className="w-4 h-4" />}
                    {section === 'pacientes'    && <Users       className="w-4 h-4" />}
                    {section === 'personal'     && <HeartPulse  className="w-4 h-4" />}
                    {section === 'habitaciones' && <BedDouble   className="w-4 h-4" />}
                    {section === 'medicos'      && <Stethoscope className="w-4 h-4" />}
                    {section === 'reportes'     && <FileText    className="w-4 h-4" />}
                    {section === 'almacen'      && <Warehouse   className="w-4 h-4" />}
                    {SECTION_LABELS[section]}
                  </button>
                ))}
              </nav>
              <div className="border-t px-4 py-3">
                <p className="text-xs text-gray-500 mb-2">Admin: {profile?.nombre}</p>
                <button onClick={signOut} className="flex items-center gap-2 text-red-600 hover:text-red-800 text-sm font-medium">
                  <LogOut className="w-4 h-4" /> Cerrar sesión
                </button>
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 px-6 py-6 ml-12">
          <h2 className="text-2xl font-bold text-center text-white mb-8 drop-shadow">
            {SECTION_LABELS[activeSection]}
          </h2>

          {activeSection === 'panel' && (
            <div className="grid grid-cols-2 gap-6 max-w-2xl mx-auto">
              <StatCard label="Pacientes en piso"      value={stats.pacientes} />
              <StatCard label="Enfermeros disponibles" value={stats.enfermeros} />
              <StatCard label="Médicos disponibles"    value={stats.medicos} />
              <StatCard label="Habitaciones libres"    value={stats.habitaciones} />
            </div>
          )}

          {activeSection === 'pacientes' && (
            <div className="max-w-6xl mx-auto space-y-4">

              {/* Add button */}
              <div className="flex justify-end">
                <button
                  onClick={() => setAddIsOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: '#1a3a5c' }}
                >
                  <Plus className="w-4 h-4" />
                  Agregar paciente
                </button>
              </div>

              {/* Patients table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm bg-white rounded-xl shadow overflow-hidden">
                  <thead>
                    <tr style={{ backgroundColor: '#1a3a5c' }} className="text-white">
                      {['Paciente', 'Estado', 'Área', 'Habitación', 'Médico', 'Enfermero', 'Diagnóstico'].map(h => (
                        <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pacientes.length === 0
                      ? <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-400">Sin pacientes</td></tr>
                      : pacientes.map((p, i) => {
                          const sem = SEMAFORO[p.estado] ?? SEMAFORO.verde;
                          return (
                            <tr key={p.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="px-4 py-3 font-medium text-gray-800">{p.nombre} {p.apellido}</td>
                              <td className="px-4 py-3">
                                <span className="px-2 py-1 rounded-full text-xs font-semibold"
                                  style={{ backgroundColor: sem.bg, color: sem.color }}>{sem.label}</span>
                              </td>
                              <td className="px-4 py-3 text-gray-600">{p.area ?? '—'}</td>
                              <td className="px-4 py-3 text-gray-600">{getHab(p.habitacion_id)}</td>
                              <td className="px-4 py-3 text-gray-600">{getName(p.medico_id)}</td>
                              <td className="px-4 py-3 text-gray-600">{getName(p.enfermero_id)}</td>
                              <td className="px-4 py-3 text-gray-600">{p.enfermedades_cronicas ?? '—'}</td>
                            </tr>
                          );
                        })
                    }
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSection === 'personal'     && <EnfermerosPage />}
          {activeSection === 'habitaciones' && <HabitacionesPage />}
          {activeSection === 'medicos'      && <MedicosPage />}
          {activeSection === 'reportes'     && <AdminReportesPage />}
          {activeSection === 'almacen'      && <AlmacenPage />}
        </main>
      </div>

      {/* Add patient modal */}
      {addIsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black bg-opacity-40" onClick={() => setAddIsOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-auto z-10 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Agregar nuevo paciente</h2>
            <AddPacienteForm onSubmit={() => { fetchData(); setAddIsOpen(false); }} />
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-xl shadow p-6 text-center">
      <p className="text-gray-600 text-sm mb-2">{label}</p>
      <p className="text-3xl font-bold" style={{ color: '#2b7bb9' }}>{value}</p>
    </div>
  );
}