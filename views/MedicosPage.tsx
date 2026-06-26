// views/MedicosPage.tsx
'use client';

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { Stethoscope, User, Phone, BadgeCheck, Building2 } from "lucide-react";

type Medico = {
  id: string;
  medico_id: string;
  numero_telefonico: string;
  paciente_id: string;
  en_piso: boolean;
  cedula?: string;
};

type Paciente = {
  id: string;
  nombre: string;
  apellido: string;
};

export default function MedicosPage() {
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [medicosSnap, pacientesSnap] = await Promise.all([
          getDocs(collection(db, "medicos")),
          getDocs(collection(db, "Pacientes")),
        ]);

        setMedicos(medicosSnap.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            medico_id: data['medico_id'] ?? '',
            numero_telefonico: data['numero telefonico'] ?? '',
            paciente_id: data['paciente_id'] ?? '',
            en_piso: data['en piso'] ?? false,
            cedula: data['cedula'] ?? '',
          } as Medico;
        }));

        setPacientes(pacientesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Paciente)));
      } catch (err) {
        console.error("Error cargando médicos:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  function getPacienteNombre(id: string) {
    if (!id) return "—";
    const p = pacientes.find(p => p.id === id);
    return p ? `${p.nombre} ${p.apellido}` : "—";
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <p className="text-white font-medium animate-pulse">Cargando médicos...</p>
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
        <Stethoscope className="w-5 h-5 text-gray-400" />
        <h3 className="text-lg font-bold text-gray-800">Personal médico</h3>
        <span className="ml-auto text-xs text-gray-400">{medicos.length} médico(s)</span>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr style={{ backgroundColor: '#1a3a5c' }} className="text-white">
            <th className="px-4 py-3 text-left font-semibold">Nombre</th>
            <th className="px-4 py-3 text-left font-semibold">Cédula</th>
            <th className="px-4 py-3 text-left font-semibold">Teléfono</th>
            <th className="px-4 py-3 text-left font-semibold">Paciente asignado</th>
            <th className="px-4 py-3 text-left font-semibold">Estado</th>
          </tr>
        </thead>
        <tbody>
          {medicos.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-10 text-center text-gray-400 italic">
                No hay médicos registrados
              </td>
            </tr>
          ) : (
            medicos.map((m, i) => (
              <tr key={m.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>

                {/* Nombre */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 text-gray-800 font-medium">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: '#1a3a5c' }}>
                      {m.medico_id?.[0]?.toUpperCase() ?? 'M'}
                    </div>
                    {m.medico_id || '—'}
                  </div>
                </td>

                {/* Cédula */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <BadgeCheck className="w-3.5 h-3.5 text-gray-400" />
                    {m.cedula || '—'}
                  </div>
                </td>

                {/* Teléfono */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    {m.numero_telefonico || '—'}
                  </div>
                </td>

                {/* Paciente */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    {getPacienteNombre(m.paciente_id)}
                  </div>
                </td>

                {/* En piso */}
                <td className="px-4 py-3">
                  <span
                    className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full"
                    style={m.en_piso
                      ? { backgroundColor: '#dcfce7', color: '#16a34a' }
                      : { backgroundColor: '#f3f4f6', color: '#6b7280' }
                    }
                  >
                    <Building2 className="w-3 h-3" />
                    {m.en_piso ? 'En piso' : 'Fuera de piso'}
                  </span>
                </td>

              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}