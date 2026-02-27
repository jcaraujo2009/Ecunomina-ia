'use client'

import { useState } from 'react'
import { Edit, X } from 'lucide-react'
import { updateEmployee } from '@/app/(dashboard)/employees/actions'
import { Employee, Department, Role } from '@/types'

interface EditEmployeeModalProps {
    employee: Employee
    departments: Department[]
    roles: Role[]
}

export function EditEmployeeModal({ employee, departments, roles }: EditEmployeeModalProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [selectedDepartment, setSelectedDepartment] = useState<string>(employee.departmentId)

    const filteredRoles = roles.filter(role => role.departmentId === selectedDepartment)

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        await updateEmployee(employee.id, formData)
        setLoading(false)
        setIsOpen(false)
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
                <Edit size={18} />
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">Editar Empleado</h2>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="rounded-full p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form action={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label htmlFor="firstName" className="text-sm font-medium text-gray-700">Nombre</label>
                                    <input
                                        type="text"
                                        name="firstName"
                                        defaultValue={employee.firstName}
                                        required
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label htmlFor="lastName" className="text-sm font-medium text-gray-700">Apellido</label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        defaultValue={employee.lastName}
                                        required
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label htmlFor="email" className="text-sm font-medium text-gray-700">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    defaultValue={employee.email || ''}
                                    required
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>

                            <div className="space-y-1">
                                <label htmlFor="identification" className="text-sm font-medium text-gray-700">Cédula / RUC</label>
                                <input
                                    type="text"
                                    name="identification"
                                    defaultValue={employee.identification}
                                    required
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label htmlFor="departmentId" className="text-sm font-medium text-gray-700">Departamento</label>
                                    <select
                                        name="departmentId"
                                        id="departmentId"
                                        required
                                        defaultValue={employee.departmentId}
                                        onChange={(e) => setSelectedDepartment(e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    >
                                        <option value="">Seleccionar...</option>
                                        {departments.map((dept) => (
                                            <option key={dept.id} value={dept.id}>{dept.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label htmlFor="roleId" className="text-sm font-medium text-gray-700">Rol / Cargo</label>
                                    <select
                                        name="roleId"
                                        id="roleId"
                                        required
                                        defaultValue={employee.roleId}
                                        disabled={!selectedDepartment}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50"
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
                                        defaultValue={employee.salary}
                                        required
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label htmlFor="startDate" className="text-sm font-medium text-gray-700">Fecha de Inicio</label>
                                    <input
                                        type="date"
                                        name="startDate"
                                        defaultValue={new Date(employee.startDate).toISOString().split('T')[0]}
                                        required
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label htmlFor="status" className="text-sm font-medium text-gray-700">Estado</label>
                                <select
                                    name="status"
                                    defaultValue={employee.status || 'ACTIVE'}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="ACTIVE">Activo</option>
                                    <option value="INACTIVE">Inactivo</option>
                                    <option value="SUSPENDED">Suspendido</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label htmlFor="edit-region" className="text-sm font-medium text-gray-700">Región (para XIV)</label>
                                <select
                                    name="region"
                                    id="edit-region"
                                    defaultValue={(employee as any).region || "SIERRA"}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="SIERRA">🏔️ Sierra / Oriente (XIV agosto)</option>
                                    <option value="COSTA">🌊 Costa / Galápagos (XIV marzo)</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label htmlFor="familyBurden" className="text-sm font-medium text-gray-700">Cargas Familiares</label>
                                <input
                                    type="number"
                                    name="familyBurden"
                                    id="familyBurden"
                                    min="0"
                                    defaultValue={(employee as any).familyBurden || 0}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                                <p className="text-xs text-gray-500">Número de cargas familiares para reducción de Impuesto a la Renta</p>
                            </div>

                            <div className="space-y-3 pt-2">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        name="accumulateDecimos"
                                        id="edit-accumulateDecimos"
                                        defaultChecked={employee.accumulateDecimos}
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <label htmlFor="edit-accumulateDecimos" className="text-sm text-gray-700">
                                        Acumular Décimos (13ro y 14to)
                                    </label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        name="accumulateReserveFund"
                                        id="edit-accumulateReserveFund"
                                        defaultChecked={employee.accumulateReserveFund}
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <label htmlFor="edit-accumulateReserveFund" className="text-sm text-gray-700">
                                        Acumular Fondo de Reserva
                                    </label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        name="isPartTime"
                                        id="edit-isPartTime"
                                        defaultChecked={employee.isPartTime}
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <label htmlFor="edit-isPartTime" className="text-sm text-gray-700 font-medium text-blue-700">
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
                                    {loading ? 'Guardando...' : 'Guardar Cambios'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
