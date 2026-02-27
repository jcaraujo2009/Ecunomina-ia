'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

export async function createCompany(data: {
    name: string,
    ruc: string,
    address?: string,
    phone?: string,
    baseSalary?: number
}) {
    const session = await auth()
    if (!session?.user?.email) throw new Error("Not authenticated")

    const userEmail = session.user.email

    const company = await (prisma as any).company.create({
        data: {
            ...data,
            name: data.name.toUpperCase(),
            ruc: data.ruc.toUpperCase(),
            address: data.address?.toUpperCase(),
            phone: data.phone?.toUpperCase(),
            users: {
                connectOrCreate: {
                    where: { email: userEmail },
                    create: {
                        email: userEmail,
                        name: (session.user.name || userEmail.split('@')[0]).toUpperCase(),
                    }
                }
            }
        }
    })

    revalidatePath("/settings")
    return company
}

export async function updateCompany(companyId: string, data: any) {
    const session = await auth()
    if (!session) throw new Error("Not authenticated")

    const formattedData = { ...data };
    if (data.name) formattedData.name = data.name.toUpperCase();
    if (data.ruc) formattedData.ruc = data.ruc.toUpperCase();
    if (data.address) formattedData.address = data.address.toUpperCase();
    if (data.phone) formattedData.phone = data.phone.toUpperCase();

    const company = await (prisma as any).company.update({
        where: { id: companyId },
        data: formattedData
    })

    revalidatePath("/settings")
    revalidatePath("/")
    return company
}

export async function getMyCompany() {
    const session = await auth()
    if (!session?.user?.email) return null

    const user = await (prisma as any).user.findUnique({
        where: { email: session.user.email },
        include: { company: true }
    })

    return user?.company
}
