import { NextResponse } from 'next/server';
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await auth();
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    try {
        const audits = await prisma.payrollAudit.findMany({
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                period: {
                    include: {
                        company: true
                    }
                }
            }
        })

        return NextResponse.json(audits)
    } catch (error) {
        console.error("Error fetching audits:", error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
