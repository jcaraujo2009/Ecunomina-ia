'use client'

import { useState } from "react"
import { Clock, X } from "lucide-react"
import { updatePayrollRecordOvertime } from "@/app/(dashboard)/payroll/actions"

interface EditOvertimeModalProps {
    recordId: string
    current25: number
    current50: number
    current100: number
    employeeName: string
}

export default function EditOvertimeModal({ recordId, current25, current50, current100, employeeName }: EditOvertimeModalProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isPending, setIsPending] = useState(false)

    async function handleSubmit(formData: FormData) {
        setIsPending(true)
        const h25 = parseFloat(formData.get("overtime25h") as string) || 0
        const h50 = parseFloat(formData.get("overtime50h") as string) || 0
        const h100 = parseFloat(formData.get("overtime100h") as string) || 0

        try {
            await updatePayrollRecordOvertime(recordId, h25, h50, h100)
            setIsOpen(false)
        } catch (error) {
            console.error(error)
            alert("Error al actualizar horas extras")
        } finally {
            setIsPending(false)
        }
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 transition-colors"
                title="Editar Horas Extras"
            >
                <Clock size={18} />
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between border-b pb-4">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Horas Extras</h2>
                                <p className="text-sm text-gray-500">{employeeName}</p>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>

                        <form action={handleSubmit} className="mt-6 space-y-4">
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Recargo Nocturno (25%)</label>
                                    <input
                                        type="number"
                                        name="overtime25h"
                                        step="0.5"
                                        min="0"
                                        defaultValue={current25}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Horas Suplementarias (50%)</label>
                                    <input
                                        type="number"
                                        name="overtime50h"
                                        step="0.5"
                                        min="0"
                                        defaultValue={current50}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Horas Extraordinarias (100%)</label>
                                    <input
                                        type="number"
                                        name="overtime100h"
                                        step="0.5"
                                        min="0"
                                        defaultValue={current100}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="flex-1 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {isPending ? "Guardando..." : "Guardar"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
