import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Building2, Trash2, PlusCircle } from "lucide-react";
import { createCompanyAdmin, deleteCompany } from "./actions";

export default async function CompaniesPage() {
    const session = await auth();
    const role = session?.user?.role;

    if (role !== 'SUPER_ADMIN') return <div className="p-8">No tienes permisos para acceder a esta sección.</div>;

    const companies = await prisma.company.findMany({
        include: { users: true },
        orderBy: { name: 'asc' }
    });

    return (
        <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Gestión de Empresas</h1>
                    <p className="text-slate-500">Administra las empresas registradas en el sistema.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <PlusCircle className="w-5 h-5 text-blue-600" />
                            Nueva Empresa
                        </h2>
                        <form action={createCompanyAdmin} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Nombre Empresa</label>
                                <input
                                    name="name"
                                    type="text"
                                    required
                                    className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                                    placeholder="Nombre de la empresa"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">RUC</label>
                                <input
                                    name="ruc"
                                    type="text"
                                    required
                                    className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                                    placeholder="RUC de la empresa"
                                />
                            </div>
                            <div className="border-t pt-4 mt-4">
                                <h3 className="text-sm font-semibold mb-2">Usuario Administrador</h3>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Nombre</label>
                                <input
                                    name="userName"
                                    type="text"
                                    required
                                    className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Email</label>
                                <input
                                    name="userEmail"
                                    type="email"
                                    required
                                    className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Contraseña</label>
                                <input
                                    name="userPassword"
                                    type="password"
                                    required
                                    className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-blue-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-700"
                            >
                                Crear Empresa
                            </button>
                        </form>
                    </div>
                </div>

                <div className="md:col-span-2">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3 font-semibold text-slate-900">Empresa</th>
                                    <th className="px-6 py-3 font-semibold text-slate-900">RUC</th>
                                    <th className="px-6 py-3 font-semibold text-slate-900">Usuarios</th>
                                    <th className="px-6 py-3 font-semibold text-slate-900 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {companies.map((company) => (
                                    <tr key={company.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 font-medium text-slate-900">{company.name}</td>
                                        <td className="px-6 py-4 text-slate-600 font-mono">{company.ruc}</td>
                                        <td className="px-6 py-4 text-slate-600">{company.users.length}</td>
                                        <td className="px-6 py-4 text-right">
                                            <form action={deleteCompany.bind(null, company.id)}>
                                                <button className="text-red-500 hover:text-red-700">
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </form>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
