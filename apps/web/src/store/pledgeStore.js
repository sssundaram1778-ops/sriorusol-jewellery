import { create } from 'zustand'
import * as api from '../lib/database'

export const usePledgeStore = create((set, get) => ({
  // State
  activePledges: [],
  closedPledges: [],
  pledges: [],
  searchResults: [],
  currentPledge: null,
  dashboardStats: {
    activePledges: 0,
    todayEntries: 0,
    totalPrincipal: 0,
    totalInterest: 0,
    grandTotal: 0
  },
  isLoading: false,
  error: null,
  connectionError: null, // Track connection-specific errors

  // Actions
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null, connectionError: null }),

  // Fetch all pledges (active + closed) with retry
  fetchAllPledges: async () => {
    set({ isLoading: true, error: null, connectionError: null })
    try {
      const data = await api.getAllPledges()
      set({ pledges: data, isLoading: false })
    } catch (error) {
      const isConnectionError = error.message?.includes('fetch') || error.message?.includes('network')
      set({ 
        error: error.message, 
        connectionError: isConnectionError ? error.message : null,
        isLoading: false 
      })
    }
  },

  // Fetch active pledges with retry
  fetchActivePledges: async () => {
    set({ isLoading: true, error: null, connectionError: null })
    try {
      const data = await api.getActivePledges()
      set({ activePledges: data, isLoading: false })
    } catch (error) {
      const isConnectionError = error.message?.includes('fetch') || error.message?.includes('network')
      set({ 
        error: error.message, 
        connectionError: isConnectionError ? error.message : null,
        isLoading: false 
      })
    }
  },

  // Fetch closed pledges with retry
  fetchClosedPledges: async () => {
    set({ isLoading: true, error: null, connectionError: null })
    try {
      const data = await api.getClosedPledges()
      set({ closedPledges: data, isLoading: false })
    } catch (error) {
      const isConnectionError = error.message?.includes('fetch') || error.message?.includes('network')
      set({ 
        error: error.message, 
        connectionError: isConnectionError ? error.message : null,
        isLoading: false 
      })
    }
  },

  // Create new pledge
  createPledge: async (pledgeData) => {
    set({ isLoading: true, error: null })
    try {
      // Transform form data to API format
      const apiData = {
        pledge_no: pledgeData.pledge_no,
        date: pledgeData.date,
        customer_name: pledgeData.customer_name,
        phone_number: pledgeData.phone_number,
        place: pledgeData.place,
        loan_amount: pledgeData.initialAmount,
        interest_rate: pledgeData.interest_rate,
        jewel_type: pledgeData.jewel_type || 'GOLD',
        jewels_details: pledgeData.jewels_details,
        no_of_items: pledgeData.no_of_items,
        gross_weight: pledgeData.gross_weight,
        net_weight: pledgeData.net_weight,
        parent_pledge_id: pledgeData.parent_pledge_id || null,
        parent_pledge_no: pledgeData.parent_pledge_no || null
      }
      const newPledge = await api.createPledge(apiData)
      set((state) => ({
        activePledges: [newPledge, ...state.activePledges],
        isLoading: false
      }))
      return newPledge
    } catch (error) {
      set({ error: error.message, isLoading: false })
      throw error
    }
  },

  // Update pledge
  updatePledge: async (id, updates) => {
    set({ isLoading: true, error: null })
    try {
      const updatedPledge = await api.updatePledge(id, updates)
      set((state) => ({
        activePledges: state.activePledges.map(p => p.id === id ? { ...p, ...updatedPledge } : p),
        currentPledge: state.currentPledge?.id === id ? { ...state.currentPledge, ...updatedPledge } : state.currentPledge,
        isLoading: false
      }))
      return updatedPledge
    } catch (error) {
      set({ error: error.message, isLoading: false })
      throw error
    }
  },

  // Add additional amount to pledge
  addAmount: async (pledgeId, amountData) => {
    set({ isLoading: true, error: null })
    try {
      const newAmount = await api.addAmount(pledgeId, amountData)
      // Refresh current pledge to get updated totals
      const updatedPledge = await api.getPledgeById(pledgeId)
      set((state) => ({
        currentPledge: updatedPledge,
        activePledges: state.activePledges.map(p => p.id === pledgeId ? updatedPledge : p),
        isLoading: false
      }))
      return newAmount
    } catch (error) {
      set({ error: error.message, isLoading: false })
      throw error
    }
  },

  // Create repledge
  createRepledge: async (pledgeId, repledgeData) => {
    set({ isLoading: true, error: null })
    try {
      const result = await api.createRepledge(pledgeId, repledgeData)
      // Refresh current pledge
      const updatedPledge = await api.getPledgeById(pledgeId)
      set((state) => ({
        currentPledge: updatedPledge,
        activePledges: state.activePledges.filter(p => p.id !== pledgeId),
        isLoading: false
      }))
      return result
    } catch (error) {
      set({ error: error.message, isLoading: false })
      throw error
    }
  },

  // Create re-pledge for additional loan amount (closes old pledge and creates new one)
  createAdditionalAmountRepledge: async (pledgeId, repledgeData) => {
    set({ isLoading: true, error: null })
    try {
      const result = await api.createAdditionalAmountRepledge(pledgeId, repledgeData)
      // Refresh pledges list
      set((state) => ({
        activePledges: [result.newPledge, ...state.activePledges.filter(p => p.id !== pledgeId)],
        isLoading: false
      }))
      return result
    } catch (error) {
      set({ error: error.message, isLoading: false })
      throw error
    }
  },

  // Close pledge
  closePledge: async (id, canceledDate, returnPledgeNo) => {
    set({ isLoading: true, error: null })
    try {
      const closedPledge = await api.closePledge(id, canceledDate, returnPledgeNo)
      set((state) => ({
        activePledges: state.activePledges.filter(p => p.id !== id),
        closedPledges: [closedPledge, ...state.closedPledges],
        currentPledge: state.currentPledge?.id === id ? { ...state.currentPledge, status: 'CLOSED', return_pledge_no: returnPledgeNo } : state.currentPledge,
        isLoading: false
      }))
      return closedPledge
    } catch (error) {
      set({ error: error.message, isLoading: false })
      throw error
    }
  },

  // Search pledges
  searchPledges: async (query, status = 'ALL') => {
    set({ isLoading: true, error: null })
    try {
      const results = await api.searchPledges(query, status)
      set({ searchResults: results, isLoading: false })
      return results
    } catch (error) {
      set({ error: error.message, isLoading: false })
      throw error
    }
  },

  // Clear search
  clearSearch: () => set({ searchResults: [] }),

  // Get single pledge
  fetchPledgeById: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const pledge = await api.getPledgeById(id)
      // Also fetch owner re-pledges
      const ownerRepledges = await api.getOwnerRepledgesByPledgeId(id)
      set({ currentPledge: { ...pledge, ownerRepledges }, isLoading: false })
      return { ...pledge, ownerRepledges }
    } catch (error) {
      set({ error: error.message, isLoading: false })
      throw error
    }
  },

  // Fetch dashboard stats
  fetchDashboardStats: async () => {
    try {
      const stats = await api.getDashboardStats()
      set({ dashboardStats: stats })
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error)
    }
  },

  // Clear current pledge
  clearCurrentPledge: () => set({ currentPledge: null }),

  // ============================================
  // OWNER RE-PLEDGE ACTIONS
  // ============================================

  // Create owner re-pledge
  createOwnerRepledge: async (pledgeId, repledgeData) => {
    set({ isLoading: true, error: null })
    try {
      const result = await api.createOwnerRepledge(pledgeId, repledgeData)
      // Refresh current pledge to get updated owner repledges
      const pledge = await api.getPledgeById(pledgeId)
      const ownerRepledges = await api.getOwnerRepledgesByPledgeId(pledgeId)
      set({ 
        currentPledge: { ...pledge, ownerRepledges },
        isLoading: false 
      })
      return result
    } catch (error) {
      set({ error: error.message, isLoading: false })
      throw error
    }
  },

  // Close owner re-pledge
  closeOwnerRepledge: async (pledgeId, ownerRepledgeId, releaseDate) => {
    set({ isLoading: true, error: null })
    try {
      const result = await api.closeOwnerRepledge(ownerRepledgeId, releaseDate)
      // Refresh current pledge
      const pledge = await api.getPledgeById(pledgeId)
      const ownerRepledges = await api.getOwnerRepledgesByPledgeId(pledgeId)
      set({ 
        currentPledge: { ...pledge, ownerRepledges },
        isLoading: false 
      })
      return result
    } catch (error) {
      set({ error: error.message, isLoading: false })
      throw error
    }
  }
}))
