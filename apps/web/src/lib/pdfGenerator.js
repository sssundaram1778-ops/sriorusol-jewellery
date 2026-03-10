import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'
import { calculatePledgeTotals } from './database'
import { Capacitor } from '@capacitor/core'

// Check if running on native platform (Android/iOS)
const isNative = () => {
  try {
    return Capacitor.isNativePlatform()
  } catch {
    return false
  }
}

// Universal PDF save function - works on both web and native
const savePDF = async (doc, filename) => {
  if (isNative()) {
    // For Android APK: Use JavaScript interface to native code
    try {
      // Get PDF as base64 data URI
      const pdfDataUri = doc.output('datauristring')
      
      // Check if Android interface is available
      if (window.AndroidPdfDownloader && window.AndroidPdfDownloader.downloadPdf) {
        // Call native Android method to save PDF
        window.AndroidPdfDownloader.downloadPdf(pdfDataUri, filename)
        return true
      } else {
        // Fallback: standard save
        doc.save(filename)
        return true
      }
    } catch (error) {
      console.error('[PDF] Error:', error)
      // Fallback: standard save
      try {
        doc.save(filename)
        return true
      } catch (e) {
        return false
      }
    }
  } else {
    // Standard browser download
    doc.save(filename)
    return true
  }
}

// Currency formatter for PDF (uses Rs. instead of ₹ for better PDF compatibility)
const formatCurrencyPDF = (amount) => {
  const num = parseFloat(amount) || 0
  return 'Rs. ' + num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

// Standard currency formatter for display
const formatCurrency = (amount) => {
    const num = parseFloat(amount) || 0
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(num)
  }

const formatDate = (date) => {
  if (!date) return '-'
  return format(new Date(date), 'dd/MM/yyyy')
}

// Professional color palette - Modern Blue Theme
const COLORS = {
  primary: [41, 98, 255],         // Vibrant Blue
  primaryDark: [25, 65, 185],     // Deep Blue
  primaryLight: [99, 145, 255],   // Light Blue
  navy: [15, 35, 95],             // Navy Blue
  navyLight: [45, 85, 165],       // Medium Navy
  accent: [0, 184, 148],          // Teal accent
  text: [30, 35, 45],             // Dark text
  textMuted: [95, 105, 125],      // Muted text
  textLight: [140, 150, 165],     // Light text
  border: [220, 228, 240],        // Light border
  success: [16, 185, 129],        // Green
  warning: [245, 158, 11],        // Orange
  danger: [239, 68, 68],          // Red
  white: [255, 255, 255],
  background: [248, 250, 255],    // Very light blue
  lightBlue: [240, 245, 255],     // Light blue bg
  cream: [253, 253, 250]          // Cream bg
}

export const generatePledgePDF = (pledge, language = 'en') => {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 14
  const contentWidth = pageWidth - (margin * 2)
  
  // ============ ELEGANT HEADER WITH GRADIENT EFFECT ============
  // Main header background
  doc.setFillColor(...COLORS.navy)
  doc.rect(0, 0, pageWidth, 32, 'F')
  
  // Decorative accent line
  doc.setFillColor(...COLORS.accent)
  doc.rect(0, 32, pageWidth, 3, 'F')
  
  // Shop name - Elegant typography
  doc.setTextColor(...COLORS.white)
  doc.setFontSize(20)
  doc.setFont(undefined, 'bold')
  doc.text('Sri Orusol Jewellers', margin, 14)
  
  // Tagline
  doc.setFontSize(9)
  doc.setFont(undefined, 'normal')
  doc.setTextColor(...COLORS.primaryLight)
  doc.text('Trusted Gold Finance Services Since 1985', margin + 30, 22)
  
  // Document type badge - Right side
  doc.setFillColor(...COLORS.accent)
  doc.roundedRect(pageWidth - margin - 50, 10, 48, 14, 3, 3, 'F')
  doc.setTextColor(...COLORS.white)
  doc.setFontSize(9)
  doc.setFont(undefined, 'bold')
  doc.text('PLEDGE RECEIPT', pageWidth - margin - 26, 19, { align: 'center' })
  
  doc.setTextColor(...COLORS.text)
  let yPos = 42
  
  // ============ PLEDGE INFO STRIP ============
  doc.setFillColor(...COLORS.lightBlue)
  doc.roundedRect(margin, yPos, contentWidth, 16, 3, 3, 'F')
  doc.setDrawColor(...COLORS.primary)
  doc.setLineWidth(0.5)
  doc.roundedRect(margin, yPos, contentWidth, 16, 3, 3, 'S')
  
  // Pledge Number
  doc.setTextColor(...COLORS.primaryDark)
  doc.setFontSize(12)
  doc.setFont(undefined, 'bold')
  doc.text(`#${pledge.pledge_no}`, margin + 10, yPos + 10)
  
  // Status Badge - Center
  const statusColor = pledge.status === 'ACTIVE' ? COLORS.success : 
                      pledge.status === 'CLOSED' ? COLORS.danger : COLORS.warning
  doc.setFillColor(...statusColor)
  doc.roundedRect(pageWidth / 2 - 18, yPos + 3, 36, 10, 2, 2, 'F')
  doc.setTextColor(...COLORS.white)
  doc.setFontSize(8)
  doc.setFont(undefined, 'bold')
  doc.text(pledge.status || 'ACTIVE', pageWidth / 2, yPos + 10, { align: 'center' })
  
  // Date - Right side
  doc.setTextColor(...COLORS.textMuted)
  doc.setFontSize(9)
  doc.setFont(undefined, 'normal')
  doc.text('Date:', pageWidth - margin - 50, yPos + 7)
  doc.setTextColor(...COLORS.text)
  doc.setFont(undefined, 'bold')
  doc.text(formatDate(pledge.date), pageWidth - margin - 50, yPos + 13)
  
  yPos += 22
  
  // ============ TWO COLUMN LAYOUT ============
  const colWidth = (contentWidth - 8) / 2
  const leftColX = margin
  const rightColX = margin + colWidth + 8
  
  // Customer Details Card
  doc.setFillColor(...COLORS.cream)
  doc.roundedRect(leftColX, yPos, colWidth, 50, 3, 3, 'F')
  doc.setDrawColor(...COLORS.border)
  doc.setLineWidth(0.3)
  doc.roundedRect(leftColX, yPos, colWidth, 50, 3, 3, 'S')
  
  // Section header with accent bar
  doc.setFillColor(...COLORS.primary)
  doc.roundedRect(leftColX, yPos, colWidth, 10, 3, 3, 'F')
  doc.rect(leftColX, yPos + 5, colWidth, 5, 'F')
  doc.setTextColor(...COLORS.white)
  doc.setFontSize(9)
  doc.setFont(undefined, 'bold')
  doc.text('CUSTOMER DETAILS', leftColX + 8, yPos + 7)
  
  // Customer info with better spacing
  const custY = yPos + 16
  doc.setFontSize(8)
  
  const customerFields = [
    { label: 'Name', value: pledge.customer_name || '-' },
    { label: 'Phone', value: pledge.phone_number || '-' },
    { label: 'Place', value: pledge.place || '-' }
  ]
  
  customerFields.forEach((field, i) => {
    const fieldY = custY + (i * 10)
    doc.setTextColor(...COLORS.textMuted)
    doc.setFont(undefined, 'normal')
    doc.text(field.label + ':', leftColX + 6, fieldY)
    doc.setTextColor(...COLORS.text)
    doc.setFont(undefined, 'bold')
    doc.text(field.value, leftColX + 28, fieldY)
  })
  
  // Jewels Details Card
  doc.setFillColor(...COLORS.cream)
  doc.roundedRect(rightColX, yPos, colWidth, 50, 3, 3, 'F')
  doc.setDrawColor(...COLORS.border)
  doc.roundedRect(rightColX, yPos, colWidth, 50, 3, 3, 'S')
  
  // Section header
  doc.setFillColor(...COLORS.accent)
  doc.roundedRect(rightColX, yPos, colWidth, 10, 3, 3, 'F')
  doc.rect(rightColX, yPos + 5, colWidth, 5, 'F')
  doc.setTextColor(...COLORS.white)
  doc.setFontSize(9)
  doc.setFont(undefined, 'bold')
  doc.text('JEWELLERY DETAILS', rightColX + 8, yPos + 7)
  
  // Jewels info
  const jewelY = yPos + 16
  const jewelFields = [
    { label: 'Type', value: pledge.jewel_type || 'GOLD' },
    { label: 'Items', value: String(pledge.no_of_items || 1) },
    { label: 'Gross Wt', value: `${pledge.gross_weight || 0}g` },
    { label: 'Net Wt', value: `${pledge.net_weight || 0}g` }
  ]
  
  jewelFields.forEach((field, i) => {
    const row = Math.floor(i / 2)
    const col = i % 2
    const fieldY = jewelY + (row * 10)
    const fieldX = rightColX + 6 + (col * 45)
    
    doc.setTextColor(...COLORS.textMuted)
    doc.setFont(undefined, 'normal')
    doc.text(field.label + ':', fieldX, fieldY)
    doc.setTextColor(...COLORS.text)
    doc.setFont(undefined, 'bold')
    doc.text(field.value, fieldX + 22, fieldY)
  })
  
  // Interest Rate Badge
  doc.setFillColor(...COLORS.warning)
  doc.roundedRect(rightColX + colWidth - 35, yPos + 38, 30, 9, 2, 2, 'F')
  doc.setTextColor(...COLORS.white)
  doc.setFontSize(8)
  doc.setFont(undefined, 'bold')
  doc.text(`${pledge.interest_rate || 2}% p.m.`, rightColX + colWidth - 20, yPos + 44, { align: 'center' })
  
  yPos += 54
  
  // Jewels description - Full width
  if (pledge.jewels_details) {
    doc.setFillColor(...COLORS.lightBlue)
    doc.roundedRect(margin, yPos, contentWidth, 14, 2, 2, 'F')
    doc.setTextColor(...COLORS.textMuted)
    doc.setFontSize(8)
    doc.setFont(undefined, 'normal')
    doc.text('Description:', margin + 6, yPos + 9)
    doc.setTextColor(...COLORS.text)
    doc.setFont(undefined, 'bold')
    const description = pledge.jewels_details || '-'
    const splitDesc = doc.splitTextToSize(description, contentWidth - 40)
    doc.text(splitDesc[0], margin + 35, yPos + 9)
    yPos += 18
  } else {
    yPos += 4
  }
  
  // ============ LOAN DETAILS TABLE ============
  if (pledge.amounts && pledge.amounts.length > 0) {
    // Section header
    doc.setFillColor(...COLORS.navy)
    doc.roundedRect(margin, yPos, contentWidth, 10, 2, 2, 'F')
    doc.setTextColor(...COLORS.white)
    doc.setFontSize(10)
    doc.setFont(undefined, 'bold')
    doc.text('LOAN DETAILS', margin + 8, yPos + 7)
    yPos += 14
    
    const totals = calculatePledgeTotals(pledge.amounts)
    
    const amountHeaders = [['Date', 'Type', 'Principal', 'Rate', 'Months', 'Interest', 'Total']]
    const amountRows = totals.breakdown.map(amt => [
      formatDate(amt.date),
      amt.amount_type === 'INITIAL' ? 'Initial' : 'Additional',
      formatCurrencyPDF(amt.amount),
      `${amt.interest_rate}%`,
      amt.months.toFixed(1),
      formatCurrencyPDF(amt.interest),
      formatCurrencyPDF(amt.total)
    ])
    
    autoTable(doc, {
      startY: yPos,
      head: amountHeaders,
      body: amountRows,
      theme: 'plain',
      headStyles: { 
        fillColor: COLORS.primary,
        textColor: COLORS.white,
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'center',
        cellPadding: 4
      },
      bodyStyles: {
        fontSize: 8,
        cellPadding: 4,
        halign: 'center',
        textColor: COLORS.text,
        lineColor: COLORS.border,
        lineWidth: 0.2
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 24 },
        1: { halign: 'center', cellWidth: 24 },
        2: { halign: 'right', cellWidth: 30 },
        3: { halign: 'center', cellWidth: 16 },
        4: { halign: 'center', cellWidth: 18 },
        5: { halign: 'right', cellWidth: 28, textColor: COLORS.success },
        6: { halign: 'right', cellWidth: 32, fontStyle: 'bold', textColor: COLORS.primaryDark }
      },
      alternateRowStyles: {
        fillColor: COLORS.lightBlue
      },
      margin: { left: margin, right: margin }
    })
    
    yPos = doc.lastAutoTable.finalY + 8
    
    // ============ ELEGANT TOTALS SUMMARY ============
    doc.setFillColor(...COLORS.navy)
    doc.roundedRect(margin, yPos, contentWidth, 28, 3, 3, 'F')
    
    const totalColWidth = contentWidth / 3
    
    // Divider lines
    doc.setDrawColor(...COLORS.navyLight)
    doc.setLineWidth(0.5)
    doc.line(margin + totalColWidth, yPos + 4, margin + totalColWidth, yPos + 24)
    doc.line(margin + totalColWidth * 2, yPos + 4, margin + totalColWidth * 2, yPos + 24)
    
    // Principal
    doc.setFontSize(8)
    doc.setTextColor(...COLORS.primaryLight)
    doc.setFont(undefined, 'normal')
    doc.text('PRINCIPAL', margin + totalColWidth / 2, yPos + 9, { align: 'center' })
    doc.setFontSize(12)
    doc.setTextColor(...COLORS.white)
    doc.setFont(undefined, 'bold')
    doc.text(formatCurrencyPDF(totals.totalPrincipal), margin + totalColWidth / 2, yPos + 20, { align: 'center' })
    
    // Interest
    doc.setFontSize(8)
    doc.setTextColor(...COLORS.primaryLight)
    doc.setFont(undefined, 'normal')
    doc.text('INTEREST', margin + totalColWidth * 1.5, yPos + 9, { align: 'center' })
    doc.setFontSize(12)
    doc.setTextColor(...COLORS.accent)
    doc.setFont(undefined, 'bold')
    doc.text(`+${formatCurrencyPDF(totals.totalInterest)}`, margin + totalColWidth * 1.5, yPos + 20, { align: 'center' })
    
    // Grand Total - Highlighted
    doc.setFillColor(...COLORS.accent)
    doc.roundedRect(margin + totalColWidth * 2 + 5, yPos + 2, totalColWidth - 10, 24, 2, 2, 'F')
    doc.setFontSize(8)
    doc.setTextColor(...COLORS.white)
    doc.setFont(undefined, 'normal')
    doc.text('TOTAL PAYABLE', margin + totalColWidth * 2.5, yPos + 9, { align: 'center' })
    doc.setFontSize(14)
    doc.setFont(undefined, 'bold')
    doc.text(formatCurrencyPDF(totals.grandTotal), margin + totalColWidth * 2.5, yPos + 21, { align: 'center' })
    
    yPos += 34
  }
  
  // ============ OWNER REPLEDGE SECTION ============
  if (pledge.ownerRepledges && pledge.ownerRepledges.length > 0) {
    doc.setFillColor(...COLORS.navyLight)
    doc.roundedRect(margin, yPos, contentWidth, 10, 2, 2, 'F')
    doc.setTextColor(...COLORS.white)
    doc.setFontSize(10)
    doc.setFont(undefined, 'bold')
    doc.text('FINANCER DETAILS', margin + 8, yPos + 7)
    yPos += 14
    
    const repledgeHeaders = [['Financer', 'Amount', 'Debt Date', 'Release', 'Status']]
    const repledgeRows = pledge.ownerRepledges.map(r => [
      r.financer_name || '-',
      formatCurrencyPDF(r.amount || 0),
      formatDate(r.debt_date),
      r.release_date ? formatDate(r.release_date) : '-',
      r.status || '-'
    ])
    
    autoTable(doc, {
      startY: yPos,
      head: repledgeHeaders,
      body: repledgeRows,
      theme: 'plain',
      headStyles: { 
        fillColor: COLORS.navyLight,
        textColor: COLORS.white,
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'center',
        cellPadding: 3
      },
      bodyStyles: {
        fontSize: 8,
        cellPadding: 3,
        halign: 'center',
        textColor: COLORS.text
      },
      alternateRowStyles: {
        fillColor: COLORS.lightBlue
      },
      margin: { left: margin, right: margin },
      didParseCell: (data) => {
        if (data.column.index === 4 && data.section === 'body') {
          if (data.cell.text[0] === 'ACTIVE') {
            data.cell.styles.textColor = COLORS.success
            data.cell.styles.fontStyle = 'bold'
          } else if (data.cell.text[0] === 'CLOSED') {
            data.cell.styles.textColor = COLORS.danger
          }
        }
      }
    })
    
    yPos = doc.lastAutoTable.finalY + 6
  }
  
  // ============ ELEGANT FOOTER ============
  const footerY = pageHeight - 20
  
  // Footer line with gradient effect
  doc.setDrawColor(...COLORS.accent)
  doc.setLineWidth(1)
  doc.line(margin, footerY - 6, pageWidth - margin, footerY - 6)
  
  // Thank you message
  doc.setFontSize(9)
  doc.setTextColor(...COLORS.text)
  doc.setFont(undefined, 'italic')
  doc.text('Thank you for choosing Sri Orusol Jewellers!', pageWidth / 2, footerY + 1, { align: 'center' })
  
  // Contact & timestamp
  doc.setFontSize(7)
  doc.setTextColor(...COLORS.textMuted)
  doc.setFont(undefined, 'normal')
  doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy, hh:mm a')}  |  Contact: +91-XXXXXXXXXX  |  © Sri Orusol Jewellers`, pageWidth / 2, footerY + 9, { align: 'center' })
  
  return doc
}

export const downloadPledgePDF = async (pledge, language = 'en') => {
  const doc = generatePledgePDF(pledge, language)
  await savePDF(doc, `Pledge-${pledge.pledge_no}.pdf`)
}

export const printPledgePDF = (pledge, language = 'en') => {
  const doc = generatePledgePDF(pledge, language)
  doc.autoPrint()
  window.open(doc.output('bloburl'), '_blank')
}

// Export financer data to PDF - Professional Modern Layout
export const downloadFinancerPDF = async (financerName, financerPlace, pledges) => {
  const doc = new jsPDF('l') // Landscape
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15
  
  // ============ ELEGANT HEADER ============
  // Navy header with accent
  doc.setFillColor(...COLORS.navy)
  doc.rect(0, 0, pageWidth, 38, 'F')
  
  // Accent bar
  doc.setFillColor(...COLORS.accent)
  doc.rect(0, 38, pageWidth, 3, 'F')
  
  // Logo circle
  // Company name
  doc.setTextColor(...COLORS.white)
  doc.setFontSize(22)
  doc.setFont(undefined, 'bold')
  doc.text('Sri Orusol Jewellers', margin, 16)
  
  // Report subtitle
  doc.setFontSize(11)
  doc.setFont(undefined, 'normal')
  doc.setTextColor(...COLORS.primaryLight)
  doc.text('Financer Pledges Report', margin, 26)
  
  // Financer name badge - Right side
  doc.setFillColor(...COLORS.accent)
  const financerText = financerName
  const textWidth = Math.min(doc.getTextWidth(financerText) * 1.2 + 24, 100)
  doc.roundedRect(pageWidth - margin - textWidth, 10, textWidth, 18, 4, 4, 'F')
  doc.setTextColor(...COLORS.white)
  doc.setFontSize(12)
  doc.setFont(undefined, 'bold')
  doc.text(financerText, pageWidth - margin - textWidth / 2, 21, { align: 'center' })
  
  if (financerPlace) {
    doc.setFontSize(8)
    doc.setFont(undefined, 'normal')
    doc.text(financerPlace, pageWidth - margin - textWidth / 2, 25, { align: 'center' })
  }
  
  doc.setTextColor(...COLORS.text)
  
  let yPos = 48
  
  // ============ SUMMARY CARDS ============
  const totalAmount = pledges.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
  const totalInterest = pledges.reduce((sum, p) => sum + (parseFloat(p.interest_amount) || 0), 0)
  const activeCount = pledges.filter(p => p.status === 'ACTIVE').length
  const closedCount = pledges.length - activeCount
  const activeAmount = pledges.filter(p => p.status === 'ACTIVE').reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
  
  // Summary boxes
  const boxWidth = 55
  const boxGap = 8
  const totalBoxesWidth = (boxWidth * 5) + (boxGap * 4)
  const startX = (pageWidth - totalBoxesWidth) / 2
  
  const summaryData = [
    { label: 'Total Pledges', value: pledges.length, color: COLORS.primary, bgColor: COLORS.lightBlue },
    { label: 'Active', value: activeCount, color: COLORS.success, bgColor: [240, 253, 244] },
    { label: 'Closed', value: closedCount, color: COLORS.danger, bgColor: [254, 242, 242] },
    { label: 'Active Amount', value: formatCurrencyPDF(activeAmount), color: COLORS.primaryDark, bgColor: COLORS.lightBlue },
    { label: 'Total Amount', value: formatCurrencyPDF(totalAmount), color: COLORS.accent, bgColor: [240, 253, 250] }
  ]
  
  summaryData.forEach((item, i) => {
    const x = startX + (i * (boxWidth + boxGap))
    
    // Card background
    doc.setFillColor(...item.bgColor)
    doc.roundedRect(x, yPos, boxWidth, 20, 3, 3, 'F')
    
    // Top accent bar
    doc.setFillColor(...item.color)
    doc.roundedRect(x, yPos, boxWidth, 4, 3, 3, 'F')
    doc.rect(x, yPos + 2, boxWidth, 2, 'F')
    
    // Label
    doc.setFontSize(7)
    doc.setTextColor(...COLORS.textMuted)
    doc.setFont(undefined, 'normal')
    doc.text(item.label, x + boxWidth / 2, yPos + 10, { align: 'center' })
    
    // Value
    doc.setFontSize(11)
    doc.setTextColor(...item.color)
    doc.setFont(undefined, 'bold')
    doc.text(String(item.value), x + boxWidth / 2, yPos + 17, { align: 'center' })
  })
  
  yPos += 28
  
  // ============ DATA TABLE ============
  const headers = [['#', 'Pledge No', 'Date', 'Customer', 'Jewel Details', 'Gross', 'Net', 'Amount', 'Debt Date', 'Status', 'Closed']]
  const rows = pledges.map((p, idx) => [
    String(idx + 1),
    p.pledge_no || '-',
    p.pledge_date ? formatDate(p.pledge_date) : '-',
    p.customer_name || '-',
    (p.jewels_details || '-').substring(0, 22) + ((p.jewels_details?.length || 0) > 22 ? '...' : ''),
    p.gross_weight ? `${p.gross_weight}g` : '-',
    p.net_weight ? `${p.net_weight}g` : '-',
    formatCurrencyPDF(p.amount || 0),
    p.debt_date ? formatDate(p.debt_date) : '-',
    p.status || '-',
    p.release_date ? formatDate(p.release_date) : '-'
  ])
  
  autoTable(doc, {
    startY: yPos,
    head: headers,
    body: rows,
    theme: 'plain',
    headStyles: { 
      fillColor: COLORS.navy,
      textColor: COLORS.white,
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
      cellPadding: 5
    },
    bodyStyles: { 
      fontSize: 8,
      cellPadding: 4,
      textColor: COLORS.text,
      halign: 'center',
      valign: 'middle',
      lineColor: COLORS.border,
      lineWidth: 0.2
    },
    alternateRowStyles: {
      fillColor: COLORS.lightBlue
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center', textColor: COLORS.textMuted },
      1: { cellWidth: 24, halign: 'center', fontStyle: 'bold', textColor: COLORS.primary },
      2: { cellWidth: 22, halign: 'center' },
      3: { cellWidth: 32, halign: 'left' },
      4: { cellWidth: 42, halign: 'left' },
      5: { cellWidth: 16, halign: 'right' },
      6: { cellWidth: 16, halign: 'right' },
      7: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
      8: { cellWidth: 22, halign: 'center' },
      9: { cellWidth: 18, halign: 'center' },
      10: { cellWidth: 22, halign: 'center' }
    },
    margin: { left: margin, right: margin },
    didParseCell: (data) => {
      if (data.column.index === 9 && data.section === 'body') {
        if (data.cell.text[0] === 'ACTIVE') {
          data.cell.styles.textColor = COLORS.success
          data.cell.styles.fontStyle = 'bold'
        } else if (data.cell.text[0] === 'CLOSED') {
          data.cell.styles.textColor = COLORS.danger
        }
      }
      if (data.column.index === 10 && data.section === 'body' && data.cell.text[0] !== '-') {
        data.cell.styles.textColor = COLORS.danger
      }
    }
  })
  
  // ============ ELEGANT FOOTER ============
  const footerY = pageHeight - 12
  
  // Footer accent line
  doc.setDrawColor(...COLORS.accent)
  doc.setLineWidth(0.8)
  doc.line(margin, footerY - 6, pageWidth - margin, footerY - 6)
  
  // Footer text
  doc.setFontSize(8)
  doc.setTextColor(...COLORS.textMuted)
  doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy, hh:mm a')}`, margin, footerY)
  doc.text('Sri Orusol Jewellers', pageWidth / 2, footerY, { align: 'center' })
  doc.text(`Page 1 of 1`, pageWidth - margin, footerY, { align: 'right' })
  
  await savePDF(doc, `${financerName.replace(/[^a-zA-Z0-9]/g, '_')}_Report.pdf`)
}

// Export all pledges to PDF - Professional Modern Layout (matching Financer PDF style)
export const downloadAllPledgesPDF = async (pledges, reportTitle = 'All Pledges') => {
  const doc = new jsPDF('l') // Landscape
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15
  
  // ============ ELEGANT HEADER ============
  // Navy header with accent
  doc.setFillColor(...COLORS.navy)
  doc.rect(0, 0, pageWidth, 38, 'F')
  
  // Accent bar
  doc.setFillColor(...COLORS.accent)
  doc.rect(0, 38, pageWidth, 3, 'F')
  
  // Company name
  doc.setTextColor(...COLORS.white)
  doc.setFontSize(22)
  doc.setFont(undefined, 'bold')
  doc.text('Sri Orusol Jewellers', margin, 16)
  
  // Report subtitle
  doc.setFontSize(11)
  doc.setFont(undefined, 'normal')
  doc.setTextColor(...COLORS.primaryLight)
  doc.text(`${reportTitle} Report`, margin, 26)
  
  // Date badge - Right side
  doc.setFillColor(...COLORS.accent)
  const dateText = format(new Date(), 'dd MMM yyyy')
  const dateWidth = 70
  doc.roundedRect(pageWidth - margin - dateWidth, 12, dateWidth, 16, 4, 4, 'F')
  doc.setTextColor(...COLORS.white)
  doc.setFontSize(10)
  doc.setFont(undefined, 'bold')
  doc.text(dateText, pageWidth - margin - dateWidth / 2, 22, { align: 'center' })
  
  doc.setTextColor(...COLORS.text)
  
  let yPos = 48
  
  // ============ SUMMARY CARDS ============
  const totalPrincipal = pledges.reduce((sum, p) => sum + (parseFloat(p.totalPrincipal) || 0), 0)
  const totalInterest = pledges.reduce((sum, p) => sum + (parseFloat(p.totalInterest) || 0), 0)
  const grandTotal = pledges.reduce((sum, p) => sum + (parseFloat(p.grandTotal) || 0), 0)
  const activeCount = pledges.filter(p => p.status === 'ACTIVE').length
  const closedCount = pledges.length - activeCount
  
  // Summary boxes
  const boxWidth = 55
  const boxGap = 8
  const totalBoxesWidth = (boxWidth * 5) + (boxGap * 4)
  const startX = (pageWidth - totalBoxesWidth) / 2
  
  const summaryData = [
    { label: 'Total Pledges', value: pledges.length, color: COLORS.primary, bgColor: COLORS.lightBlue },
    { label: 'Active', value: activeCount, color: COLORS.success, bgColor: [240, 253, 244] },
    { label: 'Closed', value: closedCount, color: COLORS.danger, bgColor: [254, 242, 242] },
    { label: 'Total Principal', value: formatCurrencyPDF(totalPrincipal), color: COLORS.primaryDark, bgColor: COLORS.lightBlue },
    { label: 'Total Interest', value: formatCurrencyPDF(totalInterest), color: COLORS.accent, bgColor: [240, 253, 250] }
  ]
  
  summaryData.forEach((item, i) => {
    const x = startX + (i * (boxWidth + boxGap))
    
    // Card background
    doc.setFillColor(...item.bgColor)
    doc.roundedRect(x, yPos, boxWidth, 20, 3, 3, 'F')
    
    // Top accent bar
    doc.setFillColor(...item.color)
    doc.roundedRect(x, yPos, boxWidth, 4, 3, 3, 'F')
    doc.rect(x, yPos + 2, boxWidth, 2, 'F')
    
    // Label
    doc.setFontSize(7)
    doc.setTextColor(...COLORS.textMuted)
    doc.setFont(undefined, 'normal')
    doc.text(item.label, x + boxWidth / 2, yPos + 10, { align: 'center' })
    
    // Value
    doc.setFontSize(11)
    doc.setTextColor(...item.color)
    doc.setFont(undefined, 'bold')
    doc.text(String(item.value), x + boxWidth / 2, yPos + 17, { align: 'center' })
  })
  
  yPos += 28
  
  // ============ DATA TABLE ============
  const headers = [['#', 'Pledge No', 'Date', 'Customer', 'Jewel Details', 'Gross', 'Net', 'Principal', 'Interest', 'Total', 'Status', 'Closed', 'Financer']]
  const rows = pledges.map((p, idx) => [
    String(idx + 1),
    p.pledge_no || '-',
    formatDate(p.date),
    p.customer_name || '-',
    (p.jewels_details || '-').substring(0, 18) + ((p.jewels_details?.length || 0) > 18 ? '...' : ''),
    `${p.gross_weight || 0}g`,
    `${p.net_weight || 0}g`,
    formatCurrencyPDF(p.totalPrincipal || 0),
    formatCurrencyPDF(p.totalInterest || 0),
    formatCurrencyPDF(p.grandTotal || 0),
    p.status,
    p.canceled_date ? formatDate(p.canceled_date) : '-',
    p.financer_name || '-'
  ])
  
  autoTable(doc, {
    startY: yPos,
    head: headers,
    body: rows,
    theme: 'plain',
    headStyles: { 
      fillColor: COLORS.navy,
      textColor: COLORS.white,
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
      cellPadding: 5
    },
    bodyStyles: { 
      fontSize: 8,
      cellPadding: 4,
      textColor: COLORS.text,
      halign: 'center',
      valign: 'middle',
      lineColor: COLORS.border,
      lineWidth: 0.2
    },
    alternateRowStyles: {
      fillColor: COLORS.lightBlue
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center', textColor: COLORS.textMuted },
      1: { cellWidth: 20, halign: 'center', fontStyle: 'bold', textColor: COLORS.primary },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 26, halign: 'left' },
      4: { cellWidth: 32, halign: 'left' },
      5: { cellWidth: 14, halign: 'right' },
      6: { cellWidth: 14, halign: 'right' },
      7: { cellWidth: 26, halign: 'right' },
      8: { cellWidth: 24, halign: 'right', textColor: COLORS.accent },
      9: { cellWidth: 26, halign: 'right', fontStyle: 'bold' },
      10: { cellWidth: 16, halign: 'center' },
      11: { cellWidth: 20, halign: 'center' },
      12: { cellWidth: 24, halign: 'left' }
    },
    margin: { left: margin, right: margin },
    didParseCell: (data) => {
      if (data.column.index === 10 && data.section === 'body') {
        if (data.cell.text[0] === 'ACTIVE') {
          data.cell.styles.textColor = COLORS.success
          data.cell.styles.fontStyle = 'bold'
        } else if (data.cell.text[0] === 'CLOSED') {
          data.cell.styles.textColor = COLORS.danger
        }
      }
      if (data.column.index === 11 && data.section === 'body' && data.cell.text[0] !== '-') {
        data.cell.styles.textColor = COLORS.danger
      }
    }
  })
  
  // ============ ELEGANT FOOTER ============
  const footerY = pageHeight - 12
  
  // Footer accent line
  doc.setDrawColor(...COLORS.accent)
  doc.setLineWidth(0.8)
  doc.line(margin, footerY - 6, pageWidth - margin, footerY - 6)
  
  // Footer text
  doc.setFontSize(8)
  doc.setTextColor(...COLORS.textMuted)
  doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy, hh:mm a')}`, margin, footerY)
  doc.text('Sri Orusol Jewellers', pageWidth / 2, footerY, { align: 'center' })
  doc.text(`Total: ${pledges.length} records`, pageWidth - margin, footerY, { align: 'right' })
  
  const filename = reportTitle.replace(/\s+/g, '_')
  await savePDF(doc, `${filename}_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`)
}
