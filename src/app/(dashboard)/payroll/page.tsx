import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Plus, FileText, Lock, Unlock } from "lucide-react"
import { createPayrollPeriod, generatePayrollForPeriod, generateDecimoTerceroPayroll, generateXivPayroll } from "./actions"
import Link from "next/link"
import { clsx } from "clsx"

async function getPayrollPeriods(companyId: string) {
    return await (prisma as any).payrollPeriod.findMany({
        where: { companyId },
        include: {
            records: {
                select: {
                    id: true,
                    baseSalary: true,
                    totalEarnings: true,
                    totalDeductions: true,
                    netSalary: true,
                }
            }
        },
        orderBy: [{ status: 'asc' }, { year: 'desc' }, { month: 'desc' }]
    })
}

async function getActiveEmployeesCount(companyId: string) {
    return await (prisma as any).employee.count({
        where: { companyId, status: "ACTIVE" }
    })
}

const TYPE_LABELS: Record<string, string> = {
    MENSUAL: "Nómina Mensual",
    DECIMO_TERCERO: "Décimo Tercero",
    DECIMO_CUARTO_SIERRA: "XIV Sierra",
    DECIMO_CUARTO_COSTA: "XIV Costa",
}

const TYPE_COLORS: Record<string, string> = {
    MENSUAL: "bg-blue-50 text-blue-700 border-blue-200",
    DECIMO_TERCERO: "bg-purple-50 text-purple-700 border-purple-200",
    DECIMO_CUARTO_SIERRA: "bg-emerald-50 text-emerald-700 border-emerald-200",
    DECIMO_CUARTO_COSTA: "bg-amber-50 text-amber-700 border-amber-200",
}

function PayrollCard({ period, isClosed }: { period: any, isClosed: boolean }) {
    const periodType = period.type ?? "MENSUAL"
    const isMensual = periodType === "MENSUAL"
    const periodLabel = new Intl.DateTimeFormat('es-EC', { month: 'long', year: 'numeric' }).format(new Date(period.startDate))

    const totalEmployees = period.records?.length || 0
    const totalEarnings = period.records?.reduce((sum: number, r: any) => sum + (r.totalEarnings || 0), 0) || 0
    const totalDeductions = period.records?.reduce((sum: number, r: any) => sum + (r.totalDeductions || 0), 0) || 0
    const totalNetSalary = period.records?.reduce((sum: number, r: any) => sum + (r.netSalary || 0), 0) || 0

    return (
        <div className={clsx(
            "rounded-xl border bg-white p-5 shadow-sm flex flex-col gap-4",
            isClosed && "opacity-75"
        )}>
            <div className="flex items-start justify-between gap-2">
                <div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className={clsx(
                            "text-xs font-semibold px-2 py-0.5 rounded-full border",
                            TYPE_COLORS[periodType] ?? TYPE_COLORS.MENSUAL
                        )}>
                            {TYPE_LABELS[periodType] ?? periodType}
                        </span>
                        <span className={clsx(
                            "text-xs font-medium px-2 py-0.5 rounded-full",
                            isClosed ? 'bg-gray-100 text-gray-600' :
                                period.status === 'PROCESSED' ? 'bg-green-100 text-green-700' :
                                    'bg-yellow-100 text-yellow-700'
                        )}>
                            {isClosed ? 'Cerrada' : period.status === 'PROCESSED' ? 'Procesada' : 'Borrador'}
                        </span>
                    </div>
                    <h3 className="mt-2 text-base font-semibold text-gray-900 capitalize">{periodLabel}</h3>
                </div>
            </div>

            {!isClosed && (
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-slate-50 rounded-lg p-2">
                        <p className="text-xs text-slate-500">Empleados</p>
                        <p className="font-semibold text-gray-900">{totalEmployees}</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-2">
                        <p className="text-xs text-slate-500">Neto Total</p>
                        <p className="font-semibold text-green-600">${totalNetSalary.toFixed(2)}</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-2">
                        <p className="text-xs text-slate-500">Total Ingresos</p>
                        <p className="font-semibold text-blue-600">${totalEarnings.toFixed(2)}</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-2">
                        <p className="text-xs text-slate-500">Total Egresos</p>
                        <p className="font-semibold text-red-600">${totalDeductions.toFixed(2)}</p>
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-2">
                <Link
                    href={`/payroll/${period.id}`}
                    className="w-full rounded-lg border border-gray-300 py-2 text-center text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                    Ver Detalles
                </Link>

                {isMensual && !isClosed && (period.status === 'DRAFT' || period.status === 'PROCESSED') && (
                    <form action={async () => {
                        'use server'
                        await generatePayrollForPeriod(period.id)
                    }}>
                        <button className={`w-full rounded-lg py-2 text-sm font-medium text-white transition-colors ${period.status === 'DRAFT' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-yellow-500 hover:bg-yellow-600'}`}>
                            {period.status === 'DRAFT' ? 'Generar Nómina' : 'Recalcular'}
                        </button>
                    </form>
                )}

                {!isClosed && period.status === 'PROCESSED' && (
                    <form action={async () => {
                        'use server'
                        const { closePayrollPeriod } = await import('./actions')
                        await closePayrollPeriod(period.id)
                    }}>
                        <button className="w-full rounded-lg bg-red-600 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors flex items-center justify-center gap-2">
                            <Lock size={14} />
                            Cerrar Nómina
                        </button>
                    </form>
                )}
            </div>
        </div>
    )
}

export default async function PayrollPage() {
    const session = await auth()
    const companyId = (session?.user as any)?.companyId

    if (!companyId) return <div>No company associated.</div>;

    const periods = await getPayrollPeriods(companyId)
    const activeEmployeesCount = await getActiveEmployeesCount(companyId)
    const now = new Date()

    const openPeriods = periods.filter((p: any) => p.status !== 'CLOSED')
    const closedPeriods = periods.filter((p: any) => p.status === 'CLOSED')

    const openMensual = openPeriods.filter((p: any) => p.type === 'MENSUAL')
    const openXIV = openPeriods.filter((p: any) => p.type?.includes('DECIMO_CUARTO'))
    const openXIII = openPeriods.filter((p: any) => p.type === 'DECIMO_TERCERO')

    const closedMensual = closedPeriods.filter((p: any) => p.type === 'MENSUAL')
    const closedXIV = closedPeriods.filter((p: any) => p.type?.includes('DECIMO_CUARTO'))
    const closedXIII = closedPeriods.filter((p: any) => p.type === 'DECIMO_TERCERO')

    const calculateOpenTotals = (periodList: any[]) => {
        const allRecords = periodList.flatMap((p: any) => p.records || [])
        return {
            netSalary: allRecords.reduce((sum: number, r: any) => sum + (r.netSalary || 0), 0),
            earnings: allRecords.reduce((sum: number, r: any) => sum + (r.totalEarnings || 0), 0),
            deductions: allRecords.reduce((sum: number, r: any) => sum + (r.totalDeductions || 0), 0),
        }
    }

    const openTotals = calculateOpenTotals(openPeriods)

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-xl border bg-white p-5 shadow-sm">
                    <p className="text-sm text-slate-500">Total Períodos</p>
                    <p className="text-2xl font-bold text-gray-900">{periods.length}</p>
                </div>
                <div className="rounded-xl border bg-white p-5 shadow-sm">
                    <p className="text-sm text-slate-500">Empleados Activos</p>
                    <p className="text-2xl font-bold text-gray-900">{activeEmployeesCount}</p>
                </div>
                <div className="rounded-xl border bg-white p-5 shadow-sm">
                    <p className="text-sm text-slate-500">Total Nóminas Abiertas (Neto)</p>
                    <p className="text-2xl font-bold text-green-600">${openTotals.netSalary.toFixed(2)}</p>
                </div>
                <div className="rounded-xl border bg-white p-5 shadow-sm">
                    <p className="text-sm text-slate-500">Total Egresos Abiertos</p>
                    <p className="text-2xl font-bold text-red-600">${openTotals.deductions.toFixed(2)}</p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Nómina</h1>
                    <p className="text-gray-500 mt-1">Gestiona los periodos de pago y beneficios de ley.</p>
                </div>

                {/* --- Action buttons --- */}
                <div className="flex flex-wrap gap-2">
                    {/* Nómina Mensual */}
                    <form action={async () => {
                        'use server'
                        const now = new Date()
                        await createPayrollPeriod(now.getMonth() + 1, now.getFullYear(), "MENSUAL")
                    }}>
                        <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
                            <Plus size={16} />
                            Nómina Mensual
                        </button>
                    </form>

                    {/* Décimo Tercero */}
                    <form action={async () => {
                        'use server'
                        const now = new Date()
                        const period = await createPayrollPeriod(11, now.getFullYear(), "DECIMO_TERCERO")
                        await generateDecimoTerceroPayroll(period.id)
                    }}>
                        <button className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 transition-colors">
                            <FileText size={16} />
                            Generar XIII
                        </button>
                    </form>

                    {/* XIV Sierra */}
                    <form action={async () => {
                        'use server'
                        const now = new Date()
                        const period = await createPayrollPeriod(8, now.getFullYear(), "DECIMO_CUARTO_SIERRA")
                        await generateXivPayroll(period.id)
                    }}>
                        <button className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors">
                            <FileText size={16} />
                            XIV Sierra
                        </button>
                    </form>

                    {/* XIV Costa */}
                    <form action={async () => {
                        'use server'
                        const now = new Date()
                        const period = await createPayrollPeriod(2, now.getFullYear(), "DECIMO_CUARTO_COSTA")
                        await generateXivPayroll(period.id)
                    }}>
                        <button className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 transition-colors">
                            <FileText size={16} />
                            XIV Costa
                        </button>
                    </form>
                </div>
            </div>

            {/* Nóminas Abiertas */}
            {openPeriods.length > 0 && (
                <div className="space-y-6">
                    <div className="flex items-center gap-2">
                        <Unlock className="text-green-600" size={20} />
                        <h2 className="text-xl font-bold text-gray-900">Nóminas Abiertas</h2>
                    </div>
                    
                    {openMensual.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">Nóminas Mensuales</h3>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {openMensual.map((period: any) => (
                                    <PayrollCard key={period.id} period={period} isClosed={false} />
                                ))}
                            </div>
                        </div>
                    )}

                    {openXIII.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">Décimo Tercer Sueldo</h3>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {openXIII.map((period: any) => (
                                    <PayrollCard key={period.id} period={period} isClosed={false} />
                                ))}
                            </div>
                        </div>
                    )}

                    {openXIV.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">Décimo Cuarto Sueldo (XIV)</h3>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {openXIV.map((period: any) => (
                                    <PayrollCard key={period.id} period={period} isClosed={false} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Nóminas Cerradas */}
            {closedPeriods.length > 0 && (
                <div className="space-y-6 pt-6 border-t">
                    <div className="flex items-center gap-2">
                        <Lock className="text-gray-400" size={20} />
                        <h2 className="text-xl font-bold text-gray-900">Nóminas Cerradas</h2>
                    </div>

                    {closedMensual.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">Nóminas Mensuales</h3>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {closedMensual.map((period: any) => (
                                    <PayrollCard key={period.id} period={period} isClosed={true} />
                                ))}
                            </div>
                        </div>
                    )}

                    {closedXIII.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">Décimo Tercer Sueldo</h3>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {closedXIII.map((period: any) => (
                                    <PayrollCard key={period.id} period={period} isClosed={true} />
                                ))}
                            </div>
                        </div>
                    )}

                    {closedXIV.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">Décimo Cuarto Sueldo (XIV)</h3>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {closedXIV.map((period: any) => (
                                    <PayrollCard key={period.id} period={period} isClosed={true} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {periods.length === 0 && (
                <div className="rounded-xl border bg-white p-12 text-center text-gray-400">
                    No hay periodos creados aún. Crea uno con los botones de arriba.
                </div>
            )}
        </div>
    )
}
