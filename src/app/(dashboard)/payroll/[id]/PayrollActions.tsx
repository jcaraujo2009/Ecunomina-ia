'use client'

import { useState } from 'react'
import { Upload, Download, FileText } from 'lucide-react'
import BulkUpdateModal from './BulkUpdateModal'
import ExportButtons from './ExportButtons'

export default function PayrollActions({ 
    periodId, 
    periodName, 
    periodType,
    records, 
    company, 
    isClosed,
    earnings,
    deductions
}: { 
    periodId: string, 
    periodName: string, 
    periodType?: string,
    records: any[], 
    company?: any,
    isClosed: boolean,
    earnings: any[],
    deductions: any[]
}) {
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)

    return (
        <>
            <div className="flex gap-2">
                {!isClosed && (
                    <button
                        onClick={() => setIsBulkModalOpen(true)}
                        className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
                    >
                        <Upload className="h-4 w-4" />
                        Carga Masiva
                    </button>
                )}
                <ExportButtons periodName={periodName} periodType={periodType} records={records} company={company} />
            </div>

            <BulkUpdateModal 
                periodId={periodId} 
                isOpen={isBulkModalOpen} 
                onClose={() => setIsBulkModalOpen(false)}
                earnings={earnings.map(e => ({ id: e.id, name: e.name, type: 'earning' as const }))}
                deductions={deductions.map(d => ({ id: d.id, name: d.name, type: 'deduction' as const }))}
            />
        </>
    )
}
