import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Department } from "@/types";
import NewDepartmentModal from "./NewDepartmentModal";
import DepartmentActions from "./DepartmentActions";

async function getDepartments(companyId: string): Promise<Department[]> {
    const departments = await (prisma as any).department.findMany({
        where: { companyId },
        orderBy: { name: 'asc' }
    });
    return departments as unknown as Department[];
}

export default async function DepartmentsPage() {
    const session = await auth();
    const companyId = (session?.user as any)?.companyId;

    if (!companyId) return <div>No company associated.</div>;

    const departments = await getDepartments(companyId);

    return (
        <div className="space-y-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Departamentos</h1>
                    <p className="text-gray-700">GESTIONA LAS ÁREAS DE TU EMPRESA.</p>
                </div>
                <div>
                    <NewDepartmentModal />
                </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <table className="w-full text-left text-sm text-gray-700">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-900 font-bold">
                        <tr>
                            <th className="px-6 py-3 font-medium">Nombre</th>
                            <th className="px-6 py-3 font-medium">Descripción</th>
                            <th className="px-6 py-3 font-medium text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {departments.map((dept) => (
                            <tr key={dept.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium text-gray-900">{dept.name}</td>
                                <td className="px-6 py-4">{dept.description || '-'}</td>
                                <td className="px-6 py-4 text-right">
                                    <DepartmentActions department={dept} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {departments.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                        NO HAY DEPARTAMENTOS REGISTRADOS.
                    </div>
                )}
            </div>
        </div>
    );
}
