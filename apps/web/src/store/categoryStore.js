import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useCategoryStore = create(
  persist(
    (set, get) => ({
      // Active category: 'FIRST' or 'SECOND'
      activeCategory: 'FIRST',
      
      // SAI unlocked state (not persisted - resets on refresh)
      saiUnlocked: false,
      
      // Set specific category
      setCategory: (category) => {
        // If switching to SS (FIRST), hide SAI again
        if (category === 'FIRST') {
          set({ activeCategory: category, saiUnlocked: false })
        } else {
          set({ activeCategory: category })
        }
      },
      
      // Toggle between categories
      toggleCategory: () => set((state) => {
        const newCategory = state.activeCategory === 'FIRST' ? 'SECOND' : 'FIRST'
        // If switching to SS, hide SAI
        if (newCategory === 'FIRST') {
          return { activeCategory: newCategory, saiUnlocked: false }
        }
        return { activeCategory: newCategory }
      }),
      
      // Check if current category is First
      isFirst: () => get().activeCategory === 'FIRST',
      
      // Check if current category is Second
      isSecond: () => get().activeCategory === 'SECOND',
      
      // Get category display name
      getCategoryName: () => get().activeCategory === 'FIRST' ? 'SS' : 'SAI',
      
      // Unlock SAI visibility (after tapping version 5 times)
      unlockSai: () => set({ saiUnlocked: true }),
      
      // Lock SAI visibility
      lockSai: () => set({ saiUnlocked: false, activeCategory: 'FIRST' }),
      
      // Reset to default (SS) - called on app start
      resetToDefault: () => set({ activeCategory: 'FIRST', saiUnlocked: false }),
      
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
