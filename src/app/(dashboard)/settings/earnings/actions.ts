'use server'

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function createEarningType(formData: FormData) {
    const session = await auth()
    const companyId = (session?.user as any)?.companyId

    if (!companyId) throw new Error("No company associated with user")

    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const formula = formData.get("formula") as string
    const isTaxable = formData.get("isTaxable") === "on"
    const isIessable = formData.get("isIessable") === "on"

    await (prisma as any).additionalEarningType.create({
        data: {
            name: name.toUpperCase(),
            description: description?.toUpperCase(),
            formula: formula || null,
            isTaxable,
            isIessable,
            company: { connect: { id: companyId } }
        }
    })

    revalidatePath("/settings/earnings")
}

export async function deleteEarningType(id: string) {
    const session = await auth()
    const companyId = (session?.user as any)?.companyId

    if (!companyId) throw new Error("No company associated with user")

    await (prisma as any).additionalEarningType.delete({
        where: {
            id,
            companyId // Safety check
        }
    })
    revalidatePath("/settings/earnings")
}

export async function updateEarningType(id: string, formData: FormData) {
    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const isTaxable = formData.get("isTaxable") === "on"
    const isIessable = formData.get("isIessable") === "on"

    await (prisma as any).additionalEarningType.update({
        where: { id },
        data: {
            name: name.toUpperCase(),
            description: description?.toUpperCase(),
            isTaxable,
            isIessable
        }
    })

    revalidatePath("/settings/earnings")
}
