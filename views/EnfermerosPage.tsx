// views/EnfermerosPage.tsx
'use client';

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

type Profile = {
  id: string;
  nombre: string;
  apellido: string;
  rol: string;
  cedula?: string;
  telefono?: string;
  paciente_id?: string;
  habitacion_id?: string;
  turno?: string;
};

type Paciente = {
  id: string;
  nombre: string;
  apellido: string;
};

type Habitacion = {
  id: string;
  numero: string;
};

export default function EnfermerosPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [habitaciones, setHabitaciones] = useState<Habitacion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const profilesSnap = await getDocs(collection(db, "profiles"));
        const pacientesSnap = await getDocs(collection(db, "Pacientes"));
        const habitacionesSnap = await getDocs(collection(db, "habitaciones"));

        setProfiles(profilesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Profile)));
        setPacientes(pacientesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Paciente)));
        setHabitaciones(habitacionesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Habitacion)));
      } catch (err) {
        console.error("Error cargando datos:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  function getPacienteNombre(id?: string) {
    if (!id) return "—";
    const p = pacientes.find(p => p.id === id);
    return p ? `${p.nombre} ${p.apellido}` : "—";
  }

  function getHabitacionNumero(id?: string) {
    if (!id) return "—";
    const h = habitaciones.find(h => h.id === id);
    return h ? h.numero : "—";
  }

  if (loading) return <p>Cargando personal de enfermería...</p>;

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h3 className="text-lg font-bold mb-4">Personal de enfermería</h3>
      <table className="w-full text-sm">
        <thead>
          <tr style={{ backgroundColor: '#1a3a5c' }} className="text-white">
            <th className="px-4 py-3 text-left font-semibold">Nombre</th>
            <th className="px-4 py-3 text-left font-semibold">Cédula</th>
            <th className="px-4 py-3 text-left font-semibold">Teléfono</th>
            <th className="px-4 py-3 text-left font-semibold">Paciente</th>
            <th className="px-4 py-3 text-left font-semibold">Habitación</th>
            <th className="px-4 py-3 text-left font-semibold">Turno</th>
          </tr>
        </thead>
        <tbody>
          {profiles.filter(p => p.rol === "enfermero").map((e, i) => (
            <tr key={e.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="px-4 py-3 text-gray-800">{e.nombre} {e.apellido}</td>
              <td className="px-4 py-3 text-gray-600">{e.cedula || "—"}</td>
              <td className="px-4 py-3 text-gray-600">{e.telefono || "—"}</td>
              <td className="px-4 py-3 text-gray-600">{getPacienteNombre(e.paciente_id)}</td>
              <td className="px-4 py-3 text-gray-600">{getHabitacionNumero(e.habitacion_id)}</td>
              <td className="px-4 py-3 text-gray-600">{e.turno || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}