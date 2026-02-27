'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

export async function saveTaxBrackets(brackets: { minLimit: number, maxLimit: number | null, baseTax: number, percentage: number }[]) {
    const session = await auth();
    const companyId = session?.user?.companyId;
    if (!companyId) throw new Error('No company');
    const userRole = session?.user?.role;
    if (userRole !== 'ADMIN') throw new Error('Unauthorized');

    await prisma.$transaction([
        prisma.incomeTaxBracket.deleteMany({ where: { companyId } }),
        prisma.incomeTaxBracket.createMany({
            data: brackets.map(b => ({
                ...b,
                companyId
            }))
        })
    ]);

    revalidatePath('/settings/taxes');
}

export async function saveTaxReduction(reductionPercentage: number) {
    const session = await auth();
    const companyId = session?.user?.companyId;
    if (!companyId) throw new Error('No company');
    const userRole = session?.user?.role;
    if (userRole !== 'ADMIN') throw new Error('Unauthorized');

    await prisma.taxReductionConfig.upsert({
        where: { companyId },
        update: { reductionPercentage },
        create: { companyId, reductionPercentage }
    });

    revalidatePath('/settings/taxes');
}

export async function saveFamilyBurdenReductions(reductions: { dependentCount: number, maxReduction: number, taxReductionPercentage: number }[], year: number) {
    const session = await auth();
    const companyId = session?.user?.companyId;
    if (!companyId) throw new Error('No company');
    const userRole = session?.user?.role;
    if (userRole !== 'ADMIN') throw new Error('Unauthorized');

    // Delete existing for this year and create new ones
    await prisma.$transaction([
        prisma.familyBurdenReduction.deleteMany({ where: { companyId, year } }),
        prisma.familyBurdenReduction.createMany({
            data: reductions.map(r => ({
                ...r,
                companyId,
                year
            }))
        })
    ]);

    revalidatePath('/settings/taxes');
}
