import { describe, it, expect } from 'vitest'
import { calculateMonthlyPayroll, ECUADOR_CONSTANTS } from './payroll'

describe('Payroll Calculation Engine (Ecuador 2025)', () => {

    it('calculates correct IESS deduction (9.45%)', () => {
        const result = calculateMonthlyPayroll(1000, true, true)
        // 1000 * 0.0945 = 94.50
        expect(result.iessDeduction).toBeCloseTo(94.50, 2)
    })

    it('calculates Income Tax for salary below fractional base', () => {
        // Annual: 1000 * 12 = 12000
        // IESS: 94.50 * 12 = 1134
        // Taxable: 12000 - 1134 = 10866
        // Limit 2025 for 0% is 11902. So tax should be 0.
        const result = calculateMonthlyPayroll(1000, true, true)
        expect(result.incomeTax).toBe(0)
    })

    it('calculates Income Tax for salary in higher bracket', () => {
        // High salary: 5000 monthly
        // Annual: 60000
        // IESS: 5000 * 9.45% = 472.50
        // Annual IESS: 5670
        // Taxable: 60000 - 5670 = 54330
        // Bracket: Starts at 45017 -> basicTax: 5791.20, percent: 30% on excess of 45017
        // Tax = 5791.20 + (54330 - 45017) * 0.30 = 5791.20 + 2793.9 = 8585.1
        // Monthly: 8585.1 / 12 = 715.425
        const result = calculateMonthlyPayroll(5000, true, true)
        expect(result.incomeTax).toBeCloseTo(715.43, 1)
    })

    it('includes proportionate décimos and fund when NOT accumulating', () => {
        const salary = 1200
        const result = calculateMonthlyPayroll(salary, false, false)

        // Decimo Tercero: 1200 / 12 = 100
        expect(result.decimoTercero).toBe(100)

        // Decimo Cuarto: 470 / 12 = 39.166...
        expect(result.decimoCuarto).toBeCloseTo(ECUADOR_CONSTANTS.SBU_2025 / 12, 2)

        // Reserve Fund: 1200 * 8.33% = 99.96
        expect(result.reserveFund).toBeCloseTo(salary * 0.0833, 2)

        expect(result.totalEarnings).toBeGreaterThan(salary)
    })

    it('sets benefits to zero when accumulating', () => {
        const result = calculateMonthlyPayroll(1000, true, true)
        expect(result.decimoTercero).toBe(0)
        expect(result.decimoCuarto).toBe(0)
        expect(result.reserveFund).toBe(0)
    })

    it('verifies net salary calculation', () => {
        const result = calculateMonthlyPayroll(1000, true, true)
        // Earnings = 1000
        // Deductions = 94.50 (IESS) + 0 (Tax)
        // Net = 1000 - 94.50 = 905.50
        expect(result.netSalary).toBeCloseTo(905.50, 2)
    })
})
