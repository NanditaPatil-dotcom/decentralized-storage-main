/**
 * Dynamic client-only component wrappers
 * These components use next/dynamic with ssr: false to prevent
 * addEventListener errors during server-side rendering
 */

import dynamic from 'next/dynamic'
import { ComponentProps } from 'react'
import { ClientOnly } from './client-only-wrapper'

// Dynamic Plasma background component
export const DynamicPlasma = dynamic(
  () => import('@/components/plasma'),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-purple-900/20 to-blue-900/20" />
    ),
  }
)

// Dynamic CardNav component
export const DynamicCardNav = dynamic(
  () => import('@/components/card-nav'),
  {
    ssr: false,
    loading: () => (
      <div className="absolute left-1/2 -translate-x-1/2 w-[90%] max-w-[800px] z-[99] top-[2.5em] md:top-[3.5em]">
        <div className="block h-[60px] p-0 rounded-xl shadow-md bg-white border border-gray-200 animate-pulse" />
      </div>
    ),
  }
)

// Dynamic GlowingFeatureCards component
export const DynamicGlowingFeatureCards = dynamic(
  () => import('@/components/glowing-feature-cards'),
  {
    ssr: false,
    loading: () => (
      <div className="grid gap-6 md:gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-6 border rounded-lg bg-white/5 border-white/10 backdrop-blur-sm animate-pulse"
          >
            <div className="h-4 bg-white/20 rounded mb-4"></div>
            <div className="h-3 bg-white/20 rounded mb-2"></div>
            <div className="h-3 bg-white/20 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    ),
  }
)

// Dynamic FileUpload component
export const DynamicFileUpload = dynamic(
  () => import('@/components/file-upload').then(mod => ({ default: mod.FileUpload })),
  {
    ssr: false,
    loading: () => (
      <div className="grid gap-4">
        <div className="grid gap-2">
          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="h-10 bg-blue-200 rounded animate-pulse"></div>
      </div>
    ),
  }
)


// Dynamic Steps component
export const DynamicSteps = dynamic(
  () => import('@/components/steps').then(mod => ({ default: mod.Steps })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-6 border rounded-lg bg-white/5 border-white/10 backdrop-blur-sm animate-pulse">
              <div className="w-12 h-12 bg-white/20 rounded-full mx-auto mb-4"></div>
              <div className="h-4 bg-white/20 rounded mb-2"></div>
              <div className="h-3 bg-white/20 rounded mb-1"></div>
              <div className="h-3 bg-white/20 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    ),
  }
)

// Dynamic WalletConnect component - uses Web3 providers internally
export const DynamicWalletConnect = dynamic(
  () => import('@/components/wallet-connect').then(mod => ({ default: mod.WalletConnect })),
  {
    ssr: false,
    loading: () => (
      <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-lg p-4">
        <div className="h-10 bg-white/20 rounded animate-pulse"></div>
      </div>
    ),
  }
)

// Type exports for convenience
export type PlasmaProps = ComponentProps<typeof DynamicPlasma>
export type CardNavProps = ComponentProps<typeof DynamicCardNav>
export type GlowingFeatureCardsProps = ComponentProps<typeof DynamicGlowingFeatureCards>
export type StepsProps = ComponentProps<typeof DynamicSteps>
export type FileUploadProps = ComponentProps<typeof DynamicFileUpload>
export type WalletConnectProps = ComponentProps<typeof DynamicWalletConnect>
