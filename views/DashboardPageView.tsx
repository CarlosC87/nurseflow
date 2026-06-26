'use client';

import { useEffect, useState } from 'react';
import { Menu, User, X, LogOut, Users, Stethoscope, ClipboardList, FlaskConical, Clock, Bell, Activity } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import PacientesPage from '@/views/PacientesPage';
import ReportesEnfermeroPage from '@/views/ReportesEnfermeroPage';
import FarmaciaSection from '@/views/FarmaciaSection';

type Profile = {
  id: string;
  nombre: string;
  apellido: string;
  rol: string;
  disponible: boolean;
  telefono?: string;
  sexo?: string;
};

type Section = 'panel' | 'pacientes' | 'reportes' | 'farmacia';

const SECTION_LABELS: Record<Section, string> = {
  panel:     'Panel',
  pacientes: 'Pacientes',
  reportes:  'Reportes de enfermería',
  farmacia:  'Directorio de Farmacia',
};

export default function DashboardPage() {
  const { profile, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<Section>('panel');
  const [stats, setStats] = useState({ medicos: 0, enfermeros: 0, pacientes: 0 });

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    try {
      const profilesSnap = await getDocs(collection(db, 'profiles'));
      const allProfiles: Profile[] = profilesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Profile));
      const pacientesSnap = await getDocs(
        query(collection(db, 'Pacientes'), where('activo', '==', true))
      );
      setStats({
        medicos:    allProfiles.filter(p => p.rol === 'medico'    && p.disponible).length,
        enfermeros: allProfiles.filter(p => p.rol === 'enfermero' && p.disponible).length,
        pacientes:  pacientesSnap.size,
      });
    } catch (err) {
      console.error('Error cargando datos:', err);
    }
  }

  function navigateTo(section: Section) {
    setActiveSection(section);
    setSidebarOpen(false);
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#a8d5e2' }}>
      <header className="py-4 text-center" style={{ backgroundColor: '#a8d5e2' }}>
        <h1 className="text-2xl font-bold text-gray-800">NurseFlow, cuidado continuo</h1>
      </header>

      <div className="flex flex-1">
        <div className="fixed left-0 top-20 z-40 flex flex-col gap-2 pl-2">
          <button onClick={() => { setSidebarOpen(true); setProfileOpen(false); }}
            className="w-9 h-9 bg-white bg-opacity-80 rounded flex items-center justify-center shadow hover:bg-opacity-100 transition-all">
            <Menu className="w-5 h-5 text-gray-700" />
          </button>
          <button onClick={() => { setProfileOpen(true); setSidebarOpen(false); }}
            className="w-9 h-9 bg-white bg-opacity-80 rounded flex items-center justify-center shadow hover:bg-opacity-100 transition-all">
            <User className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        {/* Sidebar */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 flex">
            <div className="absolute inset-0 bg-black bg-opacity-30" onClick={() => setSidebarOpen(false)} />
            <div className="relative w-64 bg-white shadow-xl flex flex-col z-10">
              <div className="flex items-center justify-between px-4 py-4 border-b" style={{ backgroundColor: '#1a3a5c' }}>
                <span className="text-white font-bold text-sm tracking-wide">NURSE FLOW</span>
                <button onClick={() => setSidebarOpen(false)} className="text-white hover:text-gray-300">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 py-4">
                {(['panel', 'pacientes', 'reportes', 'farmacia'] as Section[]).map(section => (
                  <button key={section} onClick={() => navigateTo(section)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${activeSection === section ? 'text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                    style={activeSection === section ? { backgroundColor: '#1a3a5c' } : undefined}>
                    {section === 'panel'     && <Stethoscope   className="w-4 h-4" />}
                    {section === 'pacientes' && <Users         className="w-4 h-4" />}
                    {section === 'reportes'  && <ClipboardList className="w-4 h-4" />}
                    {section === 'farmacia'  && <FlaskConical  className="w-4 h-4" />}
                    {SECTION_LABELS[section]}
                  </button>
                ))}
              </nav>
              <div className="border-t px-4 py-3">
                <button onClick={signOut} className="flex items-center gap-2 text-red-600 hover:text-red-800 text-sm font-medium transition-colors">
                  <LogOut className="w-4 h-4" /> Cerrar sesión
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Profile panel */}
        {profileOpen && (
          <div className="fixed inset-0 z-50 flex">
            <div className="absolute inset-0 bg-black bg-opacity-30" onClick={() => setProfileOpen(false)} />
            <div className="relative w-72 bg-white shadow-xl flex flex-col z-10">
              <div className="flex items-center justify-between px-4 py-4 border-b" style={{ backgroundColor: '#1a3a5c' }}>
                <span className="text-white font-bold text-sm">Mi perfil</span>
                <button onClick={() => setProfileOpen(false)} className="text-white hover:text-gray-300">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 px-6 py-6 space-y-3">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold"
                    style={{ backgroundColor: '#5ba3b0' }}>
                    {profile?.nombre?.[0]?.toUpperCase() ?? 'U'}
                  </div>
                </div>
                <ProfileField label="Nombre"  value={`${profile?.nombre ?? ''} ${profile?.apellido ?? ''}`} />
                <ProfileField label="Rol"     value={profile?.rol ?? ''} />
                <ProfileField label="Teléfono" value={profile?.telefono ?? ''} />
                <ProfileField label="Sexo"    value={profile?.sexo ?? ''} />
                <ProfileField label="Estado"  value={profile?.disponible ? 'Disponible' : 'No disponible'} />
              </div>
              <div className="border-t px-4 py-3">
                <button onClick={signOut} className="flex items-center gap-2 text-red-600 hover:text-red-800 text-sm font-medium transition-colors">
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
            <div className="max-w-2xl mx-auto space-y-6">

              {/* Quick access cards */}
              <div className="grid grid-cols-2 gap-4">
                <QuickCard
                  icon={<Users className="w-6 h-6" />}
                  label="Pacientes"
                  description={`${stats.pacientes} en piso`}
                  color="#2b7bb9"
                  bg="#e0f0fb"
                  onClick={() => navigateTo('pacientes')}
                />
                <QuickCard
                  icon={<Clock className="w-6 h-6" />}
                  label="Turno"
                  description="Ver detalles"
                  color="#7c3aed"
                  bg="#ede9fe"
                  onClick={() => {}}
                />
                <QuickCard
                  icon={<Bell className="w-6 h-6" />}
                  label="Alertas"
                  description="Sin alertas activas"
                  color="#dc2626"
                  bg="#fee2e2"
                  onClick={() => {}}
                />
                <QuickCard
                  icon={<ClipboardList className="w-6 h-6" />}
                  label="Reportes"
                  description="Ver reportes"
                  color="#059669"
                  bg="#d1fae5"
                  onClick={() => navigateTo('reportes')}
                />
              </div>

              {/* Recent activity */}
              <div className="bg-white rounded-xl shadow p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="w-4 h-4 text-gray-400" />
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Actividad reciente</h3>
                </div>
                <div className="space-y-3">
                  <ActivityItem
                    color="#2b7bb9"
                    text="Paciente Daniel Hernández actualizado"
                    time="Hace 5 min"
                  />
                  <ActivityItem
                    color="#059669"
                    text="Reporte de turno generado"
                    time="Hace 20 min"
                  />
                  <ActivityItem
                    color="#d97706"
                    text="Alerta de medicamento pendiente"
                    time="Hace 1 hora"
                  />
                  <ActivityItem
                    color="#7c3aed"
                    text="Turno nocturno iniciado"
                    time="Hace 3 horas"
                  />
                </div>
              </div>

            </div>
          )}

          {activeSection === 'pacientes' && <PacientesPage />}
          {activeSection === 'reportes'  && <ReportesEnfermeroPage />}
          {activeSection === 'farmacia'  && <FarmaciaSection />}
        </main>
      </div>
    </div>
  );
}

/* ─── Quick access card ─────────────────────────────────────────────────── */

function QuickCard({
  icon, label, description, color, bg, onClick,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  color: string;
  bg: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-xl shadow p-5 text-left hover:shadow-md transition-all group w-full"
    >
      <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-transform group-hover:scale-105"
        style={{ backgroundColor: bg, color }}>
        {icon}
      </div>
      <p className="text-sm font-bold text-gray-800">{label}</p>
      <p className="text-xs text-gray-400 mt-0.5">{description}</p>
    </button>
  );
}

/* ─── Activity item ─────────────────────────────────────────────────────── */

function ActivityItem({ color, text, time }: { color: string; text: string; time: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-1.5 w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-700">{text}</p>
        <p className="text-xs text-gray-400 mt-0.5">{time}</p>
      </div>
    </div>
  );
}

/* ─── Misc ──────────────────────────────────────────────────────────────── */

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-medium text-gray-800 capitalize">{value}</p>
    </div>
  );
}