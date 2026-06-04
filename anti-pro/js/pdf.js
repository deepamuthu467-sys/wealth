/* ═══════════════════════════════════════════════════════
   WealthWise — PDF Export
   pdf.js
═══════════════════════════════════════════════════════ */

const PDFExport = (() => {
  const exportReport = () => {
    App.showToast('info', '📄 Generating PDF report...');

    setTimeout(() => {
      try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const user     = Store.getCurrentUser();
        const currency = Store.getSettings().currency || '₹';
        const summary  = Store.getSummary(user.id);
        const monthly  = Store.getMonthlyData(user.id, 6);
        const txns     = Store.getTransactions(user.id)
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 50);
        const goals    = Store.getGoals(user.id);
        const now      = new Date();

        const BLUE   = [26, 86, 219];
        const GREEN  = [16, 185, 129];
        const RED    = [239, 68, 68];
        const PURPLE = [139, 92, 246];
        const DARK   = [15, 23, 42];
        const GRAY   = [100, 116, 139];
        const LIGHT  = [241, 245, 249];

        let y = 15;
        const pageW = 210;
        const margin = 15;

        // ── Header Banner ──
        doc.setFillColor(...BLUE);
        doc.roundedRect(margin, y, pageW - margin * 2, 40, 4, 4, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('WealthWise', margin + 8, y + 15);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Personal Financial Report', margin + 8, y + 23);
        doc.text(`${user.name} • Generated: ${now.toLocaleDateString('en-IN', { dateStyle: 'long' })}`, margin + 8, y + 31);

        y += 50;

        // ── Summary Cards ──
        doc.setTextColor(...DARK);
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text('Financial Summary', margin, y);
        y += 6;

        const stats = [
          { label: 'Total Balance',  value: summary.balance,      color: BLUE   },
          { label: 'Total Income',   value: summary.totalIncome,  color: GREEN  },
          { label: 'Total Expenses', value: summary.totalExpense, color: RED    },
          { label: 'Total Savings',  value: summary.totalSavings, color: PURPLE },
        ];

        const cardW = (pageW - margin * 2 - 9) / 4;
        stats.forEach((stat, i) => {
          const x = margin + i * (cardW + 3);
          doc.setFillColor(...LIGHT);
          doc.roundedRect(x, y, cardW, 22, 3, 3, 'F');
          doc.setFillColor(...stat.color);
          doc.roundedRect(x, y, 3, 22, 1, 1, 'F');
          doc.setTextColor(...GRAY);
          doc.setFontSize(7.5);
          doc.setFont('helvetica', 'normal');
          doc.text(stat.label, x + 6, y + 7);
          doc.setTextColor(...DARK);
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.text(currency + Math.abs(stat.value).toLocaleString('en-IN'), x + 6, y + 16);
        });
        y += 30;

        // ── Monthly Table ──
        doc.setTextColor(...DARK);
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text('Monthly Summary', margin, y);
        y += 4;

        doc.autoTable({
          startY: y,
          head: [['Month', 'Income', 'Expenses', 'Savings', 'Savings Rate']],
          body: monthly.map(m => [
            m.label,
            currency + m.income.toLocaleString('en-IN'),
            currency + m.expense.toLocaleString('en-IN'),
            (m.savings >= 0 ? '+' : '') + currency + m.savings.toLocaleString('en-IN'),
            (m.income > 0 ? Math.round((m.savings / m.income) * 100) : 0) + '%',
          ]),
          foot: [[
            'Total',
            currency + monthly.reduce((s, m) => s + m.income, 0).toLocaleString('en-IN'),
            currency + monthly.reduce((s, m) => s + m.expense, 0).toLocaleString('en-IN'),
            currency + monthly.reduce((s, m) => s + m.savings, 0).toLocaleString('en-IN'),
            '',
          ]],
          headStyles: { fillColor: BLUE, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
          footStyles: { fillColor: LIGHT, textColor: DARK, fontStyle: 'bold' },
          bodyStyles: { fontSize: 8.5, textColor: DARK },
          alternateRowStyles: { fillColor: [248, 250, 252] },
          columnStyles: {
            1: { textColor: [22, 101, 52] },
            2: { textColor: [153, 27, 27] },
            3: { textColor: PURPLE },
          },
          margin: { left: margin, right: margin },
          tableWidth: pageW - margin * 2,
        });

        y = doc.lastAutoTable.finalY + 10;

        // ── Savings Goals ──
        if (goals.length > 0) {
          if (y + 40 > 270) { doc.addPage(); y = 15; }

          doc.setTextColor(...DARK);
          doc.setFontSize(13);
          doc.setFont('helvetica', 'bold');
          doc.text('Savings Goals', margin, y);
          y += 4;

          doc.autoTable({
            startY: y,
            head: [['Goal', 'Target', 'Saved', 'Remaining', 'Progress']],
            body: goals.map(g => {
              const pct = g.targetAmount > 0 ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100)) : 0;
              return [
                g.name,
                currency + g.targetAmount.toLocaleString('en-IN'),
                currency + g.currentAmount.toLocaleString('en-IN'),
                currency + Math.max(0, g.targetAmount - g.currentAmount).toLocaleString('en-IN'),
                pct + '%',
              ];
            }),
            headStyles: { fillColor: PURPLE, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
            bodyStyles: { fontSize: 8.5, textColor: DARK },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            margin: { left: margin, right: margin },
            tableWidth: pageW - margin * 2,
          });

          y = doc.lastAutoTable.finalY + 10;
        }

        // ── Recent Transactions ──
        if (txns.length > 0) {
          if (y + 40 > 270) { doc.addPage(); y = 15; }

          doc.setTextColor(...DARK);
          doc.setFontSize(13);
          doc.setFont('helvetica', 'bold');
          doc.text('Recent Transactions (Last 50)', margin, y);
          y += 4;

          doc.autoTable({
            startY: y,
            head: [['Date', 'Type', 'Category', 'Notes', 'Amount']],
            body: txns.map(t => [
              new Date(t.date).toLocaleDateString('en-IN'),
              t.type.charAt(0).toUpperCase() + t.type.slice(1),
              t.category,
              t.notes || '—',
              (t.type === 'income' ? '+' : '-') + currency + t.amount.toLocaleString('en-IN'),
            ]),
            headStyles: { fillColor: [30, 58, 95], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
            bodyStyles: { fontSize: 8, textColor: DARK },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            columnStyles: {
              0: { cellWidth: 22 },
              1: { cellWidth: 20 },
              2: { cellWidth: 28 },
              3: { cellWidth: 'auto' },
              4: { cellWidth: 28, fontStyle: 'bold' },
            },
            didParseCell: (data) => {
              if (data.section === 'body' && data.column.index === 4) {
                const isIncome = data.cell.raw.startsWith('+');
                data.cell.styles.textColor = isIncome ? [22, 101, 52] : [153, 27, 27];
              }
            },
            margin: { left: margin, right: margin },
            tableWidth: pageW - margin * 2,
          });
        }

        // ── Footer on each page ──
        const totalPages = doc.getNumberOfPages();
        for (let p = 1; p <= totalPages; p++) {
          doc.setPage(p);
          doc.setFontSize(8);
          doc.setTextColor(...GRAY);
          doc.text(`WealthWise Financial Report • ${now.toLocaleDateString('en-IN')} • Page ${p} of ${totalPages}`,
            pageW / 2, 290, { align: 'center' });
        }

        // Save
        const filename = `WealthWise_Report_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}.pdf`;
        doc.save(filename);
        App.showToast('success', '📄 Report downloaded successfully!');
      } catch (err) {
        console.error('PDF error:', err);
        App.showToast('error', 'Failed to generate PDF. Please try again.');
      }
    }, 300);
  };

  return { exportReport };
})();
