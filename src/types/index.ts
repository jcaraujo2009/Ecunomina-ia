export enum UserRole {
    USER = "USER",
    ADMIN = "ADMIN",
    SUPER_ADMIN = "SUPER_ADMIN",
}

export enum Region {
    SIERRA = "SIERRA",
    COSTA = "COSTA",
    ORIENTE = "ORIENTE",
}

export enum EmployeeStatus {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    SUSPENDED = "SUSPENDED",
}

export enum PayrollPeriodStatus {
    DRAFT = "DRAFT",
    PROCESSED = "PROCESSED",
    CLOSED = "CLOSED",
}

export enum PayrollPeriodType {
    MENSUAL = "MENSUAL",
    DECIMO_TERCERO = "DECIMO_TERCERO",
    DECIMO_CUARTO_SIERRA = "DECIMO_CUARTO_SIERRA",
    DECIMO_CUARTO_COSTA = "DECIMO_CUARTO_COSTA",
}

export enum BenefitType {
    DECIMO_TERCERO = "DECIMO_TERCERO",
    DECIMO_CUARTO = "DECIMO_CUARTO",
    FONDO_RESERVA = "FONDO_RESERVA",
    OTHER = "OTHER",
}

export enum DeductionType {
    IESS_PERSONAL = "IESS_PERSONAL",
    INCOME_TAX = "INCOME_TAX",
    OTHER = "OTHER",
}

export interface Employee {
    id: string;
    firstName: string;
    lastName: string;
    identification: string;
    email: string | null;
    roleId: string;
    role: Role;
    departmentId: string;
    department: Department;
    salary: number;
    startDate: Date;
    status: EmployeeStatus;
    region: Region;
    accumulateDecimos: boolean;
    accumulateReserveFund: boolean;
    isPartTime: boolean;
    familyBurden: number;
}

export interface PayrollPeriod {
    id: string;
    month: number;
    year: number;
    status: PayrollPeriodStatus;
    type: PayrollPeriodType;
    startDate: Date;
    endDate: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface PayrollRecord {
    id: string;
    employeeId: string;
    periodId: string;
    baseSalary: number;
    daysWorked: number;
    overtime25h: number;
    overtime50h: number;
    overtime100h: number;
    overtime25Value: number;
    overtime50Value: number;
    overtime100Value: number;
    netSalary: number;
    totalEarnings: number;
    totalDeductions: number;
    employee?: Employee;
    benefits: Benefit[];
    deductions: Deduction[];
}

export interface Benefit {
    id: string;
    type: BenefitType;
    amount: number;
    description: string | null;
    earningType?: { name: string } | null;
}

export interface Deduction {
    id: string;
    type: DeductionType;
    amount: number;
    description: string | null;
    deductionType?: { name: string } | null;
}

export interface Company {
    id: string;
    name: string;
    ruc: string;
    address: string | null;
    phone: string | null;
    logo: string | null;
    baseSalary: number;
}

export interface Department {
    id: string;
    name: string;
    description: string | null;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface Role {
    id: string;
    name: string;
    description: string | null;
    departmentId: string;
    department?: Department;
    createdAt?: Date;
    updatedAt?: Date;
}
