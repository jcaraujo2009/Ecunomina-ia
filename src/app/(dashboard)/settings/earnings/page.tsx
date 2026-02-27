import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Plus, Trash2, Edit2, Check, X } from "lucide-react"
import { createEarningType, deleteEarningType } from "./actions"
import { getMyCompany } from "../company/actions"

export default async function EarningsSettingsPage() {
    const session = await auth()
    const companyId = (session?.user as any)?.companyId

    if (!companyId) return <div>No company associated.</div>;

    const earnings = await (prisma as any).additionalEarningType.findMany({
        where: { companyId },
        orderBy: { name: "asc" }
    })

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Maestro de Ingresos Adicionales</h1>
                <p className="text-gray-700">DEFINE LOS TIPOS DE BONOS, COMISIONES Y OTROS INGRESOS.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-1">
                    <div className="rounded-xl border bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-semibold mb-4">Nuevo Tipo de Ingreso</h2>
                        <form action={createEarningType} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nombre</label>
                                <input
                                    name="name"
                                    required
                                    className="mt-1 block w-full rounded-lg border border-gray-400 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 uppercase font-medium"
                                    placeholder="EJ: BONO DE DESEMPEÑO"
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
                                    placeholder="Ej: salary / 30 * daysWorked"
                                />
                                <p className="text-xs text-gray-500 mt-1">Variables: salary, baseSalary, daysWorked, overtimeValue</p>
                            </div>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" name="isIessable" defaultChecked className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600" />
                                    <span className="text-sm text-gray-700">Aporta al IESS</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" name="isTaxable" defaultChecked className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600" />
                                    <span className="text-sm text-gray-700">Grava Impuesto a la Renta</span>
                                </label>
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
                                    <th className="px-6 py-4">IESS</th>
                                    <th className="px-6 py-4">Renta</th>
                                    <th className="px-6 py-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {earnings.map((type: any) => (
                                    <tr key={type.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            {type.name}
                                            {type.description && <p className="text-xs font-normal text-gray-400">{type.description}</p>}
                                        </td>
                                        <td className="px-6 py-4">
                                            {type.isIessable ? <Check size={18} className="text-green-600" /> : <X size={18} className="text-red-400" />}
                                        </td>
                                        <td className="px-6 py-4">
                                            {type.isTaxable ? <Check size={18} className="text-green-600" /> : <X size={18} className="text-red-400" />}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <form action={async () => {
                                                'use server'
                                                await deleteEarningType(type.id)
                                            }}>
                                                <button className="text-red-400 hover:text-red-600">
                                                    <Trash2 size={18} />
                                                </button>
                                            </form>
                                        </td>
                                    </tr>
                                ))}
                                {earnings.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-10 text-center text-gray-400 italic">
                                            No hay tipos de ingresos definidos.
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
