import jsPDF from 'jspdf';
import type { Invoice } from '@/lib/data/invoices';
import type { RecentPayment } from '@/lib/data/pilgrims';
import type { Season } from '@/lib/data/seasons';

function drawDocument(title: string, subtitle: string, rows: [string, string][], totalLabel: string, totalValue: string) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });

  doc.setFontSize(16);
  doc.setTextColor(31, 27, 22);
  doc.text('ManasikPro', 40, 50);
  doc.setFontSize(11);
  doc.setTextColor(107, 101, 96);
  doc.text(title, 40, 68);
  doc.text(subtitle, 40, 84);

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
    'ManasikPro Hajj Campaign',
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
    'ManasikPro Hajj Campaign',
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

export function downloadSeasonSummaryPdf(season: Season) {
  const s = season.stats;
  const doc = drawDocument(
    'Season Summary',
    `${season.name} — started ${season.startDate}`,
    [
      ['Season', season.name],
      ['Start date', season.startDate],
      ['Archived on', season.archivedAt ? season.archivedAt.slice(0, 10) : '—'],
      ['Total pilgrims', String(s?.totalPilgrims ?? 0)],
      ['Groups', String(s?.totalGroups ?? 0)],
      ['Invoices issued', String(s?.totalInvoices ?? 0)],
      ['Revenue collected', `SAR ${(s?.totalRevenue ?? 0).toLocaleString()}`],
      ['Total expenses', `SAR ${(s?.totalExpenses ?? 0).toLocaleString()}`],
    ],
    'Net Profit',
    `SAR ${(s?.netProfit ?? 0).toLocaleString()}`
  );
  doc.save(`${season.name.replace(/\s+/g, '-')}-summary.pdf`);
}
