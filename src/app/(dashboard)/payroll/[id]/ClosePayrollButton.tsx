'use client'

import { useState } from "react"
import { Lock } from "lucide-react"
import { closePayrollPeriod } from "../actions"

interface ClosePayrollButtonProps {
    periodId: string;
}

export default function ClosePayrollButton({ periodId }: ClosePayrollButtonProps) {
    const [loading, setLoading] = useState(false)

    const handleClose = async () => {
        if (!confirm("¿Está seguro de cerrar esta nómina? Una vez cerrada, no podrá realizarse ninguna modificación.")) {
            return
        }

        setLoading(true)
        try {
            await closePayrollPeriod(periodId)
        } catch (error) {
            alert("Error al cerrar la nómina")
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <button
            onClick={handleClose}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
            <Lock className="h-4 w-4" />
            {loading ? 'Cerrando...' : 'Cerrar Nómina'}
        </button>
    )
}
