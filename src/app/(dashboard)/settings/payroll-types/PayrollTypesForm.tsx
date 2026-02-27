'use client';

import { useState, useEffect } from 'react';
import { Save, Check } from 'lucide-react';
import { savePayrollTypeConfig } from './actions';
import { PayrollPeriodType } from '@/types';

interface Rubro {
    id: string;
    name: string;
}

export default function PayrollTypesForm({ 
    initialType, 
    allEarnings, 
    allDeductions,
    config 
}: { 
    initialType: PayrollPeriodType, 
    allEarnings: Rubro[], 
    allDeductions: Rubro[],
    config?: { applicableEarnings: string[], applicableDeductions: string[] }
}) {
    const [selectedType, setSelectedType] = useState(initialType);
    const [selectedEarnings, setSelectedEarnings] = useState<string[]>(config?.applicableEarnings || []);
    const [selectedDeductions, setSelectedDeductions] = useState<string[]>(config?.applicableDeductions || []);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    const types = [
        { value: 'MENSUAL', label: 'Nómina Mensual' },
        { value: 'DECIMO_TERCERO', label: 'Décimo Tercer Mes' },
        { value: 'DECIMO_CUARTO_SIERRA', label: 'Décimo Cuarto (Sierra/Oriente)' },
        { value: 'DECIMO_CUARTO_COSTA', label: 'Décimo Cuarto (Costa)' },
    ];

    const handleToggleEarning = (id: string) => {
        setSelectedEarnings(prev => 
            prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
        );
    };

    const handleToggleDeduction = (id: string) => {
        setSelectedDeductions(prev => 
            prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
        );
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await savePayrollTypeConfig(selectedType, selectedEarnings, selectedDeductions);
            setMessage('Configuración guardada correctamente');
        } catch (e) {
            setMessage('Error al guardar');
        }
        setSaving(false);
    };

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Configuración de Rubros por Tipo de Nómina</h2>
                    <p className="text-sm text-slate-500">Selecciona los ingresos y deducciones que aplicarán para cada tipo de nómina.</p>
                </div>
                <button 
                    onClick={handleSave} 
                    disabled={saving}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                    <Save className="w-4 h-4" />
                    {saving ? 'Guardando...' : 'Guardar'}
                </button>
            </div>

            <div className="w-full max-w-md">
                <label className="block text-sm font-medium text-slate-700 mb-2">Tipo de Nómina</label>
                <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value as PayrollPeriodType)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                >
                    {types.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Ingresos */}
                <div>
                    <h3 className="text-lg font-semibold mb-4 text-slate-800">Ingresos Aplicables</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-2">
                        {allEarnings.length === 0 ? (
                            <p className="text-sm text-slate-400 p-2">No hay ingresos registrados</p>
                        ) : (
                            allEarnings.map(e => (
                                <label key={e.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedEarnings.includes(e.id)}
                                        onChange={() => handleToggleEarning(e.id)}
                                        className="rounded text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm">{e.name}</span>
                                </label>
                            ))
                        )}
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                        Seleccionados: {selectedEarnings.length}
                    </div>
                </div>

                {/* Deducciones */}
                <div>
                    <h3 className="text-lg font-semibold mb-4 text-slate-800">Deducciones Aplicables</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-2">
                        {allDeductions.length === 0 ? (
                            <p className="text-sm text-slate-400 p-2">No hay deducciones registradas</p>
                        ) : (
                            allDeductions.map(d => (
                                <label key={d.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedDeductions.includes(d.id)}
                                        onChange={() => handleToggleDeduction(d.id)}
                                        className="rounded text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm">{d.name}</span>
                                </label>
                            ))
                        )}
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                        Seleccionados: {selectedDeductions.length}
                    </div>
                </div>
            </div>

            {message && (
                <div className="p-4 bg-green-50 text-green-700 rounded-lg border border-green-200">
                    {message}
                </div>
            )}
        </div>
    );
}
