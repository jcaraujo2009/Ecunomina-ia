'use client'

import { FileText } from "lucide-react"
import { generateIndividualPaySlip } from "@/lib/reports"

interface PaySlipButtonProps {
    employee: any;
    period: string;
    periodType?: string;
    record: any;
    company?: any;
}

export default function PaySlipButton({ employee, period, periodType, record, company }: PaySlipButtonProps) {
    return (
        <button
            onClick={() => generateIndividualPaySlip(employee, period, periodType, record, company)}
            className="inline-flex items-center gap-2 rounded bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
            title="Descargar Rol de Pagos"
        >
            <FileText className="h-3 w-4" />
            Rol
        </button>
    )
}
