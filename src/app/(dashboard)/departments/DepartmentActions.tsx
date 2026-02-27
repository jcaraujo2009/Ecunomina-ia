'use client'

import { useState } from "react"
import { Department } from "@/types"
import { Pencil, Trash2 } from "lucide-react"
import { updateDepartment, deleteDepartment } from "./actions"

export default function DepartmentActions({ department }: { department: Department }) {
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [isPending, setIsPending] = useState(false)

    async function handleEdit(formData: FormData) {
        setIsPending(true)
        try {
            await updateDepartment(department.id, formData)
            setIsEditOpen(false)
        } catch (error) {
            console.error(error)
        } finally {
            setIsPending(false)
        }
    }

    async function handleDelete() {
        setIsPending(true)
        try {
            await deleteDepartment(department.id)
            setIsDeleteOpen(false)
        } catch (error) {
            alert("No se puede eliminar un departamento con empleados o cargos asociados.")
            console.error(error)
        } finally {
            setIsPending(false)
        }
    }

    return (
        <div className="flex justify-end gap-2">
            <button
                onClick={() => setIsEditOpen(true)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-blue-600"
            >
                <Pencil size={18} />
            </button>
            <button
                onClick={() => setIsDeleteOpen(true)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600"
            >
                <Trash2 size={18} />
            </button>

            {/* Edit Modal */}
            {isEditOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl text-left">
                        <h2 className="text-xl font-bold text-gray-900">Editar Departamento</h2>
                        <form action={handleEdit} className="mt-4 space-y-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                    Nombre
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    id="name"
                                    defaultValue={department.name}
                                    required
                                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                                    Descripción (Opcional)
                                </label>
                                <textarea
                                    name="description"
                                    id="description"
                                    rows={3}
                                    defaultValue={department.description || ""}
                                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsEditOpen(false)}
                                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {isPending ? "Actualizando..." : "Actualizar"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {isDeleteOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl text-left">
                        <h2 className="text-xl font-bold text-gray-900">¿Eliminar departamento?</h2>
                        <p className="mt-2 text-gray-500">
                            Esta acción no se puede deshacer. Se eliminarán los cargos asociados si no tienen empleados.
                        </p>
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => setIsDeleteOpen(false)}
                                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={isPending}
                                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                            >
                                {isPending ? "Eliminando..." : "Eliminar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
