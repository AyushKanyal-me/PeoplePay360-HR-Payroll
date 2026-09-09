import PDFDocument from 'pdfkit';

export interface PayslipPdfData {
  company: {
    name: string;
    currency: string;
    tax_id?: string | null;
  };
  employee: {
    id: string;
    first_name: string;
    last_name: string;
    work_email: string;
    department?: string | null;
    job_position?: string | null;
    bank_account_number?: string | null;
  };
  payslip: {
    id: string;
    period_start: string;
    period_end: string;
    worked_days: number | null;
    worked_hours: number | null;
    gross_salary: number;
    total_deductions: number;
    net_salary: number;
    generated_at: string | null;
  };
  items: {
    name: string;
    code: string;
    category: string;
    amount: number;
  }[];
}

export function generatePayslipPdfBuffer(data: PayslipPdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      // --- Header ---
      doc.fontSize(20).font('Helvetica-Bold').text(data.company.name.toUpperCase(), { align: 'center' });
      doc.fontSize(10).font('Helvetica').text('SALARY PAYSLIP & EARNINGS STATEMENT', { align: 'center' });
      doc.moveDown(1);
      doc.strokeColor('#cccccc').lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(1);

      // --- Employee & Period Details Grid ---
      const topY = doc.y;
      doc.fontSize(9).font('Helvetica-Bold').text('EMPLOYEE DETAILS', 50, topY);
      doc.font('Helvetica')
        .text(`Name: ${data.employee.first_name} ${data.employee.last_name}`, 50, topY + 15)
        .text(`Email: ${data.employee.work_email}`, 50, topY + 30)
        .text(`Position: ${data.employee.job_position || 'N/A'}`, 50, topY + 45)
        .text(`Department: ${data.employee.department || 'N/A'}`, 50, topY + 60)
        .text(`Bank A/C: ${data.employee.bank_account_number || 'N/A'}`, 50, topY + 75);

      doc.font('Helvetica-Bold').text('PAYROLL PERIOD', 320, topY);
      doc.font('Helvetica')
        .text(`Period Start: ${data.payslip.period_start}`, 320, topY + 15)
        .text(`Period End: ${data.payslip.period_end}`, 320, topY + 30)
        .text(`Worked Days: ${data.payslip.worked_days ?? 'N/A'}`, 320, topY + 45)
        .text(`Worked Hours: ${data.payslip.worked_hours ?? 'N/A'}`, 320, topY + 60)
        .text(`Currency: ${data.company.currency}`, 320, topY + 75);

      doc.y = topY + 105;
      doc.strokeColor('#cccccc').lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(1);

      // --- Line Items Breakdown ---
      doc.fontSize(10).font('Helvetica-Bold').text('SALARY COMPUTATION BREAKDOWN', 50, doc.y);
      doc.moveDown(0.5);

      // Table Header
      const tableTop = doc.y;
      doc.fontSize(9).font('Helvetica-Bold')
        .text('Rule Component', 50, tableTop)
        .text('Code', 220, tableTop)
        .text('Category', 320, tableTop)
        .text('Amount (' + data.company.currency + ')', 440, tableTop, { align: 'right' });

      doc.strokeColor('#333333').lineWidth(1).moveTo(50, tableTop + 15).lineTo(545, tableTop + 15).stroke();

      let currentY = tableTop + 22;
      doc.font('Helvetica');

      for (const item of data.items) {
        if (item.category === 'GROSS' || item.category === 'NET') continue; // summary lines shown at bottom
        doc.fontSize(9)
          .text(item.name, 50, currentY)
          .text(item.code, 220, currentY)
          .text(item.category, 320, currentY)
          .text(item.amount.toFixed(2), 440, currentY, { align: 'right' });

        currentY += 18;
      }

      doc.strokeColor('#cccccc').lineWidth(1).moveTo(50, currentY).lineTo(545, currentY).stroke();
      currentY += 10;

      // --- Totals Section ---
      doc.font('Helvetica-Bold')
        .text('Total Gross Salary:', 300, currentY)
        .text(`${data.company.currency} ${data.payslip.gross_salary.toFixed(2)}`, 440, currentY, { align: 'right' });

      currentY += 16;
      doc.text('Total Deductions:', 300, currentY)
        .text(`${data.company.currency} ${data.payslip.total_deductions.toFixed(2)}`, 440, currentY, { align: 'right' });

      currentY += 18;
      doc.strokeColor('#333333').lineWidth(1.5).moveTo(300, currentY).lineTo(545, currentY).stroke();
      currentY += 6;

      doc.fontSize(11).font('Helvetica-Bold')
        .text('NET PAYABLE SALARY:', 300, currentY)
        .text(`${data.company.currency} ${data.payslip.net_salary.toFixed(2)}`, 440, currentY, { align: 'right' });

      // Footer
      doc.fontSize(8).font('Helvetica').text(
        `This is a system-generated payslip generated on ${data.payslip.generated_at || new Date().toISOString()}. No signature required.`,
        50,
        750,
        { align: 'center', width: 495 }
      );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
