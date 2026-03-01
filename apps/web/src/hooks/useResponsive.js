import { useState, useEffect } from 'react'

export function useResponsive() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  })

  const [isMobile, setIsMobile] = useState(true)
  const [isTablet, setIsTablet] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const [orientation, setOrientation] = useState('portrait')
  const [isTouch, setIsTouch] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      
      setWindowSize({ width, height })
      
      // Breakpoints: mobile < 640, tablet 640-1024, desktop > 1024
      setIsMobile(width < 640)
      setIsTablet(width >= 640 && width < 1024)
      setIsDesktop(width >= 1024)
      setOrientation(width > height ? 'landscape' : 'portrait')
    }

    // Check for touch device
    const checkTouch = () => {
      setIsTouch(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        window.matchMedia('(pointer: coarse)').matches
      )
    }

    handleResize()
    checkTouch()

    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
    }
  }, [])

  return {
    windowSize,
    isMobile,
    isTablet,
    isDesktop,
    orientation,
    isTouch,
    // Helper breakpoint functions
    isSmall: windowSize.width < 640,
    isMedium: windowSize.width >= 640 && windowSize.width < 768,
    isLarge: windowSize.width >= 768 && windowSize.width < 1024,
    isXLarge: windowSize.width >= 1024 && windowSize.width < 1280,
    is2XLarge: windowSize.width >= 1280,
  }
}

export default useResponsive
