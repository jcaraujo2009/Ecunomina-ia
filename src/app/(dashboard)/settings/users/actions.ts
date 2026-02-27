'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { UserRole } from '@/types';

export async function createUser(formData: FormData) {
    const session = await auth();
    const companyId = session?.user?.companyId;
    const userRole = session?.user?.role;

    if (!companyId) throw new Error('No company associated with user');
    if (userRole !== 'ADMIN') throw new Error('Unauthorized: Admin role required');

    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const role = (formData.get('role') as string) as UserRole;

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            role,
            companyId,
        },
    });

    revalidatePath('/settings/users');
}

export async function deleteUser(id: string) {
    const session = await auth();
    const companyId = session?.user?.companyId;
    const userRole = session?.user?.role;

    if (!companyId) throw new Error('No company associated with user');
    if (userRole !== 'ADMIN') throw new Error('Unauthorized: Admin role required');

    // Prevent self-deletion if needed or check if last admin
    // For now, simple delete
    await prisma.user.delete({
        where: { id, companyId },
    });

    revalidatePath('/settings/users');
}
