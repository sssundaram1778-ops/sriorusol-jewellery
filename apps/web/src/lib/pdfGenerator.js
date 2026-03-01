import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { format } from 'date-fns'
import { calculatePledgeTotals } from './supabase'

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(amount || 0)
}

const formatDate = (date) => {
  if (!date) return '-'
  return format(new Date(date), 'dd/MM/yyyy')
}

// Professional color palette - Blue Theme
const COLORS = {
  primary: [37, 99, 235],         // Blue-600
  primaryDark: [29, 78, 216],     // Blue-700
  primaryLight: [96, 165, 250],   // Blue-400
  navy: [30, 64, 175],            // Blue-800
  navyLight: [59, 130, 246],      // Blue-500
  text: [33, 37, 41],             // Dark text
  textMuted: [100, 116, 139],     // Muted text
  border: [226, 232, 240],        // Light border
  success: [16, 185, 129],        // Green
  white: [255, 255, 255],
  background: [248, 250, 252],    // Slate-50
  lightBlue: [239, 246, 255]      // Blue-50
}

export const generatePledgePDF = (pledge, language = 'en') => {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 12
  const contentWidth = pageWidth - (margin * 2)
  
  // ============ COMPACT HEADER ============
  doc.setFillColor(...COLORS.navy)
  doc.rect(0, 0, pageWidth, 28, 'F')
  
  doc.setFillColor(...COLORS.primaryLight)
  doc.rect(0, 28, pageWidth, 2, 'F')
  
  // Shop name
  doc.setTextColor(...COLORS.white)
  doc.setFontSize(18)
  doc.setFont(undefined, 'bold')
  doc.text('Sri Orusol Jeweller', pageWidth / 2, 12, { align: 'center' })
  
  // Tagline
  doc.setFontSize(8)
  doc.setFont(undefined, 'normal')
  doc.text('Trusted Jewellery Finance Services', pageWidth / 2, 19, { align: 'center' })
  
  // Receipt badge
  doc.setFillColor(...COLORS.primary)
  doc.roundedRect(pageWidth / 2 - 30, 22, 60, 6, 1, 1, 'F')
  doc.setFontSize(7)
  doc.setFont(undefined, 'bold')
  doc.text('PLEDGE RECEIPT', pageWidth / 2, 26, { align: 'center' })
  
  doc.setTextColor(...COLORS.text)
  let yPos = 36
  
  // ============ PLEDGE INFO BAR ============
  doc.setFillColor(...COLORS.lightBlue)
  doc.roundedRect(margin, yPos, contentWidth, 12, 2, 2, 'F')
  doc.setDrawColor(...COLORS.primary)
  doc.setLineWidth(0.3)
  doc.roundedRect(margin, yPos, contentWidth, 12, 2, 2, 'S')
  
  // Left: Pledge Number
  doc.setFontSize(9)
  doc.setFont(undefined, 'bold')
  doc.setTextColor(...COLORS.primary)
  doc.text(`Pledge No: ${pledge.pledge_no}`, margin + 6, yPos + 7)
  
  // Center: Status Badge
  const statusColor = pledge.status === 'ACTIVE' ? COLORS.success : COLORS.textMuted
  doc.setFillColor(...statusColor)
  doc.roundedRect(pageWidth / 2 - 15, yPos + 2, 30, 8, 1, 1, 'F')
  doc.setTextColor(...COLORS.white)
  doc.setFontSize(7)
  doc.text(pledge.status || 'ACTIVE', pageWidth / 2, yPos + 7, { align: 'center' })
  
  // Right: Date
  doc.setTextColor(...COLORS.textMuted)
  doc.setFont(undefined, 'normal')
  doc.setFontSize(9)
  doc.text(`Date: ${formatDate(pledge.date)}`, pageWidth - margin - 6, yPos + 7, { align: 'right' })
  
  yPos += 16
  
  // ============ TWO COLUMN LAYOUT: CUSTOMER & JEWELS ============
  const colWidth = (contentWidth - 6) / 2
  const leftColX = margin
  const rightColX = margin + colWidth + 6
  
  // Customer Details - Left Column
  doc.setFillColor(...COLORS.primary)
  doc.roundedRect(leftColX, yPos, 3, 10, 1, 1, 'F')
  doc.setTextColor(...COLORS.text)
  doc.setFontSize(10)
  doc.setFont(undefined, 'bold')
  doc.text('Customer Details', leftColX + 6, yPos + 7)
  
  // Jewels Details - Right Column
  doc.setFillColor(...COLORS.primary)
  doc.roundedRect(rightColX, yPos, 3, 10, 1, 1, 'F')
  doc.setTextColor(...COLORS.text)
  doc.text('Jewels Details', rightColX + 6, yPos + 7)
  
  yPos += 12
  
  // Customer info - compact
  const customerY = yPos
  doc.setFontSize(8)
  doc.setTextColor(...COLORS.textMuted)
  doc.setFont(undefined, 'normal')
  doc.text('Name:', leftColX + 2, customerY + 5)
  doc.text('Phone:', leftColX + 2, customerY + 12)
  doc.text('Place:', leftColX + 2, customerY + 19)
  
  doc.setTextColor(...COLORS.text)
  doc.setFont(undefined, 'bold')
  doc.text(pledge.customer_name || '-', leftColX + 22, customerY + 5)
  doc.text(pledge.phone_number || '-', leftColX + 22, customerY + 12)
  doc.text(pledge.place || '-', leftColX + 22, customerY + 19)
  
  // Jewels info - compact
  doc.setTextColor(...COLORS.textMuted)
  doc.setFont(undefined, 'normal')
  doc.text('Type:', rightColX + 2, customerY + 5)
  doc.text('Items:', rightColX + 2, customerY + 12)
  doc.text('Gross:', rightColX + 2, customerY + 19)
  doc.text('Net:', rightColX + 2, customerY + 26)
  doc.text('Rate:', rightColX + 2, customerY + 33)
  
  doc.setTextColor(...COLORS.text)
  doc.setFont(undefined, 'bold')
  doc.text(pledge.jewel_type || 'GOLD', rightColX + 22, customerY + 5)
  doc.text(String(pledge.no_of_items || 1), rightColX + 22, customerY + 12)
  doc.text(`${pledge.gross_weight || 0}g`, rightColX + 22, customerY + 19)
  doc.text(`${pledge.net_weight || 0}g`, rightColX + 22, customerY + 26)
  doc.text(`${pledge.interest_rate || 2}% / month`, rightColX + 22, customerY + 33)
  
  // Jewels description - full width below
  yPos += 38
  doc.setTextColor(...COLORS.textMuted)
  doc.setFont(undefined, 'normal')
  doc.setFontSize(8)
  doc.text('Description:', leftColX + 2, yPos)
  doc.setTextColor(...COLORS.text)
  doc.setFont(undefined, 'bold')
  const description = pledge.jewels_details || '-'
  const splitDesc = doc.splitTextToSize(description, contentWidth - 30)
  doc.text(splitDesc, leftColX + 30, yPos)
  yPos += Math.max(splitDesc.length * 4, 4) + 6
  
  // ============ AMOUNT DETAILS TABLE ============
  if (pledge.amounts && pledge.amounts.length > 0) {
    doc.setFillColor(...COLORS.primary)
    doc.roundedRect(margin, yPos, 3, 10, 1, 1, 'F')
    doc.setTextColor(...COLORS.text)
    doc.setFontSize(10)
    doc.setFont(undefined, 'bold')
    doc.text('Loan Details', margin + 6, yPos + 7)
    yPos += 12
    
    const totals = calculatePledgeTotals(pledge.amounts)
    
    const amountHeaders = [['Date', 'Type', 'Principal', 'Rate', 'Days', 'Interest', 'Total']]
    const amountRows = totals.breakdown.map(amt => [
      formatDate(amt.date),
      amt.amount_type,
      formatCurrency(amt.amount),
      `${amt.interest_rate}%`,
      String(amt.days),
      formatCurrency(amt.interest),
      formatCurrency(amt.total)
    ])
    
    doc.autoTable({
      startY: yPos,
      head: amountHeaders,
      body: amountRows,
      theme: 'striped',
      headStyles: { 
        fillColor: COLORS.primary,
        textColor: COLORS.white,
        fontStyle: 'bold',
        fontSize: 7,
        halign: 'center',
        cellPadding: 2
      },
      bodyStyles: {
        fontSize: 7,
        cellPadding: 2,
        halign: 'center',
        textColor: COLORS.text
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 22 },
        1: { halign: 'center', cellWidth: 22 },
        2: { halign: 'right', cellWidth: 28 },
        3: { halign: 'center', cellWidth: 14 },
        4: { halign: 'center', cellWidth: 14 },
        5: { halign: 'right', cellWidth: 28 },
        6: { halign: 'right', cellWidth: 30, fontStyle: 'bold' }
      },
      alternateRowStyles: {
        fillColor: COLORS.lightBlue
      },
      margin: { left: margin, right: margin }
    })
    
    yPos = doc.lastAutoTable.finalY + 6
    
    // ============ COMPACT TOTALS - INLINE ============
    doc.setFillColor(...COLORS.lightBlue)
    doc.roundedRect(margin, yPos, contentWidth, 18, 2, 2, 'F')
    doc.setDrawColor(...COLORS.primary)
    doc.setLineWidth(0.4)
    doc.roundedRect(margin, yPos, contentWidth, 18, 2, 2, 'S')
    
    const totalColWidth = contentWidth / 3
    
    // Principal
    doc.setFontSize(7)
    doc.setTextColor(...COLORS.textMuted)
    doc.setFont(undefined, 'normal')
    doc.text('Total Principal', margin + totalColWidth / 2, yPos + 5, { align: 'center' })
    doc.setFontSize(9)
    doc.setTextColor(...COLORS.text)
    doc.setFont(undefined, 'bold')
    doc.text(formatCurrency(totals.totalPrincipal), margin + totalColWidth / 2, yPos + 13, { align: 'center' })
    
    // Interest
    doc.setFontSize(7)
    doc.setTextColor(...COLORS.textMuted)
    doc.setFont(undefined, 'normal')
    doc.text('Total Interest', margin + totalColWidth * 1.5, yPos + 5, { align: 'center' })
    doc.setFontSize(9)
    doc.setTextColor(...COLORS.success)
    doc.setFont(undefined, 'bold')
    doc.text(`+${formatCurrency(totals.totalInterest)}`, margin + totalColWidth * 1.5, yPos + 13, { align: 'center' })
    
    // Grand Total
    doc.setFontSize(7)
    doc.setTextColor(...COLORS.textMuted)
    doc.setFont(undefined, 'normal')
    doc.text('Grand Total', margin + totalColWidth * 2.5, yPos + 5, { align: 'center' })
    doc.setFontSize(11)
    doc.setTextColor(...COLORS.primaryDark)
    doc.setFont(undefined, 'bold')
    doc.text(formatCurrency(totals.grandTotal), margin + totalColWidth * 2.5, yPos + 13, { align: 'center' })
    
    yPos += 22
  }
  
  // ============ REPLEDGE HISTORY (Compact) ============
  if (pledge.repledges && pledge.repledges.length > 0) {
    doc.setFillColor(...COLORS.primary)
    doc.roundedRect(margin, yPos, 3, 10, 1, 1, 'F')
    doc.setTextColor(...COLORS.text)
    doc.setFontSize(10)
    doc.setFont(undefined, 'bold')
    doc.text('Transfer History', margin + 6, yPos + 7)
    yPos += 12
    
    const repledgeHeaders = [['Date', 'New Customer', 'Amount', 'Rate', 'Status']]
    const repledgeRows = pledge.repledges.map(r => [
      formatDate(r.date),
      r.new_customer_name,
      formatCurrency(r.amount),
      `${r.interest_rate}%`,
      r.status
    ])
    
    doc.autoTable({
      startY: yPos,
      head: repledgeHeaders,
      body: repledgeRows,
      theme: 'striped',
      headStyles: { 
        fillColor: COLORS.navyLight,
        textColor: COLORS.white,
        fontStyle: 'bold',
        fontSize: 7,
        halign: 'center',
        cellPadding: 2
      },
      bodyStyles: {
        fontSize: 7,
        cellPadding: 2,
        halign: 'center',
        textColor: COLORS.text
      },
      alternateRowStyles: {
        fillColor: COLORS.lightBlue
      },
      margin: { left: margin, right: margin }
    })
    
    yPos = doc.lastAutoTable.finalY + 6
  }
  
  // ============ COMPACT FOOTER ============
  const footerY = pageHeight - 18
  
  doc.setDrawColor(...COLORS.primary)
  doc.setLineWidth(0.5)
  doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4)
  
  doc.setFontSize(8)
  doc.setTextColor(...COLORS.textMuted)
  doc.setFont(undefined, 'italic')
  doc.text('Thank you for your trust in Sri Orusol Jeweller!', pageWidth / 2, footerY + 2, { align: 'center' })
  
  doc.setFontSize(6)
  doc.setFont(undefined, 'normal')
  doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy, hh:mm a')}  |  © Sri Orusol Jeweller`, pageWidth / 2, footerY + 9, { align: 'center' })
  
  return doc
}

export const downloadPledgePDF = (pledge, language = 'en') => {
  const doc = generatePledgePDF(pledge, language)
  doc.save(`Pledge-${pledge.pledge_no}.pdf`)
}

export const printPledgePDF = (pledge, language = 'en') => {
  const doc = generatePledgePDF(pledge, language)
  doc.autoPrint()
  window.open(doc.output('bloburl'), '_blank')
}

// Export financer data to PDF - Professional Blue Theme Layout
export const downloadFinancerPDF = (financerName, financerPlace, pledges) => {
  const doc = new jsPDF('l') // Landscape
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15
  
  // ============ HEADER ============
  doc.setFillColor(...COLORS.navy)
  doc.rect(0, 0, pageWidth, 35, 'F')
  
  doc.setFillColor(...COLORS.primaryLight)
  doc.rect(0, 35, pageWidth, 2, 'F')
  
  doc.setTextColor(...COLORS.white)
  doc.setFontSize(20)
  doc.setFont(undefined, 'bold')
  doc.text('Sri Orusol Jeweller', pageWidth / 2, 14, { align: 'center' })
  
  doc.setFontSize(11)
  doc.setFont(undefined, 'normal')
  doc.text('Financer Pledges Report', pageWidth / 2, 24, { align: 'center' })
  
  // Financer name badge
  doc.setFillColor(...COLORS.primary)
  const financerText = `${financerName}${financerPlace ? ` • ${financerPlace}` : ''}`
  const textWidth = doc.getTextWidth(financerText) + 20
  doc.roundedRect((pageWidth - textWidth) / 2, 27, textWidth, 7, 2, 2, 'F')
  doc.setFontSize(8)
  doc.setFont(undefined, 'bold')
  doc.text(financerText, pageWidth / 2, 31.5, { align: 'center' })
  
  doc.setTextColor(...COLORS.text)
  
  let yPos = 46
  
  // ============ SUMMARY STATS ============
  const totalAmount = pledges.reduce((sum, p) => sum + (p.amount || 0), 0)
  const totalInterest = pledges.reduce((sum, p) => sum + (p.interest_amount || 0), 0)
  const activeCount = pledges.filter(p => p.status === 'ACTIVE').length
  const closedCount = pledges.length - activeCount
  
  // Summary boxes
  const boxWidth = 60
  const boxGap = 10
  const totalBoxesWidth = (boxWidth * 4) + (boxGap * 3)
  const startX = (pageWidth - totalBoxesWidth) / 2
  
  const summaryData = [
    { label: 'Total Pledges', value: pledges.length, color: COLORS.primary },
    { label: 'Active', value: activeCount, color: COLORS.success },
    { label: 'Total Amount', value: formatCurrency(totalAmount), color: COLORS.primaryDark },
    { label: 'Total Interest', value: formatCurrency(totalInterest), color: COLORS.success }
  ]
  
  summaryData.forEach((item, i) => {
    const x = startX + (i * (boxWidth + boxGap))
    doc.setFillColor(...COLORS.lightBlue)
    doc.roundedRect(x, yPos, boxWidth, 16, 3, 3, 'F')
    doc.setDrawColor(...COLORS.primary)
    doc.setLineWidth(0.4)
    doc.roundedRect(x, yPos, boxWidth, 16, 3, 3, 'S')
    
    doc.setFontSize(7)
    doc.setTextColor(...COLORS.textMuted)
    doc.setFont(undefined, 'normal')
    doc.text(item.label, x + boxWidth / 2, yPos + 5, { align: 'center' })
    
    doc.setFontSize(10)
    doc.setTextColor(...item.color)
    doc.setFont(undefined, 'bold')
    doc.text(String(item.value), x + boxWidth / 2, yPos + 12, { align: 'center' })
  })
  
  yPos += 24
  
  // ============ DATA TABLE ============
  const headers = [['#', 'Pledge No', 'Date', 'Customer', 'Jewel Details', 'Gross', 'Net', 'Amount', 'Interest', 'Debt Date', 'Status']]
  const rows = pledges.map((p, idx) => [
    String(idx + 1),
    p.pledge_no || '-',
    p.pledge_date ? formatDate(p.pledge_date) : '-',
    p.customer_name || '-',
    (p.jewels_details || '-').substring(0, 28) + ((p.jewels_details?.length || 0) > 28 ? '...' : ''),
    p.gross_weight ? `${p.gross_weight}g` : '-',
    p.net_weight ? `${p.net_weight}g` : '-',
    formatCurrency(p.amount || 0),
    formatCurrency(p.interest_amount || 0),
    p.debt_date ? formatDate(p.debt_date) : '-',
    p.status || '-'
  ])
  
  doc.autoTable({
    startY: yPos,
    head: headers,
    body: rows,
    theme: 'grid',
    headStyles: { 
      fillColor: COLORS.primary,
      textColor: COLORS.white,
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
      cellPadding: 4
    },
    bodyStyles: { 
      fontSize: 7.5,
      cellPadding: 3,
      textColor: COLORS.text,
      halign: 'center',
      valign: 'middle'
    },
    alternateRowStyles: {
      fillColor: COLORS.lightBlue
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 22, halign: 'center', fontStyle: 'bold', textColor: COLORS.primary },
      2: { cellWidth: 22, halign: 'center' },
      3: { cellWidth: 34, halign: 'left' },
      4: { cellWidth: 45, halign: 'left' },
      5: { cellWidth: 18, halign: 'right' },
      6: { cellWidth: 18, halign: 'right' },
      7: { cellWidth: 26, halign: 'right', fontStyle: 'bold' },
      8: { cellWidth: 24, halign: 'right', textColor: COLORS.success },
      9: { cellWidth: 22, halign: 'center' },
      10: { cellWidth: 18, halign: 'center' }
    },
    margin: { left: margin, right: margin },
    didParseCell: (data) => {
      if (data.column.index === 10 && data.section === 'body') {
        if (data.cell.text[0] === 'ACTIVE') {
          data.cell.styles.textColor = COLORS.success
          data.cell.styles.fontStyle = 'bold'
        }
      }
    }
  })
  
  // ============ FOOTER ============
  const footerY = pageHeight - 10
  doc.setDrawColor(...COLORS.primary)
  doc.setLineWidth(0.5)
  doc.line(margin, footerY - 6, pageWidth - margin, footerY - 6)
  
  doc.setFontSize(8)
  doc.setTextColor(...COLORS.textMuted)
  doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy, hh:mm a')}  •  Sri Orusol Jeweller`, pageWidth / 2, footerY, { align: 'center' })
  
  doc.save(`${financerName.replace(/[^a-zA-Z0-9]/g, '_')}_Report.pdf`)
}

// Export all pledges to PDF - Professional Blue Theme Layout
export const downloadAllPledgesPDF = (pledges, reportTitle = 'All Pledges') => {
  const doc = new jsPDF('l') // Landscape
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 12
  
  // ============ HEADER ============
  doc.setFillColor(...COLORS.navy)
  doc.rect(0, 0, pageWidth, 30, 'F')
  
  doc.setFillColor(...COLORS.primaryLight)
  doc.rect(0, 30, pageWidth, 2, 'F')
  
  doc.setTextColor(...COLORS.white)
  doc.setFontSize(18)
  doc.setFont(undefined, 'bold')
  doc.text('Sri Orusol Jeweller', pageWidth / 2, 12, { align: 'center' })
  
  doc.setFontSize(10)
  doc.setFont(undefined, 'normal')
  doc.text(`${reportTitle} Report`, pageWidth / 2, 20, { align: 'center' })
  
  doc.setFontSize(7)
  doc.text(format(new Date(), 'dd MMMM yyyy'), pageWidth / 2, 27, { align: 'center' })
  
  doc.setTextColor(...COLORS.text)
  
  let yPos = 40
  
  // ============ SUMMARY STATS ============
  const totalPrincipal = pledges.reduce((sum, p) => sum + (p.totalPrincipal || 0), 0)
  const totalInterest = pledges.reduce((sum, p) => sum + (p.totalInterest || 0), 0)
  const grandTotal = pledges.reduce((sum, p) => sum + (p.grandTotal || 0), 0)
  const activeCount = pledges.filter(p => p.status === 'ACTIVE').length
  const closedCount = pledges.length - activeCount
  
  // Summary row
  const summaryItems = [
    { label: 'Total', value: pledges.length },
    { label: 'Active', value: activeCount },
    { label: 'Closed', value: closedCount },
    { label: 'Principal', value: formatCurrency(totalPrincipal) },
    { label: 'Interest', value: formatCurrency(totalInterest) },
    { label: 'Grand Total', value: formatCurrency(grandTotal) }
  ]
  
  doc.setFillColor(...COLORS.lightBlue)
  doc.roundedRect(margin, yPos - 4, pageWidth - (margin * 2), 14, 3, 3, 'F')
  doc.setDrawColor(...COLORS.primary)
  doc.setLineWidth(0.4)
  doc.roundedRect(margin, yPos - 4, pageWidth - (margin * 2), 14, 3, 3, 'S')
  
  const itemWidth = (pageWidth - (margin * 2)) / summaryItems.length
  summaryItems.forEach((item, i) => {
    const x = margin + (i * itemWidth) + (itemWidth / 2)
    doc.setFontSize(7)
    doc.setTextColor(...COLORS.textMuted)
    doc.setFont(undefined, 'normal')
    doc.text(item.label, x, yPos, { align: 'center' })
    doc.setFontSize(9)
    doc.setTextColor(...COLORS.primary)
    doc.setFont(undefined, 'bold')
    doc.text(String(item.value), x, yPos + 7, { align: 'center' })
  })
  
  yPos += 16
  
  // ============ DATA TABLE ============
  const headers = [['#', 'Pledge No', 'Date', 'Customer', 'Jewel Details', 'Gross', 'Net', 'Principal', 'Interest', 'Total', 'Status', 'Financer']]
  const rows = pledges.map((p, idx) => [
    String(idx + 1),
    p.pledge_no || '-',
    formatDate(p.date),
    p.customer_name || '-',
    (p.jewels_details || '-').substring(0, 22) + ((p.jewels_details?.length || 0) > 22 ? '...' : ''),
    `${p.gross_weight || 0}g`,
    `${p.net_weight || 0}g`,
    formatCurrency(p.totalPrincipal || 0),
    formatCurrency(p.totalInterest || 0),
    formatCurrency(p.grandTotal || 0),
    p.status,
    p.financer_name || '-'
  ])
  
  doc.autoTable({
    startY: yPos,
    head: headers,
    body: rows,
    theme: 'grid',
    headStyles: { 
      fillColor: COLORS.primary,
      textColor: COLORS.white,
      fontStyle: 'bold',
      fontSize: 7,
      halign: 'center',
      cellPadding: 3
    },
    bodyStyles: { 
      fontSize: 6.5,
      cellPadding: 2.5,
      textColor: COLORS.text,
      halign: 'center',
      valign: 'middle'
    },
    alternateRowStyles: {
      fillColor: COLORS.lightBlue
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 18, halign: 'center', fontStyle: 'bold', textColor: COLORS.primary },
      2: { cellWidth: 18, halign: 'center' },
      3: { cellWidth: 28, halign: 'left' },
      4: { cellWidth: 38, halign: 'left' },
      5: { cellWidth: 15, halign: 'right' },
      6: { cellWidth: 15, halign: 'right' },
      7: { cellWidth: 22, halign: 'right' },
      8: { cellWidth: 20, halign: 'right', textColor: COLORS.success },
      9: { cellWidth: 22, halign: 'right', fontStyle: 'bold' },
      10: { cellWidth: 16, halign: 'center' },
      11: { cellWidth: 32, halign: 'left' }
    },
    margin: { left: margin, right: margin },
    didParseCell: (data) => {
      if (data.column.index === 10 && data.section === 'body') {
        if (data.cell.text[0] === 'ACTIVE') {
          data.cell.styles.textColor = COLORS.success
          data.cell.styles.fontStyle = 'bold'
        }
      }
    }
  })
  
  // ============ FOOTER ============
  const footerY = pageHeight - 8
  doc.setDrawColor(...COLORS.primary)
  doc.setLineWidth(0.5)
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5)
  
  doc.setFontSize(7)
  doc.setTextColor(...COLORS.textMuted)
  doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy, hh:mm a')}  •  Sri Orusol Jeweller  •  Total Records: ${pledges.length}`, pageWidth / 2, footerY, { align: 'center' })
  
  const filename = reportTitle.replace(/\s+/g, '_')
  doc.save(`${filename}_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`)
}
