import jsPDF from 'jspdf';
import type { Invoice } from '@/lib/data/invoices';
import type { RecentPayment } from '@/lib/data/pilgrims';

function drawDocument(title: string, rows: [string, string][], totalLabel: string, totalValue: string) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });

  doc.setFontSize(16);
  doc.setTextColor(31, 27, 22);
  doc.text('ManasikPro', 40, 50);
  doc.setFontSize(11);
  doc.setTextColor(107, 101, 96);
  doc.text(title, 40, 68);
  doc.text('Hajj 2027 Campaign', 40, 84);

  doc.setDrawColor(229, 225, 218);
  doc.line(40, 100, 555, 100);

  let y = 130;
  doc.setFontSize(11);
  for (const [label, value] of rows) {
    doc.setTextColor(107, 101, 96);
    doc.text(label, 40, y);
    doc.setTextColor(31, 27, 22);
    doc.text(value, 220, y);
    y += 24;
  }

  y += 10;
  doc.setDrawColor(229, 225, 218);
  doc.line(40, y, 555, y);
  y += 34;

  doc.setFontSize(15);
  doc.setTextColor(27, 107, 74);
  doc.text(`${totalLabel}: ${totalValue}`, 40, y);

  return doc;
}

export function downloadInvoicePdf(invoice: Invoice) {
  const doc = drawDocument(
    'Invoice',
    [
      ['Invoice #', invoice.invoiceNumber],
      ['Pilgrim', `${invoice.pilgrimName} (${invoice.pilgrimId})`],
      ['Description', invoice.description],
      ['Issue date', invoice.issueDate],
      ['Due date', invoice.dueDate ?? '—'],
      ['Status', invoice.status],
      ['Paid so far', `SAR ${invoice.paidAmount.toLocaleString()}`],
    ],
    'Amount',
    `SAR ${invoice.amount.toLocaleString()}`
  );
  doc.save(`${invoice.invoiceNumber}.pdf`);
}

export function downloadReceiptPdf(payment: RecentPayment) {
  const doc = drawDocument(
    payment.type === 'refund' ? 'Refund Receipt' : 'Payment Receipt',
    [
      ['Receipt #', payment.id],
      ['Pilgrim', `${payment.pilgrimName} (${payment.pilgrimId})`],
      ['Date', payment.date],
      ['Method', payment.method],
      ['Reference', payment.reference || '—'],
      ['Invoice', payment.invoiceNumber ?? '—'],
      ['Type', payment.type === 'full' ? 'Full payment' : payment.type === 'refund' ? 'Refund' : 'Installment'],
    ],
    'Amount',
    `SAR ${payment.amount.toLocaleString()}`
  );
  doc.save(`${payment.id}.pdf`);
}
