export interface PayrollRecord {
    id: string;
    employeeId: string;
    period: string; // YYYY-MM
    baseSalary: number;
    overtimeHours: number;
    overtimeAmount: number;
    totalIncome: number;
    iessContribution: number; // 9.45%
    thirteenthSalary: number; // 1/12 total income (if monthly)
    fourteenthSalary: number; // 1/12 SBU (if monthly)
    reserveFunds: number; // 8.33% (after 1 year)
    totalDeductions: number;
    netPay: number;
}
