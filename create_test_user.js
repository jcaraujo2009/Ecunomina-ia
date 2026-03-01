const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function main() {
  const password = 'test123'
  const hashedPassword = await bcrypt.hash(password, 10)

  // Create a company first if not exists
  let company = await prisma.company.findUnique({ where: { ruc: '9999999999001' }})
  
  if (!company) {
      company = await prisma.company.create({
          data: {
              name: 'EMPRESA TEST',
              ruc: '9999999999001',
              baseSalary: 460
          }
      })
  }

  const user = await prisma.user.upsert({
      where: { email: 'test@ecunomina.com' },
      update: {},
      create: {
          email: 'test@ecunomina.com',
          name: 'Usuario Test',
          password: hashedPassword,
          role: 'USER',
          companyId: company.id
      },
  })
  console.log({ user })
}

main()
  .finally(async () => await prisma.$disconnect())
