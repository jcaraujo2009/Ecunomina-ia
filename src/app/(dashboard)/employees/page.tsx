import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NewEmployeeModal } from "@/components/NewEmployeeModal";
import { EmployeeActions } from "@/components/EmployeeActions";
import { SignOutButton } from "@/components/SignOutButton";
import { SearchInput } from "@/components/SearchInput";
import { getMyCompany } from "../settings/company/actions";

async function getEmployees(companyId: string, query?: string) {
    const employees = await (prisma as any).employee.findMany({
        where: {
            companyId,
            ...(query ? {
                OR: [
                    { firstName: { contains: query, mode: 'insensitive' } },
                    { lastName: { contains: query, mode: 'insensitive' } },
                    { email: { contains: query, mode: 'insensitive' } },
                    { identification: { contains: query, mode: 'insensitive' } },
                ]
            } : {})
        },
        include: {
            role: true,
            department: true
        }
    });
    return employees;
}

async function getDepartments(companyId: string) {
    return await (prisma as any).department.findMany({
        where: { companyId },
        orderBy: { name: 'asc' }
    });
}

async function getRoles(companyId: string) {
    return await (prisma as any).role.findMany({
        where: { department: { companyId } },
        include: { department: true },
        orderBy: { name: 'asc' }
    });
}

export default async function EmployeesPage({
    searchParams,
}: {
    searchParams?: Promise<{ query?: string }>;
}) {
    const session = await auth();
    const companyId = (session?.user as any)?.companyId;

    if (!companyId) return <div>No company associated.</div>;

    const params = await searchParams;
    const query = params?.query;
    const [employees, departments, roles] = await Promise.all([
        getEmployees(companyId, query),
        getDepartments(companyId),
        getRoles(companyId)
    ]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Empleados</h1>
                    <p className="text-gray-700">GESTIONA TU EQUIPO Y SUS ROLES.</p>
                </div>
                <div className="flex gap-2">
                    <NewEmployeeModal departments={departments} roles={roles} />
                    <SignOutButton />
                </div>
            </div>

            <div className="flex items-center gap-4 rounded-lg bg-white p-4 shadow-sm">
                <SearchInput placeholder="Buscar por nombre, email o cédula..." />
                <div className="flex gap-2">
                    {/* Filters could go here */}
                </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <table className="w-full text-left text-sm text-gray-700">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-900 font-bold">
                        <tr>
                            <th className="px-6 py-3 font-medium">Nombre</th>
                            <th className="px-6 py-3 font-medium">Rol</th>
                            <th className="px-6 py-3 font-medium">Departamento</th>
                            <th className="px-6 py-3 font-medium">Estado</th>
                            <th className="px-6 py-3 font-medium">Salario</th>
                            <th className="px-6 py-3 font-medium text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {employees.map((employee: any) => (
                            <tr key={employee.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600">
                                            {employee.firstName[0]}{employee.lastName[0]}
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900">
                                                {employee.firstName} {employee.lastName}
                                            </div>
                                            <div className="text-gray-700 font-medium">{employee.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">{employee.role.name}</td>
                                <td className="px-6 py-4">{employee.department.name}</td>
                                <td className="px-6 py-4">
                                    <span
                                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold leading-5 ${employee.status === "ACTIVE"
                                            ? "bg-green-100 text-green-800"
                                            : "bg-red-100 text-red-800"
                                            }`}
                                    >
                                        {employee.status === "ACTIVE" ? "Activo" : "Inactivo"}
                                    </span>
                                </td>
                                <td className="px-6 py-4">${employee.salary.toLocaleString()}</td>
                                <td className="px-6 py-4 text-right">
                                    <EmployeeActions
                                        employee={employee}
                                        departments={departments}
                                        roles={roles}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {employees.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                        No hay empleados registrados. Añade uno para comenzar.
                    </div>
                )}
            </div>
        </div>
    );
}
