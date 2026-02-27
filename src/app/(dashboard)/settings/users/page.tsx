import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { UserPlus, Trash2 } from "lucide-react";
import { createUser, deleteUser } from "./actions";
import { UserRole } from "@/types";

async function getUsers(companyId: string) {
    return await prisma.user.findMany({
        where: { companyId },
        orderBy: { name: 'asc' }
    });
}

export default async function UsersPage() {
    const session = await auth();
    const companyId = session?.user?.companyId;
    const role = session?.user?.role;

    if (!companyId) return <div className="p-8">No tienes una empresa asociada.</div>;
    if (role !== 'ADMIN') return <div className="p-8">No tienes permisos para acceder a esta sección.</div>;

    const users = await getUsers(companyId);

    return (
        <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Gestión de Usuarios</h1>
                    <p className="text-slate-500">Administra los miembros de tu equipo y sus permisos.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <UserPlus className="w-5 h-5 text-blue-600" />
                            Agregar Usuario
                        </h2>
                        <form action={createUser} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Nombre</label>
                                <input
                                    name="name"
                                    type="text"
                                    required
                                    className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Nombre del usuario"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Email</label>
                                <input
                                    name="email"
                                    type="email"
                                    required
                                    className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="correo@empresa.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Contraseña</label>
                                <input
                                    name="password"
                                    type="password"
                                    required
                                    className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Mínimo 6 caracteres"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Rol</label>
                                <select
                                    name="role"
                                    className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="USER">Usuario</option>
                                    <option value="ADMIN">Administrador</option>
                                </select>
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-blue-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-700 transition-colors"
                            >
                                Guardar Usuario
                            </button>
                        </form>
                    </div>
                </div>

                <div className="md:col-span-2">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3 font-semibold text-slate-900">Nombre</th>
                                    <th className="px-6 py-3 font-semibold text-slate-900">Email</th>
                                    <th className="px-6 py-3 font-semibold text-slate-900">Rol</th>
                                    <th className="px-6 py-3 font-semibold text-slate-900 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {users.map((user: any) => (
                                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-900">{user.name}</td>
                                        <td className="px-6 py-4 text-slate-600">{user.email}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'
                                                }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {user.email !== session?.user?.email && (
                                                <form action={deleteUser.bind(null, user.id)}>
                                                    <button className="text-red-500 hover:text-red-700 transition-colors">
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </form>
                                            )}
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
