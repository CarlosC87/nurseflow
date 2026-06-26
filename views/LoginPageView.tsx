'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    correo: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        form.correo,
        form.password
      );

      
      const profileSnap = await getDoc(doc(db, "profiles", userCredential.user.uid));
      const rol = profileSnap.exists() ? profileSnap.data().rol : null;

      router.push(rol === "admin" ? "/admin" : "/dashboard");
      // No quitamos el loading aquí a propósito: el botón se queda
      // deshabilitado mientras ocurre la navegación.
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#a8d5e2" }}>
      <header className="py-4 text-center" style={{ backgroundColor: "#a8d5e2" }}>
        <h1 className="text-2xl font-bold text-gray-800">NurseFlow, cuidado continuo</h1>
      </header>

      <div className="flex-1 flex justify-center py-4">
        <div className="w-full max-w-md bg-white shadow-md mx-4" style={{ borderRadius: "0" }}>
          <div className="flex justify-center pt-6 pb-2">
            <SmallLogo />
          </div>

          <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-4">
            <FormField
              label="CORREO"
              name="correo"
              placeholder="Ingresa tu correo electrónico"
              value={form.correo}
              onChange={handleChange}
              type="email"
              required
            />
            <FormField
              label="CONTRASEÑA"
              name="password"
              placeholder="Ingresa tu contraseña"
              value={form.password}
              onChange={handleChange}
              type="password"
              required
            />

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-white font-medium rounded transition-colors disabled:opacity-60"
              style={{ backgroundColor: "#1a3a5c" }}
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </button>

            <p className="text-center text-sm text-gray-600">
              ¿No tienes cuenta?{" "}
              <button
                type="button"
                onClick={() => router.push("/register")}
                className="text-blue-600 underline hover:text-blue-800"
              >
                Registrarse
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

function FormField({
  label,
  name,
  placeholder,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  name: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-700 mb-1 tracking-wide">{label}</label>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-400"
        style={{ backgroundColor: "#eef4f8" }}
      />
    </div>
  );
}

function SmallLogo() {
  return (
    <div className="flex flex-col items-center mb-2">
      <div className="text-center mb-1">
        <span className="font-extrabold text-sm tracking-wide" style={{ color: "#1a3a5c" }}>
          NURSE FLOW
        </span>
        <p className="text-xs tracking-widest" style={{ color: "#5ba3b0", fontSize: "9px" }}>
          CUIDADO CONTINUO
        </p>
      </div>
      {/* SVG logo igual que antes */}
    </div>
  );
}
