'use client';

import { useState } from 'react';
import { Save, Plus, Trash2, Users } from 'lucide-react';
import { saveTaxBrackets, saveTaxReduction, saveFamilyBurdenReductions } from './actions';

interface Bracket {
    minLimit: number;
    maxLimit: number | null;
    baseTax: number;
    percentage: number;
}

interface FamilyReduction {
    dependentCount: number;
    maxReduction: number;
    taxReductionPercentage: number;
}

export default function TaxesSettings({ 
    initialBrackets, 
    initialReduction,
    initialFamilyReductions = [],
    initialYear = new Date().getFullYear()
}: { 
    initialBrackets: Bracket[], 
    initialReduction: number,
    initialFamilyReductions?: FamilyReduction[],
    initialYear?: number
}) {
    const [brackets, setBrackets] = useState<Bracket[]>(initialBrackets);
    const [reduction, setReduction] = useState(initialReduction);
    const [familyReductions, setFamilyReductions] = useState<FamilyReduction[]>(initialFamilyReductions);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [year, setYear] = useState(initialYear);

    const handleAddBracket = () => {
        const lastBracket = brackets[brackets.length - 1];
        const newMin = lastBracket ? (lastBracket.maxLimit || lastBracket.minLimit + 10000) : 0;
        
        setBrackets([...brackets, {
            minLimit: newMin,
            maxLimit: null,
            baseTax: 0,
            percentage: 0
        }]);
    };

    const handleRemoveBracket = (index: number) => {
        setBrackets(brackets.filter((_, i) => i !== index));
    };

    const handleChange = (index: number, field: keyof Bracket, value: any) => {
        const newBrackets = [...brackets];
        newBrackets[index] = {
            ...newBrackets[index],
            [field]: field === 'maxLimit' && value === '' ? null : Number(value)
        };
        setBrackets(newBrackets);
    };

    // ... existing code for brackets ...

    const handleSaveBrackets = async () => {
        setSaving(true);
        try {
            await saveTaxBrackets(brackets);
            setMessage('Tablas guardadas correctamente');
        } catch (e) {
            setMessage('Error al guardar');
        }
        setSaving(false);
    };

    const handleSaveReduction = async () => {
        setSaving(true);
        try {
            await saveTaxReduction(reduction);
            setMessage('Reducción guardada correctamente');
        } catch (e) {
            setMessage('Error al guardar');
        }
        setSaving(false);
    };

    const handleAddFamilyReduction = () => {
        setFamilyReductions([...familyReductions, { dependentCount: 1, maxReduction: 0, taxReductionPercentage: 0 }]);
    };

    const handleRemoveFamilyReduction = (index: number) => {
        setFamilyReductions(familyReductions.filter((_, i) => i !== index));
    };

    const handleFamilyReductionChange = (index: number, field: keyof FamilyReduction, value: any) => {
        const newReductions = [...familyReductions];
        newReductions[index] = { ...newReductions[index], [field]: Number(value) };
        setFamilyReductions(newReductions);
    };

    const handleSaveFamilyReductions = async () => {
        setSaving(true);
        try {
            await saveFamilyBurdenReductions(familyReductions, year);
            setMessage('Rebajas por cargas familiares guardadas correctamente');
        } catch (e) {
            setMessage('Error al guardar');
        }
        setSaving(false);
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto p-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Tabla de Impuesto a la Renta (Anual)</h2>
                        <p className="text-sm text-slate-500">Configura las fracciones básicas y porcentajes para el cálculo.</p>
                    </div>
                    <button 
                        onClick={handleSaveBrackets} 
                        disabled={saving}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        {saving ? 'Guardando...' : 'Guardar Tabla'}
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-700 font-semibold">
                            <tr>
                                <th className="px-4 py-2">Límite Mínimo</th>
                                <th className="px-4 py-2">Límite Máximo (0 = Infinito)</th>
                                <th className="px-4 py-2">Impuesto Base</th>
                                <th className="px-4 py-2">Porcentaje (%)</th>
                                <th className="px-4 py-2 w-10"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {brackets.map((bracket, index) => (
                                <tr key={index} className="border-b border-slate-100">
                                    <td className="px-4 py-2">
                                        <input 
                                            type="number" 
                                            value={bracket.minLimit}
                                            onChange={(e) => handleChange(index, 'minLimit', e.target.value)}
                                            className="w-full border border-slate-300 rounded px-2 py-1"
                                        />
                                    </td>
                                    <td className="px-4 py-2">
                                        <input 
                                            type="number" 
                                            value={bracket.maxLimit === null ? '' : bracket.maxLimit}
                                            onChange={(e) => handleChange(index, 'maxLimit', e.target.value)}
                                            className="w-full border border-slate-300 rounded px-2 py-1"
                                            placeholder="Infinito"
                                        />
                                    </td>
                                    <td className="px-4 py-2">
                                        <input 
                                            type="number" 
                                            value={bracket.baseTax}
                                            onChange={(e) => handleChange(index, 'baseTax', e.target.value)}
                                            className="w-full border border-slate-300 rounded px-2 py-1"
                                        />
                                    </td>
                                    <td className="px-4 py-2">
                                        <input 
                                            type="number" 
                                            step="0.1"
                                            value={bracket.percentage}
                                            onChange={(e) => handleChange(index, 'percentage', e.target.value)}
                                            className="w-full border border-slate-300 rounded px-2 py-1"
                                        />
                                    </td>
                                    <td className="px-4 py-2 text-center">
                                        <button 
                                            onClick={() => handleRemoveBracket(index)}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                <button 
                    onClick={handleAddBracket}
                    className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                >
                    <Plus className="w-4 h-4" /> Agregar Franja
                </button>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Reducción del Impuesto</h2>
                        <p className="text-sm text-slate-500">Porcentaje de reducción aplicable (ej: 10% para部分 contribuyentes).</p>
                    </div>
                    <button 
                        onClick={handleSaveReduction} 
                        disabled={saving}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        {saving ? 'Guardando...' : 'Guardar'}
                    </button>
                </div>

                <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-slate-700">Porcentaje de Reducción (%):</label>
                    <input 
                        type="number" 
                        step="0.1"
                        value={reduction}
                        onChange={(e) => setReduction(Number(e.target.value))}
                        className="border border-slate-300 rounded-lg px-3 py-2 w-32"
                    />
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Reducción por Cargas Familiares</h2>
                        <p className="text-sm text-slate-500">Configura la reducción del impuesto por número de cargas familiares.</p>
                    </div>
                    <button 
                        onClick={handleSaveFamilyReductions} 
                        disabled={saving}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        {saving ? 'Guardando...' : 'Guardar'}
                    </button>
                </div>

                <div className="mb-4">
                    <label className="text-sm font-medium text-slate-700">Año Fiscal</label>
                    <input 
                        type="number" 
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                        className="border border-slate-300 rounded-lg px-3 py-2 w-32 ml-4"
                    />
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-700 font-semibold">
                            <tr>
                                <th className="px-4 py-2"># Cargas</th>
                                <th className="px-4 py-2">Rebaja Máxima ($)</th>
                                <th className="px-4 py-2">% Rebaja Impuesto</th>
                                <th className="px-4 py-2 w-10"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {familyReductions.map((r, index) => (
                                <tr key={index} className="border-b border-slate-100">
                                    <td className="px-4 py-2">
                                        <input 
                                            type="number" 
                                            value={r.dependentCount}
                                            onChange={(e) => handleFamilyReductionChange(index, 'dependentCount', e.target.value)}
                                            className="w-full border border-slate-300 rounded px-2 py-1"
                                        />
                                    </td>
                                    <td className="px-4 py-2">
                                        <input 
                                            type="number" 
                                            value={r.maxReduction}
                                            onChange={(e) => handleFamilyReductionChange(index, 'maxReduction', e.target.value)}
                                            className="w-full border border-slate-300 rounded px-2 py-1"
                                        />
                                    </td>
                                    <td className="px-4 py-2">
                                        <input 
                                            type="number" 
                                            value={r.taxReductionPercentage}
                                            onChange={(e) => handleFamilyReductionChange(index, 'taxReductionPercentage', e.target.value)}
                                            className="w-full border border-slate-300 rounded px-2 py-1"
                                        />
                                    </td>
                                    <td className="px-4 py-2 text-center">
                                        <button 
                                            onClick={() => handleRemoveFamilyReduction(index)}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                <button 
                    onClick={handleAddFamilyReduction}
                    className="mt-4 text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center gap-1"
                >
                    <Plus className="w-4 h-4" /> Agregar
                </button>
            </div>

            {message && (
                <div className="p-4 bg-green-50 text-green-700 rounded-lg border border-green-200">
                    {message}
                </div>
            )}
        </div>
    );
}
