// views/ReportesEnfermeroPage.tsx
'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { HeartPulse, Brain, SmilePlus, FlaskConical, Droplets, MessageSquare, Send, CheckCircle, ClipboardList } from 'lucide-react';

type Paciente = {
  id: string;
  nombre: string;
  apellido: string;
};

type FormClinico = {
  paciente_id: string;
  signosVitales: { FC: string; FR: string; TA: string; Temp: string; SpO2: string; notas: string };
  estadoNeurologico: string;
  comportamiento: string;
  estudiosARealizar: string;
  ultimoDrenado: string;
  comentariosGenerales: string;
};

const FORM_CLINICO_INICIAL: FormClinico = {
  paciente_id: '',
  signosVitales: { FC: '', FR: '', TA: '', Temp: '', SpO2: '', notas: '' },
  estadoNeurologico: '',
  comportamiento: '',
  estudiosARealizar: '',
  ultimoDrenado: '',
  comentariosGenerales: '',
};

export default function ReportesEnfermeroPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<'clinico' | 'anterior'>('clinico');
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [form, setForm] = useState<FormClinico>(FORM_CLINICO_INICIAL);
  const [loading, setLoading] = useState(false);
  const [exito, setExito] = useState(false);

  useEffect(() => {
    if (user) fetchPacientes();
  }, [user]);

  async function fetchPacientes() {
    const snap = await getDocs(
      query(collection(db, 'Pacientes'),
        where('enfermero_id', '==', user!.uid),
        where('activo', '==', true)
      )
    );
    setPacientes(snap.docs.map(d => ({ id: d.id, ...d.data() } as Paciente)));
  }

  function updateSignos(field: string, value: string) {
    setForm(f => ({ ...f, signosVitales: { ...f.signosVitales, [field]: value } }));
  }

  async function handleSubmitClinico() {
    if (!form.paciente_id) { alert('Selecciona un paciente'); return; }
    setLoading(true);
    try {
      await addDoc(collection(db, 'reportes'), {
        enfermero_id: user!.uid,
        paciente_id: form.paciente_id,
        tipo: 'clinico',
        timestamp: new Date().toISOString(),
        signosVitales: form.signosVitales,
        estadoNeurologico: form.estadoNeurologico,
        comportamiento: form.comportamiento,
        estudiosARealizar: form.estudiosARealizar,
        ultimoDrenado: form.ultimoDrenado,
        comentariosGenerales: form.comentariosGenerales,
      });
      setForm(FORM_CLINICO_INICIAL);
      setExito(true);
      setTimeout(() => setExito(false), 3000);
    } catch (err) {
      console.error('Error enviando reporte:', err);
    }
    setLoading(false);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Tabs */}
      <div className="flex bg-white rounded-xl shadow overflow-hidden">
        <button onClick={() => setTab('clinico')}
          className={`flex-1 py-3 text-sm font-semibold transition-colors ${tab === 'clinico' ? 'text-white' : 'text-gray-500 hover:bg-gray-50'}`}
          style={tab === 'clinico' ? { backgroundColor: '#1a3a5c' } : undefined}>
          Reporte clínico
        </button>
        <button onClick={() => setTab('anterior')}
          className={`flex-1 py-3 text-sm font-semibold transition-colors ${tab === 'anterior' ? 'text-white' : 'text-gray-500 hover:bg-gray-50'}`}
          style={tab === 'anterior' ? { backgroundColor: '#1a3a5c' } : undefined}>
          Turno anterior
        </button>
      </div>

      {/* Éxito */}
      {exito && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-green-700">
          <CheckCircle className="w-5 h-5" />
          <span className="text-sm font-medium">Reporte enviado correctamente</span>
        </div>
      )}

      {/* REPORTE CLÍNICO */}
      {tab === 'clinico' && (
        <div className="space-y-5">

          <div className="bg-white rounded-xl shadow p-5">
            <label className="block text-sm font-bold text-gray-700 mb-2">Paciente</label>
            <select
              value={form.paciente_id}
              onChange={e => setForm(f => ({ ...f, paciente_id: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              <option value="">Selecciona un paciente...</option>
              {pacientes.map(p => (
                <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>
              ))}
            </select>
          </div>

          <Section icon={<HeartPulse className="w-4 h-4 text-green-600" />} title="Signos vitales" color="green">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'FC',          field: 'FC',   placeholder: 'ej. 88 lpm' },
                { label: 'FR',          field: 'FR',   placeholder: 'ej. 18 rpm' },
                { label: 'T/A',         field: 'TA',   placeholder: 'ej. 118/76 mmHg' },
                { label: 'Temperatura', field: 'Temp', placeholder: 'ej. 37.1 °C' },
                { label: 'SpO₂',        field: 'SpO2', placeholder: 'ej. 96%' },
              ].map(item => (
                <div key={item.field}>
                  <label className="text-xs text-gray-500 mb-1 block">{item.label}</label>
                  <input
                    value={form.signosVitales[item.field as keyof typeof form.signosVitales]}
                    onChange={e => updateSignos(item.field, e.target.value)}
                    placeholder={item.placeholder}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-200"
                  />
                </div>
              ))}
            </div>
            <div className="mt-3">
              <label className="text-xs text-gray-500 mb-1 block">Notas</label>
              <textarea
                value={form.signosVitales.notas}
                onChange={e => updateSignos('notas', e.target.value)}
                placeholder="Observaciones de signos vitales..."
                rows={2}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-200 resize-none"
              />
            </div>
          </Section>

          <Section icon={<Brain className="w-4 h-4 text-indigo-600" />} title="Estado neurológico" color="indigo">
            <label className="text-xs text-gray-500 mb-1 block">Descripción del estado neurológico</label>
            <textarea
              value={form.estadoNeurologico}
              onChange={e => setForm(f => ({ ...f, estadoNeurologico: e.target.value }))}
              placeholder="ej. Consciente, orientado en tiempo y espacio..."
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-none"
            />
          </Section>

          <Section icon={<SmilePlus className="w-4 h-4 text-orange-500" />} title="Comportamiento" color="orange">
            <label className="text-xs text-gray-500 mb-1 block">Descripción del comportamiento del paciente</label>
            <textarea
              value={form.comportamiento}
              onChange={e => setForm(f => ({ ...f, comportamiento: e.target.value }))}
              placeholder="ej. Paciente tranquilo y cooperador..."
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 resize-none"
            />
          </Section>

          <Section icon={<FlaskConical className="w-4 h-4 text-teal-600" />} title="Estudios a realizar" color="teal">
            <label className="text-xs text-gray-500 mb-1 block">Estudios pendientes o por solicitar</label>
            <textarea
              value={form.estudiosARealizar}
              onChange={e => setForm(f => ({ ...f, estudiosARealizar: e.target.value }))}
              placeholder="ej. BH, QS, radiografía de tórax, ECG..."
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200 resize-none"
            />
          </Section>

          <Section icon={<Droplets className="w-4 h-4 text-blue-500" />} title="Último drenado" color="blue">
            <label className="text-xs text-gray-500 mb-1 block">Tiempo desde el último drenado</label>
            <input
              value={form.ultimoDrenado}
              onChange={e => setForm(f => ({ ...f, ultimoDrenado: e.target.value }))}
              placeholder="ej. Hace 2 horas"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </Section>

          <Section icon={<MessageSquare className="w-4 h-4 text-gray-500" />} title="Comentarios generales" color="gray">
            <label className="text-xs text-gray-500 mb-1 block">Observaciones adicionales del turno</label>
            <textarea
              value={form.comentariosGenerales}
              onChange={e => setForm(f => ({ ...f, comentariosGenerales: e.target.value }))}
              placeholder="Cualquier observación adicional relevante sobre el paciente..."
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 resize-none"
            />
          </Section>

          <button onClick={handleSubmitClinico} disabled={loading}
            className="w-full py-3 text-white font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-60 transition-opacity"
            style={{ backgroundColor: '#1a3a5c' }}>
            <Send className="w-4 h-4" />
            {loading ? 'Enviando...' : 'Enviar reporte clínico'}
          </button>
        </div>
      )}

      {/* TURNO ANTERIOR — placeholder */}
      {tab === 'anterior' && (
        <div className="space-y-4">

          {/* Patient selector */}
          <div className="bg-white rounded-xl shadow p-5">
            <label className="block text-sm font-bold text-gray-700 mb-2">Paciente</label>
            <select
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
              defaultValue=""
            >
              <option value="">Selecciona un paciente...</option>
              {pacientes.map(p => (
                <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>
              ))}
            </select>
          </div>

          {/* Placeholder report card */}
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100" style={{ backgroundColor: '#f0f4f8' }}>
              <ClipboardList className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-semibold text-gray-600">Reporte del turno anterior</span>
              <span className="ml-auto text-xs text-gray-400">— / — / ——</span>
            </div>
            <div className="px-4 py-10 flex flex-col items-center justify-center text-center gap-2">
              <ClipboardList className="w-10 h-10 text-gray-200" />
              <p className="text-sm font-medium text-gray-400">Selecciona un paciente para ver el reporte de su turno anterior</p>
              <p className="text-xs text-gray-300">Esta sección mostrará signos vitales, estado neurológico y observaciones del turno previo</p>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}

function Section({ icon, title, color, children }: {
  icon: React.ReactNode;
  title: string;
  color: 'blue' | 'green' | 'indigo' | 'orange' | 'teal' | 'gray';
  children: React.ReactNode;
}) {
  const styles = {
    blue:   { bg: 'bg-blue-50',   border: 'border-blue-200',   header: 'bg-blue-100',   text: 'text-blue-800'   },
    green:  { bg: 'bg-green-50',  border: 'border-green-200',  header: 'bg-green-100',  text: 'text-green-800'  },
    indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', header: 'bg-indigo-100', text: 'text-indigo-800' },
    orange: { bg: 'bg-orange-50', border: 'border-orange-200', header: 'bg-orange-100', text: 'text-orange-800' },
    teal:   { bg: 'bg-teal-50',   border: 'border-teal-200',   header: 'bg-teal-100',   text: 'text-teal-800'   },
    gray:   { bg: 'bg-gray-50',   border: 'border-gray-200',   header: 'bg-gray-100',   text: 'text-gray-700'   },
  }[color];

  return (
    <div className={`rounded-xl border overflow-hidden ${styles.bg} ${styles.border}`}>
      <div className={`flex items-center gap-2 px-4 py-2 ${styles.header} border-b ${styles.border}`}>
        {icon}
        <span className={`text-sm font-semibold ${styles.text}`}>{title}</span>
      </div>
      <div className="px-4 py-4">{children}</div>
    </div>
  );
}