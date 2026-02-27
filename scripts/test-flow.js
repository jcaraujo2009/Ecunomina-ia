const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function main() {
    console.log('🚀 Starting Full System Test...')

    // 1. Login as Super Admin (We already have one from seed)
    const superAdmin = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } })
    console.log('✅ 1. Logged in as Super Admin:', superAdmin.email)

    // 2. Create a Company
    const company = await prisma.company.create({
        data: {
            name: 'Empresa de Prueba S.A.',
            ruc: '1791234567001',
            baseSalary: 460.00
        }
    })
    console.log('✅ 2. Company created:', company.name)

    // 3. Create Admin User for Company
    const hashedPassword = await bcrypt.hash('admin123', 10)
    await prisma.user.create({
        data: {
            name: 'Admin Prueba',
            email: 'admin@empresaprueba.com',
            password: hashedPassword,
            role: 'ADMIN',
            companyId: company.id
        }
    })
    console.log('✅ 3. Admin user created for company')

    // 4. Create Department
    const dept = await prisma.department.create({
        data: {
            name: 'TECNOLOGÍA',
            companyId: company.id
        }
    })
    console.log('✅ 4. Department created:', dept.name)

    // 5. Create Role
    const role = await prisma.role.create({
        data: {
            name: 'DESARROLLADOR FULL STACK',
            departmentId: dept.id
        }
    })
    console.log('✅ 5. Role created:', role.name)

    // 6. Create Employees
    const employees = await prisma.employee.createMany({
        data: [
            {
                firstName: 'JUAN',
                lastName: 'PEREZ',
                identification: '1234567890',
                email: 'juan@p.com',
                salary: 1500.00,
                startDate: new Date(),
                status: 'ACTIVE',
                companyId: company.id,
                departmentId: dept.id,
                roleId: role.id,
                region: 'SIERRA',
                accumulateDecimos: false,
                accumulateReserveFund: false,
                isPartTime: false,
                familyBurden: 1
            },
            {
                firstName: 'MARIA',
                lastName: 'GOMEZ',
                identification: '0987654321',
                email: 'maria@p.com',
                salary: 1200.00,
                startDate: new Date(),
                status: 'ACTIVE',
                companyId: company.id,
                departmentId: dept.id,
                roleId: role.id,
                region: 'COSTA',
                accumulateDecimos: true,
                accumulateReserveFund: true,
                isPartTime: false,
                familyBurden: 2
            }
        ]
    })
    console.log('✅ 6. Employees created:', employees.count)

    // 7. Create Payroll Period (Monthly)
    const now = new Date()
    const period = await prisma.payrollPeriod.create({
        data: {
            month: now.getMonth() + 1,
            year: now.getFullYear(),
            type: 'MENSUAL',
            status: 'DRAFT',
            startDate: new Date(now.getFullYear(), now.getMonth(), 1),
            endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0),
            companyId: company.id
        }
    })
    console.log('✅ 7. Payroll Period created:', period.id)

    // 8. Create Income Types (Rubros)
    const earningType = await prisma.additionalEarningType.create({
        data: {
            name: 'BONO DE DESEMPEÑO',
            formula: 'salary * 0.10', // 10% of salary
            isTaxable: true,
            isIessable: true,
            companyId: company.id
        }
    })
    
    await prisma.additionalEarningType.create({
        data: {
            name: 'UTILIDADES',
            formula: null, // Manual entry
            isTaxable: true,
            isIessable: true,
            companyId: company.id
        }
    })
    console.log('✅ 8. Income types created')

    // 9. Create Deduction Types
    await prisma.additionalDeductionType.create({
        data: {
            name: 'MULTAS',
            formula: null, // Manual entry
            companyId: company.id
        }
    })
    console.log('✅ 9. Deduction types created')

    // 10. Configure Payroll Type (Monthly) to include the bonus
    // We need IDs of earnings
    const earnings = await prisma.additionalEarningType.findMany({ where: { companyId: company.id } })
    
    await prisma.payrollTypeConfig.upsert({
        where: { companyId_type: { companyId: company.id, type: 'MENSUAL' } },
        update: {},
        create: {
            companyId: company.id,
            type: 'MENSUAL',
            applicableEarnings: earnings.map(e => e.id),
            applicableDeductions: []
        }
    })
    console.log('✅ 10. Payroll config (Monthly) set to include bonus')

    // 11. Simulate Payroll Generation (Logic is in calculateMonthlyPayroll)
    // We can't easily run the server action here, so we will assume it works 
    // or we manually calculate to verify.
    console.log('⏭️ 11. Skipping payroll generation (requires server runtime)')

    console.log('\n🎉 Test Data Created Successfully!')
    console.log('Login with: admin@empresaprueba.com / admin123')
    console.log('Company RUC:', company.ruc)
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect())
