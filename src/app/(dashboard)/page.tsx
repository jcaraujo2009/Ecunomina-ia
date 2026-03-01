import { Suspense } from 'react';
import { Users, CreditCard, Building2, Briefcase, TrendingUp, Calendar, Activity, Shield, Trash2, Key } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import clsx from 'clsx';
import Link from 'next/link';
import { resetUserPassword } from './settings/users/actions';
import { ResetPasswordButton } from '@/components/ResetPasswordButton';
import { UpdateRoleButton } from '@/components/UpdateRoleButton';

export const dynamic = 'force-dynamic';

async function CardWrapper({ companyId }: { companyId: string }) {
    const employeeCount = await prisma.employee.count({ where: { companyId, status: 'ACTIVE' } });
    const payrollCount = await prisma.payrollPeriod.count({ where: { companyId } });
    const departmentCount = await prisma.department.count({ where: { companyId } });
    const roleCount = await prisma.role.count({ where: { department: { companyId } } });

    const employees = await prisma.employee.findMany({
        where: { companyId, status: 'ACTIVE' },
        select: { salary: true }
    });
    const totalPayroll = employees.reduce((acc, emp) => acc + emp.salary, 0);

    return (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Card title="Total Empleados" value={employeeCount} icon={Users} color="blue" />
            <Card title="Nóminas Procesadas" value={payrollCount} icon={CreditCard} color="indigo" />
            <Card title="Departamentos" value={departmentCount} icon={Building2} color="violet" />
            <Card title="Cargos" value={roleCount} icon={Briefcase} color="fuchsia" />

            <div className="sm:col-span-2 lg:col-span-4">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm font-medium mb-1">Nómina Mensual Estimada</p>
                            <p className="text-3xl font-bold">${totalPayroll.toLocaleString('es-EC', { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                            <TrendingUp className="w-8 h-8" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default async function DashboardPage() {
    const session = await auth();

    if (!session) {
        return <div className="p-8">Cargando sesión...</div>;
    }

    let companyId = session?.user?.companyId;
    let role = 'USER';

    try {
        role = (session?.user?.role as string) || 'USER';
    } catch (e) {
        console.error("Error getting role:", e);
    }

    let companyName = null;
    try {
        if (companyId) {
            const company = await prisma.company.findUnique({ where: { id: companyId } });
            companyName = company?.name;
        }
    } catch (e) {
        console.error("Error getting company:", e);
    }

    // --- SUPER ADMIN VIEW ---
    if (role === 'SUPER_ADMIN') {
        let allUsers: any[] = [];
        try {
            allUsers = await prisma.user.findMany({
                include: { company: true },
                orderBy: { createdAt: 'desc' }
            });
        } catch (e) {
            console.error("Error fetching users:", e);
        }

        return (
            <main className="space-y-8">
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-8 text-white shadow-xl">
                    <h1 className="text-3xl font-bold mb-2">Panel de Super Administrador</h1>
                    <p className="text-slate-300">Gestiona las empresas y configuraciones globales del sistema.</p>
                    <div className="mt-4 text-xs bg-black/30 p-2 rounded">
                        DEBUG: ID: {session.user.id} | Role: {role} | Email: {session.user.email}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Link href="/settings/companies" className="block p-6 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                                <Building2 className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">Empresas</h2>
                                <p className="text-sm text-slate-500">Ver listado y crear nuevas empresas</p>
                            </div>
                        </div>
                    </Link>
                    <Link href="/audit" className="block p-6 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
                                <Activity className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">Auditoría</h2>
                                <p className="text-sm text-slate-500">Ver historial de nóminas calculadas</p>
                            </div>
                        </div>
                    </Link>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100">
                        <h2 className="text-lg font-semibold text-slate-900">Gestión de Usuarios</h2>
                        <p className="text-sm text-slate-500">Administra todos los usuarios del sistema</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-700 font-medium">
                                <tr>
                                    <th className="px-6 py-3">Nombre</th>
                                    <th className="px-6 py-3">Email</th>
                                    <th className="px-6 py-3">Empresa</th>
                                    <th className="px-6 py-3">Rol</th>
                                    <th className="px-6 py-3 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {allUsers.map(user => (
                                    <tr key={user.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 font-medium text-slate-900">{user.name}</td>
                                        <td className="px-6 py-4 text-slate-600">{user.email}</td>
                                        <td className="px-6 py-4 text-slate-600">{user.company?.name || 'N/A'}</td>
                                        <td className="px-6 py-4">
                                            <UpdateRoleButton userId={user.id} currentRole={user.role} />
                                        </td>
                                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                                            <ResetPasswordButton userId={user.id} />
                                            <button className="text-red-600 hover:text-red-900" title="Desactivar">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        );
    }

    // --- NORMAL USER VIEW (COMPANY) ---
    if (!companyId) return <div className="p-8 text-red-600 font-bold">No company associated.</div>;

    return (
        <main className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
                    <p className="text-slate-500 mt-1">Bienvenido de nuevo, aquí está el resumen de <span className="font-medium text-slate-700">{companyName}</span></p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-medium text-slate-600">
                            {new Date().toLocaleDateString('es-EC', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                    </div>
                </div>
            </div>

            <Suspense fallback={<StatsSkeleton />}>
                <CardWrapper companyId={companyId} />
            </Suspense>

            <div className="grid gap-6 md:grid-cols-2">
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-blue-600" />
                            Acciones Rápidas
                        </h2>
                    </div>
                    <div className="space-y-3">
                        <a href="/employees" className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-blue-50 transition-colors group">
                            <span className="text-sm font-medium text-slate-700 group-hover:text-blue-700">Registrar Empleado</span>
                            <Users className="w-4 h-4 text-slate-400 group-hover:text-blue-500" />
                        </a>
                        <a href="/payroll" className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-blue-50 transition-colors group">
                            <span className="text-sm font-medium text-slate-700 group-hover:text-blue-700">Procesar Nómina</span>
                            <CreditCard className="w-4 h-4 text-slate-400 group-hover:text-blue-500" />
                        </a>
                        <a href="/settings/company" className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-blue-50 transition-colors group">
                            <span className="text-sm font-medium text-slate-700 group-hover:text-blue-700">Configurar Empresa</span>
                            <Building2 className="w-4 h-4 text-slate-400 group-hover:text-blue-500" />
                        </a>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-indigo-600" />
                            Próximos Eventos
                        </h2>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-start gap-4 p-3 rounded-lg bg-blue-50 border border-blue-100">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold text-xs">15</div>
                            <div>
                                <p className="text-sm font-semibold text-slate-900">Decimo Cuarto (Costa)</p>
                                <p className="text-xs text-slate-500">Pagos pendientes para empleados de Costa</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4 p-3 rounded-lg bg-purple-50 border border-purple-100">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 font-bold text-xs">24</div>
                            <div>
                                <p className="text-sm font-semibold text-slate-900">Decimo Tercer Mes</p>
                                <p className="text-xs text-slate-500">Proyección de gasto</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

function StatsSkeleton() {
    return (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 animate-pulse rounded-2xl bg-gray-100" />
            ))}
        </div>
    );
}

function Card({
    title,
    value,
    icon: Icon,
    color
}: {
    title: string;
    value: number;
    icon: any;
    color: string;
}) {
    const colorMap: any = {
        blue: { bg: 'bg-blue-50', text: 'text-blue-600', icon: 'bg-blue-100' },
        indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', icon: 'bg-indigo-100' },
        violet: { bg: 'bg-violet-50', text: 'text-violet-600', icon: 'bg-violet-100' },
        fuchsia: { bg: 'bg-fuchsia-50', text: 'text-fuchsia-600', icon: 'bg-fuchsia-100' },
    };

    const colors = colorMap[color] || colorMap.blue;

    return (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
                <div className={clsx("p-3 rounded-xl", colors.icon)}>
                    <Icon className={clsx("w-6 h-6", colors.text)} />
                </div>
                <span className="text-3xl font-bold text-slate-900">{value}</span>
            </div>
            <p className="mt-4 text-sm font-medium text-slate-500">{title}</p>
        </div>
    );
}
