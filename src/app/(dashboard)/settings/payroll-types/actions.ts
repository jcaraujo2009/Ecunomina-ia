'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { PayrollPeriodType } from '@/types';

export async function savePayrollTypeConfig(
    type: PayrollPeriodType, 
    earningIds: string[], 
    deductionIds: string[]
) {
    const session = await auth();
    const companyId = session?.user?.companyId;
    if (!companyId) throw new Error('No company');
    
    const userRole = session?.user?.role;
    if (userRole !== 'ADMIN') throw new Error('Unauthorized');

    await prisma.payrollTypeConfig.upsert({
        where: {
            companyId_type: { companyId, type }
        },
        update: {
            applicableEarnings: earningIds,
            applicableDeductions: deductionIds
        },
        create: {
            companyId,
            type,
            applicableEarnings: earningIds,
            applicableDeductions: deductionIds
        }
    });

    revalidatePath('/settings/payroll-types');
}
