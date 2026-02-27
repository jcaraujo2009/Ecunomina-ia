'use client'

import { useState } from "react"
import { Plus, X } from "lucide-react"
import { addAdditionalEarning, addAdditionalDeduction } from "../actions"

interface Props {
    recordId: string
    earningsTypes: any[]
    deductionsTypes: any[]
}

export default function AddAdditionalItemModal({ recordId, earningsTypes, deductionsTypes }: Props) {
    const [isOpen, setIsOpen] = useState(false)
    const [isPending, setIsPending] = useState(false)
    const [activeTab, setActiveTab] = useState<'earning' | 'deduction'>('earning')

    async function handleSubmit(formData: FormData) {
        setIsPending(true)
        const typeId = formData.get("typeId") as string
        const amount = parseFloat(formData.get("amount") as string)
        const description = formData.get("description") as string

        try {
            if (activeTab === 'earning') {
                await addAdditionalEarning(recordId, typeId, amount, description)
            } else {
                await addAdditionalDeduction(recordId, typeId, amount, description)
            }
            setIsOpen(false)
        } catch (error) {
            console.error(error)
            alert("Error al guardar el item")
        } finally {
            setIsPending(false)
        }
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
            >
                <Plus size={14} />
                Agregar Item
            </button>
        )
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900 font-inter">Agregar Ingreso/Deducción</h2>
                    <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex border-b mb-4">
                    <button
                        className={`flex-1 py-2 text-sm font-medium ${activeTab === 'earning' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
                        onClick={() => setActiveTab('earning')}
                    >
                        Ingreso
                    </button>
                    <button
                        className={`flex-1 py-2 text-sm font-medium ${activeTab === 'deduction' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
                        onClick={() => setActiveTab('deduction')}
                    >
                        Deducción
                    </button>
                </div>

                <form action={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Tipo</label>
                        <select
                            name="typeId"
                            required
                            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="">Seleccione un tipo...</option>
                            {activeTab === 'earning'
                                ? earningsTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)
                                : deductionsTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)
                            }
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Valor</label>
                        <div className="relative mt-1">
                            <span className="absolute left-3 top-2 text-gray-400">$</span>
                            <input
                                name="amount"
                                type="number"
                                step="0.01"
                                required
                                min="0.01"
                                className="block w-full rounded-lg border border-gray-300 pl-7 pr-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Descripción (Opcional)</label>
                        <textarea
                            name="description"
                            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            rows={2}
                            placeholder="Motivo de este registro"
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
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
                            className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                            {isPending ? "Guardando..." : "Guardar"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
