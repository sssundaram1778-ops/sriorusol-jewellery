import { useState, useEffect, useRef } from 'react'
import { Calendar } from 'lucide-react'

// Custom date input that displays dd/mm/yyyy format
export default function DateInput({ value, onChange, className = '', ...props }) {
  const [displayValue, setDisplayValue] = useState('')
  const dateInputRef = useRef(null)

  // Convert yyyy-mm-dd to dd/mm/yyyy for display
  useEffect(() => {
    if (value) {
      let dateStr = ''
      // Handle Date object
      if (value instanceof Date) {
        dateStr = value.toISOString().split('T')[0]
      } else if (typeof value === 'string') {
        dateStr = value
        // Handle ISO timestamp (remove time portion)
        if (dateStr.includes('T')) {
          dateStr = dateStr.split('T')[0]
        }
      }
      // Handle yyyy-mm-dd format
      if (dateStr && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dateStr.split('-')
        setDisplayValue(`${day}/${month}/${year}`)
      } else {
        setDisplayValue('')
      }
    } else {
      setDisplayValue('')
    }
  }, [value])

  // Handle input change - convert dd/mm/yyyy to yyyy-mm-dd
  const handleChange = (e) => {
    let input = e.target.value.replace(/[^\d/]/g, '')
    
    // Auto-add slashes
    if (input.length === 2 && !input.includes('/')) {
      input = input + '/'
    } else if (input.length === 5 && input.split('/').length === 2) {
      input = input + '/'
    }
    
    // Limit to dd/mm/yyyy format
    if (input.length > 10) {
      input = input.slice(0, 10)
    }
    
    setDisplayValue(input)
    
    // Convert to yyyy-mm-dd when complete
    const parts = input.split('/')
    if (parts.length === 3 && parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) {
      const [day, month, year] = parts
      const isoDate = `${year}-${month}-${day}`
      // Validate date
      const dateObj = new Date(isoDate)
      if (!isNaN(dateObj.getTime())) {
        onChange({ target: { value: isoDate } })
      }
    }
  }

  // Handle calendar picker
  const handleCalendarChange = (e) => {
    onChange(e)
  }

  // Open calendar picker
  const openCalendar = () => {
    if (dateInputRef.current) {
      dateInputRef.current.showPicker()
    }
  }

  return (
    <div className="relative flex items-center">
      <input
        type="text"
        value={displayValue}
        onChange={handleChange}
        placeholder="dd/mm/yyyy"
        className={`${className} pr-10`}
        {...props}
      />
      <button
        type="button"
        onClick={openCalendar}
        className="absolute right-2 p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
      >
        <Calendar className="w-5 h-5" />
      </button>
      <input
        ref={dateInputRef}
        type="date"
        value={
          value instanceof Date 
            ? value.toISOString().split('T')[0] 
            : (typeof value === 'string' ? (value.includes('T') ? value.split('T')[0] : value) : '')
        }
        onChange={handleCalendarChange}
        className="absolute opacity-0 pointer-events-none w-0 h-0"
        tabIndex={-1}
      />
    </div>
  )
}
