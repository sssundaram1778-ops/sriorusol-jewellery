import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useCategoryStore = create(
  persist(
    (set, get) => ({
      // Active category: 'FIRST' or 'SECOND'
      activeCategory: 'FIRST',
      
      // Set specific category
      setCategory: (category) => set({ activeCategory: category }),
      
      // Toggle between categories
      toggleCategory: () => set((state) => ({
        activeCategory: state.activeCategory === 'FIRST' ? 'SECOND' : 'FIRST'
      })),
      
      // Check if current category is First
      isFirst: () => get().activeCategory === 'FIRST',
      
      // Check if current category is Second
      isSecond: () => get().activeCategory === 'SECOND',
      
      // Get category display name
      getCategoryName: () => get().activeCategory === 'FIRST' ? 'SS' : 'SAI',
      
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
    }
  )
)
