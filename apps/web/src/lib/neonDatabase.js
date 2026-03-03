import { format } from 'date-fns'
import { 
  sql, 
  isNeonConfigured, 
  checkConnection,
  keepAlive 
} from './neonClient'

// Re-export for backward compatibility
export { sql, isNeonConfigured, checkConnection, keepAlive }
// Alias for compatibility with existing code
// Legacy alias removed
// Legacy alias removed

// ============================================
// MOCK DATA STORAGE (localStorage fallback)
// ============================================
const STORAGE_KEYS = {
  PLEDGES: 'sriorusol_pledges',
  AMOUNTS: 'sriorusol_pledge_amounts',
  REPLEDGES: 'sriorusol_repledges'
}

const getStoredData = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]')
  } catch {
    return []
  }
}

const setStoredData = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data))
}

// Generate UUID
const generateId = () => crypto.randomUUID()

// ============================================
// INTEREST CALCULATION (Monthly Basis with 0.5 month increments)
// ============================================

// Interest rates by jewel type
export const JEWEL_TYPES = {
  GOLD: { rate: 2, label: 'Gold', labelTa: 'தங்கம்' },
  SILVER: { rate: 3, label: 'Silver', labelTa: 'வெள்ளி' },
  MIXED: { rate: null, label: 'Mixed', labelTa: 'கலப்பு' }
}

// Calculate interest months based on calendar months
// Rule: Month cycles start from debt date's day of month
// Complete months counted from day X to day X
// Remaining days: 1-15 = +0.5 month, 16+ = +1 month
// Minimum: 1 month interest
export const calculateInterestMonths = (startDate, endDate = new Date()) => {
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  // Normalize dates to start of day
  start.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)
  
  // Calculate total days for display
  const totalDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)))
  
  // If same day or end before start, return minimum
  if (totalDays <= 0) {
    return { days: 1, months: 1, rawMonths: 0 }
  }
  
  // Calculate complete months
  // From day X of month A to day X of month B = complete months
  let completeMonths = (end.getFullYear() - start.getFullYear()) * 12 
                     + (end.getMonth() - start.getMonth())
  
  // Check if we haven't reached the same day yet in the final month
  if (end.getDate() < start.getDate()) {
    completeMonths -= 1
  }
  
  // Calculate remaining days after complete months
  let remainingDays
  if (end.getDate() >= start.getDate()) {
    remainingDays = end.getDate() - start.getDate()
  } else {
    // Days from start day to end of that month + days in end month
    const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0)
    remainingDays = (prevMonth.getDate() - start.getDate()) + end.getDate()
  }
  
  // Apply remaining days rule
  let extraMonths = 0
  if (remainingDays > 0) {
    if (remainingDays <= 15) {
      extraMonths = 0.5
    } else {
      extraMonths = 1
    }
  }
  
  const totalMonths = completeMonths + extraMonths
  
  // Apply minimum 1 month rule
  const months = Math.max(1, totalMonths)
  
  return { days: totalDays, months, rawMonths: totalMonths }
}

// Get default interest rate based on jewel type
export const getDefaultInterestRate = (jewelType) => {
  switch (jewelType) {
    case 'SILVER': return 3
    case 'GOLD': 
    default: return 2
  }
}

// Calculate interest for a single amount entry
export const calculateInterest = (amount, interestRate, startDate, endDate = new Date()) => {
  const amountNum = parseFloat(amount) || 0
  const rateNum = parseFloat(interestRate) || 2
  const { days, months } = calculateInterestMonths(startDate, endDate)
  const interest = amountNum * (rateNum / 100) * months
  return { 
    days, 
    months,
    interest: Math.round(interest * 100) / 100 
  }
}

// Calculate totals for all amounts in a pledge
export const calculatePledgeTotals = (amounts, endDate = new Date()) => {
  if (!amounts || amounts.length === 0) {
    return { totalPrincipal: 0, totalInterest: 0, grandTotal: 0, breakdown: [] }
  }
  
  let totalPrincipal = 0
  let totalInterest = 0
  const breakdown = []

  amounts.forEach(amt => {
    // Ensure amount and interest_rate are numbers
    const amountNum = parseFloat(amt.amount) || 0
    const interestRateNum = parseFloat(amt.interest_rate) || 2
    
    const { days, months, interest } = calculateInterest(
      amountNum, 
      interestRateNum, 
      amt.date, 
      endDate
    )
    totalPrincipal += amountNum
    totalInterest += interest
    breakdown.push({
      ...amt,
      amount: amountNum,
      interest_rate: interestRateNum,
      days,
      months,
      interest,
      total: amountNum + interest
    })
  })

  return {
    totalPrincipal,
    totalInterest: Math.round(totalInterest * 100) / 100,
    grandTotal: Math.round((totalPrincipal + totalInterest) * 100) / 100,
    breakdown
  }
}

// ============================================
// PLEDGE OPERATIONS
// ============================================

// Generate pledge number
export const generatePledgeNo = async () => {
  const year = new Date().getFullYear()
  
  if (sql) {
    try {
      const result = await sql`
        SELECT COUNT(*) as count FROM pledges 
        WHERE pledge_no LIKE ${'SRI-' + year + '-%'}
      `
      const count = parseInt(result[0]?.count || 0)
      return `SRI-${year}-${String(count + 1).padStart(4, '0')}`
    } catch (error) {
      console.error('Error generating pledge no:', error)
    }
  }
  
  // Mock fallback
  const pledges = getStoredData(STORAGE_KEYS.PLEDGES)
  const yearPledges = pledges.filter(p => p.pledge_no?.includes(`SRI-${year}`))
  return `SRI-${year}-${String(yearPledges.length + 1).padStart(4, '0')}`
}

// Create new pledge
export const createPledge = async (pledgeData) => {
  const pledgeNo = pledgeData.pledge_no || await generatePledgeNo()
  const id = generateId()
  
  const jewelType = pledgeData.jewel_type || 'GOLD'
  const interestRate = pledgeData.interest_rate ?? getDefaultInterestRate(jewelType)

  const pledge = {
    id,
    pledge_no: pledgeNo,
    date: pledgeData.date,
    customer_name: pledgeData.customer_name,
    phone_number: pledgeData.phone_number || null,
    place: pledgeData.place || null,
    jewels_details: pledgeData.jewels_details || null,
    no_of_items: pledgeData.no_of_items || 1,
    gross_weight: pledgeData.gross_weight || null,
    net_weight: pledgeData.net_weight || null,
    jewel_type: jewelType,
    interest_rate: interestRate,
    status: 'ACTIVE',
    canceled_date: null,
    parent_pledge_id: pledgeData.parent_pledge_id || null,
    parent_pledge_no: pledgeData.parent_pledge_no || null
  }

  const initialAmount = {
    id: generateId(),
    pledge_id: id,
    amount: pledgeData.loan_amount,
    date: pledgeData.date,
    interest_rate: interestRate,
    amount_type: 'INITIAL',
    notes: pledgeData.notes || null
  }

  if (sql) {
    try {
      // Insert pledge
      await sql`
        INSERT INTO pledges (id, pledge_no, date, customer_name, phone_number, place, jewels_details, 
          no_of_items, gross_weight, net_weight, jewel_type, interest_rate, status, canceled_date,
          parent_pledge_id, parent_pledge_no, created_at, updated_at)
        VALUES (${pledge.id}, ${pledge.pledge_no}, ${pledge.date}, ${pledge.customer_name}, 
          ${pledge.phone_number}, ${pledge.place}, ${pledge.jewels_details}, ${pledge.no_of_items},
          ${pledge.gross_weight}, ${pledge.net_weight}, ${pledge.jewel_type}, ${pledge.interest_rate},
          ${pledge.status}, ${pledge.canceled_date}, ${pledge.parent_pledge_id}, ${pledge.parent_pledge_no},
          NOW(), NOW())
      `
      
      // Insert initial amount
      await sql`
        INSERT INTO pledge_amounts (id, pledge_id, amount, date, interest_rate, amount_type, notes, created_at)
        VALUES (${initialAmount.id}, ${initialAmount.pledge_id}, ${initialAmount.amount}, 
          ${initialAmount.date}, ${initialAmount.interest_rate}, ${initialAmount.amount_type}, 
          ${initialAmount.notes}, NOW())
      `
      
      return pledge
    } catch (error) {
      console.error('Error creating pledge:', error)
      throw error
    }
  }

  // Mock storage fallback
  const pledges = getStoredData(STORAGE_KEYS.PLEDGES)
  pledges.unshift({ ...pledge, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
  setStoredData(STORAGE_KEYS.PLEDGES, pledges)

  const amounts = getStoredData(STORAGE_KEYS.AMOUNTS)
  amounts.push({ ...initialAmount, created_at: new Date().toISOString() })
  setStoredData(STORAGE_KEYS.AMOUNTS, amounts)

  return pledge
}

// Get pledge by ID with amounts and repledges
export const getPledgeById = async (id) => {
  if (sql) {
    try {
      const pledges = await sql`SELECT * FROM pledges WHERE id = ${id}`
      if (!pledges || pledges.length === 0) return null
      
      const pledge = pledges[0]
      const amounts = await sql`
        SELECT * FROM pledge_amounts WHERE pledge_id = ${id} ORDER BY date ASC
      `
      
      // Get owner repledges for this pledge
      const ownerRepledges = await sql`
        SELECT * FROM owner_repledges WHERE pledge_id = ${id} ORDER BY created_at DESC
      `
      
      const endDate = (pledge.status === 'CLOSED' || pledge.status === 'REPLEDGED') && pledge.canceled_date
        ? new Date(pledge.canceled_date)
        : new Date()
      
      const totals = calculatePledgeTotals(amounts || [], endDate)

      return {
        ...pledge,
        amounts: amounts || [],
        ownerRepledges: ownerRepledges || [],
        repledges: [], // Not used anymore
        ...totals
      }
    } catch (error) {
      console.error('Error getting pledge:', error)
      return null
    }
  }

  // Mock fallback
  const pledges = getStoredData(STORAGE_KEYS.PLEDGES)
  const pledge = pledges.find(p => p.id === id)
  if (!pledge) return null

  const amounts = getStoredData(STORAGE_KEYS.AMOUNTS)
    .filter(a => a.pledge_id === id)
    .sort((a, b) => new Date(a.date) - new Date(b.date))

  const repledges = getStoredData(STORAGE_KEYS.REPLEDGES)
    .filter(r => r.original_pledge_id === id)
    .sort((a, b) => new Date(a.date) - new Date(b.date))

  const endDate = (pledge.status === 'CLOSED' || pledge.status === 'REPLEDGED') && pledge.canceled_date
    ? new Date(pledge.canceled_date)
    : new Date()
  
  const totals = calculatePledgeTotals(amounts, endDate)

  return {
    ...pledge,
    amounts,
    repledges,
    ...totals
  }
}

// Get active pledges
export const getActivePledges = async () => {
  if (sql) {
    try {
      const pledges = await sql`
        SELECT * FROM pledges WHERE status = 'ACTIVE' ORDER BY created_at DESC
      `
      
      const pledgeIds = pledges.map(p => p.id)
      if (pledgeIds.length === 0) return []
      
      const allAmounts = await sql`
        SELECT * FROM pledge_amounts WHERE pledge_id = ANY(${pledgeIds})
      `

      return pledges.map(pledge => {
        const amounts = allAmounts?.filter(a => a.pledge_id === pledge.id) || []
        const totals = calculatePledgeTotals(amounts)
        return { ...pledge, amounts, ...totals }
      })
    } catch (error) {
      console.error('Error getting active pledges:', error)
      return []
    }
  }

  // Mock fallback
  const pledges = getStoredData(STORAGE_KEYS.PLEDGES)
    .filter(p => p.status === 'ACTIVE')
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  const allAmounts = getStoredData(STORAGE_KEYS.AMOUNTS)

  return pledges.map(pledge => {
    const amounts = allAmounts.filter(a => a.pledge_id === pledge.id)
    const totals = calculatePledgeTotals(amounts)
    return { ...pledge, amounts, ...totals }
  })
}

// Get closed/repledged pledges
export const getClosedPledges = async () => {
  if (sql) {
    try {
      const pledges = await sql`
        SELECT * FROM pledges WHERE status IN ('CLOSED', 'REPLEDGED') ORDER BY updated_at DESC
      `
      
      const pledgeIds = pledges.map(p => p.id)
      if (pledgeIds.length === 0) return []
      
      const allAmounts = await sql`
        SELECT * FROM pledge_amounts WHERE pledge_id = ANY(${pledgeIds})
      `

      return pledges.map(pledge => {
        const amounts = allAmounts?.filter(a => a.pledge_id === pledge.id) || []
        const totals = calculatePledgeTotals(amounts, pledge.canceled_date ? new Date(pledge.canceled_date) : new Date())
        return { ...pledge, amounts, ...totals }
      })
    } catch (error) {
      console.error('Error getting closed pledges:', error)
      return []
    }
  }

  // Mock fallback
  const pledges = getStoredData(STORAGE_KEYS.PLEDGES)
    .filter(p => p.status === 'CLOSED' || p.status === 'REPLEDGED')
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))

  const allAmounts = getStoredData(STORAGE_KEYS.AMOUNTS)

  return pledges.map(pledge => {
    const amounts = allAmounts.filter(a => a.pledge_id === pledge.id)
    const totals = calculatePledgeTotals(amounts, pledge.canceled_date ? new Date(pledge.canceled_date) : new Date())
    return { ...pledge, amounts, ...totals }
  })
}

// Get all pledges
export const getAllPledges = async () => {
  if (sql) {
    try {
      const pledges = await sql`SELECT * FROM pledges ORDER BY created_at DESC`
      
      const pledgeIds = pledges.map(p => p.id)
      if (pledgeIds.length === 0) return []
      
      const allAmounts = await sql`
        SELECT * FROM pledge_amounts WHERE pledge_id = ANY(${pledgeIds})
      `

      return pledges.map(pledge => {
        const amounts = allAmounts?.filter(a => a.pledge_id === pledge.id) || []
        const totals = calculatePledgeTotals(amounts, pledge.status === 'CLOSED' && pledge.canceled_date ? new Date(pledge.canceled_date) : new Date())
        return { ...pledge, amounts, ...totals }
      })
    } catch (error) {
      console.error('Error getting all pledges:', error)
      return []
    }
  }

  // Mock fallback
  const pledges = getStoredData(STORAGE_KEYS.PLEDGES)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  const allAmounts = getStoredData(STORAGE_KEYS.AMOUNTS)

  return pledges.map(pledge => {
    const amounts = allAmounts.filter(a => a.pledge_id === pledge.id)
    const totals = calculatePledgeTotals(amounts, pledge.status === 'CLOSED' && pledge.canceled_date ? new Date(pledge.canceled_date) : new Date())
    return { ...pledge, amounts, ...totals }
  })
}

// Search pledges
export const searchPledges = async (query, status = 'ALL') => {
  const searchLower = query.toLowerCase()
  const searchPattern = `%${query}%`
  
  if (sql) {
    try {
      let pledges
      if (status !== 'ALL') {
        pledges = await sql`
          SELECT * FROM pledges 
          WHERE status = ${status}
          AND (customer_name ILIKE ${searchPattern} 
            OR place ILIKE ${searchPattern} 
            OR pledge_no ILIKE ${searchPattern}
            OR phone_number ILIKE ${searchPattern})
          ORDER BY created_at DESC
        `
      } else {
        pledges = await sql`
          SELECT * FROM pledges 
          WHERE customer_name ILIKE ${searchPattern} 
            OR place ILIKE ${searchPattern} 
            OR pledge_no ILIKE ${searchPattern}
            OR phone_number ILIKE ${searchPattern}
          ORDER BY created_at DESC
        `
      }
      
      const pledgeIds = pledges.map(p => p.id)
      if (pledgeIds.length === 0) return []
      
      const allAmounts = await sql`
        SELECT * FROM pledge_amounts WHERE pledge_id = ANY(${pledgeIds})
      `

      return pledges.map(pledge => {
        const amounts = allAmounts?.filter(a => a.pledge_id === pledge.id) || []
        const endDate = (pledge.status === 'CLOSED' || pledge.status === 'REPLEDGED') && pledge.canceled_date
          ? new Date(pledge.canceled_date)
          : new Date()
        const totals = calculatePledgeTotals(amounts, endDate)
        return { ...pledge, amounts, ...totals }
      })
    } catch (error) {
      console.error('Error searching pledges:', error)
      return []
    }
  }

  // Mock fallback
  let pledges = getStoredData(STORAGE_KEYS.PLEDGES)
    .filter(p => 
      p.customer_name?.toLowerCase().includes(searchLower) ||
      p.place?.toLowerCase().includes(searchLower) ||
      p.pledge_no?.toLowerCase().includes(searchLower) ||
      p.phone_number?.toLowerCase().includes(searchLower)
    )

  if (status !== 'ALL') {
    pledges = pledges.filter(p => p.status === status)
  }

  const allAmounts = getStoredData(STORAGE_KEYS.AMOUNTS)

  return pledges.map(pledge => {
    const amounts = allAmounts.filter(a => a.pledge_id === pledge.id)
    const endDate = (pledge.status === 'CLOSED' || pledge.status === 'REPLEDGED') && pledge.canceled_date
      ? new Date(pledge.canceled_date)
      : new Date()
    const totals = calculatePledgeTotals(amounts, endDate)
    return { ...pledge, amounts, ...totals }
  })
}

// Update pledge
export const updatePledge = async (id, updates) => {
  if (sql) {
    try {
      // Build dynamic update query
      const setClauses = []
      const values = []
      
      Object.entries(updates).forEach(([key, value]) => {
        if (key !== 'id') {
          setClauses.push(key)
          values.push(value)
        }
      })
      
      await sql`
        UPDATE pledges 
        SET customer_name = COALESCE(${updates.customer_name}, customer_name),
            phone_number = COALESCE(${updates.phone_number}, phone_number),
            place = COALESCE(${updates.place}, place),
            jewels_details = COALESCE(${updates.jewels_details}, jewels_details),
            no_of_items = COALESCE(${updates.no_of_items}, no_of_items),
            gross_weight = COALESCE(${updates.gross_weight}, gross_weight),
            net_weight = COALESCE(${updates.net_weight}, net_weight),
            status = COALESCE(${updates.status}, status),
            canceled_date = COALESCE(${updates.canceled_date}, canceled_date),
            return_pledge_id = COALESCE(${updates.return_pledge_id}, return_pledge_id),
            return_pledge_no = COALESCE(${updates.return_pledge_no}, return_pledge_no),
            updated_at = NOW()
        WHERE id = ${id}
      `
      
      const result = await sql`SELECT * FROM pledges WHERE id = ${id}`
      return result[0]
    } catch (error) {
      console.error('Error updating pledge:', error)
      throw error
    }
  }

  // Mock fallback
  const pledges = getStoredData(STORAGE_KEYS.PLEDGES)
  const index = pledges.findIndex(p => p.id === id)
  if (index === -1) throw new Error('Pledge not found')
  
  pledges[index] = { ...pledges[index], ...updates, updated_at: new Date().toISOString() }
  setStoredData(STORAGE_KEYS.PLEDGES, pledges)
  return pledges[index]
}

// Close pledge and auto-close associated financer pledges
export const closePledge = async (id, closedDate, returnPledgeNo) => {
  const closeDate = closedDate || format(new Date(), 'yyyy-MM-dd')
  
  // Close the pledge
  const closedPledge = await updatePledge(id, {
    status: 'CLOSED',
    canceled_date: closeDate,
    return_pledge_no: returnPledgeNo || null
  })
  
  // Auto-close all active owner repledges (financer pledges) for this pledge
  if (sql) {
    try {
      await sql`
        UPDATE owner_repledges 
        SET status = 'CLOSED', release_date = ${closeDate}
        WHERE pledge_id = ${id} AND status = 'ACTIVE'
      `
    } catch (error) {
      console.error('Error closing owner repledges:', error)
    }
  } else {
    // Mock fallback
    const ownerRepledges = getStoredData(OWNER_REPLEDGES_KEY)
    const updated = ownerRepledges.map(or => {
      if (or.pledge_id === id && or.status === 'ACTIVE') {
        return { ...or, status: 'CLOSED', release_date: closeDate }
      }
      return or
    })
    setStoredData(OWNER_REPLEDGES_KEY, updated)
  }
  
  return closedPledge
}

// ============================================
// AMOUNT OPERATIONS
// ============================================

// Add additional amount
export const addAmount = async (pledgeId, amountData) => {
  const amount = {
    id: generateId(),
    pledge_id: pledgeId,
    amount: amountData.amount,
    date: amountData.date,
    interest_rate: amountData.interest_rate,
    amount_type: 'ADDITIONAL',
    notes: amountData.notes || null
  }

  if (sql) {
    try {
      await sql`
        INSERT INTO pledge_amounts (id, pledge_id, amount, date, interest_rate, amount_type, notes, created_at)
        VALUES (${amount.id}, ${amount.pledge_id}, ${amount.amount}, ${amount.date}, 
          ${amount.interest_rate}, ${amount.amount_type}, ${amount.notes}, NOW())
      `
      return amount
    } catch (error) {
      console.error('Error adding amount:', error)
      throw error
    }
  }

  // Mock fallback
  const amounts = getStoredData(STORAGE_KEYS.AMOUNTS)
  amounts.push({ ...amount, created_at: new Date().toISOString() })
  setStoredData(STORAGE_KEYS.AMOUNTS, amounts)
  return amount
}

// ============================================
// REPLEDGE OPERATIONS
// ============================================

// Create repledge (transfer to new customer)
export const createRepledge = async (originalPledgeId, repledgeData) => {
  const originalPledge = await getPledgeById(originalPledgeId)
  if (!originalPledge) throw new Error('Original pledge not found')

  const newPledge = await createPledge({
    date: repledgeData.date,
    customer_name: repledgeData.new_customer_name,
    phone_number: repledgeData.phone_number,
    place: originalPledge.place,
    jewels_details: originalPledge.jewels_details,
    no_of_items: originalPledge.no_of_items,
    gross_weight: originalPledge.gross_weight,
    net_weight: originalPledge.net_weight,
    interest_rate: repledgeData.interest_rate,
    loan_amount: repledgeData.amount
  })

  const repledge = {
    id: generateId(),
    original_pledge_id: originalPledgeId,
    new_pledge_id: newPledge.id,
    new_customer_name: repledgeData.new_customer_name,
    amount: repledgeData.amount,
    date: repledgeData.date,
    interest_rate: repledgeData.interest_rate,
    notes: repledgeData.notes || null
  }

  if (sql) {
    try {
      await sql`
        INSERT INTO repledges (id, original_pledge_id, new_pledge_id, new_customer_name, amount, date, interest_rate, notes, created_at)
        VALUES (${repledge.id}, ${repledge.original_pledge_id}, ${repledge.new_pledge_id}, 
          ${repledge.new_customer_name}, ${repledge.amount}, ${repledge.date}, 
          ${repledge.interest_rate}, ${repledge.notes}, NOW())
      `
    } catch (error) {
      console.error('Error creating repledge:', error)
      throw error
    }
  } else {
    const repledges = getStoredData(STORAGE_KEYS.REPLEDGES)
    repledges.push({ ...repledge, created_at: new Date().toISOString() })
    setStoredData(STORAGE_KEYS.REPLEDGES, repledges)
  }

  await updatePledge(originalPledgeId, { status: 'REPLEDGED' })

  return { newPledge, repledge }
}

// Create re-pledge for additional loan amount (same customer)
export const createAdditionalAmountRepledge = async (originalPledgeId, repledgeData) => {
  const originalPledge = await getPledgeById(originalPledgeId)
  if (!originalPledge) throw new Error('Original pledge not found')

  const closedDate = repledgeData.new_date
  await closePledge(originalPledgeId, closedDate)

  const newPledge = await createPledge({
    date: repledgeData.new_date,
    customer_name: originalPledge.customer_name,
    phone_number: originalPledge.phone_number,
    place: originalPledge.place,
    jewels_details: originalPledge.jewels_details,
    no_of_items: originalPledge.no_of_items,
    gross_weight: originalPledge.gross_weight,
    net_weight: originalPledge.net_weight,
    jewel_type: originalPledge.jewel_type,
    interest_rate: repledgeData.interest_rate,
    loan_amount: repledgeData.new_total_amount,
    parent_pledge_id: originalPledgeId,
    parent_pledge_no: originalPledge.pledge_no,
    notes: repledgeData.notes ? 
      `${repledgeData.notes} | Re-pledged from ${originalPledge.pledge_no}` :
      `Re-pledged from ${originalPledge.pledge_no}`
  })

  await updatePledge(originalPledgeId, {
    return_pledge_id: newPledge.id,
    return_pledge_no: newPledge.pledge_no
  })

  return { 
    newPledge, 
    closedPledge: originalPledge,
    settlement: {
      principal: repledgeData.old_principal,
      interest: repledgeData.old_interest,
      total: repledgeData.settlement_amount
    }
  }
}

// ============================================
// DASHBOARD STATS
// ============================================

export const getDashboardStats = async () => {
  const today = format(new Date(), 'yyyy-MM-dd')
  
  if (sql) {
    try {
      const activeCount = await sql`SELECT COUNT(*) as count FROM pledges WHERE status = 'ACTIVE'`
      const todayCount = await sql`SELECT COUNT(*) as count FROM pledges WHERE date = ${today}`
      
      const activePledges = await sql`SELECT id FROM pledges WHERE status = 'ACTIVE'`
      const pledgeIds = activePledges.map(p => p.id)
      
      let totalPrincipal = 0
      let totalInterest = 0

      if (pledgeIds.length > 0) {
        const amounts = await sql`
          SELECT * FROM pledge_amounts WHERE pledge_id = ANY(${pledgeIds})
        `
        const totals = calculatePledgeTotals(amounts || [])
        totalPrincipal = totals.totalPrincipal
        totalInterest = totals.totalInterest
      }

      return {
        activePledges: parseInt(activeCount[0]?.count || 0),
        todayEntries: parseInt(todayCount[0]?.count || 0),
        totalPrincipal,
        totalInterest,
        grandTotal: totalPrincipal + totalInterest
      }
    } catch (error) {
      console.error('Error getting dashboard stats:', error)
      return { activePledges: 0, todayEntries: 0, totalPrincipal: 0, totalInterest: 0, grandTotal: 0 }
    }
  }

  // Mock fallback
  const pledges = getStoredData(STORAGE_KEYS.PLEDGES)
  const amounts = getStoredData(STORAGE_KEYS.AMOUNTS)
  
  const activePledgesData = pledges.filter(p => p.status === 'ACTIVE')
  const todayEntries = pledges.filter(p => p.date === today)

  const activeAmounts = amounts.filter(a => 
    activePledgesData.some(p => p.id === a.pledge_id)
  )

  const totals = calculatePledgeTotals(activeAmounts)

  return {
    activePledges: activePledgesData.length,
    todayEntries: todayEntries.length,
    totalPrincipal: totals.totalPrincipal,
    totalInterest: totals.totalInterest,
    grandTotal: totals.grandTotal
  }
}

// ============================================
// OWNER RE-PLEDGE OPERATIONS
// ============================================

const OWNER_REPLEDGES_KEY = 'sriorusol_owner_repledges'

export const calculateOwnerRepledgeDuration = (debtDate, releaseDate = new Date()) => {
  const start = new Date(debtDate)
  const end = new Date(releaseDate)
  const totalDays = Math.max(0, Math.ceil((end - start) / (1000 * 60 * 60 * 24)))
  const months = Math.floor(totalDays / 31)
  const days = totalDays % 31
  return { totalDays, months, days }
}

export const calculateOwnerRepledgeInterest = (amount, interestRate, debtDate, releaseDate = new Date()) => {
  const { totalDays, months, days } = calculateOwnerRepledgeDuration(debtDate, releaseDate)
  const interest = amount * (interestRate / 100) * (months + days / 31)
  return {
    totalDays,
    months,
    days,
    interest: Math.round(interest * 100) / 100
  }
}

export const createOwnerRepledge = async (pledgeId, repledgeData) => {
  const ownerRepledge = {
    id: generateId(),
    pledge_id: pledgeId,
    financer_name: repledgeData.financer_name,
    financer_place: repledgeData.financer_place || null,
    amount: repledgeData.amount,
    interest_rate: repledgeData.interest_rate || 2.00,
    debt_date: repledgeData.debt_date,
    release_date: null,
    status: 'ACTIVE',
    notes: repledgeData.notes || null
  }

  if (sql) {
    try {
      await sql`
        INSERT INTO owner_repledges (id, pledge_id, financer_name, financer_place, amount, interest_rate, debt_date, release_date, status, notes, created_at)
        VALUES (${ownerRepledge.id}, ${ownerRepledge.pledge_id}, ${ownerRepledge.financer_name}, 
          ${ownerRepledge.financer_place}, ${ownerRepledge.amount}, ${ownerRepledge.interest_rate},
          ${ownerRepledge.debt_date}, ${ownerRepledge.release_date}, ${ownerRepledge.status}, 
          ${ownerRepledge.notes}, NOW())
      `
      return ownerRepledge
    } catch (error) {
      console.error('Error creating owner repledge:', error)
      throw error
    }
  }

  // Mock fallback
  const ownerRepledges = getStoredData(OWNER_REPLEDGES_KEY)
  ownerRepledges.push({ ...ownerRepledge, created_at: new Date().toISOString() })
  setStoredData(OWNER_REPLEDGES_KEY, ownerRepledges)
  return ownerRepledge
}

export const getOwnerRepledgesByPledgeId = async (pledgeId) => {
  if (sql) {
    try {
      const result = await sql`
        SELECT * FROM owner_repledges WHERE pledge_id = ${pledgeId} ORDER BY created_at DESC
      `
      return result || []
    } catch (error) {
      console.error('Error getting owner repledges:', error)
      return []
    }
  }

  // Mock fallback
  const ownerRepledges = getStoredData(OWNER_REPLEDGES_KEY)
  return ownerRepledges
    .filter(r => r.pledge_id === pledgeId)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
}

export const closeOwnerRepledge = async (id, releaseDate) => {
  if (sql) {
    try {
      await sql`
        UPDATE owner_repledges SET status = 'CLOSED', release_date = ${releaseDate} WHERE id = ${id}
      `
      const result = await sql`SELECT * FROM owner_repledges WHERE id = ${id}`
      return result[0]
    } catch (error) {
      console.error('Error closing owner repledge:', error)
      throw error
    }
  }

  // Mock fallback
  const ownerRepledges = getStoredData(OWNER_REPLEDGES_KEY)
  const index = ownerRepledges.findIndex(r => r.id === id)
  if (index === -1) throw new Error('Owner re-pledge not found')
  
  ownerRepledges[index] = { ...ownerRepledges[index], status: 'CLOSED', release_date: releaseDate }
  setStoredData(OWNER_REPLEDGES_KEY, ownerRepledges)
  return ownerRepledges[index]
}

export const getActiveOwnerRepledges = async () => {
  if (sql) {
    try {
      const result = await sql`
        SELECT o.*, p.pledge_no, p.customer_name, p.jewels_details, p.gross_weight, p.net_weight
        FROM owner_repledges o
        LEFT JOIN pledges p ON o.pledge_id = p.id
        WHERE o.status = 'ACTIVE'
        ORDER BY o.created_at DESC
      `
      return result || []
    } catch (error) {
      console.error('Error getting active owner repledges:', error)
      return []
    }
  }

  // Mock fallback
  const ownerRepledges = getStoredData(OWNER_REPLEDGES_KEY)
  const pledges = getStoredData(STORAGE_KEYS.PLEDGES)
  
  return ownerRepledges
    .filter(r => r.status === 'ACTIVE')
    .map(r => ({
      ...r,
      pledges: pledges.find(p => p.id === r.pledge_id)
    }))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
}

// Storage key for standalone financers
const FINANCERS_KEY = 'sriorusol_financers'

export const getFinancerList = async () => {
  if (sql) {
    try {
      // Join with pledges table to check pledge status
      // A financer pledge is only ACTIVE if both owner_repledge AND pledge are ACTIVE
      const result = await sql`
        SELECT 
          MAX(TRIM(o.financer_name)) as name, 
          MAX(o.financer_place) as place,
          SUM(o.amount) as total_amount,
          SUM(CASE WHEN o.status = 'ACTIVE' AND p.status = 'ACTIVE' THEN o.amount ELSE 0 END) as active_amount,
          SUM(CASE WHEN o.status = 'CLOSED' OR p.status = 'CLOSED' THEN o.amount ELSE 0 END) as closed_amount,
          COUNT(*) as pledge_count,
          COUNT(CASE WHEN o.status = 'ACTIVE' AND p.status = 'ACTIVE' THEN 1 END) as active_count,
          COUNT(CASE WHEN o.status = 'CLOSED' OR p.status = 'CLOSED' THEN 1 END) as closed_count
        FROM owner_repledges o
        LEFT JOIN pledges p ON o.pledge_id = p.id
        GROUP BY LOWER(TRIM(o.financer_name))
        ORDER BY MAX(TRIM(o.financer_name)) ASC
      `
      return result || []
    } catch (error) {
      console.error('Error getting financer list:', error)
      return []
    }
  }

  // Mock fallback
  const ownerRepledges = getStoredData(OWNER_REPLEDGES_KEY)
  const pledges = getStoredData(STORAGE_KEYS.PLEDGES)
  const standaloneFinancers = getStoredData(FINANCERS_KEY)
  const financerMap = new Map()
  
  standaloneFinancers.forEach(item => {
    const normalizedKey = item.name?.trim().toLowerCase()
    if (normalizedKey && !financerMap.has(normalizedKey)) {
      financerMap.set(normalizedKey, { name: item.name.trim(), place: item.place, total_amount: 0, active_amount: 0, closed_amount: 0, pledge_count: 0, active_count: 0, closed_count: 0 })
    }
  })
  
  ownerRepledges.forEach(item => {
    const normalizedKey = item.financer_name?.trim().toLowerCase()
    if (!normalizedKey) return
    
    // Get pledge status
    const pledge = pledges.find(p => p.id === item.pledge_id)
    const pledgeIsActive = pledge?.status === 'ACTIVE'
    const isActive = item.status === 'ACTIVE' && pledgeIsActive
    
    if (!financerMap.has(normalizedKey)) {
      financerMap.set(normalizedKey, { 
        name: item.financer_name.trim(), 
        place: item.financer_place, 
        total_amount: 0,
        active_amount: 0,
        closed_amount: 0,
        pledge_count: 0,
        active_count: 0,
        closed_count: 0
      })
    }
    const financer = financerMap.get(normalizedKey)
    financer.total_amount += (item.amount || 0)
    financer.pledge_count += 1
    if (isActive) {
      financer.active_count += 1
      financer.active_amount += (item.amount || 0)
    } else {
      financer.closed_count += 1
      financer.closed_amount += (item.amount || 0)
    }
  })
  
  return Array.from(financerMap.values()).sort((a, b) => a.name.localeCompare(b.name))
}

export const addFinancer = async (financerData) => {
  const financer = {
    id: generateId(),
    name: financerData.name,
    place: financerData.place || null
  }

  if (sql) {
    try {
      await sql`
        INSERT INTO financers (id, name, place, created_at) 
        VALUES (${financer.id}, ${financer.name}, ${financer.place}, NOW())
      `
      return financer
    } catch (error) {
      console.error('Error adding financer:', error)
      // Fallback to localStorage
      const financers = getStoredData(FINANCERS_KEY)
      financers.push({ ...financer, created_at: new Date().toISOString() })
      setStoredData(FINANCERS_KEY, financers)
      return financer
    }
  }

  // Mock fallback
  const financers = getStoredData(FINANCERS_KEY)
  financers.push({ ...financer, created_at: new Date().toISOString() })
  setStoredData(FINANCERS_KEY, financers)
  return financer
}

export const deleteFinancer = async (name) => {
  if (sql) {
    try {
      await sql`DELETE FROM financers WHERE name = ${name}`
      return
    } catch (error) {
      // Fallback to localStorage
      const financers = getStoredData(FINANCERS_KEY)
      const filtered = financers.filter(f => f.name !== name)
      setStoredData(FINANCERS_KEY, filtered)
      return
    }
  }

  // Mock fallback
  const financers = getStoredData(FINANCERS_KEY)
  const filtered = financers.filter(f => f.name !== name)
  setStoredData(FINANCERS_KEY, filtered)
}

export const getOwnerRepledgesByFinancer = async (financerName) => {
  if (sql) {
    try {
      // Include pledge status to determine effective status
      // If pledge is CLOSED, the financer pledge is also considered CLOSED
      const result = await sql`
        SELECT o.*, 
          p.pledge_no, p.customer_name, p.jewels_details, p.gross_weight, p.net_weight, p.date as pledge_date, p.phone_number, p.status as pledge_status,
          CASE WHEN p.status = 'CLOSED' THEN 'CLOSED' ELSE o.status END as effective_status
        FROM owner_repledges o
        LEFT JOIN pledges p ON o.pledge_id = p.id
        WHERE LOWER(TRIM(o.financer_name)) = LOWER(TRIM(${financerName}))
        ORDER BY o.created_at DESC
      `
      // Map effective_status to status for display
      return (result || []).map(r => ({
        ...r,
        status: r.effective_status || r.status
      }))
    } catch (error) {
      console.error('Error getting owner repledges by financer:', error)
      return []
    }
  }

  // Mock fallback
  const ownerRepledges = getStoredData(OWNER_REPLEDGES_KEY)
  const pledges = getStoredData(STORAGE_KEYS.PLEDGES)
  const normalizedName = financerName.trim().toLowerCase()
  
  return ownerRepledges
    .filter(r => r.financer_name?.trim().toLowerCase() === normalizedName)
    .map(r => {
      const pledge = pledges.find(p => p.id === r.pledge_id)
      // If pledge is closed, financer pledge is also closed
      const effectiveStatus = pledge?.status === 'CLOSED' ? 'CLOSED' : r.status
      return {
        ...r,
        status: effectiveStatus,
        pledge_no: pledge?.pledge_no,
        customer_name: pledge?.customer_name,
        jewels_details: pledge?.jewels_details,
        gross_weight: pledge?.gross_weight,
        net_weight: pledge?.net_weight,
        pledge_date: pledge?.date
      }
    })
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
}

export const getAllOwnerRepledges = async () => {
  if (sql) {
    try {
      const result = await sql`
        SELECT o.*, p.pledge_no, p.customer_name
        FROM owner_repledges o
        LEFT JOIN pledges p ON o.pledge_id = p.id
        ORDER BY o.financer_name ASC
      `
      return result || []
    } catch (error) {
      console.error('Error getting all owner repledges:', error)
      return []
    }
  }

  // Mock fallback
  const ownerRepledges = getStoredData(OWNER_REPLEDGES_KEY)
  const pledges = getStoredData(STORAGE_KEYS.PLEDGES)
  
  return ownerRepledges
    .map(r => {
      const pledge = pledges.find(p => p.id === r.pledge_id)
      return {
        ...r,
        pledge_no: pledge?.pledge_no,
        customer_name: pledge?.customer_name
      }
    })
    .sort((a, b) => a.financer_name.localeCompare(b.financer_name))
}

export const getAllPledgesWithAmounts = async () => {
  if (sql) {
    try {
      const pledges = await sql`SELECT * FROM pledges ORDER BY date DESC`
      const amounts = await sql`SELECT * FROM pledge_amounts`
      const ownerRepledges = await sql`
        SELECT pledge_id, financer_name FROM owner_repledges WHERE status = 'ACTIVE'
      `

      return (pledges || []).map(pledge => {
        const pledgeAmounts = (amounts || []).filter(a => a.pledge_id === pledge.id)
        const totals = calculatePledgeTotals(pledgeAmounts, pledge.canceled_date)
        const ownerRepledge = (ownerRepledges || []).find(r => r.pledge_id === pledge.id)
        return {
          ...pledge,
          ...totals,
          financer_name: ownerRepledge?.financer_name || ''
        }
      })
    } catch (error) {
      console.error('Error getting all pledges with amounts:', error)
      return []
    }
  }

  // Mock fallback
  const pledges = getStoredData(STORAGE_KEYS.PLEDGES)
  const amounts = getStoredData(STORAGE_KEYS.AMOUNTS)
  const ownerRepledges = getStoredData(OWNER_REPLEDGES_KEY)

  return pledges.map(pledge => {
    const pledgeAmounts = amounts.filter(a => a.pledge_id === pledge.id)
    const totals = calculatePledgeTotals(pledgeAmounts, pledge.canceled_date)
    const ownerRepledge = ownerRepledges.find(r => r.pledge_id === pledge.id && r.status === 'ACTIVE')
    return {
      ...pledge,
      ...totals,
      financer_name: ownerRepledge?.financer_name || ''
    }
  }).sort((a, b) => new Date(b.date) - new Date(a.date))
}

export const getActivePledgesWithAmounts = async () => {
  if (sql) {
    try {
      const pledges = await sql`SELECT * FROM pledges WHERE status = 'ACTIVE' ORDER BY date DESC`
      const amounts = await sql`SELECT * FROM pledge_amounts`
      const ownerRepledges = await sql`
        SELECT pledge_id, financer_name FROM owner_repledges WHERE status = 'ACTIVE'
      `

      return (pledges || []).map(pledge => {
        const pledgeAmounts = (amounts || []).filter(a => a.pledge_id === pledge.id)
        const totals = calculatePledgeTotals(pledgeAmounts, pledge.canceled_date)
        const ownerRepledge = (ownerRepledges || []).find(r => r.pledge_id === pledge.id)
        return {
          ...pledge,
          ...totals,
          financer_name: ownerRepledge?.financer_name || ''
        }
      })
    } catch (error) {
      console.error('Error getting active pledges with amounts:', error)
      return []
    }
  }

  // Mock fallback
  const pledges = getStoredData(STORAGE_KEYS.PLEDGES).filter(p => p.status === 'ACTIVE')
  const amounts = getStoredData(STORAGE_KEYS.AMOUNTS)
  const ownerRepledges = getStoredData(OWNER_REPLEDGES_KEY)

  return pledges.map(pledge => {
    const pledgeAmounts = amounts.filter(a => a.pledge_id === pledge.id)
    const totals = calculatePledgeTotals(pledgeAmounts, pledge.canceled_date)
    const ownerRepledge = ownerRepledges.find(r => r.pledge_id === pledge.id && r.status === 'ACTIVE')
    return {
      ...pledge,
      ...totals,
      financer_name: ownerRepledge?.financer_name || ''
    }
  }).sort((a, b) => new Date(b.date) - new Date(a.date))
}

export const getClosedPledgesWithAmounts = async () => {
  if (sql) {
    try {
      const pledges = await sql`SELECT * FROM pledges WHERE status = 'CLOSED' ORDER BY date DESC`
      const amounts = await sql`SELECT * FROM pledge_amounts`
      const ownerRepledges = await sql`SELECT pledge_id, financer_name FROM owner_repledges`

      return (pledges || []).map(pledge => {
        const pledgeAmounts = (amounts || []).filter(a => a.pledge_id === pledge.id)
        const totals = calculatePledgeTotals(pledgeAmounts, pledge.canceled_date)
        const ownerRepledge = (ownerRepledges || []).find(r => r.pledge_id === pledge.id)
        return {
          ...pledge,
          ...totals,
          financer_name: ownerRepledge?.financer_name || ''
        }
      })
    } catch (error) {
      console.error('Error getting closed pledges with amounts:', error)
      return []
    }
  }

  // Mock fallback
  const pledges = getStoredData(STORAGE_KEYS.PLEDGES).filter(p => p.status === 'CLOSED')
  const amounts = getStoredData(STORAGE_KEYS.AMOUNTS)
  const ownerRepledges = getStoredData(OWNER_REPLEDGES_KEY)

  return pledges.map(pledge => {
    const pledgeAmounts = amounts.filter(a => a.pledge_id === pledge.id)
    const totals = calculatePledgeTotals(pledgeAmounts, pledge.canceled_date)
    const ownerRepledge = ownerRepledges.find(r => r.pledge_id === pledge.id)
    return {
      ...pledge,
      ...totals,
      financer_name: ownerRepledge?.financer_name || ''
    }
  }).sort((a, b) => new Date(b.date) - new Date(a.date))
}
