import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { PayrollRecord, Company, Benefit, Deduction } from '@/types';

const TYPE_LABELS: Record<string, string> = {
    MENSUAL: "Nómina Mensual",
    DECIMO_TERCERO: "Décimo Tercer Sueldo",
    DECIMO_CUARTO_SIERRA: "XIV Sierra",
    DECIMO_CUARTO_COSTA: "XIV Costa",
}

function addFooter(doc: jsPDF) {
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text('Generado por Ecunomina - Sistema de Gestión de Nómina', 105, 290, { align: 'center' });
        doc.text(`Página ${i} de ${pageCount}`, 195, 290, { align: 'right' });
    }
}

export function exportPayrollToExcel(periodName: string, periodType: string | undefined, records: PayrollRecord[], company?: Company) {
    const payrollType = periodType ? (TYPE_LABELS[periodType] || periodType) : "Nómina";
    
    // Collect all unique additional categories
    const allBenefitNames = new Set<string>();
    const allDeductionNames = new Set<string>();

    records.forEach(r => {
        r.benefits.forEach((b: Benefit) => {
            const name = b.earningType?.name || b.type.replace(/_/g, ' ');
            allBenefitNames.add(name);
        });
        r.deductions.forEach((d: Deduction) => {
            const name = d.deductionType?.name || d.type.replace(/_/g, ' ');
            allDeductionNames.add(name);
        });
    });

    const benefitCols = Array.from(allBenefitNames).sort();
    const deductionCols = Array.from(allDeductionNames).sort();

    const data = records.map(r => {
        const row: Record<string, any> = {
            'Empleado': `${r.employee!.firstName} ${r.employee!.lastName}`,
            'Identificación': r.employee!.identification,
            'Sueldo Base': r.baseSalary,
            'Días Trabajados': r.daysWorked,
            'Horas Extras (Valor)': r.overtime25Value + r.overtime50Value + r.overtime100Value,
        };

        // Initialize benefit/deduction columns with 0
        benefitCols.forEach(name => row[name] = 0);
        deductionCols.forEach(name => row[name] = 0);

        // Fill data
        r.benefits.forEach((b: Benefit) => {
            const name = b.earningType?.name || b.type.replace(/_/g, ' ');
            row[name] += b.amount;
        });
        r.deductions.forEach((d: Deduction) => {
            const name = d.deductionType?.name || d.type.replace(/_/g, ' ');
            row[name] += d.amount;
        });

        row['Total Ingresos'] = r.totalEarnings;
        row['Total Egresos'] = r.totalDeductions;
        row['Neto a Recibir'] = r.netSalary;

        return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Resumen Nómina');

    const fileName = company ? `${company.name}_${payrollType}_${periodName}` : `${payrollType}_${periodName}`;
    XLSX.writeFile(workbook, `${fileName.replace(/ /g, '_')}.xlsx`);
}

export function exportPayrollToPDF(periodName: string, periodType: string | undefined, records: PayrollRecord[], company?: Company) {
    const doc = new jsPDF('landscape');
    const payrollType = periodType ? (TYPE_LABELS[periodType] || periodType) : "Nómina";

    if (company) {
        if (company.logo) {
            try {
                doc.addImage(company.logo, 'PNG', 14, 10, 30, 30);
                doc.setFontSize(20);
                doc.setTextColor(0, 51, 102);
                doc.text(company.name, 48, 20);
                doc.setFontSize(10);
                doc.setTextColor(100);
                doc.text(`RUC: ${company.ruc} | Tel: ${company.phone || ''}`, 48, 26);
                doc.text(company.address || '', 48, 31);
            } catch (e) {
                console.error("Error adding logo to PDF:", e);
                // Fallback to text if image fails
                doc.setFontSize(20);
                doc.setTextColor(0, 51, 102);
                doc.text(company.name, 14, 20);
            }
        } else {
            doc.setFontSize(20);
            doc.setTextColor(0, 51, 102);
            doc.text(company.name, 14, 20);
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`RUC: ${company.ruc} | Tel: ${company.phone || ''}`, 14, 26);
            doc.text(company.address || '', 14, 31);
        }
    }

    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text(`Resumen de ${payrollType}: ${periodName}`, 14, company ? 42 : 22);

    const startY = company ? 45 : 30;

    const headers = [['Empleado', 'Identificación', 'Sueldo', 'Días', 'Ing. Extras', 'Beneficios', 'IESS/Renta', 'Otros Desc.', 'Total Ing.', 'Total Egr.', 'Neto']];

    const rows = records.map(r => {
        const lawBenefits = r.benefits.filter((b: Benefit) => b.type !== 'OTHER').reduce((sum: number, b: Benefit) => sum + b.amount, 0);
        const iessRenta = r.deductions.filter((d: Deduction) => d.type === 'IESS_PERSONAL' || d.type === 'INCOME_TAX').reduce((sum: number, d: Deduction) => sum + d.amount, 0);
        const otherDeductions = r.deductions.filter((d: Deduction) => d.type !== 'IESS_PERSONAL' && d.type !== 'INCOME_TAX').reduce((sum: number, d: Deduction) => sum + d.amount, 0);

        return [
            `${r.employee!.firstName} ${r.employee!.lastName}`,
            r.employee!.identification,
            r.baseSalary.toFixed(2),
            r.daysWorked,
            (r.overtime25Value + r.overtime50Value + r.overtime100Value).toFixed(2),
            lawBenefits.toFixed(2),
            iessRenta.toFixed(2),
            otherDeductions.toFixed(2),
            r.totalEarnings.toFixed(2),
            r.totalDeductions.toFixed(2),
            r.netSalary.toFixed(2)
        ];
    });

    autoTable(doc, {
        head: headers,
        body: rows,
        startY: startY,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
    });

    addFooter(doc);

    const fileName = company ? `${company.name}_${payrollType}_${periodName}` : `${payrollType}_${periodName}`;
    doc.save(`${fileName.replace(/ /g, '_')}.pdf`);
}

export function generateIndividualPaySlip(employee: any, period: string, periodType: string | undefined, record: PayrollRecord, company?: Company) {
    const doc = new jsPDF();

    const payrollType = periodType ? (TYPE_LABELS[periodType] || periodType) : "Nómina";

    // Header with Company Info
    if (company) {
        if (company.logo) {
            try {
                doc.addImage(company.logo, 'PNG', 14, 10, 25, 25);
            } catch (e) {
                console.error("Error adding logo to pay slip:", e);
            }
        }
        doc.setFontSize(22);
        doc.setTextColor(0, 51, 102);
        doc.text(company.name, 105, 20, { align: 'center' });
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`RUC: ${company.ruc} | Dir: ${company.address || ''}`, 105, 26, { align: 'center' });
    } else {
        doc.setFontSize(22);
        doc.setTextColor(0, 51, 102);
        doc.text('ECUNOMINA', 105, 20, { align: 'center' });
    }

    doc.setFontSize(14);
    doc.setTextColor(0, 51, 102);
    doc.text(payrollType, 105, 35, { align: 'center' });
    doc.text(period, 105, 43, { align: 'center' });

    // Employee Info
    doc.setDrawColor(200);
    doc.line(14, 50, 196, 50);

    doc.setFontSize(10);
    doc.text(`EMPLEADO: ${employee.firstName.toUpperCase()} ${employee.lastName.toUpperCase()}`, 14, 60);
    doc.text(`ID/CÉDULA: ${employee.identification.toUpperCase()}`, 14, 67);
    doc.text(`CARGO: ${employee.role?.name?.toUpperCase() || 'UNDEFINED'}`, 14, 74);
    doc.text(`DPTO: ${employee.department?.name?.toUpperCase() || 'UNDEFINED'}`, 14, 81);

    doc.text(`FECHA INGRESO: ${format(new Date(employee.startDate), 'dd/MM/yyyy')}`, 120, 60);
    doc.text(`DÍAS TRABAJADOS: ${record.daysWorked}`, 120, 67);
    doc.text(`SUELDO NOMINAL: $${record.baseSalary.toFixed(2)}`, 120, 74);

    // Table structure
    const body: (string | number)[][] = [];

    const iessAmount = record.deductions.find((d: Deduction) => d.type === 'IESS_PERSONAL')?.amount || 0;
    const incomeTaxAmount = record.deductions.find((d: Deduction) => d.type === 'INCOME_TAX')?.amount || 0;
    const otValue = record.overtime25Value + record.overtime50Value + record.overtime100Value;

    const earnings = [
        { desc: 'SUELDO PROPORCIONAL', amount: record.baseSalary / 30 * record.daysWorked },
        { desc: 'HORAS EXTRAS', amount: otValue },
        ...record.benefits.map((b: Benefit) => ({
            desc: (b.earningType?.name || b.type.replace(/_/g, ' ')).toUpperCase(),
            amount: b.amount
        }))
    ].filter(item => item.amount > 0);

    const deductions = [
        { desc: 'APORTE IESS (9.45%)', amount: iessAmount },
        { desc: 'IMPUESTO A LA RENTA', amount: incomeTaxAmount },
        ...record.deductions.filter((d: Deduction) => d.type !== 'IESS_PERSONAL' && d.type !== 'INCOME_TAX').map((d: Deduction) => ({
            desc: (d.deductionType?.name || d.type.replace(/_/g, ' ')).toUpperCase(),
            amount: d.amount
        }))
    ].filter(item => item.amount > 0);

    const maxLength = Math.max(earnings.length, deductions.length);
    for (let i = 0; i < maxLength; i++) {
        body.push([
            earnings[i]?.desc || '',
            earnings[i] ? `$${earnings[i].amount.toFixed(2)}` : '',
            deductions[i]?.desc || '',
            deductions[i] ? `$${deductions[i].amount.toFixed(2)}` : ''
        ]);
    }

    autoTable(doc, {
        startY: 90,
        head: [['DESCRIPCIÓN INGRESOS', 'VALOR', 'DESCRIPCIÓN EGRESOS', 'VALOR']],
        body: body,
        theme: 'grid',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold' },
        columnStyles: {
            1: { halign: 'right' },
            3: { halign: 'right' }
        }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(11);
    doc.text(`TOTAL INGRESOS: $${record.totalEarnings.toFixed(2)}`, 14, finalY);
    doc.text(`TOTAL EGRESOS: $${record.totalDeductions.toFixed(2)}`, 120, finalY);

    doc.setFontSize(14);
    doc.setTextColor(0, 51, 102);
    doc.rect(14, finalY + 5, 182, 12);
    doc.text(`NETO A RECIBIR: $${record.netSalary.toFixed(2)}`, 105, finalY + 13, { align: 'center' });

    const signY = 240;
    doc.line(30, signY, 90, signY);
    doc.line(120, signY, 180, signY);
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text('RECIBÍ CONFORME', 60, signY + 5, { align: 'center' });
    doc.text('EMPRESA', 150, signY + 5, { align: 'center' });

    addFooter(doc);

    const fileName = company ? `Rol_${employee.lastName}_${company.name}_${period}` : `Rol_${employee.lastName}_${period}`;
    doc.save(`${fileName.replace(/ /g, '_')}.pdf`);
}

export function exportPayrollToIESS(periodName: string, records: PayrollRecord[], company?: Company) {
    let content = "";
    
    // Header
    // Formato:TipoReg|IdEmpresa|Periodo|ValorTotal|TotalReg
    const totalSalary = records.reduce((sum, r) => sum + r.baseSalary, 0);
    const totalIess = records.reduce((sum, r) => {
        const iess = r.deductions.find((d: Deduction) => d.type === 'IESS_PERSONAL');
        return sum + (iess?.amount || 0);
    }, 0);

    const periodStr = periodName.replace(/[^0-9]/g, ''); // Ensure it's YYYYMM
    content += `0|${company?.ruc || '0000000000001'}|${periodStr}|${totalIess.toFixed(2)}|${records.length}\n`;

    // Detail
    // Formato: 1|ID|APELLIDOS|NOMBRES|DIAS| SUELDO|BI_IESS|APORTE|EXTRAS|BONOS|OTROS
    records.forEach(r => {
        const iessDeduction = r.deductions.find((d: Deduction) => d.type === 'IESS_PERSONAL')?.amount || 0;
        
        // Calculate BI (Base Imponible IESS) - usually Salary + Extras + Bonuses (taxable)
        // For now, we use baseSalary as BI
        const bi = r.baseSalary;

        const row = [
            '1', // Type detail
            r.employee!.identification,
            r.employee!.lastName.toUpperCase(),
            r.employee!.firstName.toUpperCase(),
            r.daysWorked.toString().padStart(2, '0'),
            r.baseSalary.toFixed(2).replace('.', '').padStart(10, '0'), // Sueldo
            bi.toFixed(2).replace('.', '').padStart(10, '0'), // BI IESS
            iessDeduction.toFixed(2).replace('.', '').padStart(10, '0'), // Aporte
            r.overtime25Value.toFixed(2).replace('.', '').padStart(10, '0'), // Extras 25
            '0000000000', // Placeholder for other bonuses
            '0000000000'  // Placeholder for others
        ].join('|');
        
        content += row + '\n';
    });

    // Download file
    if (typeof window === 'undefined') return;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `IESS_${periodName.replace(/ /g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

export async function generatePayslipPDF(record: any, company: any, periodName: string, employee: any) {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text(company.name || "EMPRESA", 14, 22);
    doc.setFontSize(12);
    doc.text("RUC: " + (company.ruc || ""), 14, 30);
    doc.text("Dirección: " + (company.address || ""), 14, 36);

    doc.setFontSize(14);
    doc.text("ROLE DE PAGOS", 14, 46);
    doc.setFontSize(10);
    doc.text(`Periodo: ${periodName}`, 14, 52);
    doc.text(`Fecha de generación: ${new Date().toLocaleDateString()}`, 14, 58);

    const employeeInfo = [
        ["Empleado:", `${employee.firstName} ${employee.lastName}`],
        ["Identificación:", employee.identification],
        ["Cargo:", employee.position || "N/A"],
        ["Fecha de Ingreso:", employee.startDate ? new Date(employee.startDate).toLocaleDateString() : "N/A"]
    ];

    let yPos = 70;
    employeeInfo.forEach(([label, value]) => {
        doc.setFontSize(10);
        doc.text(label, 14, yPos);
        doc.text(value, 50, yPos);
        yPos += 7;
    });

    const earningsData = [
        ["Sueldo Base", record.baseSalary.toFixed(2)],
        ["Horas Extras", (record.overtime25Value + record.overtime50Value + record.overtime100Value).toFixed(2)],
    ];

    const benefits = Array.isArray(record.benefits) ? record.benefits : [];
    benefits.forEach((b: any) => {
        const name = b.earningType?.name || "Otro";
        earningsData.push([name, b.amount.toFixed(2)]);
    });

    const decimoTercero = benefits.find((b: any) => b.type === 'DECIMO_TERCERO')?.amount || 0;
    const decimoCuarto = benefits.find((b: any) => b.type === 'DECIMO_CUARTO')?.amount || 0;
    const fondoReserva = benefits.find((b: any) => b.type === 'FONDO_RESERVA')?.amount || 0;

    if (decimoTercero > 0) earningsData.push(["Décimo Tercer Sueldo", decimoTercero.toFixed(2)]);
    if (decimoCuarto > 0) earningsData.push(["Décimo Cuarto Sueldo", decimoCuarto.toFixed(2)]);
    if (fondoReserva > 0) earningsData.push(["Fondo de Reserva", fondoReserva.toFixed(2)]);

    const earningsTotal = record.totalEarnings;

    autoTable(doc, {
        startY: yPos + 5,
        head: [['Ingresos', 'Valor']],
        body: earningsData,
        theme: 'striped',
        foot: [['Total Ingresos', earningsTotal.toFixed(2)]],
        headStyles: { fillColor: [41, 128, 185] },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    const deductions = Array.isArray(record.deductions) ? record.deductions : [];
    
    const iessDeduction = deductions.find((d: any) => d.type === 'IESS_PERSONAL')?.amount || 0;
    const incomeTax = deductions.find((d: any) => d.type === 'INCOME_TAX')?.amount || 0;

    const deductionsData = [
        ["IESS (Aporte Personal)", iessDeduction.toFixed(2)],
        ["Impuesto a la Renta", incomeTax.toFixed(2)],
    ];

    deductions.forEach((d: any) => {
        if (d.type !== 'IESS_PERSONAL' && d.type !== 'INCOME_TAX') {
            const name = d.deductionType?.name || "Otro";
            deductionsData.push([name, d.amount.toFixed(2)]);
        }
    });

    const deductionsTotal = record.totalDeductions;

    autoTable(doc, {
        startY: yPos,
        head: [['Deducciones', 'Valor']],
        body: deductionsData,
        theme: 'striped',
        headStyles: { fillColor: [185, 41, 41] },
        foot: [['Total Deducciones', deductionsTotal.toFixed(2)]],
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("LIQUIDO A RECIBIR:", 14, yPos);
    doc.text(`$${record.netSalary.toFixed(2)}`, 80, yPos);

    addFooter(doc);

    return doc.output('arraybuffer');
}
