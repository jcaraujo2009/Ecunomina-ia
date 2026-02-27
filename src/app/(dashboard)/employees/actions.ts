'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { Region } from "@/types"

export async function createEmployee(formData: FormData) {
    const firstName = (formData.get("firstName") as string).toUpperCase()
    const lastName = (formData.get("lastName") as string).toUpperCase()
    const email = (formData.get("email") as string)?.toUpperCase()
    const identification = (formData.get("identification") as string).toUpperCase()
    const roleId = formData.get("roleId") as string
    const departmentId = formData.get("departmentId") as string
    const salary = parseFloat(formData.get("salary") as string)
    const startDate = new Date(formData.get("startDate") as string)
    const accumulateDecimos = formData.get("accumulateDecimos") === "on"
    const accumulateReserveFund = formData.get("accumulateReserveFund") === "on"
    const isPartTime = formData.get("isPartTime") === "on"
    const region = (formData.get("region") as string) as Region || Region.SIERRA
    const familyBurden = parseInt(formData.get("familyBurden") as string) || 0

    const session = await auth()
    const companyId = session?.user?.companyId

    if (!companyId) return { error: "No hay empresa asociada al usuario." }

    try {
        await (prisma as any).employee.create({
            data: {
                firstName,
                lastName,
                email,
                identification,
                role: { connect: { id: roleId } },
                department: { connect: { id: departmentId } },
                company: { connect: { id: companyId } },
                salary,
                startDate,
                status: "ACTIVE",
                region,
                accumulateDecimos,
                accumulateReserveFund,
                isPartTime,
                familyBurden,
            },
        })
    } catch (error: any) {
        if (error.code === 'P2002') {
            return { error: "Ya existe un empleado con esa identificación (cédula/RUC). Por favor verifique." }
        }
        return { error: "Error al crear el empleado. Intente de nuevo." }
    }

    revalidatePath("/employees")
    redirect("/employees")
}

export async function deleteEmployee(id: string) {
    await (prisma as any).employee.delete({
        where: { id },
    })
    revalidatePath("/employees")
}

export async function updateEmployee(id: string, formData: FormData) {
    const firstName = (formData.get("firstName") as string).toUpperCase()
    const lastName = (formData.get("lastName") as string).toUpperCase()
    const email = (formData.get("email") as string)?.toUpperCase()
    const identification = (formData.get("identification") as string).toUpperCase()
    const roleId = formData.get("roleId") as string
    const departmentId = formData.get("departmentId") as string
    const salary = parseFloat(formData.get("salary") as string)
    const startDate = new Date(formData.get("startDate") as string)
    const status = formData.get("status") as string
    const accumulateDecimos = formData.get("accumulateDecimos") === "on"
    const accumulateReserveFund = formData.get("accumulateReserveFund") === "on"
    const isPartTime = formData.get("isPartTime") === "on"
    const region = (formData.get("region") as string) || "SIERRA"
    const familyBurden = parseInt(formData.get("familyBurden") as string) || 0

    try {
        await (prisma as any).employee.update({
            where: { id },
            data: {
                firstName,
                lastName,
                email,
                identification,
                role: { connect: { id: roleId } },
                department: { connect: { id: departmentId } },
                salary,
                startDate,
                status,
                region,
                accumulateDecimos,
                accumulateReserveFund,
                isPartTime,
                familyBurden,
            },
        })
    } catch (error: any) {
        if (error.code === 'P2002') {
            return { error: "Ya existe un empleado con esa identificación (cédula/RUC). Por favor verifique." }
        }
        return { error: "Error al actualizar el empleado. Intente de nuevo." }
    }

    revalidatePath("/employees")
    redirect("/employees")
}
