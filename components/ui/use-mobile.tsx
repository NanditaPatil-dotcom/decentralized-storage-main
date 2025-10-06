import * as React from 'react'

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    
    // Initial check - no event listeners needed
    const checkSize = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
      }
    }
    
    checkSize()
    
    // Use timer instead of resize listener for periodic checks
    const interval = setInterval(checkSize, 500)
    
    return () => {
      clearInterval(interval)
    }
  }, [])

  // Return false during SSR
  if (!mounted) return false
  
  return isMobile
}
