import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Role, Department } from "@/types";
import NewRoleModal from "./NewRoleModal";
import RoleActions from "./RoleActions";

async function getRoles(companyId: string) {
    return await (prisma as any).role.findMany({
        where: { department: { companyId } },
        include: { department: true },
        orderBy: [
            { department: { name: 'asc' } },
            { name: 'asc' }
        ]
    });
}

async function getDepartments(companyId: string) {
    return await (prisma as any).department.findMany({
        where: { companyId },
        orderBy: { name: 'asc' }
    });
}

export default async function RolesPage() {
    const session = await auth();
    const companyId = (session?.user as any)?.companyId;

    if (!companyId) return <div>No company associated.</div>;

    const roles = await getRoles(companyId);
    const departments = await getDepartments(companyId);

    return (
        <div className="space-y-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Cargos</h1>
                    <p className="text-gray-700">DEFINE LOS ROLES Y RESPONSABILIDADES POR DEPARTAMENTO.</p>
                </div>
                <div>
                    <NewRoleModal departments={departments as unknown as Department[]} />
                </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <table className="w-full text-left text-sm text-gray-700">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-900 font-bold">
                        <tr>
                            <th className="px-6 py-3 font-medium">Nombre</th>
                            <th className="px-6 py-3 font-medium">Departamento</th>
                            <th className="px-6 py-3 font-medium">Descripción</th>
                            <th className="px-6 py-3 font-medium text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {roles.map((role: any) => (
                            <tr key={role.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium text-gray-900">{role.name}</td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                        {role.department.name}
                                    </span>
                                </td>
                                <td className="px-6 py-4">{role.description || '-'}</td>
                                <td className="px-6 py-4 text-right">
                                    <RoleActions role={role as unknown as Role} departments={departments as unknown as Department[]} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {roles.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                        No hay cargos registrados.
                    </div>
                )}
            </div>
        </div>
    );
}
