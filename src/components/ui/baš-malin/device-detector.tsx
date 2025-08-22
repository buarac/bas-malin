import * as React from "react"
import { useDeviceType } from "@/hooks/use-theme"
import { cn } from "@/lib/utils"

export interface DeviceDetectorProps {
  children: React.ReactNode
  className?: string
  showOnly?: 'mobile' | 'tablet' | 'desktop' | 'tv' | Array<'mobile' | 'tablet' | 'desktop' | 'tv'>
  hideOn?: 'mobile' | 'tablet' | 'desktop' | 'tv' | Array<'mobile' | 'tablet' | 'desktop' | 'tv'>
  renderMobile?: React.ReactNode
  renderTablet?: React.ReactNode
  renderDesktop?: React.ReactNode
  renderTV?: React.ReactNode
  fallback?: React.ReactNode
}

const DeviceDetector = React.forwardRef<HTMLDivElement, DeviceDetectorProps>(
  ({ 
    children, 
    className, 
    showOnly, 
    hideOn, 
    renderMobile, 
    renderTablet, 
    renderDesktop, 
    renderTV,
    fallback,
    ...props 
  }, ref) => {
    const deviceType = useDeviceType()

    // Normaliser les arrays
    const showOnlyArray = Array.isArray(showOnly) ? showOnly : showOnly ? [showOnly] : []
    const hideOnArray = Array.isArray(hideOn) ? hideOn : hideOn ? [hideOn] : []

    // Vérifier si on doit afficher le composant
    const shouldShow = () => {
      // Si hideOn est spécifié et contient le device actuel, on cache
      if (hideOnArray.length > 0 && hideOnArray.includes(deviceType)) {
        return false
      }

      // Si showOnly est spécifié, on affiche seulement sur les devices listés
      if (showOnlyArray.length > 0) {
        return showOnlyArray.includes(deviceType)
      }

      // Par défaut, on affiche
      return true
    }

    // Si on ne doit pas afficher, retourner null ou fallback
    if (!shouldShow()) {
      return fallback ? <>{fallback}</> : null
    }

    // Rendu spécifique par device si fourni
    const getDeviceSpecificContent = () => {
      switch (deviceType) {
        case 'mobile':
          return renderMobile || children
        case 'tablet':
          return renderTablet || children
        case 'desktop':
          return renderDesktop || children
        case 'tv':
          return renderTV || children
        default:
          return children
      }
    }

    return (
      <div
        ref={ref}
        className={cn(
          "device-detector",
          `device-${deviceType}`,
          className
        )}
        data-device={deviceType}
        {...props}
      >
        {getDeviceSpecificContent()}
      </div>
    )
  }
)
DeviceDetector.displayName = "DeviceDetector"

// Composants spécialisés pour chaque device
export const MobileOnly = ({ children, ...props }: Omit<DeviceDetectorProps, 'showOnly'>) => (
  <DeviceDetector showOnly="mobile" {...props}>
    {children}
  </DeviceDetector>
)

export const TabletOnly = ({ children, ...props }: Omit<DeviceDetectorProps, 'showOnly'>) => (
  <DeviceDetector showOnly="tablet" {...props}>
    {children}
  </DeviceDetector>
)

export const DesktopOnly = ({ children, ...props }: Omit<DeviceDetectorProps, 'showOnly'>) => (
  <DeviceDetector showOnly="desktop" {...props}>
    {children}
  </DeviceDetector>
)

export const TVOnly = ({ children, ...props }: Omit<DeviceDetectorProps, 'showOnly'>) => (
  <DeviceDetector showOnly="tv" {...props}>
    {children}
  </DeviceDetector>
)

export const MobileUp = ({ children, ...props }: Omit<DeviceDetectorProps, 'showOnly'>) => (
  <DeviceDetector showOnly={['mobile', 'tablet', 'desktop', 'tv']} {...props}>
    {children}
  </DeviceDetector>
)

export const TabletUp = ({ children, ...props }: Omit<DeviceDetectorProps, 'showOnly'>) => (
  <DeviceDetector showOnly={['tablet', 'desktop', 'tv']} {...props}>
    {children}
  </DeviceDetector>
)

export const DesktopUp = ({ children, ...props }: Omit<DeviceDetectorProps, 'showOnly'>) => (
  <DeviceDetector showOnly={['desktop', 'tv']} {...props}>
    {children}
  </DeviceDetector>
)

// Composant pour adapter les props selon le device
export interface AdaptivePropsProps<T extends Record<string, unknown>> {
  children: (props: T) => React.ReactNode
  mobileProps?: Partial<T>
  tabletProps?: Partial<T>
  desktopProps?: Partial<T>
  tvProps?: Partial<T>
  defaultProps: T
}

export function AdaptiveProps<T extends Record<string, unknown>>({
  children,
  mobileProps,
  tabletProps,
  desktopProps,
  tvProps,
  defaultProps
}: AdaptivePropsProps<T>) {
  const deviceType = useDeviceType()

  const getDeviceProps = (): T => {
    const baseProps = { ...defaultProps }

    switch (deviceType) {
      case 'mobile':
        return { ...baseProps, ...mobileProps }
      case 'tablet':
        return { ...baseProps, ...tabletProps }
      case 'desktop':
        return { ...baseProps, ...desktopProps }
      case 'tv':
        return { ...baseProps, ...tvProps }
      default:
        return baseProps
    }
  }

  return <>{children(getDeviceProps())}</>
}

// Hook pour obtenir des valeurs adaptatives
export function useAdaptiveValue<T>(values: {
  mobile?: T
  tablet?: T
  desktop?: T
  tv?: T
  default: T
}): T {
  const deviceType = useDeviceType()

  switch (deviceType) {
    case 'mobile':
      return values.mobile ?? values.default
    case 'tablet':
      return values.tablet ?? values.default
    case 'desktop':
      return values.desktop ?? values.default
    case 'tv':
      return values.tv ?? values.default
    default:
      return values.default
  }
}

// Composant pour les layouts adaptatifs
export interface ResponsiveLayoutProps {
  children: React.ReactNode
  className?: string
  mobileLayout?: 'stack' | 'grid'
  tabletLayout?: 'stack' | 'grid' | 'sidebar'
  desktopLayout?: 'stack' | 'grid' | 'sidebar' | 'columns'
  tvLayout?: 'grid' | 'columns' | 'dashboard'
}

export function ResponsiveLayout({
  children,
  className,
  mobileLayout = 'stack',
  tabletLayout = 'grid',
  desktopLayout = 'columns',
  tvLayout = 'dashboard'
}: ResponsiveLayoutProps) {
  const deviceType = useDeviceType()

  const getLayoutClass = () => {
    const layout = {
      mobile: mobileLayout,
      tablet: tabletLayout,
      desktop: desktopLayout,
      tv: tvLayout
    }[deviceType]

    const layoutClasses = {
      stack: 'flex flex-col gap-4',
      grid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4',
      sidebar: 'flex gap-6',
      columns: 'grid grid-cols-12 gap-6',
      dashboard: 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 p-8'
    }

    return layoutClasses[layout] || layoutClasses.stack
  }

  return (
    <div
      className={cn(
        getLayoutClass(),
        `layout-${deviceType}`,
        className
      )}
    >
      {children}
    </div>
  )
}

// Utilitaire pour debug du device detection
export function DeviceDebugger({ className }: { className?: string }) {
  const deviceType = useDeviceType()
  
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className={cn(
      "fixed bottom-4 right-4 bg-black/80 text-white px-3 py-2 rounded-lg text-xs font-mono z-50",
      className
    )}>
      Device: {deviceType}
      <br />
      Screen: {typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'SSR'}
    </div>
  )
}

export { DeviceDetector }