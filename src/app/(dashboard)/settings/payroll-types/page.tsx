import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import PayrollTypesForm from "./PayrollTypesForm";
import { PayrollPeriodType } from "@/types";

export default async function PayrollTypesPage() {
    const session = await auth();
    const companyId = session?.user?.companyId;
    const role = session?.user?.role;

    if (!companyId) return <div className="p-8">No tienes una empresa asociada.</div>;
    if (role !== 'ADMIN') return <div className="p-8">No tienes permisos.</div>;

    const earnings = await prisma.additionalEarningType.findMany({
        where: { companyId },
        orderBy: { name: 'asc' }
    });

    const deductions = await prisma.additionalDeductionType.findMany({
        where: { companyId },
        orderBy: { name: 'asc' }
    });

    const initialType = PayrollPeriodType.MENSUAL;

    const config = await prisma.payrollTypeConfig.findUnique({
        where: {
            companyId_type: { companyId, type: initialType }
        }
    });

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-6">Configuración de Nómina por Tipo</h1>
            <PayrollTypesForm 
                initialType={initialType} 
                allEarnings={earnings} 
                allDeductions={deductions}
                config={config ? {
                    applicableEarnings: config.applicableEarnings,
                    applicableDeductions: config.applicableDeductions
                } : undefined}
            />
        </div>
    );
}
