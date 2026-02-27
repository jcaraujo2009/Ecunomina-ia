'use client'

import { useState, useRef } from 'react'
import { Upload, X, FileSpreadsheet } from 'lucide-react'
import { uploadBulkValues } from '../actions'
import * as XLSX from 'xlsx'

interface Rubro {
    id: string;
    name: string;
    type: 'earning' | 'deduction';
}

interface BulkUpdateModalProps {
    periodId: string
    isOpen: boolean
    onClose: () => void
    earnings: Rubro[]
    deductions: Rubro[]
}

export default function BulkUpdateModal({ periodId, isOpen, onClose, earnings, deductions }: BulkUpdateModalProps) {
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [targetType, setTargetType] = useState<'salary' | 'earning' | 'deduction'>('earning')
    const [targetId, setTargetId] = useState('')
    const fileInputRef = useRef<HTMLInputElement>(null)

    if (!isOpen) return null

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!targetId && targetType !== 'salary') {
            setMessage('Por favor selecciona un rubro primero.')
            setLoading(false)
            return
        }

        setLoading(true)
        setMessage('')

        try {
            const data = await file.arrayBuffer()
            const workbook = XLSX.read(data)
            const sheet = workbook.Sheets[workbook.SheetNames[0]]
            const json = XLSX.utils.sheet_to_json(sheet)

            const rows = json.map((row: any) => {
                const keys = Object.keys(row)
                const idKey = keys.find(k => k.toLowerCase().includes('cedula') || k.toLowerCase().includes('identificacion') || k.toLowerCase().includes('id'))
                const valueKey = keys.find(k => k.toLowerCase().includes('valor') || k.toLowerCase().includes('monto') || k.toLowerCase().includes('value'))

                if (!idKey || !valueKey) return null
                
                return {
                    identification: String(row[idKey]).trim(),
                    value: parseFloat(row[valueKey])
                }
            }).filter((r: any) => r && !isNaN(r.value)) as { identification: string, value: number }[]

            if (rows.length === 0) {
                setMessage('No se encontraron datos válidos en el Excel.')
                setLoading(false)
                return
            }

            const result = await uploadBulkValues(periodId, rows, targetType, targetId)
            
            if (result.success) {
                setMessage(`Actualizado ${result.count} registros correctamente.`)
                setTimeout(() => {
                    window.location.reload()
                }, 1500)
            } else {
                setMessage(result.message || 'Error al subir datos')
            }

        } catch (error) {
            console.error(error)
            setMessage('Error al procesar el archivo')
        }

        setLoading(false)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Carga Masiva de Rubros</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">¿Qué desea actualizar?</label>
                        <select 
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            value={targetType}
                            onChange={(e) => {
                                setTargetType(e.target.value as any)
                                setTargetId('')
                            }}
                        >
                            <option value="earning">Un Ingreso</option>
                            <option value="deduction">Una Deducción</option>
                        </select>
                    </div>

                    {targetType !== 'salary' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Seleccionar Rubro</label>
                            <select 
                                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                value={targetId}
                                onChange={(e) => setTargetId(e.target.value)}
                            >
                                <option value="">Seleccione...</option>
                                {targetType === 'earning' && earnings.map(e => (
                                    <option key={e.id} value={e.id}>{e.name}</option>
                                ))}
                                {targetType === 'deduction' && deductions.map(d => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <p className="text-sm text-gray-600">
                        Sube un archivo Excel (.xlsx) con:
                    </p>
                    <ul className="list-disc list-inside text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
                        <li><strong>Cédula</strong> (o identificación)</li>
                        <li><strong>Valor</strong> (monto)</li>
                    </ul>

                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <input 
                            type="file" 
                            accept=".xlsx" 
                            ref={fileInputRef}
                            className="hidden" 
                            onChange={handleFileChange}
                            disabled={loading}
                        />
                        {loading ? (
                            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                        ) : (
                            <>
                                <FileSpreadsheet className="w-12 h-12 mx-auto text-green-600 mb-2" />
                                <p className="text-blue-600 font-medium">Haz click para subir el archivo</p>
                            </>
                        )}
                    </div>

                    {message && (
                        <div className={`p-3 rounded-lg text-sm ${message.includes('Error') || message.includes('No') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                            {message}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
