import { format } from 'date-fns'
import { sql } from './neonClient'
import { 
  calculateInterestMonths,
  calculateInterest,
  calculatePledgeTotals,
  getDefaultInterestRate,
  JEWEL_TYPES
} from './neonDatabase'

// Re-export shared utilities
export { 
  calculateInterestMonths, 
  calculateInterest, 
  calculatePledgeTotals, 
  getDefaultInterestRate,
  JEWEL_TYPES 
}

// ============================================
// MOCK DATA STORAGE (localStorage fallback) - SECOND CATEGORY
// 3 Essential Tables: pledges_second, pledge_amounts_second, owner_repledges_second
// ============================================
const STORAGE_KEYS = {
  PLEDGES: 'sriorusol_pledges_second',
  AMOUNTS: 'sriorusol_pledge_amounts_second'
}

const OWNER_REPLEDGES_KEY = 'sriorusol_owner_repledges_second'

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
// PLEDGE OPERATIONS - SECOND CATEGORY
// ============================================

// Generate pledge number for Second category
export const generatePledgeNo = async () => {
  const year = new Date().getFullYear()
  
  if (sql) {
    try {
      const result = await sql`
        SELECT COUNT(*) as count FROM pledges_second 
        WHERE pledge_no LIKE ${'SRI2-' + year + '-%'}
      `
      const count = parseInt(result[0]?.count || 0)
      return `SRI2-${year}-${String(count + 1).padStart(4, '0')}`
    } catch (error) {
      console.error('Error generating pledge no:', error)
    }
  }
  
  // Mock fallback
  const pledges = getStoredData(STORAGE_KEYS.PLEDGES)
  const yearPledges = pledges.filter(p => p.pledge_no?.includes(`SRI2-${year}`))
  return `SRI2-${year}-${String(yearPledges.length + 1).padStart(4, '0')}`
}

// Create new pledge - Second category
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
      await sql`
        INSERT INTO pledges_second (id, pledge_no, date, customer_name, phone_number, place, jewels_details, 
          no_of_items, gross_weight, net_weight, jewel_type, interest_rate, status, canceled_date,
          parent_pledge_id, parent_pledge_no, created_at, updated_at)
        VALUES (${pledge.id}, ${pledge.pledge_no}, ${pledge.date}, ${pledge.customer_name}, 
          ${pledge.phone_number}, ${pledge.place}, ${pledge.jewels_details}, ${pledge.no_of_items},
          ${pledge.gross_weight}, ${pledge.net_weight}, ${pledge.jewel_type}, ${pledge.interest_rate},
          ${pledge.status}, ${pledge.canceled_date}, ${pledge.parent_pledge_id}, ${pledge.parent_pledge_no},
          NOW(), NOW())
      `
      
      await sql`
        INSERT INTO pledge_amounts_second (id, pledge_id, amount, date, interest_rate, amount_type, notes, created_at)
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

// Get pledge by ID - Second category
export const getPledgeById = async (id) => {
  if (sql) {
    try {
      const pledges = await sql`SELECT * FROM pledges_second WHERE id = ${id}`
      if (!pledges || pledges.length === 0) return null
      
      const pledge = pledges[0]
      const amounts = await sql`
        SELECT * FROM pledge_amounts_second WHERE pledge_id = ${id} ORDER BY date ASC
      `
      
      const ownerRepledges = await sql`
        SELECT * FROM owner_repledges_second WHERE pledge_id = ${id} ORDER BY created_at DESC
      `
      
      const endDate = (pledge.status === 'CLOSED' || pledge.status === 'REPLEDGED') && pledge.canceled_date
        ? new Date(pledge.canceled_date)
        : new Date()
      
      const totals = calculatePledgeTotals(amounts || [], endDate)

      return {
        ...pledge,
        amounts: amounts || [],
        ownerRepledges: ownerRepledges || [],
        repledges: [],
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

  const ownerRepledges = getStoredData(OWNER_REPLEDGES_KEY)
    .filter(r => r.pledge_id === id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  const endDate = (pledge.status === 'CLOSED' || pledge.status === 'REPLEDGED') && pledge.canceled_date
    ? new Date(pledge.canceled_date)
    : new Date()
  
  const totals = calculatePledgeTotals(amounts, endDate)

  return {
    ...pledge,
    amounts,
    ownerRepledges,
    repledges: [],
    ...totals
  }
}

// Get active pledges - Second category
export const getActivePledges = async () => {
  if (sql) {
    try {
      const pledges = await sql`
        SELECT * FROM pledges_second WHERE status = 'ACTIVE' ORDER BY date DESC, pledge_no DESC
      `
      
      const pledgeIds = pledges.map(p => p.id)
      if (pledgeIds.length === 0) return []
      
      const allAmounts = await sql`
        SELECT * FROM pledge_amounts_second WHERE pledge_id = ANY(${pledgeIds})
      `

      return pledges.map(pledge => {
        const amounts = allAmounts?.filter(a => a.pledge_id === pledge.id) || []
        const totals = calculatePledgeTotals(amounts, new Date())
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
    .sort((a, b) => {
      const dateCompare = new Date(b.date) - new Date(a.date)
      if (dateCompare !== 0) return dateCompare
      return (parseInt(b.pledge_no) || 0) - (parseInt(a.pledge_no) || 0)
    })

  const allAmounts = getStoredData(STORAGE_KEYS.AMOUNTS)

  return pledges.map(pledge => {
    const amounts = allAmounts.filter(a => a.pledge_id === pledge.id)
    const totals = calculatePledgeTotals(amounts, new Date())
    return { ...pledge, amounts, ...totals }
  })
}

// Get closed pledges - Second category
export const getClosedPledges = async () => {
  if (sql) {
    try {
      const pledges = await sql`
        SELECT * FROM pledges_second WHERE status IN ('CLOSED', 'REPLEDGED') ORDER BY date DESC, pledge_no DESC
      `
      
      const pledgeIds = pledges.map(p => p.id)
      if (pledgeIds.length === 0) return []
      
      const allAmounts = await sql`
        SELECT * FROM pledge_amounts_second WHERE pledge_id = ANY(${pledgeIds})
      `

      return pledges.map(pledge => {
        const amounts = allAmounts?.filter(a => a.pledge_id === pledge.id) || []
        const endDate = pledge.canceled_date ? new Date(pledge.canceled_date) : new Date()
        const totals = calculatePledgeTotals(amounts, endDate)
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
    .sort((a, b) => {
      const dateCompare = new Date(b.date) - new Date(a.date)
      if (dateCompare !== 0) return dateCompare
      return (parseInt(b.pledge_no) || 0) - (parseInt(a.pledge_no) || 0)
    })

  const allAmounts = getStoredData(STORAGE_KEYS.AMOUNTS)

  return pledges.map(pledge => {
    const amounts = allAmounts.filter(a => a.pledge_id === pledge.id)
    const endDate = pledge.canceled_date ? new Date(pledge.canceled_date) : new Date()
    const totals = calculatePledgeTotals(amounts, endDate)
    return { ...pledge, amounts, ...totals }
  })
}

// Get all pledges - Second category
export const getAllPledges = async () => {
  if (sql) {
    try {
      const pledges = await sql`SELECT * FROM pledges_second ORDER BY date DESC, pledge_no DESC`
      
      const pledgeIds = pledges.map(p => p.id)
      if (pledgeIds.length === 0) return []
      
      const allAmounts = await sql`
        SELECT * FROM pledge_amounts_second WHERE pledge_id = ANY(${pledgeIds})
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
      console.error('Error getting all pledges:', error)
      return []
    }
  }

  // Mock fallback
  const pledges = getStoredData(STORAGE_KEYS.PLEDGES)
    .sort((a, b) => {
      const dateCompare = new Date(b.date) - new Date(a.date)
      if (dateCompare !== 0) return dateCompare
      return (parseInt(b.pledge_no) || 0) - (parseInt(a.pledge_no) || 0)
    })

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

// Search pledges - Second category
export const searchPledges = async (query, status = 'ALL') => {
  const searchPattern = `%${query}%`
  
  if (sql) {
    try {
      let pledges
      if (status !== 'ALL') {
        pledges = await sql`
          SELECT * FROM pledges_second 
          WHERE status = ${status}
          AND (customer_name ILIKE ${searchPattern} 
            OR place ILIKE ${searchPattern} 
            OR pledge_no ILIKE ${searchPattern}
            OR phone_number ILIKE ${searchPattern})
          ORDER BY date DESC, pledge_no DESC
        `
      } else {
        pledges = await sql`
          SELECT * FROM pledges_second 
          WHERE customer_name ILIKE ${searchPattern} 
            OR place ILIKE ${searchPattern} 
            OR pledge_no ILIKE ${searchPattern}
            OR phone_number ILIKE ${searchPattern}
          ORDER BY date DESC, pledge_no DESC
        `
      }
      
      const pledgeIds = pledges.map(p => p.id)
      if (pledgeIds.length === 0) return []
      
      const allAmounts = await sql`
        SELECT * FROM pledge_amounts_second WHERE pledge_id = ANY(${pledgeIds})
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
  const searchLower = query.toLowerCase()
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

// Update pledge - Second category
export const updatePledge = async (id, updates) => {
  if (sql) {
    try {
      await sql`
        UPDATE pledges_second 
        SET pledge_no = COALESCE(${updates.pledge_no}, pledge_no),
            customer_name = COALESCE(${updates.customer_name}, customer_name),
            phone_number = COALESCE(${updates.phone_number}, phone_number),
            place = COALESCE(${updates.place}, place),
            date = COALESCE(${updates.date}, date),
            jewels_details = COALESCE(${updates.jewels_details}, jewels_details),
            no_of_items = COALESCE(${updates.no_of_items}, no_of_items),
            gross_weight = COALESCE(${updates.gross_weight}, gross_weight),
            net_weight = COALESCE(${updates.net_weight}, net_weight),
            jewel_type = COALESCE(${updates.jewel_type}, jewel_type),
            interest_rate = COALESCE(${updates.interest_rate}, interest_rate),
            status = COALESCE(${updates.status}, status),
            canceled_date = COALESCE(${updates.canceled_date}, canceled_date),
            return_pledge_id = COALESCE(${updates.return_pledge_id}, return_pledge_id),
            return_pledge_no = COALESCE(${updates.return_pledge_no}, return_pledge_no),
            updated_at = NOW()
        WHERE id = ${id}
      `
      
      // If initialAmount is provided, update the INITIAL amount entry
      if (updates.initialAmount !== undefined && updates.initialAmount !== null) {
        await sql`
          UPDATE pledge_amounts_second 
          SET amount = ${updates.initialAmount},
              date = COALESCE(${updates.date}, date),
              interest_rate = COALESCE(${updates.interest_rate}, interest_rate)
          WHERE pledge_id = ${id} AND amount_type = 'INITIAL'
        `
      }
      
      const result = await sql`SELECT * FROM pledges_second WHERE id = ${id}`
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
  
  // Update initial amount in mock storage
  if (updates.initialAmount !== undefined && updates.initialAmount !== null) {
    const amounts = getStoredData(STORAGE_KEYS.AMOUNTS)
    const amountIndex = amounts.findIndex(a => a.pledge_id === id && a.amount_type === 'INITIAL')
    if (amountIndex !== -1) {
      amounts[amountIndex].amount = updates.initialAmount
      if (updates.date) amounts[amountIndex].date = updates.date
      if (updates.interest_rate) amounts[amountIndex].interest_rate = updates.interest_rate
      setStoredData(STORAGE_KEYS.AMOUNTS, amounts)
    }
  }
  
  return pledges[index]
}

// Close pledge - Second category
export const closePledge = async (id, closedDate, returnPledgeNo) => {
  const closeDate = closedDate || format(new Date(), 'yyyy-MM-dd')
  
  const closedPledge = await updatePledge(id, {
    status: 'CLOSED',
    canceled_date: closeDate,
    return_pledge_no: returnPledgeNo || null
  })
  
  // Auto-close owner repledges
  if (sql) {
    try {
      await sql`
        UPDATE owner_repledges_second 
        SET status = 'CLOSED', release_date = ${closeDate}
        WHERE pledge_id = ${id} AND status = 'ACTIVE'
      `
    } catch (error) {
      console.error('Error closing owner repledges:', error)
    }
  } else {
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
// AMOUNT OPERATIONS - SECOND CATEGORY
// ============================================

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
        INSERT INTO pledge_amounts_second (id, pledge_id, amount, date, interest_rate, amount_type, notes, created_at)
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
// REPLEDGE OPERATIONS - SECOND CATEGORY
// ============================================

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

  await updatePledge(originalPledgeId, { status: 'REPLEDGED' })

  return { newPledge }
}

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
    parent_pledge_no: originalPledge.pledge_no
  })

  await updatePledge(originalPledgeId, {
    return_pledge_id: newPledge.id,
    return_pledge_no: newPledge.pledge_no
  })

  return { newPledge, closedPledge: originalPledge }
}

// ============================================
// DASHBOARD STATS - SECOND CATEGORY
// ============================================

export const getDashboardStats = async () => {
  const today = format(new Date(), 'yyyy-MM-dd')
  
  if (sql) {
    try {
      const activeCount = await sql`SELECT COUNT(*) as count FROM pledges_second WHERE status = 'ACTIVE'`
      const todayCount = await sql`SELECT COUNT(*) as count FROM pledges_second WHERE date = ${today}`
      
      const activePledges = await sql`SELECT id FROM pledges_second WHERE status = 'ACTIVE'`
      const pledgeIds = activePledges.map(p => p.id)
      
      let totalPrincipal = 0
      let totalInterest = 0

      if (pledgeIds.length > 0) {
        const amounts = await sql`
          SELECT * FROM pledge_amounts_second WHERE pledge_id = ANY(${pledgeIds})
        `
        const totals = calculatePledgeTotals(amounts || [], new Date())
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

  const totals = calculatePledgeTotals(activeAmounts, new Date())

  return {
    activePledges: activePledgesData.length,
    todayEntries: todayEntries.length,
    totalPrincipal: totals.totalPrincipal,
    totalInterest: totals.totalInterest,
    grandTotal: totals.grandTotal
  }
}

// ============================================
// OWNER REPLEDGE OPERATIONS - SECOND CATEGORY
// ============================================

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
        INSERT INTO owner_repledges_second (id, pledge_id, financer_name, financer_place, amount, interest_rate, debt_date, release_date, status, notes, created_at)
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
        SELECT * FROM owner_repledges_second WHERE pledge_id = ${pledgeId} ORDER BY created_at DESC
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
        UPDATE owner_repledges_second SET status = 'CLOSED', release_date = ${releaseDate} WHERE id = ${id}
      `
      const result = await sql`SELECT * FROM owner_repledges_second WHERE id = ${id}`
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

export const updateOwnerRepledge = async (id, updates) => {
  if (sql) {
    try {
      await sql`
        UPDATE owner_repledges_second 
        SET financer_name = COALESCE(${updates.financer_name}, financer_name),
            amount = COALESCE(${updates.amount}, amount),
            debt_date = COALESCE(${updates.debt_date}, debt_date),
            notes = COALESCE(${updates.notes}, notes)
        WHERE id = ${id}
      `
      const result = await sql`SELECT * FROM owner_repledges_second WHERE id = ${id}`
      return result[0]
    } catch (error) {
      console.error('Error updating owner repledge:', error)
      throw error
    }
  }

  // Mock fallback
  const ownerRepledges = getStoredData(OWNER_REPLEDGES_KEY)
  const index = ownerRepledges.findIndex(r => r.id === id)
  if (index === -1) throw new Error('Owner re-pledge not found')
  
  ownerRepledges[index] = { 
    ...ownerRepledges[index], 
    financer_name: updates.financer_name || ownerRepledges[index].financer_name,
    amount: updates.amount || ownerRepledges[index].amount,
    debt_date: updates.debt_date || ownerRepledges[index].debt_date,
    notes: updates.notes !== undefined ? updates.notes : ownerRepledges[index].notes
  }
  setStoredData(OWNER_REPLEDGES_KEY, ownerRepledges)
  return ownerRepledges[index]
}

// ============================================
// FINANCER OPERATIONS - SECOND CATEGORY
// ============================================

export const getFinancerList = async () => {
  if (sql) {
    try {
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
        FROM owner_repledges_second o
        LEFT JOIN pledges_second p ON o.pledge_id = p.id
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
  const financerMap = new Map()
  
  ownerRepledges.forEach(item => {
    const normalizedKey = item.financer_name?.trim().toLowerCase()
    if (!normalizedKey) return
    
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

export const getOwnerRepledgesByFinancer = async (financerName) => {
  if (sql) {
    try {
      const result = await sql`
        SELECT o.*, 
          p.pledge_no, p.customer_name, p.jewels_details, p.gross_weight, p.net_weight, p.date as pledge_date, p.phone_number, p.status as pledge_status,
          CASE WHEN p.status = 'CLOSED' THEN 'CLOSED' ELSE o.status END as effective_status
        FROM owner_repledges_second o
        LEFT JOIN pledges_second p ON o.pledge_id = p.id
        WHERE LOWER(TRIM(o.financer_name)) = LOWER(TRIM(${financerName}))
        ORDER BY o.debt_date DESC, p.pledge_no DESC
      `
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
    .sort((a, b) => {
      const dateCompare = new Date(b.debt_date) - new Date(a.debt_date)
      if (dateCompare !== 0) return dateCompare
      return (parseInt(b.pledge_no) || 0) - (parseInt(a.pledge_no) || 0)
    })
}

// ============================================
// PDF EXPORT HELPERS - SECOND CATEGORY
// ============================================

export const getAllPledgesWithAmounts = async () => {
  if (sql) {
    try {
      const pledges = await sql`SELECT * FROM pledges_second ORDER BY date DESC`
      const amounts = await sql`SELECT * FROM pledge_amounts_second`
      const ownerRepledges = await sql`
        SELECT pledge_id, financer_name FROM owner_repledges_second WHERE status = 'ACTIVE'
      `

      return (pledges || []).map(pledge => {
        const pledgeAmounts = (amounts || []).filter(a => a.pledge_id === pledge.id)
        const endDate = (pledge.status === 'CLOSED' || pledge.status === 'REPLEDGED') && pledge.canceled_date 
          ? new Date(pledge.canceled_date) 
          : new Date()
        const totals = calculatePledgeTotals(pledgeAmounts, endDate)
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
    const endDate = (pledge.status === 'CLOSED' || pledge.status === 'REPLEDGED') && pledge.canceled_date 
      ? new Date(pledge.canceled_date) 
      : new Date()
    const totals = calculatePledgeTotals(pledgeAmounts, endDate)
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
      const pledges = await sql`SELECT * FROM pledges_second WHERE status = 'ACTIVE' ORDER BY date DESC`
      const amounts = await sql`SELECT * FROM pledge_amounts_second`
      const ownerRepledges = await sql`
        SELECT pledge_id, financer_name FROM owner_repledges_second WHERE status = 'ACTIVE'
      `

      return (pledges || []).map(pledge => {
        const pledgeAmounts = (amounts || []).filter(a => a.pledge_id === pledge.id)
        const totals = calculatePledgeTotals(pledgeAmounts, new Date())
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
    const totals = calculatePledgeTotals(pledgeAmounts, new Date())
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
      const pledges = await sql`SELECT * FROM pledges_second WHERE status = 'CLOSED' ORDER BY date DESC`
      const amounts = await sql`SELECT * FROM pledge_amounts_second`
      const ownerRepledges = await sql`SELECT pledge_id, financer_name FROM owner_repledges_second`

      return (pledges || []).map(pledge => {
        const pledgeAmounts = (amounts || []).filter(a => a.pledge_id === pledge.id)
        const endDate = pledge.canceled_date ? new Date(pledge.canceled_date) : new Date()
        const totals = calculatePledgeTotals(pledgeAmounts, endDate)
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
    const endDate = pledge.canceled_date ? new Date(pledge.canceled_date) : new Date()
    const totals = calculatePledgeTotals(pledgeAmounts, endDate)
    const ownerRepledge = ownerRepledges.find(r => r.pledge_id === pledge.id)
    return {
      ...pledge,
      ...totals,
      financer_name: ownerRepledge?.financer_name || ''
    }
  }).sort((a, b) => new Date(b.date) - new Date(a.date))
}
