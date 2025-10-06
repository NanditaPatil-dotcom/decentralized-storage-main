"use client"

import { ReactNode, useEffect, useState } from 'react'

type ClientOnlyProps = {
  children: ReactNode
  fallback?: ReactNode
}

/**
 * Ensures children only render on the client-side
 * This prevents SSR/hydration issues with components that use addEventListener
 */
export function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

/**
 * Higher-order component that wraps any component to make it client-only
 */
export function withClientOnly<T extends object>(
  Component: React.ComponentType<T>,
  fallback?: ReactNode
) {
  return function ClientOnlyComponent(props: T) {
    return (
      <ClientOnly fallback={fallback}>
        <Component {...props} />
      </ClientOnly>
    )
  }
}