import React from 'react'
import { cn } from '@/lib/utils'
import { useDeviceType } from '@/hooks/use-theme'

interface GridProps {
  children: React.ReactNode
  className?: string
  cols?: {
    mobile?: number
    tablet?: number
    desktop?: number
    tv?: number
  }
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  autoFit?: {
    minWidth: string
    maxWidth?: string
  }
  as?: React.ElementType
}

interface GridItemProps {
  children: React.ReactNode
  className?: string
  span?: {
    mobile?: number
    tablet?: number
    desktop?: number
    tv?: number
  }
  start?: {
    mobile?: number
    tablet?: number
    desktop?: number
    tv?: number
  }
  as?: React.ElementType
}

const gapClasses = {
  xs: 'gap-2',
  sm: 'gap-4',
  md: 'gap-6',
  lg: 'gap-8',
  xl: 'gap-12'
}

export function Grid({
  children,
  className,
  cols = { mobile: 1, tablet: 2, desktop: 3, tv: 4 },
  gap = 'md',
  autoFit,
  as: Component = 'div',
  ...props
}: GridProps) {
  const deviceType = useDeviceType()

  const getGridClasses = () => {
    if (autoFit) {
      return `grid-cols-[repeat(auto-fit,minmax(${autoFit.minWidth},${autoFit.maxWidth || '1fr'}))]`
    }

    const gridClasses = []
    
    if (cols.mobile) gridClasses.push(`grid-cols-${cols.mobile}`)
    if (cols.tablet) gridClasses.push(`sm:grid-cols-${cols.tablet}`)
    if (cols.desktop) gridClasses.push(`lg:grid-cols-${cols.desktop}`)
    if (cols.tv) gridClasses.push(`2xl:grid-cols-${cols.tv}`)

    return gridClasses.join(' ')
  }

  // Ajuster le gap pour TV
  const getGapClass = () => {
    if (deviceType === 'tv') {
      return gap === 'xs' ? 'gap-4' : 
             gap === 'sm' ? 'gap-6' :
             gap === 'md' ? 'gap-8' :
             gap === 'lg' ? 'gap-12' : 'gap-16'
    }
    return gapClasses[gap]
  }

  return (
    <Component
      className={cn(
        'grid',
        getGridClasses(),
        getGapClass(),
        className
      )}
      {...props}
    >
      {children}
    </Component>
  )
}

export function GridItem({
  children,
  className,
  span,
  start,
  as: Component = 'div',
  ...props
}: GridItemProps) {
  const getSpanClasses = () => {
    if (!span) return ''

    const spanClasses = []
    
    if (span.mobile) spanClasses.push(`col-span-${span.mobile}`)
    if (span.tablet) spanClasses.push(`sm:col-span-${span.tablet}`)
    if (span.desktop) spanClasses.push(`lg:col-span-${span.desktop}`)
    if (span.tv) spanClasses.push(`2xl:col-span-${span.tv}`)

    return spanClasses.join(' ')
  }

  const getStartClasses = () => {
    if (!start) return ''

    const startClasses = []
    
    if (start.mobile) startClasses.push(`col-start-${start.mobile}`)
    if (start.tablet) startClasses.push(`sm:col-start-${start.tablet}`)
    if (start.desktop) startClasses.push(`lg:col-start-${start.desktop}`)
    if (start.tv) startClasses.push(`2xl:col-start-${start.tv}`)

    return startClasses.join(' ')
  }

  return (
    <Component
      className={cn(
        getSpanClasses(),
        getStartClasses(),
        className
      )}
      {...props}
    >
      {children}
    </Component>
  )
}

// Grille spécialisée pour les cartes
export function CardGrid({ 
  children, 
  className,
  minCardWidth = '280px',
  ...props 
}: Omit<GridProps, 'autoFit' | 'cols'> & { minCardWidth?: string }) {
  return (
    <Grid
      autoFit={{ minWidth: minCardWidth }}
      className={cn('items-start', className)}
      {...props}
    >
      {children}
    </Grid>
  )
}

// Grille responsive pour dashboard
export function DashboardGrid({ 
  children, 
  className, 
  ...props 
}: Omit<GridProps, 'cols'>) {
  const deviceType = useDeviceType()

  const cols = {
    mobile: 1,
    tablet: 2,
    desktop: 3,
    tv: deviceType === 'tv' ? 4 : 3
  }

  return (
    <Grid
      cols={cols}
      gap={deviceType === 'tv' ? 'xl' : 'lg'}
      className={cn('items-start', className)}
      {...props}
    >
      {children}
    </Grid>
  )
}