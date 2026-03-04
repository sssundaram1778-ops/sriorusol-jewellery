import { useCategoryStore } from '../store/categoryStore'

export default function CategoryBadge({ className = '', showLabel = true }) {
  const { activeCategory, getCategoryColors } = useCategoryStore()
  const colors = getCategoryColors()
  
  const isFirst = activeCategory === 'FIRST'
  
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <span className={`
        px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider
        ${isFirst 
          ? 'bg-blue-500 text-white' 
          : 'bg-purple-500 text-white'
        }
      `}>
        {activeCategory}
      </span>
      {showLabel && (
        <span className={`text-xs font-medium ${isFirst ? 'text-blue-600' : 'text-purple-600'}`}>
          Category
        </span>
      )}
    </div>
  )
}
