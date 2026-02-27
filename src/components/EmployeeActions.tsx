'use client'

import { Trash2 } from "lucide-react"
import { deleteEmployee } from "@/app/(dashboard)/employees/actions"
import { useState } from "react"
import { Employee, Department, Role } from "@/types"
import { EditEmployeeModal } from "./EditEmployeeModal"

interface EmployeeActionsProps {
    employee: Employee
    departments: Department[]
    roles: Role[]
}

export function EmployeeActions({ employee, departments, roles }: EmployeeActionsProps) {
    const [isDeleting, setIsDeleting] = useState(false)

    async function handleDelete() {
        if (confirm("¿Estás seguro de eliminar este empleado?")) {
            setIsDeleting(true)
            try {
                await deleteEmployee(employee.id)
            } catch (error) {
                alert("Error al eliminar empleado")
            } finally {
                setIsDeleting(false)
            }
        }
    }

    return (
        <div className="flex justify-end gap-2">
            <EditEmployeeModal
                employee={employee}
                departments={departments}
                roles={roles}
            />
            <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600 disabled:opacity-50"
            >
                <Trash2 size={18} />
            </button>
        </div>
    )
}
