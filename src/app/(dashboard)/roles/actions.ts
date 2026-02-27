'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function createRole(formData: FormData) {
    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const departmentId = formData.get("departmentId") as string

    await (prisma as any).role.create({
        data: {
            name: name.toUpperCase(),
            description: description?.toUpperCase(),
            departmentId,
        },
    })

    revalidatePath("/roles")
}

export async function updateRole(id: string, formData: FormData) {
    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const departmentId = formData.get("departmentId") as string

    await (prisma as any).role.update({
        where: { id },
        data: {
            name: name.toUpperCase(),
            description: description?.toUpperCase(),
            departmentId,
        },
    })

    revalidatePath("/roles")
}

export async function deleteRole(id: string) {
    await (prisma as any).role.delete({
        where: { id },
    })
    revalidatePath("/roles")
}
