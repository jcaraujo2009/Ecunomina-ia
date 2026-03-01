'use server'

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { calculateMonthlyPayroll, ECUADOR_CONSTANTS } from "@/lib/payroll"
import { PayrollPeriodType } from "@/types"
import nodemailer from "nodemailer"
import { generatePayslipPDF } from "@/lib/reports"

export async function createPayrollPeriod(month: number, year: number, type: string = "MENSUAL") {
    const session = await auth()
    const companyId = session?.user?.companyId

    if (!companyId) throw new Error("No company associated with user")

    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0)

    // Use upsert so trying to create a period that already exists
    // just returns the existing one instead of crashing.
    const period = await prisma.payrollPeriod.upsert({
        where: {
            month_year_type_companyId: { month, year, type: type as PayrollPeriodType, companyId }
        },
        update: {}, // keep everything as-is if it already exists
        create: {
            month,
            year,
            type: type as PayrollPeriodType,
            startDate,
            endDate,
            status: "DRAFT",
            company: { connect: { id: companyId } }
        }
    })

    revalidatePath("/payroll")
    return period
}

export async function generatePayrollForPeriod(periodId: string) {
    const session = await auth()
    const companyId = (session?.user as any)?.companyId

    if (!companyId) throw new Error("No company associated with user")

    const period = await (prisma as any).payrollPeriod.findUnique({
        where: { id: periodId },
        include: { records: true }
    })

    if (!period) throw new Error("Period not found")
    if (period.companyId !== companyId) throw new Error("Unauthorized access to this period")

    const employees = await (prisma as any).employee.findMany({
        where: { status: "ACTIVE", companyId: companyId }
    })

    const company = await (prisma as any).company.findUnique({ where: { id: companyId } })
    const baseSalarySBU = company?.baseSalary ?? ECUADOR_CONSTANTS.SBU_2025

    const taxConfig = await (prisma as any).taxReductionConfig.findUnique({ where: { companyId } })
    const taxReduction = taxConfig ? Number(taxConfig.reductionPercentage) : 0

    const dbBrackets = await (prisma as any).incomeTaxBracket.findMany({ where: { companyId } })
    const taxBrackets = dbBrackets.length > 0 ? dbBrackets.map((b: any) => ({
        minLimit: Number(b.minLimit),
        maxLimit: b.maxLimit ? Number(b.maxLimit) : null,
        baseTax: Number(b.baseTax),
        percentage: Number(b.percentage)
    })) : undefined // Pass undefined to use default in function

    // Obtener año del período para buscar la reducción familiar correcta
    const year = period.year

    // Obtener configuraciones de reducción por cargas familiares
    const familyReductions = await (prisma as any).familyBurdenReduction.findMany({ 
        where: { companyId, year } 
    })
    const familyBurdenReductions = familyReductions.map((r: any) => ({
        dependentCount: r.dependentCount,
        maxReduction: Number(r.maxReduction),
        taxReductionPercentage: Number(r.taxReductionPercentage)
    }))

    // Obtener configuración de rubros por tipo de nómina
    const typeConfig = await (prisma as any).payrollTypeConfig.findUnique({
        where: {
            companyId_type: { companyId, type: period.type }
        }
    })

    // Obtener todos los tipos de ingresos y deducciones de la empresa
    const allEarnings = await (prisma as any).additionalEarningType.findMany({ where: { companyId } })
    const allDeductions = await (prisma as any).additionalDeductionType.findMany({ where: { companyId } })

    // Filtrar según configuración
    const applicableEarnings = typeConfig ? allEarnings.filter((e: any) => typeConfig.applicableEarnings.includes(e.id)) : allEarnings
    const applicableDeductions = typeConfig ? allDeductions.filter((d: any) => typeConfig.applicableDeductions.includes(d.id)) : allDeductions

    // Transformar al formato esperado por la función de cálculo
    const earningsParams = applicableEarnings.map((e: any) => ({
        id: e.id,
        formula: e.formula,
        defaultValue: 0, // TODO: Implementar entrada de valores manuales
        isTaxable: e.isTaxable,
        isIessable: e.isIessable
    }));

    const deductionParams = applicableDeductions.map((d: any) => ({
        id: d.id,
        formula: d.formula,
        defaultValue: 0 // TODO: Implementar entrada de valores manuales
    }));

    for (const employee of employees) {
        const calc = calculateMonthlyPayroll(
            employee.salary,
            employee.accumulateDecimos,
            employee.accumulateReserveFund,
            0, 0, 0, earningsParams, deductionParams,
            employee.isPartTime,
            30,
            baseSalarySBU,
            taxBrackets,
            employee.familyBurden || 0,
            familyBurdenReductions
        )

        // Check if record already exists
        const existingRecord = await (prisma as any).payrollRecord.findUnique({
            where: {
                employeeId_periodId: {
                    employeeId: employee.id,
                    periodId: periodId
                }
            }
        })

        if (existingRecord) {
            // Update record and replace law benefits/deductions cleanly
            await prisma.$transaction([
                (prisma as any).payrollRecord.update({
                    where: { id: existingRecord.id },
                    data: {
                        baseSalary: calc.baseSalary,
                        overtime25h: 0,
                        overtime50h: 0,
                        overtime100h: 0,
                        overtime25Value: calc.overtime25Value,
                        overtime50Value: calc.overtime50Value,
                        overtime100Value: calc.overtime100Value,
                        netSalary: calc.netSalary,
                        totalEarnings: calc.totalEarnings,
                        totalDeductions: calc.totalDeductions,
                    }
                }),
                (prisma as any).benefit.deleteMany({
                    where: { payrollRecordId: existingRecord.id, earningTypeId: null }
                }),
                (prisma as any).deduction.deleteMany({
                    where: { payrollRecordId: existingRecord.id, deductionTypeId: null }
                }),
                (prisma as any).benefit.createMany({
                    data: [
                        { payrollRecordId: existingRecord.id, type: "DECIMO_TERCERO", amount: calc.decimoTercero },
                        { payrollRecordId: existingRecord.id, type: "DECIMO_CUARTO", amount: calc.decimoCuarto },
                        { payrollRecordId: existingRecord.id, type: "FONDO_RESERVA", amount: calc.reserveFund },
                    ]
                }),
                (prisma as any).deduction.createMany({
                    data: [
                        { payrollRecordId: existingRecord.id, type: "IESS_PERSONAL", amount: calc.iessDeduction },
                        { payrollRecordId: existingRecord.id, type: "INCOME_TAX", amount: calc.incomeTax }
                    ]
                }),
            ])
        } else {
            // Create new record with benefits and deductions
            await (prisma as any).payrollRecord.create({
                data: {
                    employeeId: employee.id,
                    periodId: periodId,
                    baseSalary: calc.baseSalary,
                    daysWorked: 30,
                    overtime25h: 0,
                    overtime50h: 0,
                    overtime100h: 0,
                    overtime25Value: calc.overtime25Value,
                    overtime50Value: calc.overtime50Value,
                    overtime100Value: calc.overtime100Value,
                    netSalary: calc.netSalary,
                    totalEarnings: calc.totalEarnings,
                    totalDeductions: calc.totalDeductions,
                    benefits: {
                        create: [
                            { type: "DECIMO_TERCERO", amount: calc.decimoTercero },
                            { type: "DECIMO_CUARTO", amount: calc.decimoCuarto },
                            { type: "FONDO_RESERVA", amount: calc.reserveFund },
                        ]
                    },
                    deductions: {
                        create: [
                            { type: "IESS_PERSONAL", amount: calc.iessDeduction },
                            { type: "INCOME_TAX", amount: calc.incomeTax }
                        ]
                    }
                }
            })
        }
    }

    await (prisma as any).payrollPeriod.update({
        where: { id: periodId },
        data: { status: "PROCESSED" }
    })

    await (prisma as any).payrollAudit.create({
        data: {
            periodId,
            action: "CALCULATED",
            employeeCount: employees.length,
            userId: session?.user?.id,
            userEmail: session?.user?.email,
            details: JSON.stringify({ type: period.type, year: period.year, month: period.month })
        }
    })

    revalidatePath("/payroll")
}

/**
 * Génera la nómina de Décimo Tercero (XIII).
 * Cubre el periodo diciembre 1 (año anterior) a noviembre 30 (año actual).
 * Calcula la prorción acumulada en nóminas mensuales y paga la diferencia.
 */
export async function generateDecimoTerceroPayroll(periodId: string) {
    const session = await auth()
    const companyId = (session?.user as any)?.companyId
    if (!companyId) throw new Error("No company associated with user")

    const period = await (prisma as any).payrollPeriod.findUnique({ where: { id: periodId } })
    if (!period) throw new Error("Period not found")

    // Covered period: Dec 1 (year-1) to Nov 30 (year)
    const coverYear = period.year
    // Monthly periods in scope: Dec of prev year (month=12 year=coverYear-1) and Jan-Nov of coverYear
    const coveredMonthlyPeriods = await (prisma as any).payrollPeriod.findMany({
        where: {
            companyId,
            type: "MENSUAL",
            status: { in: ["PROCESSED", "CLOSED"] },
            OR: [
                { year: coverYear - 1, month: 12 },
                { year: coverYear, month: { lte: 11 } }
            ]
        },
        select: { id: true }
    })
    const coveredPeriodIds = coveredMonthlyPeriods.map((p: any) => p.id)

    const employees = await (prisma as any).employee.findMany({
        where: { companyId, status: "active" }
    })

    for (const employee of employees) {
        // Sum DECIMO_TERCERO already paid in monthly payrolls
        const alreadyPaidBenefits = await (prisma as any).benefit.findMany({
            where: {
                type: "DECIMO_TERCERO",
                payrollRecord: {
                    employeeId: employee.id,
                    periodId: { in: coveredPeriodIds }
                }
            }
        })
        const alreadyPaid = alreadyPaidBenefits.reduce((sum: number, b: any) => sum + b.amount, 0)

        // Total XIII entitlement = (salary / 12) * months worked in covered period
        // For simplicity, use covered period count as months worked
        const monthsWorked = coveredPeriodIds.length
        const totalEntitlement = (employee.salary / 12) * monthsWorked
        const toPay = Math.max(0, totalEntitlement - alreadyPaid)

        // Upsert payroll record for this employee in this period
        const existing = await (prisma as any).payrollRecord.findUnique({
            where: { employeeId_periodId: { employeeId: employee.id, periodId } }
        })

        if (existing) {
            await (prisma as any).benefit.deleteMany({ where: { payrollRecordId: existing.id, earningTypeId: null } })
            await (prisma as any).benefit.create({ data: { payrollRecordId: existing.id, type: "DECIMO_TERCERO", amount: toPay } })
            await (prisma as any).payrollRecord.update({
                where: { id: existing.id },
                data: { baseSalary: 0, netSalary: toPay, totalEarnings: toPay, totalDeductions: 0 }
            })
        } else {
            await (prisma as any).payrollRecord.create({
                data: {
                    employeeId: employee.id, periodId,
                    baseSalary: 0, daysWorked: 30,
                    overtime25h: 0, overtime50h: 0, overtime100h: 0,
                    overtime25Value: 0, overtime50Value: 0, overtime100Value: 0,
                    netSalary: toPay, totalEarnings: toPay, totalDeductions: 0,
                    benefits: { create: [{ type: "DECIMO_TERCERO", amount: toPay }] }
                }
            })
        }
    }

    await (prisma as any).payrollPeriod.update({ where: { id: periodId }, data: { status: "PROCESSED" } })

    await (prisma as any).payrollAudit.create({
        data: {
            periodId,
            action: "CALCULATED",
            employeeCount: employees.length,
            userId: session?.user?.id,
            userEmail: session?.user?.email,
            details: JSON.stringify({ type: period.type, year: period.year, month: period.month })
        }
    })

    revalidatePath("/payroll")
}

/**
 * Genera la nómina de Décimo Cuarto (XIV).
 * Cubre diferentes periodos según la región:
 *   - SIERRA: ago 1 (año anterior) a jul 31 (año actual) → pago en agosto
 *   - COSTA:  mar 1 (año anterior) a feb 28 (año actual) → pago en marzo
 * Paga la diferencia entre 1 SBU y lo ya cobrado mensualmente.
 */
export async function generateDecimoCuartoPayroll(periodId: string) {
    const session = await auth()
    const companyId = (session?.user as any)?.companyId
    if (!companyId) throw new Error("No company associated with user")

    const period = await (prisma as any).payrollPeriod.findUnique({ where: { id: periodId } })
    if (!period) throw new Error("Period not found")

    const company = await (prisma as any).company.findUnique({ where: { id: companyId } })
    const sbu = company?.baseSalary ?? ECUADOR_CONSTANTS.SBU_2025

    // Determine covered months based on type
    const isSierra = period.type === "DECIMO_CUARTO_SIERRA"
    const coverYear = period.year

    // Sierra: Aug (prev year) to Jul (current year) → months 8-12 of prev + 1-7 of current
    // Costa:  Mar (prev year) to Feb (current year) → months 3-12 of prev + 1-2 of current
    let coveredMonthsPrevYear: number[]
    let coveredMonthsCurrentYear: number[]

    if (isSierra) {
        coveredMonthsPrevYear = [8, 9, 10, 11, 12]          // Aug-Dec
        coveredMonthsCurrentYear = [1, 2, 3, 4, 5, 6, 7]   // Jan-Jul
    } else {
        coveredMonthsPrevYear = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12] // Mar-Dec
        coveredMonthsCurrentYear = [1, 2]                           // Jan-Feb
    }

    const coveredMonthlyPeriods = await (prisma as any).payrollPeriod.findMany({
        where: {
            companyId,
            type: "MENSUAL",
            status: { in: ["PROCESSED", "CLOSED"] },
            OR: [
                { year: coverYear - 1, month: { in: coveredMonthsPrevYear } },
                { year: coverYear, month: { in: coveredMonthsCurrentYear } }
            ]
        },
        select: { id: true }
    })
    const coveredPeriodIds = coveredMonthlyPeriods.map((p: any) => p.id)

    const employees = await (prisma as any).employee.findMany({
        where: { companyId, status: "active" }
    })

    for (const employee of employees) {
        // Sum DECIMO_CUARTO already paid in monthly payrolls
        const alreadyPaidBenefits = await (prisma as any).benefit.findMany({
            where: {
                type: "DECIMO_CUARTO",
                payrollRecord: {
                    employeeId: employee.id,
                    periodId: { in: coveredPeriodIds }
                }
            }
        })
        const alreadyPaid = alreadyPaidBenefits.reduce((sum: number, b: any) => sum + b.amount, 0)

        // 1 SBU prorated by months with active payroll records
        const monthsWorked = coveredPeriodIds.length
        const fullSbu = employee.isPartTime ? sbu * 0.5 : sbu
        const totalEntitlement = (fullSbu / 12) * monthsWorked
        const toPay = Math.max(0, totalEntitlement - alreadyPaid)

        const existing = await (prisma as any).payrollRecord.findUnique({
            where: { employeeId_periodId: { employeeId: employee.id, periodId } }
        })

        if (existing) {
            await (prisma as any).benefit.deleteMany({ where: { payrollRecordId: existing.id, earningTypeId: null } })
            await (prisma as any).benefit.create({ data: { payrollRecordId: existing.id, type: "DECIMO_CUARTO", amount: toPay } })
            await (prisma as any).payrollRecord.update({
                where: { id: existing.id },
                data: { baseSalary: 0, netSalary: toPay, totalEarnings: toPay, totalDeductions: 0 }
            })
        } else {
            await (prisma as any).payrollRecord.create({
                data: {
                    employeeId: employee.id, periodId,
                    baseSalary: 0, daysWorked: 30,
                    overtime25h: 0, overtime50h: 0, overtime100h: 0,
                    overtime25Value: 0, overtime50Value: 0, overtime100Value: 0,
                    netSalary: toPay, totalEarnings: toPay, totalDeductions: 0,
                    benefits: { create: [{ type: "DECIMO_CUARTO", amount: toPay }] }
                }
            })
        }
    }

    await (prisma as any).payrollPeriod.update({ where: { id: periodId }, data: { status: "PROCESSED" } })

    await (prisma as any).payrollAudit.create({
        data: {
            periodId,
            action: "CALCULATED",
            employeeCount: employees.length,
            userId: session?.user?.id,
            userEmail: session?.user?.email,
            details: JSON.stringify({ type: period.type, year: period.year, month: period.month })
        }
    })

    revalidatePath("/payroll")
}

export async function recalculateAllRecords(periodId: string) {
    const period = await (prisma as any).payrollPeriod.findUnique({
        where: { id: periodId },
        include: { records: { select: { id: true } } }
    })
    if (!period) throw new Error("Period not found")
    if (period.status === "CLOSED") throw new Error("Period is CLOSED")

    const session = await auth()
    const userId = session?.user?.id

    // Audit log start
    await (prisma as any).payrollAudit.create({
        data: {
            periodId,
            action: "RECALCULATED",
            employeeCount: period.records.length,
            userId: userId,
            userEmail: session?.user?.email,
            details: JSON.stringify({ type: period.type, year: period.year, month: period.month })
        }
    })

    for (const r of period.records) {
        await recalculateRecord(r.id)
    }
    revalidatePath("/payroll")
}

export async function closePayrollPeriod(id: string) {
    // Fetch period with company settings
    const period = await (prisma as any).payrollPeriod.findUnique({
        where: { id },
        include: {
            company: true,
            records: {
                include: {
                    employee: true,
                    benefits: { include: { earningType: true } },
                    deductions: { include: { deductionType: true } }
                }
            }
        }
    })

    if (!period) throw new Error("Period not found")
    if (period.status === "CLOSED") throw new Error("Period already closed")

    const session = await auth()
    const userId = session?.user?.id

    await prisma.$transaction([
        (prisma as any).payrollPeriod.update({
            where: { id },
            data: { 
                status: "CLOSED",
                closedAt: new Date(),
                closedById: userId
            }
        }),
        (prisma as any).payrollAudit.create({
            data: {
                periodId: id,
                action: "CLOSED",
                employeeCount: period.records.length,
                userId: userId,
                userEmail: session?.user?.email,
                details: JSON.stringify({ type: period.type, year: period.year, month: period.month })
            }
        })
    ])

    const company = period.company as any;
    if (company.sendPayrollEmail && company.emailFrom && company.emailPassword && company.emailHost) {
        const transporter = nodemailer.createTransport({
            host: company.emailHost,
            port: company.emailPort || 587,
            secure: false,
            auth: {
                user: company.emailFrom,
                pass: company.emailPassword,
            },
        });

        const periodName = `${period.month}/${period.year} - ${period.type}`;

        for (const record of period.records) {
            const employee = record.employee as any;
            if (employee.email) {
                try {
                    const pdfBuffer = await generatePayslipPDF(record, company, periodName, employee);
                    
                    await transporter.sendMail({
                        from: company.emailFrom,
                        to: employee.email,
                        subject: `Rol de Pagos - ${periodName}`,
                        text: `Hola ${employee.firstName},\n\nAdjunto encontraras tu rol de pagos correspondiente al periodo ${periodName}.\n\nSaludos,\n${company.name}`,
                        attachments: [
                            {
                                filename: `Rol_${employee.firstName}_${periodName.replace('/', '-')}.pdf`,
                                content: Buffer.from(pdfBuffer),
                            },
                        ],
                    });
                } catch (error) {
                    console.error(`Failed to send email to ${employee.email}:`, error);
                }
            }
        }
    }

    revalidatePath("/payroll")
}

async function checkPeriodStatus(recordId: string) {
    const record = await (prisma as any).payrollRecord.findUnique({
        where: { id: recordId },
        include: { period: true }
    })
    if (record?.period.status === "CLOSED") {
        throw new Error("This payroll period is CLOSED and cannot be modified.")
    }
}

export async function recalculateRecord(recordId: string) {
    await checkPeriodStatus(recordId)
    const record = await (prisma as any).payrollRecord.findUnique({
        where: { id: recordId },
        include: {
            employee: true,
            benefits: { include: { earningType: true } },
            deductions: { include: { deductionType: true } }
        }
    })

    if (!record) throw new Error("Record not found")

    const additionalEarnings = (record as any).benefits
        .filter((b: any) => b.earningType)
        .map((b: any) => ({
            amount: b.amount,
            isTaxable: b.earningType!.isTaxable,
            isIessable: b.earningType!.isIessable
        }))

    const additionalDeductions = (record as any).deductions
        .filter((d: any) => d.deductionType)
        .map((d: any) => ({
            amount: d.amount
        }))

    const calc = calculateMonthlyPayroll(
        (record as any).employee.salary,
        (record as any).employee.accumulateDecimos,
        (record as any).employee.accumulateReserveFund,
        (record as any).overtime25h,
        (record as any).overtime50h,
        (record as any).overtime100h,
        additionalEarnings,
        additionalDeductions,
        (record as any).employee.isPartTime,
        (record as any).daysWorked
    )

    await prisma.$transaction([
        (prisma as any).payrollRecord.update({
            where: { id: recordId },
            data: {
                overtime25Value: calc.overtime25Value,
                overtime50Value: calc.overtime50Value,
                overtime100Value: calc.overtime100Value,
                netSalary: calc.netSalary,
                totalEarnings: calc.totalEarnings,
                totalDeductions: calc.totalDeductions,
            }
        }),
        (prisma as any).benefit.deleteMany({
            where: { payrollRecordId: recordId, earningTypeId: null }
        }),
        (prisma as any).deduction.deleteMany({
            where: { payrollRecordId: recordId, deductionTypeId: null }
        }),
        (prisma as any).benefit.createMany({
            data: [
                { payrollRecordId: recordId, type: "DECIMO_TERCERO", amount: calc.decimoTercero },
                { payrollRecordId: recordId, type: "DECIMO_CUARTO", amount: calc.decimoCuarto },
                { payrollRecordId: recordId, type: "FONDO_RESERVA", amount: calc.reserveFund },
            ]
        }),
        (prisma as any).deduction.createMany({
            data: [
                { payrollRecordId: recordId, type: "IESS_PERSONAL", amount: calc.iessDeduction },
                { payrollRecordId: recordId, type: "INCOME_TAX", amount: calc.incomeTax }
            ]
        })
    ])
}

export async function updatePayrollRecordOvertime(recordId: string, overtime25h: number, overtime50h: number, overtime100h: number) {
    await checkPeriodStatus(recordId)
    await (prisma as any).payrollRecord.update({
        where: { id: recordId },
        data: { overtime25h, overtime50h, overtime100h }
    })

    await recalculateRecord(recordId)
    revalidatePath("/payroll")
}

export async function updatePayrollRecordDays(recordId: string, daysWorked: number) {
    await checkPeriodStatus(recordId)
    await (prisma as any).payrollRecord.update({
        where: { id: recordId },
        data: { daysWorked }
    })

    await recalculateRecord(recordId)
    revalidatePath("/payroll")
}

export async function addAdditionalEarning(recordId: string, typeId: string, amount: number, description?: string) {
    await checkPeriodStatus(recordId)
    await (prisma as any).benefit.create({
        data: {
            payrollRecordId: recordId,
            type: "ADDITIONAL",
            amount,
            description,
            earningTypeId: typeId
        }
    })
    await recalculateRecord(recordId)
    revalidatePath("/payroll")
}

export async function removeAdditionalEarning(recordId: string, earningId: string) {
    await checkPeriodStatus(recordId)
    await (prisma as any).benefit.delete({
        where: { id: earningId }
    })
    await recalculateRecord(recordId)
    revalidatePath("/payroll")
}

export async function addAdditionalDeduction(recordId: string, typeId: string, amount: number, description?: string) {
    await checkPeriodStatus(recordId)
    await (prisma as any).deduction.create({
        data: {
            payrollRecordId: recordId,
            type: "ADDITIONAL",
            amount,
            description,
            deductionTypeId: typeId
        }
    })
    await recalculateRecord(recordId)
    revalidatePath("/payroll")
}

export async function removeAdditionalDeduction(recordId: string, deductionId: string) {
    await checkPeriodStatus(recordId)
    await (prisma as any).deduction.delete({
        where: { id: deductionId }
    })
    await recalculateRecord(recordId)
    revalidatePath("/payroll")
}

export async function uploadBulkValues(periodId: string, data: { identification: string, value: number }[], type: string, typeId: string) {
    const session = await auth()
    const companyId = session?.user?.companyId
    if (!companyId) return { success: false, message: 'No company' }

    const period = await (prisma as any).payrollPeriod.findUnique({ where: { id: periodId } })
    if (!period || period.status !== 'DRAFT') return { success: false, message: 'Periodo no válido o cerrado' }

    const identifications = data.map(d => d.identification)
    
    const employees = await (prisma as any).employee.findMany({
        where: { 
            companyId,
            identification: { in: identifications }
        },
        include: {
            payrollRecords: {
                where: { periodId }
            }
        }
    })

    let updateCount = 0
    
    for (const empData of data) {
        const employee = employees.find((e: any) => e.identification === empData.identification)
        if (employee && employee.payrollRecords.length > 0) {
            const record = employee.payrollRecords[0]
            
            if (type === 'earning') {
                // Create or update benefit
                // Check if exists
                const existing = await (prisma as any).benefit.findFirst({
                    where: { payrollRecordId: record.id, earningTypeId: typeId }
                })

                if (existing) {
                    await (prisma as any).benefit.update({
                        where: { id: existing.id },
                        data: { amount: empData.value }
                    })
                } else {
                    await (prisma as any).benefit.create({
                        data: {
                            payrollRecordId: record.id,
                            type: 'OTHER',
                            amount: empData.value,
                            earningTypeId: typeId
                        }
                    })
                }
                updateCount++

            } else if (type === 'deduction') {
                const existing = await (prisma as any).deduction.findFirst({
                    where: { payrollRecordId: record.id, deductionTypeId: typeId }
                })

                if (existing) {
                    await (prisma as any).deduction.update({
                        where: { id: existing.id },
                        data: { amount: empData.value }
                    })
                } else {
                    await (prisma as any).deduction.create({
                        data: {
                            payrollRecordId: record.id,
                            type: 'OTHER',
                            amount: empData.value,
                            deductionTypeId: typeId
                        }
                    })
                }
                updateCount++
            }
        }
    }
    
    // Recalculate totals for affected records
    if (updateCount > 0) {
        await recalculateAllRecords(periodId)
    }
    
    return { success: true, count: updateCount }
}
