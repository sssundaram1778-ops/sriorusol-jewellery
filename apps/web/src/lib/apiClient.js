// API Client for database operations
// This calls the Vercel serverless API instead of direct database connection

const API_URL = '/api/db'

// Helper function to make API calls
const apiCall = async (action, data = {}) => {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, data }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'API request failed')
    }

    return await response.json()
  } catch (error) {
    console.error(`API Error (${action}):`, error.message)
    throw error
  }
}

// ============ CONNECTION ============
export const checkConnection = async () => {
  try {
    const result = await apiCall('check')
    return { connected: result.connected, error: null }
  } catch (error) {
    return { connected: false, error: error.message }
  }
}

export const isNeonConfigured = true // Always true when using API

// ============ PLEDGES ============
export const getPledges = async () => {
  const result = await apiCall('getPledges')
  return result.data || []
}

export const getPledge = async (id) => {
  const result = await apiCall('getPledge', { id })
  return result.data
}

export const createPledge = async (pledgeData) => {
  const id = crypto.randomUUID()
  const result = await apiCall('createPledge', { ...pledgeData, id })
  return result.data
}

export const updatePledge = async (id, updates) => {
  const result = await apiCall('updatePledge', { ...updates, id })
  return result.data
}

export const deletePledge = async (id) => {
  await apiCall('deletePledge', { id })
  return true
}

// ============ FINANCERS ============
export const getFinancers = async () => {
  const result = await apiCall('getFinancers')
  return result.data || []
}

// ============ PLEDGE AMOUNTS (Financer) ============
export const getPledgeAmounts = async (pledgeId) => {
  const result = await apiCall('getPledgeAmounts', { pledge_id: pledgeId })
  return result.data || []
}

export const getAllPledgeAmounts = async () => {
  const result = await apiCall('getAllPledgeAmounts')
  return result.data || []
}

export const getPledgeAmountsByFinancer = async (financerName) => {
  const result = await apiCall('getPledgeAmountsByFinancer', { financer_name: financerName })
  return result.data || []
}

export const createPledgeAmount = async (amountData) => {
  const id = crypto.randomUUID()
  const result = await apiCall('createPledgeAmount', { ...amountData, id })
  return result.data
}

export const updatePledgeAmount = async (id, updates) => {
  const result = await apiCall('updatePledgeAmount', { ...updates, id })
  return result.data
}

export const closePledgeAmountsByPledge = async (pledgeId) => {
  await apiCall('closePledgeAmountsByPledge', { pledge_id: pledgeId })
  return true
}

export const deletePledgeAmount = async (id) => {
  await apiCall('deletePledgeAmount', { id })
  return true
}

// ============ OWNER REPLEDGES ============
export const getOwnerRepledges = async (pledgeId) => {
  const result = await apiCall('getOwnerRepledges', { pledge_id: pledgeId })
  return result.data || []
}

export const createOwnerRepledge = async (repledgeData) => {
  const id = crypto.randomUUID()
  const result = await apiCall('createOwnerRepledge', { ...repledgeData, id })
  return result.data
}

export const updateOwnerRepledge = async (id, updates) => {
  const result = await apiCall('updateOwnerRepledge', { ...updates, id })
  return result.data
}

export const deleteOwnerRepledge = async (id) => {
  await apiCall('deleteOwnerRepledge', { id })
  return true
}

// ============ INTEREST CALCULATION ============
// These are client-side calculations, no API needed

export const JEWEL_TYPES = {
  GOLD: { rate: 2, label: 'Gold', labelTa: 'தங்கம்' },
  SILVER: { rate: 3, label: 'Silver', labelTa: 'வெள்ளி' },
  MIXED: { rate: null, label: 'Mixed', labelTa: 'கலப்பு' }
}

export const calculateInterestMonths = (startDate, endDate = new Date()) => {
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  start.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)
  
  const totalDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)))
  
  if (totalDays <= 0) {
    return { days: 1, months: 1, rawMonths: 0 }
  }
  
  let completeMonths = (end.getFullYear() - start.getFullYear()) * 12 
                     + (end.getMonth() - start.getMonth())
  
  if (end.getDate() < start.getDate()) {
    completeMonths -= 1
  }
  
  let remainingDays
  if (end.getDate() >= start.getDate()) {
    remainingDays = end.getDate() - start.getDate()
  } else {
    const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0)
    remainingDays = (prevMonth.getDate() - start.getDate()) + end.getDate()
  }
  
  let extraMonths = 0
  if (remainingDays > 0) {
    if (remainingDays <= 15) {
      extraMonths = 0.5
    } else {
      extraMonths = 1
    }
  }
  
  const rawMonths = completeMonths + extraMonths
  const months = Math.max(1, rawMonths)
  
  return { days: totalDays, months, rawMonths }
}

export const calculateInterest = (principal, rate, startDate, endDate = new Date()) => {
  const { months, days, rawMonths } = calculateInterestMonths(startDate, endDate)
  const interest = (principal * rate * months) / 100
  
  return {
    interest: Math.round(interest * 100) / 100,
    months,
    days,
    rawMonths,
    principal,
    rate,
    total: Math.round((principal + interest) * 100) / 100
  }
}

export const getDefaultInterestRate = (jewelType) => {
  switch (jewelType) {
    case 'SILVER': return 3
    case 'GOLD':
    default: return 2
  }
}

// Keep alive - no-op for API version
export const keepAlive = async () => true
