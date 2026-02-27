export const ECUADOR_CONSTANTS = {
    SBU_2025: 470.00,
    IESS_PERSONAL_PERCENT: 9.45,
    IESS_EMPLOYER_PERCENT: 11.15,
    RESERVE_FUND_PERCENT: 8.33,
};

// Brackets for 2025 Income Tax (yearly) - Based on SRI official table
const INCOME_TAX_BRACKETS_2025 = [
    { lowerLimit: 0, basicTax: 0, percent: 0 },
    { lowerLimit: 11902, basicTax: 0, percent: 5 },
    { lowerLimit: 15159, basicTax: 162.85, percent: 10 },
    { lowerLimit: 18473, basicTax: 494.25, percent: 12 },
    { lowerLimit: 22223, basicTax: 944.25, percent: 15 },
    { lowerLimit: 27150, basicTax: 1683.30, percent: 20 },
    { lowerLimit: 34327, basicTax: 3118.70, percent: 25 },
    { lowerLimit: 45017, basicTax: 5791.20, percent: 30 },
    { lowerLimit: 59317, basicTax: 10081.20, percent: 35 },
    { lowerLimit: 80894, basicTax: 17633.15, percent: 37 },
];

export interface AdditionalEarningParam {
    id: string;
    formula: string | null;
    defaultValue?: number;
    isTaxable: boolean;
    isIessable: boolean;
}

export interface AdditionalDeductionParam {
    id: string;
    formula: string | null;
    defaultValue?: number;
}

export function evaluateFormula(formula: string | null, context: Record<string, number>): number {
    if (!formula) return 0;
    
    try {
        const sanitized = formula.replace(/[^a-zA-Z0-9+\-*/.()% ]/g, '');
        let expression = sanitized;
        
        for (const [key, value] of Object.entries(context)) {
            const safeKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`\\b${safeKey}\\b`, 'g');
            expression = expression.replace(regex, String(value));
        }

        const result = new Function('return ' + expression)();
        return Number(result) || 0;
    } catch (error) {
        console.error("Error evaluating formula:", formula, error);
        return 0;
    }
}
export interface TaxBracket {
    minLimit: number;
    maxLimit: number | null;
    baseTax: number;
    percentage: number;
}

export interface FamilyBurdenReduction {
    dependentCount: number;
    maxReduction: number;
    taxReductionPercentage: number;
}

export interface PayrollCalculationResult {
    baseSalary: number;
    overtime25h: number;
    overtime50h: number;
    overtime100h: number;
    overtime25Value: number;
    overtime50Value: number;
    overtime100Value: number;
    additionalEarningsTotal: number;
    additionalDeductionsTotal: number;
    iessDeduction: number;
    incomeTax: number;
    decimoTercero: number;
    decimoCuarto: number;
    reserveFund: number;
    totalEarnings: number;
    totalDeductions: number;
    netSalary: number;
}

function calculateAnnualIncomeTax(annualTaxableIncome: number, brackets: TaxBracket[], familyBurdenReduction?: FamilyBurdenReduction | null): number {
    let tax = 0;
    // Find the applicable bracket
    // Sort brackets just in case
    const sortedBrackets = [...brackets].sort((a, b) => a.minLimit - b.minLimit);

    for (const bracket of sortedBrackets) {
        if (annualTaxableIncome >= bracket.minLimit) {
            const limit = bracket.maxLimit ?? Infinity;
            if (annualTaxableIncome <= limit) {
                const excess = annualTaxableIncome - bracket.minLimit;
                tax = bracket.baseTax + (excess * (bracket.percentage / 100));
                break;
            }
        }
    }
    
    // Apply reduction based on family burden if exists
    if (familyBurdenReduction) {
        const burdenReduction = tax * (familyBurdenReduction.taxReductionPercentage / 100);
        // The reduction cannot exceed the max allowed for this burden count
        const finalReduction = Math.min(burdenReduction, familyBurdenReduction.maxReduction);
        tax = tax - finalReduction;
    }
    
    return tax < 0 ? 0 : tax;
}

/**
 * Calculates monthly payroll components for an employee in Ecuador.
 */
// Default Brackets for 2025
const DEFAULT_TAX_BRACKETS: TaxBracket[] = [
    { minLimit: 0, maxLimit: 11902, baseTax: 0, percentage: 0 },
    { minLimit: 11902, maxLimit: 15159, baseTax: 0, percentage: 5 },
    { minLimit: 15159, maxLimit: 18473, baseTax: 162.85, percentage: 10 },
    { minLimit: 18473, maxLimit: 22223, baseTax: 494.25, percentage: 12 },
    { minLimit: 22223, maxLimit: 27150, baseTax: 944.25, percentage: 15 },
    { minLimit: 27150, maxLimit: 34327, baseTax: 1683.30, percentage: 20 },
    { minLimit: 34327, maxLimit: 45017, baseTax: 3118.70, percentage: 25 },
    { minLimit: 45017, maxLimit: 59317, baseTax: 5791.20, percentage: 30 },
    { minLimit: 59317, maxLimit: 80894, baseTax: 10081.20, percentage: 35 },
    { minLimit: 80894, maxLimit: null, baseTax: 17633.15, percentage: 37 },
];

export function calculateMonthlyPayroll(
    monthlySalary: number,
    accumulateDecimos: boolean = false,
    accumulateReserveFund: boolean = false,
    overtime25h: number = 0,
    overtime50h: number = 0,
    overtime100h: number = 0,
    additionalEarnings: AdditionalEarningParam[] = [],
    additionalDeductions: AdditionalDeductionParam[] = [],
    isPartTime: boolean = false,
    daysWorked: number = 30,
    baseSalarySBU: number = ECUADOR_CONSTANTS.SBU_2025,
    taxBrackets: TaxBracket[] = DEFAULT_TAX_BRACKETS,
    familyBurden: number = 0,
    familyBurdenReductions: FamilyBurdenReduction[] = []
): PayrollCalculationResult {
    const proRatedSalary = (monthlySalary / 30) * daysWorked;
    const hourlyRate = proRatedSalary / 240;

    const overtime25Value = hourlyRate * 0.25 * overtime25h;
    const overtime50Value = hourlyRate * 1.5 * overtime50h;
    const overtime100Value = hourlyRate * 2.0 * overtime100h;
    const totalOvertime = overtime25Value + overtime50Value + overtime100Value;

    // Contexto para evaluar fórmulas
    const formulaContext = {
        salary: monthlySalary,
        baseSalary: proRatedSalary,
        daysWorked,
        overtime25: overtime25h,
        overtime50: overtime50h,
        overtime100: overtime100h,
        overtimeValue: totalOvertime,
        iess: 0 // Se calculará después
    };

    // Calcular ingresos adicionales
    const calculatedEarnings = additionalEarnings.map(e => {
        let amount = 0;
        if (e.formula) {
            amount = evaluateFormula(e.formula, formulaContext);
        } else if (e.defaultValue !== undefined) {
            amount = e.defaultValue;
        }
        return { ...e, amount };
    });

    const additionalEarningsTotal = calculatedEarnings.reduce((acc, curr) => acc + curr.amount, 0);

    // Calcular deducciones adicionales
    // Actualizar contexto con el IESS calculado hasta ahora para que las fórmulas puedan usarlo si quieren (ej. otros descuentos sobre el neto)
    // En realidad el IESS se calcula sobre el base, pero pongámoslo aquí para referencia
    formulaContext.iess = 0; 

    const calculatedDeductions = additionalDeductions.map(d => {
        let amount = 0;
        if (d.formula) {
            amount = evaluateFormula(d.formula, formulaContext);
        } else if (d.defaultValue !== undefined) {
            amount = d.defaultValue;
        }
        return { ...d, amount };
    });

    const additionalDeductionsTotal = calculatedDeductions.reduce((acc, curr) => acc + curr.amount, 0);

    const iessableAdditional = calculatedEarnings.filter(e => e.isIessable).reduce((acc, curr) => acc + curr.amount, 0);
    const taxableAdditional = calculatedEarnings.filter(e => e.isTaxable).reduce((acc, curr) => acc + curr.amount, 0);

    const baseForIess = proRatedSalary + totalOvertime + iessableAdditional;
    const iessDeduction = (baseForIess * ECUADOR_CONSTANTS.IESS_PERSONAL_PERCENT) / 100;

    // Income Tax Calculation
    const baseForTax = proRatedSalary + totalOvertime + taxableAdditional;
    const annualTaxableIncome = (baseForTax * 12) - (iessDeduction * 12);
    
    // Find applicable family burden reduction
    const applicableReduction = familyBurdenReductions.find(r => r.dependentCount === familyBurden);
    
    const annualIncomeTax = calculateAnnualIncomeTax(annualTaxableIncome, taxBrackets, applicableReduction || null);
    const monthlyIncomeTax = annualIncomeTax / 12;

    let decimoTercero = 0;
    let decimoCuarto = 0;
    let reserveFund = 0;

    // Base for benefits includes all IESSable income
    const baseForBenefits = baseForIess;

    // If NOT accumulating, they receive it monthly
    if (!accumulateDecimos) {
        decimoTercero = baseForBenefits / 12;
        // Decimo cuarto is proportional to hours. Part-time is 50% by default.
        const fullTimeDecimoCuarto = baseSalarySBU / 12;
        decimoCuarto = isPartTime ? fullTimeDecimoCuarto * 0.5 : fullTimeDecimoCuarto;
    }

    if (!accumulateReserveFund) {
        reserveFund = (baseForBenefits * ECUADOR_CONSTANTS.RESERVE_FUND_PERCENT) / 100;
    }

    const totalEarnings = baseForBenefits + calculatedEarnings.filter(e => !e.isIessable).reduce((acc, curr) => acc + curr.amount, 0) + decimoTercero + decimoCuarto + reserveFund;
    const totalDeductions = iessDeduction + monthlyIncomeTax + additionalDeductionsTotal;
    const netSalary = totalEarnings - totalDeductions;

    return {
        baseSalary: proRatedSalary,
        overtime25h,
        overtime50h,
        overtime100h,
        overtime25Value,
        overtime50Value,
        overtime100Value,
        additionalEarningsTotal,
        additionalDeductionsTotal,
        iessDeduction,
        incomeTax: monthlyIncomeTax,
        decimoTercero,
        decimoCuarto,
        reserveFund,
        totalEarnings,
        totalDeductions,
        netSalary,
    };
}
