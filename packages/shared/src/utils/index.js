import { format } from 'date-fns'

// ============================================
// JEWEL TYPE CONSTANTS
// ============================================
export const JEWEL_TYPES = {
  GOLD: { rate: 2, label: 'Gold', labelTa: 'தங்கம்' },
  SILVER: { rate: 3, label: 'Silver', labelTa: 'வெள்ளி' },
  MIXED: { rate: null, label: 'Mixed', labelTa: 'கலப்பு' }
}

// Get default interest rate based on jewel type
export const getDefaultInterestRate = (jewelType) => {
  switch (jewelType) {
    case 'SILVER': return 3
    case 'GOLD': 
    default: return 2
  }
}

// ============================================
// INTEREST CALCULATION (Monthly Basis with 0.5 month increments)
// ============================================

/**
 * Calculate interest months with 0.5 month increments and 1 month minimum
 * 
 * Rules:
 * - Minimum period: 1 month (even if 1 day)
 * - Round UP to nearest 0.5 month
 * - Gold: 2% per month, Silver: 3% per month
 * 
 * Examples:
 * - 7 days → 1 month (minimum)
 * - 35 days → 1.5 months (ceil(35/30 * 2) / 2 = 1.5)
 * - 46 days → 2 months (ceil(46/30 * 2) / 2 = 2)
 * - 372 days → 12.5 months
 */
export const calculateInterestMonths = (startDate, endDate = new Date()) => {
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  // Calculate days (minimum 1 day)
  const days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)))
  
  // Calculate raw months
  const rawMonths = days / 30
  
  // Round UP to nearest 0.5 month
  const roundedMonths = Math.ceil(rawMonths * 2) / 2
  
  // Apply minimum 1 month rule
  const months = Math.max(1, roundedMonths)
  
  return { days, months, rawMonths }
}

// Format currency in Indian Rupees
export const formatCurrency = (amount, options = {}) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: options.decimals ?? 2
  }).format(amount || 0)
}

// Format date
export const formatDate = (date, pattern = 'dd/MM/yyyy') => {
  if (!date) return '-'
  return format(new Date(date), pattern)
}

// Calculate interest for a given amount and date range (NEW LOGIC)
export const calculateInterest = (amount, interestRate, startDate, endDate = new Date()) => {
  const { days, months } = calculateInterestMonths(startDate, endDate)
  const interest = amount * (interestRate / 100) * months
  return { 
    days, 
    months,
    interest: Math.round(interest * 100) / 100 
  }
}

// Calculate total amounts and interest for a pledge
export const calculatePledgeTotals = (amounts, endDate = new Date()) => {
  if (!amounts || amounts.length === 0) {
    return { totalPrincipal: 0, totalInterest: 0, grandTotal: 0, breakdown: [] }
  }

  let totalPrincipal = 0
  let totalInterest = 0
  const breakdown = []

  amounts.forEach(amt => {
    const { days, months, interest } = calculateInterest(
      amt.amount, 
      amt.interest_rate, 
      amt.date, 
      endDate
    )
    totalPrincipal += amt.amount
    totalInterest += interest
    breakdown.push({
      ...amt,
      days,
      months,
      interest,
      total: amt.amount + interest
    })
  })

  return {
    totalPrincipal,
    totalInterest: Math.round(totalInterest * 100) / 100,
    grandTotal: Math.round((totalPrincipal + totalInterest) * 100) / 100,
    breakdown
  }
}

// Generate pledge number
export const generatePledgeNo = (count, year = new Date().getFullYear()) => {
  return `SRI-${year}-${String(count).padStart(4, '0')}`
}

// Debounce utility
export function debounce(func, wait) {
  let timeout
  const debounced = (...args) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
  debounced.cancel = () => clearTimeout(timeout)
  return debounced
}

// Class name utility
export const cn = (...classes) => classes.filter(Boolean).join(' ')
