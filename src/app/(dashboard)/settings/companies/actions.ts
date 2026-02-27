'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createCompanyAdmin(formData: FormData) {
    const session = await auth();
    const userRole = session?.user?.role;

    if (userRole !== 'SUPER_ADMIN') throw new Error('Unauthorized');

    const name = formData.get('name') as string;
    const ruc = formData.get('ruc') as string;
    const userName = formData.get('userName') as string;
    const userEmail = formData.get('userEmail') as string;
    const userPassword = formData.get('userPassword') as string;

    if (!name || !ruc || !userName || !userEmail || !userPassword) {
        return;
    }

    try {
        await prisma.$transaction(async (tx) => {
            const company = await tx.company.create({
                data: {
                    name,
                    ruc,
                }
            });

            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash(userPassword, 10);

            await tx.user.create({
                data: {
                    name: userName,
                    email: userEmail,
                    password: hashedPassword,
                    role: 'ADMIN',
                    companyId: company.id,
                }
            });
        });
    } catch (error) {
        console.error(error);
    }

    revalidatePath('/settings/companies');
}

export async function deleteCompany(id: string) {
    const session = await auth();
    if (session?.user?.role !== 'SUPER_ADMIN') throw new Error('Unauthorized');

    await prisma.company.delete({ where: { id } });
    revalidatePath('/settings/companies');
}
