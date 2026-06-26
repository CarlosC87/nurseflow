// views/AlmacenPage.tsx
'use client';

import { useState } from 'react';
import { Cross, Monitor, AlertTriangle, ChevronRight, Package } from 'lucide-react';

type Tab = 'insumos' | 'dispositivos';
///nigga///
interface Insumo {
  id: string;
  nombre: string;
  stock: number;
  unidad: string;
}

interface Dispositivo {
  id: string;
  nombre: string;
  estado: 'Operativo' | 'En mantenimiento' | 'Fuera de servicio';
}

const MOCK_INSUMOS: Insumo[] = [
  { id: '1', nombre: 'Jeringas 5ml',          stock: 200, unidad: 'pzas' },
  { id: '2', nombre: 'Gasas Estériles',        stock: 8,   unidad: 'pqts' },
  { id: '3', nombre: 'Catéteres Venosos',      stock: 34,  unidad: 'pzas' },
  { id: '4', nombre: 'Solución Salina 500ml',  stock: 60,  unidad: 'fcos' },
  { id: '5', nombre: 'Guantes Nitrilo M',      stock: 3,   unidad: 'cajas' },
  { id: '6', nombre: 'Mascarillas N95',        stock: 50,  unidad: 'pzas' },
  { id: '7', nombre: 'Vendas Elásticas',       stock: 0,   unidad: 'rollos' },
  { id: '8', nombre: 'Apósitos Adhesivos',     stock: 120, unidad: 'pzas' },
];

const MOCK_DISPOSITIVOS: Dispositivo[] = [
  { id: '1', nombre: 'Bomba de Infusión',        estado: 'Operativo' },
  { id: '2', nombre: 'Monitor de Signos Vitales', estado: 'Operativo' },
  { id: '3', nombre: 'Ventilador Mecánico',       estado: 'En mantenimiento' },
  { id: '4', nombre: 'Desfibrilador',             estado: 'Operativo' },
  { id: '5', nombre: 'Oxímetro de Pulso',         estado: 'Operativo' },
  { id: '6', nombre: 'Electrocardiógrafo',        estado: 'Fuera de servicio' },
  { id: '7', nombre: 'Cama Eléctrica #3',         estado: 'En mantenimiento' },
  { id: '8', nombre: 'Ultrasonido Portátil',      estado: 'Operativo' },
];

function getStockStatus(stock: number) {
  if (stock === 0)  return { label: 'Agotado',    color: '#dc2626', bg: '#fee2e2' };
  if (stock <= 10)  return { label: 'Stock bajo',  color: '#d97706', bg: '#fef9c3' };
  return              { label: 'Ver Stock',        color: '#2b7bb9', bg: 'transparent' };
}

function getEstadoStyle(estado: Dispositivo['estado']) {
  if (estado === 'Operativo')          return { color: '#16a34a', dot: '#16a34a' };
  if (estado === 'En mantenimiento')   return { color: '#d97706', dot: '#d97706' };
  return                                 { color: '#dc2626', dot: '#dc2626' };
}

function InsumoRow({ insumo }: { insumo: Insumo }) {
  const s = getStockStatus(insumo.stock);
  return (
    <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-sm">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: '#eef4f8' }}>
        <Package className="w-4 h-4" style={{ color: '#1a3a5c' }} />
      </div>
      <span className="flex-1 text-sm font-medium text-gray-800">{insumo.nombre}</span>
      <span className="text-xs font-semibold px-2 py-1 rounded-lg"
        style={{ color: s.color, backgroundColor: s.bg, border: s.bg === 'transparent' ? 'none' : undefined }}>
        {s.label === 'Ver Stock' ? `Ver Stock` : s.label}
      </span>
    </div>
  );
}

function DispositivoRow({ dispositivo }: { dispositivo: Dispositivo }) {
  const s = getEstadoStyle(dispositivo.estado);
  return (
    <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-sm">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: '#eef4f8' }}>
        <Monitor className="w-4 h-4" style={{ color: '#1a3a5c' }} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-800">{dispositivo.nombre}</p>
        <p className="text-xs mt-0.5" style={{ color: s.color }}>Estado: {dispositivo.estado}</p>
      </div>
      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.dot }} />
    </div>
  );
}

export default function AlmacenPage() {
  const [tab, setTab] = useState<Tab>('insumos');

  return (
    <div className="max-w-2xl mx-auto space-y-4">

      {/* Tab switcher */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setTab('insumos')}
          className="flex flex-col items-center gap-1.5 py-4 rounded-xl text-sm font-semibold transition-all border-2"
          style={{
            backgroundColor: tab === 'insumos' ? '#1a3a5c' : 'white',
            color:           tab === 'insumos' ? 'white'   : '#6b7280',
            borderColor:     tab === 'insumos' ? '#1a3a5c' : '#e5e7eb',
          }}
        >
          <Cross className="w-5 h-5" />
          Insumos Médicos
        </button>
        <button
          onClick={() => setTab('dispositivos')}
          className="flex flex-col items-center gap-1.5 py-4 rounded-xl text-sm font-semibold transition-all border-2"
          style={{
            backgroundColor: tab === 'dispositivos' ? '#1a3a5c' : 'white',
            color:           tab === 'dispositivos' ? 'white'   : '#6b7280',
            borderColor:     tab === 'dispositivos' ? '#1a3a5c' : '#e5e7eb',
          }}
        >
          <Monitor className="w-5 h-5" />
          Dispositivos
        </button>
      </div>

      {/* Alert banner */}
      <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-opacity hover:opacity-90"
        style={{ backgroundColor: '#7f1d1d' }}>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: '#991b1b' }}>
          <AlertTriangle className="w-5 h-5 text-red-200" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-red-100">¿Falla en un equipo?</p>
          <p className="text-xs text-red-300">Contactar a Ingeniería Biomédica</p>
        </div>
        <ChevronRight className="w-4 h-4 text-red-300 flex-shrink-0" />
      </button>

      {/* List */}
      <div className="space-y-2">
        {tab === 'insumos'
          ? MOCK_INSUMOS.map(i => <InsumoRow key={i.id} insumo={i} />)
          : MOCK_DISPOSITIVOS.map(d => <DispositivoRow key={d.id} dispositivo={d} />)
        }
      </div>
    </div>
  );
}