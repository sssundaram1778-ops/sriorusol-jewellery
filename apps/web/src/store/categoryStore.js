import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// SAI visibility timeout (60 seconds)
const SAI_VISIBILITY_TIMEOUT = 60 * 1000

export const useCategoryStore = create(
  persist(
    (set, get) => ({
      // Active category: 'FIRST' or 'SECOND'
      activeCategory: 'FIRST',
      
      // SAI unlocked state (not persisted - resets on refresh)
      saiUnlocked: false,
      
      // Timestamp when SAI visibility expires (for auto-hide)
      saiVisibleUntil: null,
      
      // Set specific category
      setCategory: (category) => {
        // If switching to SS (FIRST), hide SAI again and require 5 taps
        if (category === 'FIRST') {
          set({ activeCategory: category, saiUnlocked: false, saiVisibleUntil: null })
        } else {
          // Entering SAI - clear the timer since user selected it
          set({ activeCategory: category, saiVisibleUntil: null })
        }
      },
      
      // Toggle between categories
      toggleCategory: () => set((state) => {
        const newCategory = state.activeCategory === 'FIRST' ? 'SECOND' : 'FIRST'
        // If switching to SS, hide SAI and require 5 taps again
        if (newCategory === 'FIRST') {
          return { activeCategory: newCategory, saiUnlocked: false, saiVisibleUntil: null }
        }
        return { activeCategory: newCategory, saiVisibleUntil: null }
      }),
      
      // Check if current category is First
      isFirst: () => get().activeCategory === 'FIRST',
      
      // Check if current category is Second
      isSecond: () => get().activeCategory === 'SECOND',
      
      // Get category display name
      getCategoryName: () => get().activeCategory === 'FIRST' ? 'SS' : 'SAI',
      
      // Unlock SAI visibility with 60-second timer
      unlockSai: () => set({ 
        saiUnlocked: true, 
        saiVisibleUntil: Date.now() + SAI_VISIBILITY_TIMEOUT 
      }),
      
      // Lock SAI visibility
      lockSai: () => set({ saiUnlocked: false, activeCategory: 'FIRST', saiVisibleUntil: null }),
      
      // Check if SAI is still visible (within timeout)
      isSaiVisible: () => {
        const state = get()
        if (!state.saiUnlocked) return false
        if (!state.saiVisibleUntil) return state.saiUnlocked
        return Date.now() < state.saiVisibleUntil
      },
      
      // Hide SAI (timer expired)
      hideSai: () => set({ saiUnlocked: false, saiVisibleUntil: null }),
      
      // Reset to default (SS) - called on app start
      resetToDefault: () => set({ activeCategory: 'FIRST', saiUnlocked: false, saiVisibleUntil: null }),
      
      // Get category colors
      getCategoryColors: () => {
        const isFirst = get().activeCategory === 'FIRST'
        return {
          primary: isFirst ? '#2563EB' : '#7C3AED',
          primaryDark: isFirst ? '#1D4ED8' : '#6D28D9',
          bg: isFirst ? 'bg-blue-500' : 'bg-purple-500',
          bgLight: isFirst ? 'bg-blue-50' : 'bg-purple-50',
          bgGradient: isFirst 
            ? 'bg-gradient-to-br from-blue-600 to-blue-500' 
            : 'bg-gradient-to-br from-purple-600 to-purple-500',
          text: isFirst ? 'text-blue-600' : 'text-purple-600',
          textLight: isFirst ? 'text-blue-500' : 'text-purple-500',
          border: isFirst ? 'border-blue-500' : 'border-purple-500',
          shadow: isFirst ? 'shadow-blue-500/30' : 'shadow-purple-500/30',
          ring: isFirst ? 'ring-blue-500' : 'ring-purple-500',
        }
      }
    }),
    {
      name: 'sriorusol-category', // localStorage key
      // Only persist activeCategory as FIRST (SS) - SAI always hidden on restart
      partialize: (state) => ({ activeCategory: 'FIRST' }),
    }
  )
)
