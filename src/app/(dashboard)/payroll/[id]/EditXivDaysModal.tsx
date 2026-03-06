'use client'

import { useState } from "react"
import { Calendar, X } from "lucide-react"
import { updateXivDays } from "../actions"

interface Props {
    recordId: string
    currentDays: number
}

export default function EditXivDaysModal({ recordId, currentDays }: Props) {
    const [isOpen, setIsOpen] = useState(false)
    const [isPending, setIsPending] = useState(false)
    const [days, setDays] = useState(currentDays)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (days < 0 || days > 360) {
            alert("Los días deben estar entre 0 y 360")
            return
        }

        setIsPending(true)
        try {
            await updateXivDays(recordId, days)
            setIsOpen(false)
        } catch (error) {
            console.error(error)
            alert("Error al actualizar los días")
        } finally {
            setIsPending(false)
        }
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-1 text-gray-500 hover:text-rose-600 transition-colors"
                title="Editar días trabajados (XIV)"
            >
                <span className="font-medium">{currentDays}</span>
                <Calendar size={14} className="opacity-50" />
            </button>
        )
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900">Días Trabajados (XIV)</h2>
                    <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Días en el período</label>
                        <input
                            type="number"
                            value={days}
                            onChange={(e) => setDays(parseInt(e.target.value) || 0)}
                            min="0"
                            max="360"
                            required
                            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                        />
                        <p className="mt-1 text-xs text-gray-400 italic text-center">
                            Ingrese 360 para pagar el año completo
                        </p>
                    </div>

                    <div className="bg-rose-50 rounded-lg p-3 text-sm text-rose-700">
                        <p className="font-medium">Cálculo:</p>
                        <p>XIV = (SBU / 360) × Días</p>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="flex-1 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50 shadow-md shadow-rose-500/20"
                        >
                            {isPending ? "Guardando..." : "Actualizar"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
