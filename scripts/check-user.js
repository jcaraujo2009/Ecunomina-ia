const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

async function check() {
    const users = await p.user.findMany({ 
        where: { email: 'admin@empresaprueba.com' },
        select: { id: true, name: true, companyId: true, role: true }
    })
    console.log(JSON.stringify(users, null, 2))
    await p.$disconnect()
}

check()
