'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { UserRole } from '@/types';

export async function createUser(formData: FormData) {
    const session = await auth();
    const companyId = session?.user?.companyId;
    const userRole = session?.user?.role as string;

    const isSuperAdmin = userRole === 'SUPER_ADMIN';
    const isAdmin = userRole === 'ADMIN';

    if (!isSuperAdmin && !isAdmin) throw new Error('Unauthorized');

    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const role = (formData.get('role') as string) as UserRole;
    
    let targetCompanyId = companyId;
    
    if (isSuperAdmin) {
        const selectedCompanyId = formData.get('companyId') as string;
        if (selectedCompanyId) {
            targetCompanyId = selectedCompanyId;
        }
    }

    if (!targetCompanyId) throw new Error('Company is required');

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            role,
            companyId: targetCompanyId,
        },
    });

    revalidatePath('/settings/users');
}

export async function deleteUser(id: string) {
    const session = await auth();
    const companyId = session?.user?.companyId;
    const userRole = session?.user?.role as string;

    const isSuperAdmin = userRole === 'SUPER_ADMIN';
    const isAdmin = userRole === 'ADMIN';

    if (!isSuperAdmin && !isAdmin) throw new Error('Unauthorized');

    if (isSuperAdmin) {
        await prisma.user.delete({
            where: { id },
        });
    } else {
        if (!companyId) throw new Error('No company associated with user');
        await prisma.user.delete({
            where: { id, companyId },
        });
    }

    revalidatePath('/settings/users');
}

export async function resetUserPassword(userId: string, newPassword: string) {
    const session = await auth();
    const userRole = session?.user?.role;

    if (userRole !== 'SUPER_ADMIN') throw new Error('Unauthorized: Super Admin role required');

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
    });

    revalidatePath('/');
}

export async function updateUserRole(userId: string, newRole: string) {
    const session = await auth();
    const userRole = session?.user?.role;

    if (userRole !== 'SUPER_ADMIN') throw new Error('Unauthorized: Super Admin role required');

    await prisma.user.update({
        where: { id: userId },
        data: { role: newRole as any },
    });

    revalidatePath('/');
}
