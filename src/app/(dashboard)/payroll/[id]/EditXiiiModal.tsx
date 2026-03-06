'use client'

import { useState } from "react"
import { DollarSign, X } from "lucide-react"
import { updateXiiiAmount } from "../actions"

interface Props {
    recordId: string
    currentAmount: number
}

export default function EditXiiiModal({ recordId, currentAmount }: Props) {
    const [isOpen, setIsOpen] = useState(false)
    const [isPending, setIsPending] = useState(false)
    const [amount, setAmount] = useState(currentAmount)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (amount < 0) {
            alert("El monto no puede ser negativo")
            return
        }

        setIsPending(true)
        try {
            await updateXiiiAmount(recordId, amount)
            setIsOpen(false)
        } catch (error) {
            console.error(error)
            alert("Error al actualizar el monto")
        } finally {
            setIsPending(false)
        }
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-1 text-gray-500 hover:text-purple-600 transition-colors"
                title="Editar monto XIII"
            >
                <span className="font-medium">${currentAmount.toFixed(2)}</span>
                <DollarSign size={14} className="opacity-50" />
            </button>
        )
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900">Editar XIII</h2>
                    <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Monto XIII</label>
                        <input
                            type="number"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                            min="0"
                            required
                            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                        <p className="mt-1 text-xs text-gray-400 italic text-center">
                            Calculado: (Ingresos IESSables) / 12
                        </p>
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
                            className="flex-1 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50 shadow-md shadow-purple-500/20"
                        >
                            {isPending ? "Guardando..." : "Actualizar"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
