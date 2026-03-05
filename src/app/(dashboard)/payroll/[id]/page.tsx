import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import EditOvertimeModal from "./EditOvertimeModal"
import EditDaysModal from "./EditDaysModal"
import AddAdditionalItemModal from "./AddAdditionalItemModal"
import DeleteAdditionalItemButton from "./DeleteAdditionalItemButton"
import ExportButtons from "./ExportButtons"
import ClosePayrollButton from "./ClosePayrollButton"
import PaySlipButton from "./PaySlipButton"
import PayrollActions from "./PayrollActions"
import { clsx } from "clsx"
import { getMyCompany } from "../../settings/company/actions"
import { recalculateAllRecords } from "../actions"
import { RefreshCw } from "lucide-react"

export default async function PayrollDetailsPage({ params }: { params: { id: string } }) {
    const { id } = await params
    const company = await getMyCompany()

    const [period, earningsTypes, deductionsTypes] = await Promise.all([
        (prisma as any).payrollPeriod.findUnique({
            where: { id },
            include: {
                records: {
                    include: {
                        employee: { include: { role: true, department: true } },
                        benefits: { include: { earningType: true } },
                        deductions: { include: { deductionType: true } }
                    }
                }
            }
        }),
        (prisma as any).additionalEarningType.findMany({ orderBy: { name: 'asc' } }),
        (prisma as any).additionalDeductionType.findMany({ orderBy: { name: 'asc' } })
    ])

    if (!period) notFound()

    const isClosed = period.status === 'CLOSED'
    const periodName = new Intl.DateTimeFormat('es-EC', { month: 'long', year: 'numeric' }).format(period.startDate)

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border shadow-sm">
                <div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <h1 className="text-2xl font-bold capitalize">
                            {(period as any).type !== 'MENSUAL' ? (
                                ({ DECIMO_TERCERO: 'Décimo Tercero', DECIMO_CUARTO_SIERRA: 'XIV Sierra', DECIMO_CUARTO_COSTA: 'XIV Costa' } as Record<string, string>)[(period as any).type] ?? (period as any).type
                            ) : 'Nómina'}: {periodName}
                        </h1>
                        <span className={clsx(
                            "px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider",
                            period.status === 'CLOSED' ? "bg-gray-100 text-gray-800 border border-gray-200" :
                                period.status === 'PROCESSED' ? "bg-blue-100 text-blue-800 border border-blue-200" :
                                    "bg-yellow-100 text-yellow-800 border border-yellow-200"
                        )}>
                            {period.status === 'CLOSED' ? 'Cerrada' : period.status === 'PROCESSED' ? 'Procesada' : 'Borrador'}
                        </span>
                    </div>
                    <p className="text-gray-500 mt-1">Gestión de pagos y descuentos del periodo.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <PayrollActions 
                        periodId={period.id} 
                        periodName={periodName} 
                        records={period.records} 
                        company={company} 
                        isClosed={isClosed}
                        earnings={earningsTypes}
                        deductions={deductionsTypes}
                    />
                    {!isClosed && period.status === 'processed' && (
                        <form action={async () => {
                            'use server'
                            await recalculateAllRecords(period.id)
                        }}>
                            <button className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                                <RefreshCw size={14} />
                                Recalcular Todo
                            </button>
                        </form>
                    )}
                    {!isClosed && period.status === 'processed' && (
                        <ClosePayrollButton periodId={period.id} />
                    )}
                </div>
            </div>

            <div className="overflow-hidden rounded-xl border bg-white shadow-sm overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-500">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-700">
                        <tr>
                            <th className="px-6 py-4">Empleado</th>
                            <th className="px-6 py-4">Sueldo Base</th>
                            <th className="px-6 py-4">Días</th>
                            <th className="px-6 py-4">Horas Extras (%)</th>
                            <th className="px-6 py-4 text-right">Valores HE</th>
                            <th className="px-6 py-4">Beneficios (Décimos/FR)</th>
                            <th className="px-6 py-4">Egresos (IESS/Renta)</th>
                            <th className="px-6 py-4 text-right">Neto a Recibir</th>
                            <th className="px-6 py-4 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {period.records.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="px-6 py-10 text-center text-gray-400">
                                    No hay registros generados para este periodo.
                                </td>
                            </tr>
                        ) : period.records.map((record: any) => {
                            const lawDeductions = record.deductions.filter((d: any) => !d.deductionType);
                            const additionalDeductions = record.deductions.filter((d: any) => d.deductionType);

                            const iess = lawDeductions.find((d: any) => d.type === 'IESS_PERSONAL')?.amount || 0;
                            const incomeTax = lawDeductions.find((d: any) => d.type === 'INCOME_TAX')?.amount || 0;

                            const lawBenefits = record.benefits.filter((b: any) => !b.earningType);
                            const additionalBenefits = record.benefits.filter((b: any) => b.earningType);

                            const benefitsTotal = record.benefits.reduce((acc: number, b: any) => acc + b.amount, 0);

                            return (
                                <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">
                                            {record.employee.firstName} {record.employee.lastName}
                                        </div>
                                        <div className="text-xs text-gray-400">{record.employee.identification}</div>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-gray-600">${record.baseSalary.toFixed(2)}</td>
                                    <td className="px-6 py-4">
                                        {isClosed ? (
                                            <span className="font-mono">{record.daysWorked}</span>
                                        ) : (
                                            <EditDaysModal recordId={record.id} currentDays={record.daysWorked} />
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1 text-[11px] font-mono">
                                            <div className="flex justify-between gap-4">
                                                <span className="text-gray-400">25%:</span>
                                                <span className="font-semibold text-gray-700">{record.overtime25h}h</span>
                                            </div>
                                            <div className="flex justify-between gap-4">
                                                <span className="text-gray-400">50%:</span>
                                                <span className="font-semibold text-gray-700">{record.overtime50h}h</span>
                                            </div>
                                            <div className="flex justify-between gap-4">
                                                <span className="text-gray-400">100%:</span>
                                                <span className="font-semibold text-gray-700">{record.overtime100h}h</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex flex-col gap-1 text-[11px] font-mono">
                                            <div className="text-blue-600">+${record.overtime25Value.toFixed(2)}</div>
                                            <div className="text-blue-600">+${record.overtime50Value.toFixed(2)}</div>
                                            <div className="text-blue-600">+${record.overtime100Value.toFixed(2)}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-green-600 font-semibold">+${benefitsTotal.toFixed(2)}</div>
                                        <div className="text-[10px] space-y-1">
                                            <div className="text-gray-400">
                                                Leyes: {lawBenefits.map((b: any) => `${b.type.split('_').pop()}: ${b.amount.toFixed(2)}`).join(' | ')}
                                            </div>
                                            {additionalBenefits.length > 0 && (
                                                <div className="flex flex-wrap gap-1">
                                                    {additionalBenefits.map((b: any) => (
                                                        <span key={b.id} className="inline-flex items-center gap-1 rounded bg-green-50 px-1.5 py-0.5 text-green-700 border border-green-100">
                                                            {b.earningType?.name}: ${b.amount.toFixed(2)}
                                                            {!isClosed && <DeleteAdditionalItemButton recordId={record.id} itemId={b.id} type="earning" />}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-red-600 font-semibold">-${record.totalDeductions.toFixed(2)}</div>
                                        <div className="text-[10px] space-y-1">
                                            <div className="text-gray-400">
                                                IESS: {iess.toFixed(2)} | Renta: {incomeTax.toFixed(2)}
                                            </div>
                                            {additionalDeductions.length > 0 && (
                                                <div className="flex flex-wrap gap-1">
                                                    {additionalDeductions.map((d: any) => (
                                                        <span key={d.id} className="inline-flex items-center gap-1 rounded bg-red-50 px-1.5 py-0.5 text-red-700 border border-red-100">
                                                            {d.deductionType?.name}: ${d.amount.toFixed(2)}
                                                            {!isClosed && <DeleteAdditionalItemButton recordId={record.id} itemId={d.id} type="deduction" />}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="text-lg font-bold text-gray-900">${record.netSalary.toFixed(2)}</div>
                                    </td>
                                    <td className="px-6 py-4 flex flex-col items-center gap-2">
                                        <PaySlipButton
                                            employee={record.employee}
                                            period={periodName}
                                            record={record}
                                            company={company}
                                        />
                                        {!isClosed && (
                                            <>
                                                <EditOvertimeModal
                                                    recordId={record.id}
                                                    employeeName={`${record.employee.firstName} ${record.employee.lastName}`}
                                                    current25={record.overtime25h}
                                                    current50={record.overtime50h}
                                                    current100={record.overtime100h}
                                                />
                                                <AddAdditionalItemModal
                                                    recordId={record.id}
                                                    earningsTypes={earningsTypes}
                                                    deductionsTypes={deductionsTypes}
                                                />
                                            </>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
