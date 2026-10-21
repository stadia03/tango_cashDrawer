import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { DailyDrawer, DrawerTransaction, CouchPayment, CashDrawerSummary } from '../types';
import { formatINR, r2 } from '../utils/currency';
import { formatDisplayDate, formatDateTime, formatTime } from '../utils/dates';
import { DEFAULT_STAFF_NAME } from './storage.service';

const HOTEL_NAME = import.meta.env.VITE_HOTEL_NAME || 'Waves Hotel & Resorts - Port Blair';

/**
 * Generates a clean, professional Date Range Cash Drawer Report in PDF format
 */
export function generateDateRangePdfReport(
  fromDate: string,
  toDate: string,
  drawersList: DailyDrawer[],
  transactionsList: DrawerTransaction[],
  posPaymentsByDate: Record<string, CouchPayment[]> = {}
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const drawersMap: Record<string, DailyDrawer> = {};
  drawersList.forEach(dr => {
    drawersMap[dr.date] = dr;
  });

  const rangeTxns = transactionsList.filter(t => t.date >= fromDate && t.date <= toDate);

  // Generate date list
  const dates: string[] = [];
  let curr = new Date(fromDate);
  const end = new Date(toDate);
  while (curr <= end) {
    const y = curr.getFullYear();
    const m = String(curr.getMonth() + 1).padStart(2, '0');
    const d = String(curr.getDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${d}`);
    curr.setDate(curr.getDate() + 1);
  }

  let grandTotalOpening = 0;
  let grandTotalPosCash = 0;
  let grandTotalExtraIn = 0;
  let grandTotalExpenses = 0;

  const dailyRows: any[] = [];
  const categoryExpenses: Record<string, { count: number; total: number }> = {};

  dates.forEach(d => {
    const drawer = drawersMap[d] || {
      date: d,
      openingBalance: 0,
      isLocked: false,
    };

    const dayTxns = rangeTxns.filter(t => t.date === d);
    const dayExtraIn = dayTxns
      .filter(t => t.type === 'CASH_IN')
      .reduce((sum, t) => sum + t.amount, 0);
    const dayExpenses = dayTxns
      .filter(t => t.type === 'CASH_OUT')
      .reduce((sum, t) => sum + t.amount, 0);

    const dayPosDocs = posPaymentsByDate[d] || [];
    const dayPosAmount = dayPosDocs.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    const dayTotalIn = r2(dayPosAmount + dayExtraIn);
    const closing = r2(drawer.openingBalance + dayTotalIn - dayExpenses);

    grandTotalOpening += drawer.openingBalance;
    grandTotalPosCash += dayPosAmount;
    grandTotalExtraIn += dayExtraIn;
    grandTotalExpenses += dayExpenses;

    dailyRows.push([
      formatDisplayDate(d),
      formatINR(drawer.openingBalance),
      formatINR(dayPosAmount),
      formatINR(dayExtraIn),
      formatINR(dayTotalIn),
      formatINR(dayExpenses),
      formatINR(closing),
      drawer.isLocked ? 'Closed' : 'Active',
    ]);
  });

  // Group expenses by category
  rangeTxns
    .filter(t => t.type === 'CASH_OUT')
    .forEach(t => {
      const cat = t.category || 'General';
      if (!categoryExpenses[cat]) {
        categoryExpenses[cat] = { count: 0, total: 0 };
      }
      categoryExpenses[cat].count += 1;
      categoryExpenses[cat].total = r2(categoryExpenses[cat].total + t.amount);
    });

  // --- Header ---
  doc.setFillColor(30, 41, 59); // slate-800
  doc.rect(0, 0, 210, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(HOTEL_NAME, 14, 11);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(226, 232, 240);
  doc.text('CASH DRAWER REPORT', 14, 18);
  doc.text(`Location: Port Blair | Staff: ${DEFAULT_STAFF_NAME}`, 14, 23);

  doc.text(`Period: ${formatDisplayDate(fromDate)} to ${formatDisplayDate(toDate)}`, 196, 23, { align: 'right' });

  // --- Summary Box ---
  const startY = 34;
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, startY, 182, 28, 1, 1, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('SUMMARY OF CASH MOVEMENT', 18, startY + 7);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);

  // Column 1: Inflows
  doc.text('POS Cash (Port Blair):', 18, startY + 14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(formatINR(grandTotalPosCash), 65, startY + 14);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Extra Cash Received:', 18, startY + 21);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(formatINR(grandTotalExtraIn), 65, startY + 21);

  // Column 2: Outflows & Net
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Total Expenses (Cash Out):', 110, startY + 14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(formatINR(grandTotalExpenses), 165, startY + 14);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Net Cash Change:', 110, startY + 21);
  const netChange = r2(grandTotalPosCash + grandTotalExtraIn - grandTotalExpenses);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(formatINR(netChange), 165, startY + 21);

  // --- Daily Breakdown Table ---
  const tableY = 68;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Daily Record Breakdown', 14, tableY);

  autoTable(doc, {
    startY: tableY + 3,
    head: [['Date', 'Opening', 'POS Cash', 'Extra In', 'Total In', 'Expenses', 'Closing Cash', 'Status']],
    body: dailyRows,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'right',
    },
    columnStyles: {
      0: { halign: 'left', cellWidth: 30 },
      1: { halign: 'right', cellWidth: 22 },
      2: { halign: 'right', cellWidth: 22 },
      3: { halign: 'right', cellWidth: 20 },
      4: { halign: 'right', cellWidth: 22 },
      5: { halign: 'right', cellWidth: 22 },
      6: { halign: 'right', cellWidth: 24 },
      7: { halign: 'center', cellWidth: 20 },
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  // --- Expenses by Category ---
  let finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 8 : 150;
  if (finalY > 230) {
    doc.addPage();
    finalY = 20;
  }

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Expenses by Category', 14, finalY);

  const catRows = Object.entries(categoryExpenses).map(([cat, data]) => {
    return [cat, data.count, formatINR(data.total)];
  });

  if (catRows.length === 0) {
    catRows.push(['No expenses recorded in this period', '0', formatINR(0)]);
  }

  autoTable(doc, {
    startY: finalY + 3,
    head: [['Category', 'Count', 'Total Amount']],
    body: catRows,
    theme: 'grid',
    headStyles: {
      fillColor: [71, 85, 105],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { halign: 'left' },
      1: { halign: 'center', cellWidth: 35 },
      2: { halign: 'right', cellWidth: 45 },
    },
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
  });

  // Footer on each page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Waves Cash Drawer | Generated on ${formatDateTime(new Date().toISOString())} | Page ${i} of ${pageCount}`,
      105,
      290,
      { align: 'center' }
    );
  }

  doc.save(`CashDrawer_${fromDate}_to_${toDate}.pdf`);
}

/**
 * Generates a clean, simple daily shift report in PDF format
 */
export function generateDailyDrawerPdfReport(
  summary: CashDrawerSummary,
  _drawer: DailyDrawer,
  posPayments: CouchPayment[],
  transactions: DrawerTransaction[]
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Header
  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, 210, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(HOTEL_NAME, 14, 11);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(226, 232, 240);
  doc.text('DAILY CASH DRAWER REPORT', 14, 18);
  doc.text(`Date: ${formatDisplayDate(summary.date)} | Location: Port Blair | Staff: ${DEFAULT_STAFF_NAME}`, 14, 23);
  doc.text(`Status: ${summary.isLocked ? 'LOCKED' : 'OPEN'}`, 196, 23, { align: 'right' });

  // Summary box
  const startY = 34;
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, startY, 182, 32, 1, 1, 'FD');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);

  // Row 1
  doc.text('Opening Balance:', 18, startY + 9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(formatINR(summary.openingBalance), 65, startY + 9);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Total Inflow (POS + Extra):', 110, startY + 9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(formatINR(summary.totalCashIn), 165, startY + 9);

  // Row 2
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`POS Cash (${posPayments.length} entries):`, 18, startY + 17);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(formatINR(summary.posCashAmount), 65, startY + 17);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Expenses (Cash Out):', 110, startY + 17);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(formatINR(summary.expensesOut), 165, startY + 17);

  // Row 3
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Extra Cash In:', 18, startY + 25);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(formatINR(summary.extraCashIn), 65, startY + 25);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Closing Cash in Drawer:', 110, startY + 25);
  doc.text(formatINR(summary.closingBalance), 165, startY + 25);

  // POS Cash Receipts table
  const posY = startY + 38;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`POS Cash Received - Port Blair (${posPayments.length} entries)`, 14, posY);

  const posRows = posPayments.map(p => [
    formatTime(p.paymentDate || p.createdAt),
    p.receiptNumber || 'N/A',
    p.bookingNumber ? `#${p.bookingNumber}` : '--',
    p.createdBy || 'FrontDesk',
    formatINR(p.amount),
  ]);

  if (posRows.length === 0) {
    posRows.push(['--', 'No POS Cash received on this date', '--', '--', formatINR(0)]);
  }

  autoTable(doc, {
    startY: posY + 3,
    head: [['Payment Time', 'Receipt #', 'Booking #', 'Cashier', 'Amount']],
    body: posRows,
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 40 },
      2: { cellWidth: 30 },
      3: { cellWidth: 45 },
      4: { halign: 'right', cellWidth: 37 },
    },
  });

  // Manual In / Out table
  let nextY = (doc as any).lastAutoTable.finalY + 8;
  if (nextY > 230) {
    doc.addPage();
    nextY = 20;
  }

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Manual Inflows & Expenses', 14, nextY);

  const txnRows = transactions.map(t => [
    formatTime(t.timestamp),
    t.type === 'CASH_IN' ? 'IN' : 'OUT',
    t.category,
    t.recipient || '--',
    t.voucherNo || '--',
    t.notes || '--',
    t.type === 'CASH_IN' ? `+ ${formatINR(t.amount)}` : `- ${formatINR(t.amount)}`,
  ]);

  if (txnRows.length === 0) {
    txnRows.push(['--', '--', 'No manual entries recorded', '--', '--', '--', '--']);
  }

  autoTable(doc, {
    startY: nextY + 3,
    head: [['Time', 'Type', 'Category', 'Recipient / Paid To', 'Voucher #', 'Notes', 'Amount']],
    body: txnRows,
    theme: 'grid',
    headStyles: { fillColor: [71, 85, 105], fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 16, halign: 'center' },
      2: { cellWidth: 35 },
      3: { cellWidth: 35 },
      4: { cellWidth: 22 },
      5: { cellWidth: 25 },
      6: { halign: 'right', cellWidth: 27 },
    },
  });

  // Sign-off
  let signY = (doc as any).lastAutoTable.finalY + 18;
  if (signY > 255) {
    doc.addPage();
    signY = 30;
  }

  doc.setDrawColor(203, 213, 225);
  doc.line(18, signY + 10, 75, signY + 10);
  doc.line(130, signY + 10, 187, signY + 10);

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Staff Signature (${DEFAULT_STAFF_NAME})`, 18, signY + 14);
  doc.text('Manager Verification', 130, signY + 14);

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Waves Cash Drawer | ${formatDisplayDate(summary.date)} | Page ${i} of ${pageCount}`,
      105,
      290,
      { align: 'center' }
    );
  }

  doc.save(`CashDrawer_${summary.date}.pdf`);
}
