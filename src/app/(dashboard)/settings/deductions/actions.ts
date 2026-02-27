'use server'

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function createDeductionType(formData: FormData) {
    const session = await auth()
    const companyId = (session?.user as any)?.companyId

    if (!companyId) throw new Error("No company associated with user")

    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const formula = formData.get("formula") as string

    await (prisma as any).additionalDeductionType.create({
        data: {
            name: name.toUpperCase(),
            description: description?.toUpperCase(),
            formula: formula || null,
            company: { connect: { id: companyId } }
        }
    })

    revalidatePath("/settings/deductions")
}

export async function deleteDeductionType(id: string) {
    const session = await auth()
    const companyId = (session?.user as any)?.companyId

    if (!companyId) throw new Error("No company associated with user")

    await (prisma as any).additionalDeductionType.delete({
        where: {
            id,
            companyId // Safety check
        }
    })
    revalidatePath("/settings/deductions")
}
