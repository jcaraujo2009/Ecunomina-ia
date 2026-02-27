'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { createEmployee } from '@/app/(dashboard)/employees/actions'
import { Department, Role } from '@/types'

export function NewEmployeeModal({ departments, roles }: { departments: Department[], roles: Role[] }) {
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [selectedDepartment, setSelectedDepartment] = useState<string>('')

    const filteredRoles = roles.filter(role => role.departmentId === selectedDepartment)

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        setError(null)
        const result = await createEmployee(formData)
        setLoading(false)
        if (result?.error) {
            setError(result.error)
            return
        }
        setIsOpen(false)
        setSelectedDepartment('')
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
                <Plus size={18} />
                Nuevo Empleado
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">Nuevo Empleado</h2>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="rounded-full p-1 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form action={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 font-medium">
                                    ⚠️ {error}
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label htmlFor="firstName" className="text-sm font-bold text-gray-800">Nombre</label>
                                    <input
                                        type="text"
                                        name="firstName"
                                        required
                                        className="w-full rounded-lg border border-gray-400 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 uppercase font-medium"
                                        onChange={(e) => e.target.value = e.target.value.toUpperCase()}
                                        placeholder="EJ. JUAN"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label htmlFor="lastName" className="text-sm font-bold text-gray-800">Apellido</label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        required
                                        className="w-full rounded-lg border border-gray-400 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 uppercase font-medium"
                                        onChange={(e) => e.target.value = e.target.value.toUpperCase()}
                                        placeholder="EJ. PEREZ"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label htmlFor="email" className="text-sm font-bold text-gray-800">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    className="w-full rounded-lg border border-gray-400 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 uppercase font-medium"
                                    onChange={(e) => e.target.value = e.target.value.toUpperCase()}
                                    placeholder="USUARIO@EMPRESA.COM"
                                />
                            </div>

                            <div className="space-y-1">
                                <label htmlFor="identification" className="text-sm font-bold text-gray-800">Cédula / RUC</label>
                                <input
                                    type="text"
                                    name="identification"
                                    required
                                    className="w-full rounded-lg border border-gray-400 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 uppercase font-medium"
                                    onChange={(e) => e.target.value = e.target.value.toUpperCase()}
                                    placeholder="1791234567001"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label htmlFor="departmentId" className="text-sm font-bold text-gray-800">Departamento</label>
                                    <select
                                        name="departmentId"
                                        id="departmentId"
                                        required
                                        value={selectedDepartment}
                                        onChange={(e) => setSelectedDepartment(e.target.value)}
                                        className="w-full rounded-lg border border-gray-400 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 font-medium"
                                    >
                                        <option value="">Seleccionar...</option>
                                        {departments.map((dept) => (
                                            <option key={dept.id} value={dept.id}>{dept.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label htmlFor="roleId" className="text-sm font-bold text-gray-800">Rol / Cargo</label>
                                    <select
                                        name="roleId"
                                        id="roleId"
                                        required
                                        disabled={!selectedDepartment}
                                        className="w-full rounded-lg border border-gray-400 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 disabled:bg-gray-100 font-medium"
                                    >
                                        <option value="">Seleccionar...</option>
                                        {filteredRoles.map((role) => (
                                            <option key={role.id} value={role.id}>{role.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label htmlFor="salary" className="text-sm font-medium text-gray-700">Salario ($)</label>
                                    <input
                                        type="number"
                                        name="salary"
                                        step="0.01"
                                        min="0"
                                        required
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label htmlFor="startDate" className="text-sm font-medium text-gray-700">Fecha de Inicio</label>
                                    <input
                                        type="date"
                                        name="startDate"
                                        required
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label htmlFor="region" className="text-sm font-bold text-gray-800">Región (para XIV)</label>
                                <select
                                    name="region"
                                    id="region"
                                    defaultValue="SIERRA"
                                    className="w-full rounded-lg border border-gray-400 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 font-medium"
                                >
                                    <option value="SIERRA">🏔️ Sierra / Oriente (XIV agosto)</option>
                                    <option value="COSTA">🌊 Costa / Galápagos (XIV marzo)</option>
                                </select>
                            </div>

                            <div className="space-y-3 pt-2">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        name="accumulateDecimos"
                                        id="accumulateDecimos"
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <label htmlFor="accumulateDecimos" className="text-sm text-gray-700">
                                        Acumular Décimos (13ro y 14to)
                                    </label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        name="accumulateReserveFund"
                                        id="accumulateReserveFund"
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <label htmlFor="accumulateReserveFund" className="text-sm text-gray-700">
                                        Acumular Fondo de Reserva
                                    </label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        name="isPartTime"
                                        id="isPartTime"
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <label htmlFor="isPartTime" className="text-sm text-gray-700 font-medium text-blue-700">
                                        Empleado de Medio Tiempo
                                    </label>
                                </div>
                            </div>

                            <div className="mt-6 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                    disabled={loading}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                                    disabled={loading}
                                >
                                    {loading ? 'Guardando...' : 'Guardar Empleado'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
