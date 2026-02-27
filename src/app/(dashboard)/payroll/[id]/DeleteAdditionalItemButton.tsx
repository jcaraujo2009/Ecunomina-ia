'use client'

import { Trash2 } from "lucide-react"
import { removeAdditionalEarning, removeAdditionalDeduction } from "../actions"
import { useState } from "react"

interface Props {
    recordId: string
    itemId: string
    type: 'earning' | 'deduction'
}

export default function DeleteAdditionalItemButton({ recordId, itemId, type }: Props) {
    const [isPending, setIsPending] = useState(false)

    async function handleDelete() {
        if (!confirm("¿Está seguro de eliminar este item?")) return

        setIsPending(true)
        try {
            if (type === 'earning') {
                await removeAdditionalEarning(recordId, itemId)
            } else {
                await removeAdditionalDeduction(recordId, itemId)
            }
        } catch (error) {
            console.error(error)
            alert("Error al eliminar el item")
        } finally {
            setIsPending(false)
        }
    }

    return (
        <button
            disabled={isPending}
            onClick={handleDelete}
            className="text-gray-400 hover:text-red-500 disabled:opacity-50 transition-colors"
            title="Eliminar item"
        >
            <Trash2 size={12} />
        </button>
    )
}
