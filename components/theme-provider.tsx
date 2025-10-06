'use client'

import * as React from 'react'
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from 'next-themes'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    // Only mount on client-side
    if (typeof window !== 'undefined') {
      setMounted(true)
    }
  }, [])

  // During SSR or until client is ready, render children without theme provider
  if (!mounted || typeof window === 'undefined') {
    return <>{children}</>
  }

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
