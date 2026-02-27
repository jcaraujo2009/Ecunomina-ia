'use client'

import { useState } from "react"
import Image from "next/image";
import { Building2, Save, MapPin, Phone, CreditCard, DollarSign, Mail } from "lucide-react"
import { createCompany, updateCompany } from "./actions"

interface CompanySettingsFormProps {
    company: any
}

export default function CompanySettingsForm({ company: initialCompany }: CompanySettingsFormProps) {
    const [company, setCompany] = useState(initialCompany || {
        name: "",
        ruc: "",
        address: "",
        phone: "",
        baseSalary: 460.00,
        sendPayrollEmail: false,
        emailFrom: "",
        emailHost: "",
        emailPort: 587,
        emailPassword: ""
    })
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage("")
        try {
            if (initialCompany?.id) {
                await updateCompany(initialCompany.id, company)
                setMessage("Empresa actualizada correctamente")
            } else {
                const newCompany = await createCompany(company)
                setMessage("Empresa creada correctamente")
                // Refresh or redirect if needed
            }
        } catch (error) {
            console.error(error)
            setMessage("Error al guardar los cambios")
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-indigo-600" />
                        Información de la Empresa
                    </h2>
                    <p className="text-sm text-slate-700 mt-1">
                        Configura los datos principales de tu organización para los reportes y cálculos.
                    </p>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                            Nombre de la Empresa
                        </label>
                        <input
                            type="text"
                            required
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium uppercase"
                            value={company.name}
                            onChange={(e) => setCompany({ ...company, name: e.target.value.toUpperCase() })}
                            placeholder="EJ. ECUNOMINA S.A."
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-slate-400" />
                            RUC
                        </label>
                        <input
                            type="text"
                            required
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono uppercase"
                            value={company.ruc}
                            onChange={(e) => setCompany({ ...company, ruc: e.target.value.toUpperCase() })}
                            placeholder="EJ. 1791234567001"
                        />
                    </div>

                    <div className="space-y-4 md:col-span-1">
                        <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                            Logo de la Empresa
                        </label>
                        <div className="flex items-center gap-4">
                            <div className="h-20 w-20 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50 overflow-hidden relative group">
                                {company.logo ? (
                                    <>
                                        <Image src={company.logo} alt="Preview" className="h-full w-full object-contain" width={80} height={80} />
                                        <button
                                            type="button"
                                            onClick={() => setCompany({ ...company, logo: null })}
                                            className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs"
                                        >
                                            Eliminar
                                        </button>
                                    </>
                                ) : (
                                    <Building2 className="h-8 w-8 text-slate-300" />
                                )}
                            </div>
                            <div className="flex-1">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onloadend = () => {
                                                setCompany({ ...company, logo: reader.result as string });
                                            };
                                            reader.readAsDataURL(file);
                                        }
                                    }}
                                    className="block w-full text-sm text-slate-500
                                        file:mr-4 file:py-2 file:px-4
                                        file:rounded-full file:border-0
                                        file:text-sm file:font-semibold
                                        file:bg-indigo-50 file:text-indigo-700
                                        hover:file:bg-indigo-100"
                                />
                                <p className="text-xs text-slate-700 mt-1">PNG, JPG HASTA 2MB RECOMENDABLE.</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-slate-400" />
                            Dirección
                        </label>
                        <input
                            type="text"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all uppercase"
                            value={company.address || ""}
                            onChange={(e) => setCompany({ ...company, address: e.target.value.toUpperCase() })}
                            placeholder="EJ. AV. AMAZONAS Y COLON, QUITO"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                            <Phone className="h-4 w-4 text-slate-400" />
                            Teléfono
                        </label>
                        <input
                            type="text"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all uppercase"
                            value={company.phone || ""}
                            onChange={(e) => setCompany({ ...company, phone: e.target.value.toUpperCase() })}
                            placeholder="EJ. 02 2345 678"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-slate-400" />
                            Salario Básico Unificado (SBU)
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-2 text-slate-500">$</span>
                            <input
                                type="number"
                                step="any"
                                required
                                className="w-full rounded-lg border border-slate-300 pl-7 pr-3 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                                value={company.baseSalary}
                                onChange={(e) => setCompany({ ...company, baseSalary: parseFloat(e.target.value) })}
                                placeholder="Ej. 460.00"
                            />
                        </div>
                        <p className="text-xs text-slate-700">SE USARÁ PARA EL CÁLCULO DE LA 14VA REMUNERACIÓN.</p>
                    </div>
                </div>

                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                        <Mail className="h-5 w-5 text-indigo-600" />
                        Configuración de Correo
                    </h2>
                    <p className="text-sm text-slate-700 mt-1">
                        Configura el servidor SMTP para enviar los roles de pago por correo electrónico al cerrar la nómina.
                    </p>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 md:col-span-2 flex flex-col gap-2">
                         <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="sendPayrollEmail"
                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                checked={company.sendPayrollEmail || false}
                                onChange={(e) => setCompany({ ...company, sendPayrollEmail: e.target.checked })}
                            />
                            <label htmlFor="sendPayrollEmail" className="text-sm font-medium text-slate-700">
                                Enviar rol de pago por correo electrónico al cerrar la nómina
                            </label>
                         </div>
                    </div>

                    {company.sendPayrollEmail && (
                        <>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                    Correo Remitente
                                </label>
                                <input
                                    type="email"
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                                    value={company.emailFrom || ""}
                                    onChange={(e) => setCompany({ ...company, emailFrom: e.target.value })}
                                    placeholder="nominas@empresa.com"
                                />
                            </div>

                             <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                    Contraseña
                                </label>
                                <input
                                    type="password"
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                                    value={company.emailPassword || ""}
                                    onChange={(e) => setCompany({ ...company, emailPassword: e.target.value })}
                                    placeholder="••••••••"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                    Servidor (Host)
                                </label>
                                <input
                                    type="text"
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                                    value={company.emailHost || ""}
                                    onChange={(e) => setCompany({ ...company, emailHost: e.target.value })}
                                    placeholder="smtp.gmail.com"
                                />
                            </div>

                             <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                    Puerto
                                </label>
                                <input
                                    type="number"
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                                    value={company.emailPort || 587}
                                    onChange={(e) => setCompany({ ...company, emailPort: parseInt(e.target.value) })}
                                    placeholder="587"
                                />
                            </div>
                        </>
                    )}
                </div>

                <div className="bg-slate-50 p-6 flex items-center justify-between border-t border-slate-100">
                    <div>
                        {message && (
                            <p className={`text-sm font-medium ${message.includes("Error") ? "text-red-600" : "text-green-600"}`}>
                                {message}
                            </p>
                        )}
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all disabled:opacity-50"
                    >
                        <Save className="h-4 w-4" />
                        {loading ? "Guardando..." : "Guardar Cambios"}
                    </button>
                </div>
            </div>
        </form>
    )
}
