import { format } from 'date-fns'
import { 
  supabase, 
  isSupabaseConfigured, 
  executeWithRetry,
  checkConnection,
  keepAlive 
} from './supabaseClient'

// Re-export for backward compatibility
export { supabase, isSupabaseConfigured, checkConnection, keepAlive }

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
  MIXED: { rate: null, label: 'Mixed', labelTa: 'கலப்பு' } // Custom rate
}

// Calculate interest months with 0.5 month increments and 1 month minimum
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
  const { days, months } = calculateInterestMonths(startDate, endDate)
  const interest = amount * (interestRate / 100) * months
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

// ============================================
// PLEDGE OPERATIONS
// ============================================

// Generate pledge number
export const generatePledgeNo = async () => {
  const year = new Date().getFullYear()
  
  if (supabase) {
    const { count } = await supabase
      .from('pledges')
      .select('*', { count: 'exact', head: true })
      .ilike('pledge_no', `SRI-${year}-%`)
    return `SRI-${year}-${String((count || 0) + 1).padStart(4, '0')}`
  }
  
  // Mock
  const pledges = getStoredData(STORAGE_KEYS.PLEDGES)
  const yearPledges = pledges.filter(p => p.pledge_no?.includes(`SRI-${year}`))
  return `SRI-${year}-${String(yearPledges.length + 1).padStart(4, '0')}`
}

// Create new pledge
export const createPledge = async (pledgeData) => {
  // Use user-provided pledge number or generate one if not provided
  const pledgeNo = pledgeData.pledge_no || await generatePledgeNo()
  const id = generateId()
  
  // Determine interest rate based on jewel type
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
    // Parent pledge reference for re-pledge tracking
    parent_pledge_id: pledgeData.parent_pledge_id || null,
    parent_pledge_no: pledgeData.parent_pledge_no || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  // Initial amount entry
  const initialAmount = {
    id: generateId(),
    pledge_id: id,
    amount: pledgeData.loan_amount,
    date: pledgeData.date,
    interest_rate: interestRate,
    amount_type: 'INITIAL',
    notes: pledgeData.notes || null,
    created_at: new Date().toISOString()
  }

  if (supabase) {
    const { data: newPledge, error: pledgeError } = await supabase
      .from('pledges')
      .insert(pledge)
      .select()
      .single()
    
    if (pledgeError) throw pledgeError

    const { error: amountError } = await supabase
      .from('pledge_amounts')
      .insert(initialAmount)
    
    if (amountError) throw amountError

    return newPledge
  }

  // Mock storage
  const pledges = getStoredData(STORAGE_KEYS.PLEDGES)
  pledges.unshift(pledge)
  setStoredData(STORAGE_KEYS.PLEDGES, pledges)

  const amounts = getStoredData(STORAGE_KEYS.AMOUNTS)
  amounts.push(initialAmount)
  setStoredData(STORAGE_KEYS.AMOUNTS, amounts)

  return pledge
}

// Get pledge by ID with amounts and repledges
export const getPledgeById = async (id) => {
  if (supabase) {
    const { data: pledge, error } = await supabase
      .from('pledges')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error

    const { data: amounts } = await supabase
      .from('pledge_amounts')
      .select('*')
      .eq('pledge_id', id)
      .order('date', { ascending: true })

    const { data: repledges } = await supabase
      .from('repledges')
      .select('*')
      .eq('original_pledge_id', id)
      .order('date', { ascending: true })

    // For closed/repledged pledges, calculate interest up to canceled_date
    // For active pledges, calculate interest up to current date
    const endDate = (pledge.status === 'CLOSED' || pledge.status === 'REPLEDGED') && pledge.canceled_date
      ? new Date(pledge.canceled_date)
      : new Date()
    
    const totals = calculatePledgeTotals(amounts || [], endDate)

    return {
      ...pledge,
      amounts: amounts || [],
      repledges: repledges || [],
      ...totals
    }
  }

  // Mock
  const pledges = getStoredData(STORAGE_KEYS.PLEDGES)
  const pledge = pledges.find(p => p.id === id)
  if (!pledge) return null

  const amounts = getStoredData(STORAGE_KEYS.AMOUNTS)
    .filter(a => a.pledge_id === id)
    .sort((a, b) => new Date(a.date) - new Date(b.date))

  const repledges = getStoredData(STORAGE_KEYS.REPLEDGES)
    .filter(r => r.original_pledge_id === id)
    .sort((a, b) => new Date(a.date) - new Date(b.date))

  // For closed/repledged pledges, calculate interest up to canceled_date
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
  if (supabase) {
    const { data: pledges, error } = await supabase
      .from('pledges')
      .select('*')
      .eq('status', 'ACTIVE')
      .order('created_at', { ascending: false })
    
    if (error) throw error

    const pledgeIds = pledges.map(p => p.id)
    const { data: allAmounts } = await supabase
      .from('pledge_amounts')
      .select('*')
      .in('pledge_id', pledgeIds)

    return pledges.map(pledge => {
      const amounts = allAmounts?.filter(a => a.pledge_id === pledge.id) || []
      const totals = calculatePledgeTotals(amounts)
      return { ...pledge, amounts, ...totals }
    })
  }

  // Mock
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

// Get closed/repledged pledges (past data)
export const getClosedPledges = async () => {
  if (supabase) {
    const { data: pledges, error } = await supabase
      .from('pledges')
      .select('*')
      .in('status', ['CLOSED', 'REPLEDGED'])
      .order('updated_at', { ascending: false })
    
    if (error) throw error

    const pledgeIds = pledges.map(p => p.id)
    const { data: allAmounts } = await supabase
      .from('pledge_amounts')
      .select('*')
      .in('pledge_id', pledgeIds)

    return pledges.map(pledge => {
      const amounts = allAmounts?.filter(a => a.pledge_id === pledge.id) || []
      const totals = calculatePledgeTotals(amounts, pledge.canceled_date ? new Date(pledge.canceled_date) : new Date())
      return { ...pledge, amounts, ...totals }
    })
  }

  // Mock
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

// Get all pledges (both active and closed)
export const getAllPledges = async () => {
  if (supabase) {
    const { data: pledges, error } = await supabase
      .from('pledges')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error

    const pledgeIds = pledges.map(p => p.id)
    const { data: allAmounts } = await supabase
      .from('pledge_amounts')
      .select('*')
      .in('pledge_id', pledgeIds)

    return pledges.map(pledge => {
      const amounts = allAmounts?.filter(a => a.pledge_id === pledge.id) || []
      const totals = calculatePledgeTotals(amounts, pledge.status === 'CLOSED' && pledge.canceled_date ? new Date(pledge.canceled_date) : new Date())
      return { ...pledge, amounts, ...totals }
    })
  }

  // Mock
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
  
  if (supabase) {
    let queryBuilder = supabase
      .from('pledges')
      .select('*')
      .or(`customer_name.ilike.%${query}%,place.ilike.%${query}%,pledge_no.ilike.%${query}%,phone_number.ilike.%${query}%`)
    
    if (status !== 'ALL') {
      queryBuilder = queryBuilder.eq('status', status)
    }

    const { data: pledges, error } = await queryBuilder.order('created_at', { ascending: false })
    
    if (error) throw error

    const pledgeIds = pledges.map(p => p.id)
    const { data: allAmounts } = await supabase
      .from('pledge_amounts')
      .select('*')
      .in('pledge_id', pledgeIds)

    return pledges.map(pledge => {
      const amounts = allAmounts?.filter(a => a.pledge_id === pledge.id) || []
      // For closed/repledged pledges, calculate interest up to canceled_date
      const endDate = (pledge.status === 'CLOSED' || pledge.status === 'REPLEDGED') && pledge.canceled_date
        ? new Date(pledge.canceled_date)
        : new Date()
      const totals = calculatePledgeTotals(amounts, endDate)
      return { ...pledge, amounts, ...totals }
    })
  }

  // Mock
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
    // For closed/repledged pledges, calculate interest up to canceled_date
    const endDate = (pledge.status === 'CLOSED' || pledge.status === 'REPLEDGED') && pledge.canceled_date
      ? new Date(pledge.canceled_date)
      : new Date()
    const totals = calculatePledgeTotals(amounts, endDate)
    return { ...pledge, amounts, ...totals }
  })
}

// Update pledge
export const updatePledge = async (id, updates) => {
  const updateData = {
    ...updates,
    updated_at: new Date().toISOString()
  }

  if (supabase) {
    const { data, error } = await supabase
      .from('pledges')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // Mock
  const pledges = getStoredData(STORAGE_KEYS.PLEDGES)
  const index = pledges.findIndex(p => p.id === id)
  if (index === -1) throw new Error('Pledge not found')
  
  pledges[index] = { ...pledges[index], ...updateData }
  setStoredData(STORAGE_KEYS.PLEDGES, pledges)
  return pledges[index]
}

// Close pledge
export const closePledge = async (id, closedDate) => {
  return updatePledge(id, {
    status: 'CLOSED',
    canceled_date: closedDate || format(new Date(), 'yyyy-MM-dd')
  })
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
    notes: amountData.notes || null,
    created_at: new Date().toISOString()
  }

  if (supabase) {
    const { data, error } = await supabase
      .from('pledge_amounts')
      .insert(amount)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // Mock
  const amounts = getStoredData(STORAGE_KEYS.AMOUNTS)
  amounts.push(amount)
  setStoredData(STORAGE_KEYS.AMOUNTS, amounts)
  return amount
}

// ============================================
// REPLEDGE OPERATIONS
// ============================================

// Create repledge (transfer to new customer)
export const createRepledge = async (originalPledgeId, repledgeData) => {
  // Get original pledge
  const originalPledge = await getPledgeById(originalPledgeId)
  if (!originalPledge) throw new Error('Original pledge not found')

  // Create new pledge for new customer
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

  // Create repledge record
  const repledge = {
    id: generateId(),
    original_pledge_id: originalPledgeId,
    new_pledge_id: newPledge.id,
    new_customer_name: repledgeData.new_customer_name,
    amount: repledgeData.amount,
    date: repledgeData.date,
    interest_rate: repledgeData.interest_rate,
    notes: repledgeData.notes || null,
    created_at: new Date().toISOString()
  }

  if (supabase) {
    await supabase.from('repledges').insert(repledge)
  } else {
    const repledges = getStoredData(STORAGE_KEYS.REPLEDGES)
    repledges.push(repledge)
    setStoredData(STORAGE_KEYS.REPLEDGES, repledges)
  }

  // Mark original as REPLEDGED
  await updatePledge(originalPledgeId, { status: 'REPLEDGED' })

  return { newPledge, repledge }
}

// Create re-pledge for additional loan amount (same customer)
// Process: Close old pledge with interest settlement -> Create new pledge with total amount
export const createAdditionalAmountRepledge = async (originalPledgeId, repledgeData) => {
  // Get original pledge with calculated totals
  const originalPledge = await getPledgeById(originalPledgeId)
  if (!originalPledge) throw new Error('Original pledge not found')

  // Close the original pledge with interest settlement
  const closedDate = repledgeData.new_date
  await closePledge(originalPledgeId, closedDate)

  // Create new pledge with the total amount (previous principal + additional amount)
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
    // Store reference to parent pledge for tracking
    parent_pledge_id: originalPledgeId,
    parent_pledge_no: originalPledge.pledge_no,
    notes: repledgeData.notes ? 
      `${repledgeData.notes} | Re-pledged from ${originalPledge.pledge_no}. Previous Principal: ₹${repledgeData.old_principal}, Interest Settled: ₹${repledgeData.old_interest}, Additional: ₹${repledgeData.additional_amount}` :
      `Re-pledged from ${originalPledge.pledge_no}. Previous Principal: ₹${repledgeData.old_principal}, Interest Settled: ₹${repledgeData.old_interest}, Additional: ₹${repledgeData.additional_amount}`
  })

  // Update old pledge with reference to new return pledge number for easy tracking
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
  
  if (supabase) {
    const { count: activePledges } = await supabase
      .from('pledges')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'ACTIVE')

    const { count: todayEntries } = await supabase
      .from('pledges')
      .select('*', { count: 'exact', head: true })
      .eq('date', today)

    const { data: activePledgesData } = await supabase
      .from('pledges')
      .select('id')
      .eq('status', 'ACTIVE')

    const pledgeIds = activePledgesData?.map(p => p.id) || []
    
    let totalPrincipal = 0
    let totalInterest = 0

    if (pledgeIds.length > 0) {
      const { data: amounts } = await supabase
        .from('pledge_amounts')
        .select('*')
        .in('pledge_id', pledgeIds)

      const totals = calculatePledgeTotals(amounts || [])
      totalPrincipal = totals.totalPrincipal
      totalInterest = totals.totalInterest
    }

    return {
      activePledges: activePledges || 0,
      todayEntries: todayEntries || 0,
      totalPrincipal,
      totalInterest,
      grandTotal: totalPrincipal + totalInterest
    }
  }

  // Mock
  const pledges = getStoredData(STORAGE_KEYS.PLEDGES)
  const amounts = getStoredData(STORAGE_KEYS.AMOUNTS)
  
  const activePledges = pledges.filter(p => p.status === 'ACTIVE')
  const todayEntries = pledges.filter(p => p.date === today)

  const activeAmounts = amounts.filter(a => 
    activePledges.some(p => p.id === a.pledge_id)
  )

  const totals = calculatePledgeTotals(activeAmounts)

  return {
    activePledges: activePledges.length,
    todayEntries: todayEntries.length,
    totalPrincipal: totals.totalPrincipal,
    totalInterest: totals.totalInterest,
    grandTotal: totals.grandTotal
  }
}

// ============================================
// OWNER RE-PLEDGE OPERATIONS (Owner-to-Financer)
// ============================================

const OWNER_REPLEDGES_KEY = 'sriorusol_owner_repledges'

// Calculate owner re-pledge duration (1 month = 31 days)
export const calculateOwnerRepledgeDuration = (debtDate, releaseDate = new Date()) => {
  const start = new Date(debtDate)
  const end = new Date(releaseDate)
  
  // Calculate total days
  const totalDays = Math.max(0, Math.ceil((end - start) / (1000 * 60 * 60 * 24)))
  
  // 1 month = 31 days
  const months = Math.floor(totalDays / 31)
  const days = totalDays % 31
  
  return { totalDays, months, days }
}

// Calculate owner re-pledge interest
export const calculateOwnerRepledgeInterest = (amount, interestRate, debtDate, releaseDate = new Date()) => {
  const { totalDays, months, days } = calculateOwnerRepledgeDuration(debtDate, releaseDate)
  
  // Interest = Amount × (Rate/100) × (Months + Days/31)
  const interest = amount * (interestRate / 100) * (months + days / 31)
  
  return {
    totalDays,
    months,
    days,
    interest: Math.round(interest * 100) / 100
  }
}

// Create owner re-pledge
export const createOwnerRepledge = async (pledgeId, repledgeData) => {
  const ownerRepledge = {
    id: generateId(),
    pledge_id: pledgeId,
    financer_name: repledgeData.financer_name,
    financer_place: repledgeData.financer_place || null,
    amount: repledgeData.amount,
    interest_amount: repledgeData.interest_amount || 0,
    debt_date: repledgeData.debt_date,
    release_date: null,
    status: 'ACTIVE',
    notes: repledgeData.notes || null,
    created_at: new Date().toISOString()
  }

  if (supabase) {
    const { data, error } = await supabase
      .from('owner_repledges')
      .insert(ownerRepledge)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // Mock storage
  const ownerRepledges = getStoredData(OWNER_REPLEDGES_KEY)
  ownerRepledges.push(ownerRepledge)
  setStoredData(OWNER_REPLEDGES_KEY, ownerRepledges)
  return ownerRepledge
}

// Get owner re-pledges for a pledge
export const getOwnerRepledgesByPledgeId = async (pledgeId) => {
  if (supabase) {
    const { data, error } = await supabase
      .from('owner_repledges')
      .select('*')
      .eq('pledge_id', pledgeId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  // Mock
  const ownerRepledges = getStoredData(OWNER_REPLEDGES_KEY)
  return ownerRepledges
    .filter(r => r.pledge_id === pledgeId)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
}

// Close owner re-pledge
export const closeOwnerRepledge = async (id, releaseDate) => {
  const updateData = {
    status: 'CLOSED',
    release_date: releaseDate
  }

  if (supabase) {
    const { data, error } = await supabase
      .from('owner_repledges')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // Mock
  const ownerRepledges = getStoredData(OWNER_REPLEDGES_KEY)
  const index = ownerRepledges.findIndex(r => r.id === id)
  if (index === -1) throw new Error('Owner re-pledge not found')
  
  ownerRepledges[index] = { ...ownerRepledges[index], ...updateData }
  setStoredData(OWNER_REPLEDGES_KEY, ownerRepledges)
  return ownerRepledges[index]
}

// Get all active owner re-pledges
export const getActiveOwnerRepledges = async () => {
  if (supabase) {
    const { data, error } = await supabase
      .from('owner_repledges')
      .select('*, pledges(*)')
      .eq('status', 'ACTIVE')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  // Mock
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

// Get unique financer names for autocomplete
export const getFinancerList = async () => {
  if (supabase) {
    const { data, error } = await supabase
      .from('owner_repledges')
      .select('financer_name, financer_place')
      .order('financer_name', { ascending: true })
    
    if (error) throw error
    
    // Get unique financers
    const uniqueFinancers = []
    const seen = new Set()
    data?.forEach(item => {
      if (!seen.has(item.financer_name)) {
        seen.add(item.financer_name)
        uniqueFinancers.push({
          name: item.financer_name,
          place: item.financer_place
        })
      }
    })
    return uniqueFinancers
  }

  // Mock - combine from owner_repledges and standalone financers
  const ownerRepledges = getStoredData(OWNER_REPLEDGES_KEY)
  const standaloneFinancers = getStoredData(FINANCERS_KEY)
  const uniqueFinancers = []
  const seen = new Set()
  
  // Add standalone financers first
  standaloneFinancers.forEach(item => {
    if (!seen.has(item.name)) {
      seen.add(item.name)
      uniqueFinancers.push({
        name: item.name,
        place: item.place
      })
    }
  })
  
  // Add from owner repledges
  ownerRepledges.forEach(item => {
    if (!seen.has(item.financer_name)) {
      seen.add(item.financer_name)
      uniqueFinancers.push({
        name: item.financer_name,
        place: item.financer_place
      })
    }
  })
  return uniqueFinancers.sort((a, b) => a.name.localeCompare(b.name))
}

// Storage key for standalone financers
const FINANCERS_KEY = 'sriorusol_financers'

// Add a new financer
export const addFinancer = async (financerData) => {
  const financer = {
    id: generateId(),
    name: financerData.name,
    place: financerData.place || null,
    created_at: new Date().toISOString()
  }

  if (supabase) {
    // Check if financers table exists, if not create entry in owner_repledges metadata
    // For now, we'll use a simple approach - store in a financers table or localStorage
    const { data, error } = await supabase
      .from('financers')
      .insert(financer)
      .select()
      .single()
    
    if (error) {
      // If table doesn't exist, fall back to localStorage
      console.warn('Financers table not found, using localStorage')
      const financers = getStoredData(FINANCERS_KEY)
      financers.push(financer)
      setStoredData(FINANCERS_KEY, financers)
      return financer
    }
    return data
  }

  // Mock storage
  const financers = getStoredData(FINANCERS_KEY)
  financers.push(financer)
  setStoredData(FINANCERS_KEY, financers)
  return financer
}

// Delete a financer by name
export const deleteFinancer = async (name) => {
  if (supabase) {
    const { error } = await supabase
      .from('financers')
      .delete()
      .eq('name', name)
    
    if (error) {
      // Fall back to localStorage
      const financers = getStoredData(FINANCERS_KEY)
      const filtered = financers.filter(f => f.name !== name)
      setStoredData(FINANCERS_KEY, filtered)
      return
    }
    return
  }

  // Mock storage
  const financers = getStoredData(FINANCERS_KEY)
  const filtered = financers.filter(f => f.name !== name)
  setStoredData(FINANCERS_KEY, filtered)
}

// Get owner re-pledges by financer name
export const getOwnerRepledgesByFinancer = async (financerName) => {
  if (supabase) {
    const { data, error } = await supabase
      .from('owner_repledges')
      .select('*, pledges(pledge_no, customer_name, jewels_details, gross_weight, net_weight, date)')
      .eq('financer_name', financerName)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    // Flatten the data
    return (data || []).map(item => ({
      ...item,
      pledge_no: item.pledges?.pledge_no,
      customer_name: item.pledges?.customer_name,
      jewels_details: item.pledges?.jewels_details,
      gross_weight: item.pledges?.gross_weight,
      net_weight: item.pledges?.net_weight,
      pledge_date: item.pledges?.date
    }))
  }

  // Mock
  const ownerRepledges = getStoredData(OWNER_REPLEDGES_KEY)
  const pledges = getStoredData(STORAGE_KEYS.PLEDGES)
  
  return ownerRepledges
    .filter(r => r.financer_name === financerName)
    .map(r => {
      const pledge = pledges.find(p => p.id === r.pledge_id)
      return {
        ...r,
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

// Get all owner re-pledges for export
export const getAllOwnerRepledges = async () => {
  if (supabase) {
    const { data, error } = await supabase
      .from('owner_repledges')
      .select('*, pledges(pledge_no, customer_name)')
      .order('financer_name', { ascending: true })
    
    if (error) throw error
    
    return (data || []).map(item => ({
      ...item,
      pledge_no: item.pledges?.pledge_no,
      customer_name: item.pledges?.customer_name
    }))
  }

  // Mock
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

// Get all pledges with amounts for export (including financer names)
export const getAllPledgesWithAmounts = async () => {
  if (supabase) {
    const { data: pledges, error: pledgesError } = await supabase
      .from('pledges')
      .select('*')
      .order('date', { ascending: false })
    
    if (pledgesError) throw pledgesError

    const { data: amounts, error: amountsError } = await supabase
      .from('pledge_amounts')
      .select('*')
    
    if (amountsError) throw amountsError

    const { data: ownerRepledges, error: repledgesError } = await supabase
      .from('owner_repledges')
      .select('pledge_id, financer_name')
      .eq('status', 'ACTIVE')
    
    if (repledgesError) throw repledgesError

    // Calculate totals for each pledge and add financer name
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
  }

  // Mock
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

// Get active pledges with amounts for PDF export
export const getActivePledgesWithAmounts = async () => {
  if (supabase) {
    const { data: pledges, error: pledgesError } = await supabase
      .from('pledges')
      .select('*')
      .eq('status', 'ACTIVE')
      .order('date', { ascending: false })
    
    if (pledgesError) throw pledgesError

    const { data: amounts, error: amountsError } = await supabase
      .from('pledge_amounts')
      .select('*')
    
    if (amountsError) throw amountsError

    const { data: ownerRepledges, error: repledgesError } = await supabase
      .from('owner_repledges')
      .select('pledge_id, financer_name')
      .eq('status', 'ACTIVE')
    
    if (repledgesError) throw repledgesError

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
  }

  // Mock
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

// Get closed pledges with amounts for PDF export
export const getClosedPledgesWithAmounts = async () => {
  if (supabase) {
    const { data: pledges, error: pledgesError } = await supabase
      .from('pledges')
      .select('*')
      .eq('status', 'CLOSED')
      .order('date', { ascending: false })
    
    if (pledgesError) throw pledgesError

    const { data: amounts, error: amountsError } = await supabase
      .from('pledge_amounts')
      .select('*')
    
    if (amountsError) throw amountsError

    const { data: ownerRepledges, error: repledgesError } = await supabase
      .from('owner_repledges')
      .select('pledge_id, financer_name')
    
    if (repledgesError) throw repledgesError

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
  }

  // Mock
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
