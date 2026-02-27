'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

export async function createDepartment(formData: FormData) {
    const name = formData.get("name") as string
    const description = formData.get("description") as string

    const session = await auth()
    const companyId = (session?.user as any)?.companyId

    if (!companyId) throw new Error("No company associated with user")

    await (prisma as any).department.create({
        data: {
            name: name.toUpperCase(),
            description: description?.toUpperCase(),
            company: { connect: { id: companyId } }
        },
    })

    revalidatePath("/departments")
}

export async function updateDepartment(id: string, formData: FormData) {
    const name = formData.get("name") as string
    const description = formData.get("description") as string

    await (prisma as any).department.update({
        where: { id },
        data: {
            name: name.toUpperCase(),
            description: description?.toUpperCase(),
        },
    })

    revalidatePath("/departments")
}

export async function deleteDepartment(id: string) {
    // Check if it has employees or roles first? 
    // Prisma will throw error if there are relations if not configured to cascade
    await (prisma as any).department.delete({
        where: { id },
    })
    revalidatePath("/departments")
}
