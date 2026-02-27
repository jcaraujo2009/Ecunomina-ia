import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Plus, Trash2, X } from "lucide-react"
import { createDeductionType, deleteDeductionType } from "./actions"
import { getMyCompany } from "../company/actions"

export default async function DeductionsSettingsPage() {
    const session = await auth()
    const companyId = (session?.user as any)?.companyId

    if (!companyId) return <div>No company associated.</div>;

    const deductions = await (prisma as any).additionalDeductionType.findMany({
        where: { companyId },
        orderBy: { name: "asc" }
    })

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Maestro de Deducciones Adicionales</h1>
                <p className="text-gray-700">DEFINE PRÉSTAMOS, ADELANTOS Y OTROS DESCUENTOS.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-1">
                    <div className="rounded-xl border bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-semibold mb-4">Nuevo Tipo de Deducción</h2>
                        <form action={createDeductionType} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nombre</label>
                                <input
                                    name="name"
                                    required
                                    className="mt-1 block w-full rounded-lg border border-gray-400 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 uppercase font-medium"
                                    placeholder="EJ: ANTICIPO DE SUELDO"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Descripción</label>
                                <textarea
                                    name="description"
                                    className="mt-1 block w-full rounded-lg border border-gray-400 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 uppercase font-medium"
                                    rows={2}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Fórmula (Opcional)</label>
                                <input
                                    name="formula"
                                    className="mt-1 block w-full rounded-lg border border-gray-400 px-3 py-2 text-sm font-mono focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                                    placeholder="Ej: baseSalary * 0.01"
                                />
                                <p className="text-xs text-gray-500 mt-1">Variables: salary, baseSalary, netSalary</p>
                            </div>
                            <button type="submit" className="w-full flex justify-center items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                                <Plus size={18} />
                                Agregar
                            </button>
                        </form>
                    </div>
                </div>

                <div className="md:col-span-2">
                    <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
                        <table className="w-full text-left text-sm text-gray-700">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-900 font-bold">
                                <tr>
                                    <th className="px-6 py-4">Nombre</th>
                                    <th className="px-6 py-4">Descripción</th>
                                    <th className="px-6 py-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {deductions.map((type: any) => (
                                    <tr key={type.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            {type.name}
                                        </td>
                                        <td className="px-6 py-4">
                                            {type.description || <span className="text-gray-300 italic text-xs">Sin descripción</span>}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <form action={async () => {
                                                'use server'
                                                await deleteDeductionType(type.id)
                                            }}>
                                                <button className="text-red-400 hover:text-red-600">
                                                    <Trash2 size={18} />
                                                </button>
                                            </form>
                                        </td>
                                    </tr>
                                ))}
                                {deductions.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-10 text-center text-gray-400 italic">
                                            No hay tipos de deducciones definidos.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
