// views/FarmaciaSection.tsx
'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Loader2, X, ChevronDown } from 'lucide-react';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// ── Types ────────────────────────────────────────────────────────────────────

interface Medicamento {
  id: string;
  paciente_id: string;
  nombre: string;
  dosis: string;
  via: string;
  horario: string;
  dilucion: string;
  observaciones: string;
}

interface Paciente {
  id: string;
  nombre: string;
  apellido: string;
}

// ── Constants ────────────────────────────────────────────────────────────────

const VIAS = ['IV', 'VO', 'SGT', 'IM', 'SL', 'NAL', 'SC', 'TD', 'Otra'];

const EMPTY_FORM = {
  nombre: '',
  dosis: '',
  via: 'IV',
  horario: '',
  dilucion: '',
  observaciones: '',
};

// ── Sub-components ───────────────────────────────────────────────────────────

function Field({
  label,
  name,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
      />
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function FarmaciaSection() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [selectedPacienteId, setSelectedPacienteId] = useState<string>('');
  const [meds, setMeds] = useState<Medicamento[]>([]);
  const [loadingPacientes, setLoadingPacientes] = useState(true);
  const [loadingMeds, setLoadingMeds] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchPacientes() {
      setLoadingPacientes(true);
      try {
        const q = query(collection(db, 'Pacientes'), where('activo', '==', true));
        const snap = await getDocs(q);
        const data: Paciente[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Paciente, 'id'>),
        }));
        setPacientes(data);
        if (data.length > 0) setSelectedPacienteId(data[0].id);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingPacientes(false);
      }
    }
    fetchPacientes();
  }, []);

  useEffect(() => {
    if (!selectedPacienteId) return;
    fetchMeds(selectedPacienteId);
  }, [selectedPacienteId]);

  async function fetchMeds(pacienteId: string) {
    setLoadingMeds(true);
    try {
      const q = query(
        collection(db, 'medicamentos'),
        where('paciente_id', '==', pacienteId)
      );
      const snap = await getDocs(q);
      const data: Medicamento[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Medicamento, 'id'>),
      }));
      setMeds(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMeds(false);
    }
  }

  async function handleAdd() {
    if (!form.nombre.trim() || !form.dosis.trim() || !form.horario.trim()) {
      setError('Nombre, dosis y horario son obligatorios.');
      return;
    }
    if (!selectedPacienteId) {
      setError('Selecciona un paciente primero.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await addDoc(collection(db, 'medicamentos'), {
        paciente_id: selectedPacienteId,
        nombre: form.nombre.trim(),
        dosis: form.dosis.trim(),
        via: form.via,
        horario: form.horario.trim(),
        dilucion: form.dilucion.trim(),
        observaciones: form.observaciones.trim(),
        created_at: serverTimestamp(),
      });
      setForm(EMPTY_FORM);
      setShowForm(false);
      fetchMeds(selectedPacienteId);
    } catch (e: any) {
      setError(e.message ?? 'Error al guardar.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteDoc(doc(db, 'medicamentos', id));
      setMeds((prev) => prev.filter((m) => m.id !== id));
    } catch (e) {
      console.error(e);
    }
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  const selectedPaciente = pacientes.find((p) => p.id === selectedPacienteId);

  return (
    <div className="max-w-5xl mx-auto space-y-4">

      {/* Patient selector */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        {loadingPacientes ? (
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Cargando pacientes...
          </div>
        ) : pacientes.length === 0 ? (
          <p className="text-sm text-gray-400">No hay pacientes activos registrados.</p>
        ) : (
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-600 whitespace-nowrap">
              Paciente:
            </label>
            <div className="relative flex-1 max-w-xs">
              <select
                value={selectedPacienteId}
                onChange={(e) => {
                  setSelectedPacienteId(e.target.value);
                  setShowForm(false);
                  setError('');
                }}
                className="w-full appearance-none text-sm border border-gray-200 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white font-medium text-gray-800"
              >
                {pacientes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} {p.apellido}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        )}
      </div>

      {/* MAR Table */}
      {selectedPacienteId && (
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          {loadingMeds ? (
            <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Cargando medicamentos...</span>
            </div>
          ) : (
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr style={{ backgroundColor: '#1a3a5c' }} className="text-white">
                  <th className="px-4 py-3 text-left font-semibold tracking-wide">NOMBRE</th>
                  <th className="px-4 py-3 text-left font-semibold tracking-wide">DOSIS</th>
                  <th className="px-4 py-3 text-left font-semibold tracking-wide">VÍA</th>
                  <th className="px-4 py-3 text-left font-semibold tracking-wide">HORARIO</th>
                  <th className="px-4 py-3 text-left font-semibold tracking-wide">DILUCIÓN</th>
                  <th className="px-4 py-3 text-left font-semibold tracking-wide">OBSERVACIONES</th>
                  <th className="px-4 py-3 w-8" />
                </tr>
              </thead>
              <tbody>
                {meds.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center text-gray-400 py-12 text-sm">
                      Sin medicamentos registrados para este paciente.
                    </td>
                  </tr>
                ) : (
                  meds.map((m, i) => (
                    <tr
                      key={m.id}
                      className={`border-b border-gray-50 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                    >
                      <td className="px-4 py-3 font-medium text-gray-800">{m.nombre}</td>
                      <td className="px-4 py-3 text-gray-700">{m.dosis}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                          {m.via}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700 font-mono text-xs">{m.horario}</td>
                      <td className="px-4 py-3 text-gray-600">{m.dilucion || '—'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{m.observaciones || '—'}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDelete(m.id)}
                          className="text-gray-300 hover:text-red-500 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Inline add form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">
              Nuevo medicamento —{' '}
              <span className="font-normal text-gray-500">
                {selectedPaciente?.nombre} {selectedPaciente?.apellido}
              </span>
            </h3>
            <button
              onClick={() => {
                setShowForm(false);
                setError('');
                setForm(EMPTY_FORM);
              }}
            >
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Field label="Nombre *" name="nombre" value={form.nombre} onChange={handleChange} placeholder="Ej. Metronidazol" />
            <Field label="Dosis *" name="dosis" value={form.dosis} onChange={handleChange} placeholder="Ej. 500mg" />
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Vía</label>
              <select
                name="via"
                value={form.via}
                onChange={handleChange}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
              >
                {VIAS.map((v) => <option key={v}>{v}</option>)}
              </select>
            </div>
            <Field label="Horario *" name="horario" value={form.horario} onChange={handleChange} placeholder="Ej. 8-16-24" />
            <Field label="Dilución" name="dilucion" value={form.dilucion} onChange={handleChange} placeholder="Ej. 100ml SSN" />
            <Field label="Observaciones" name="observaciones" value={form.observaciones} onChange={handleChange} placeholder="Ej. PRN c/6h" />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button
            onClick={handleAdd}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: '#1a3a5c' }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {saving ? 'Guardando...' : 'Guardar medicamento'}
          </button>
        </div>
      )}

      {/* Add button */}
      {!showForm && selectedPacienteId && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#1a3a5c' }}
        >
          <Plus className="w-4 h-4" />
          Agregar medicamento
        </button>
      )}
    </div>
  );
}