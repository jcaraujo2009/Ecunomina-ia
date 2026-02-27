'use client'

import { FileDown, FileSpreadsheet, FileText } from "lucide-react"
import { exportPayrollToExcel, exportPayrollToPDF, exportPayrollToIESS } from "@/lib/reports"

interface ExportButtonsProps {
    periodName: string;
    records: any[];
    company?: any;
}

export default function ExportButtons({ periodName, records, company }: ExportButtonsProps) {
    return (
        <div className="flex gap-2">
             <button
                onClick={() => exportPayrollToIESS(periodName, records, company)}
                className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
            >
                <FileText className="h-4 w-4" />
                IESS
            </button>
            <button
                onClick={() => exportPayrollToExcel(periodName, records, company)}
                className="inline-flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-100 transition-colors"
            >
                <FileSpreadsheet className="h-4 w-4" />
                Excel
            </button>
            <button
                onClick={() => exportPayrollToPDF(periodName, records, company)}
                className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors"
            >
                <FileDown className="h-4 w-4" />
                PDF
            </button>
        </div>
    )
}
