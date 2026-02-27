'use client'

import { useEffect, useState } from 'react'
import { ListChecks, Download, Search, Loader2 } from 'lucide-react'

interface AuditEntry {
    id: string
    action: string
    employeeCount: number
    userEmail: string | null
    createdAt: string
    details: string | null
    period: {
        month: number
        year: number
        type: string
        company: {
            name: string
            ruc: string
        }
    }
}

export default function AuditPage() {
    const [audits, setAudits] = useState<AuditEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        async function fetchAudits() {
            try {
                const res = await fetch('/api/audit')
                if (!res.ok) throw new Error('Unauthorized or error fetching data')
                const data = await res.json()
                setAudits(data)
            } catch (err: any) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }
        fetchAudits()
    }, [])

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <ListChecks className="h-8 w-8 text-indigo-600" />
                        Auditoría de Nómina
                    </h1>
                    <p className="text-slate-600 mt-1">
                        Registro de todas las nóminas calculadas y cerradas en el sistema.
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <div className="flex gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Buscar por empresa, usuario o fecha..." 
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                            />
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="p-12 flex justify-center">
                        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
                    </div>
                ) : error ? (
                    <div className="p-12 text-center text-red-600">
                        {error}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-700 font-medium">
                                <tr>
                                    <th className="px-6 py-3">Fecha</th>
                                    <th className="px-6 py-3">Acción</th>
                                    <th className="px-6 py-3">Empresa</th>
                                    <th className="px-6 py-3">Período</th>
                                    <th className="px-6 py-3 text-right">Empleados</th>
                                    <th className="px-6 py-3">Usuario</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {audits.map((audit) => {
                                    let details: any = {};
                                    try {
                                        if (audit.details) details = JSON.parse(audit.details);
                                    } catch (e) {}

                                    return (
                                        <tr key={audit.id} className="hover:bg-slate-50/50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {new Date(audit.createdAt).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    audit.action === 'CLOSED' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                                                }`}>
                                                    {audit.action}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-slate-900">{audit.period?.company?.name || 'N/A'}</div>
                                                <div className="text-slate-500 text-xs">{audit.period?.company?.ruc || 'N/A'}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {details.month}/{details.year} - {details.type}
                                            </td>
                                            <td className="px-6 py-4 text-right font-medium">
                                                {audit.employeeCount}
                                            </td>
                                            <td className="px-6 py-4 text-slate-500">
                                                {audit.userEmail || 'Sistema'}
                                            </td>
                                        </tr>
                                    )
                                })}
                                {audits.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                            No se encontraron registros de auditoría.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
