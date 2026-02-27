import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import TaxesForm from "./TaxesForm";

export default async function TaxesPage() {
    const session = await auth();
    const companyId = session?.user?.companyId;
    const role = session?.user?.role;

    if (!companyId) return <div className="p-8">No tienes una empresa asociada.</div>;
    if (role !== 'ADMIN') return <div className="p-8">No tienes permisos.</div>;

    const currentYear = new Date().getFullYear();

    const taxBrackets = await prisma.incomeTaxBracket.findMany({
        where: { companyId },
        orderBy: { minLimit: 'asc' }
    });

    const taxConfig = await prisma.taxReductionConfig.findUnique({
        where: { companyId }
    });

    const familyReductions = await prisma.familyBurdenReduction.findMany({
        where: { companyId, year: currentYear }
    });

    const defaultBrackets = [
        { minLimit: 0, maxLimit: 11902, baseTax: 0, percentage: 0 },
        { minLimit: 11902, maxLimit: 15159, baseTax: 0, percentage: 5 },
        { minLimit: 15159, maxLimit: 18473, baseTax: 162.85, percentage: 10 },
        { minLimit: 18473, maxLimit: 22223, baseTax: 494.25, percentage: 12 },
        { minLimit: 22223, maxLimit: 27150, baseTax: 944.25, percentage: 15 },
        { minLimit: 27150, maxLimit: 34327, baseTax: 1683.30, percentage: 20 },
        { minLimit: 34327, maxLimit: 45017, baseTax: 3118.70, percentage: 25 },
        { minLimit: 45017, maxLimit: 59317, baseTax: 5791.20, percentage: 30 },
        { minLimit: 59317, maxLimit: 80894, baseTax: 10081.20, percentage: 35 },
        { minLimit: 80894, maxLimit: null, baseTax: 17633.15, percentage: 37 },
    ];

    const brackets = taxBrackets.length > 0 ? taxBrackets.map(b => ({
        minLimit: Number(b.minLimit),
        maxLimit: b.maxLimit ? Number(b.maxLimit) : null,
        baseTax: Number(b.baseTax),
        percentage: Number(b.percentage)
    })) : defaultBrackets;

    const reduction = taxConfig ? Number(taxConfig.reductionPercentage) : 0;

    const familyBurdenReductions = familyReductions.map(r => ({
        dependentCount: r.dependentCount,
        maxReduction: Number(r.maxReduction),
        taxReductionPercentage: Number(r.taxReductionPercentage)
    }));

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-6">Configuración de Impuestos</h1>
            <TaxesForm initialBrackets={brackets} initialReduction={reduction} initialFamilyReductions={familyBurdenReductions} initialYear={currentYear} />
        </div>
    );
}
