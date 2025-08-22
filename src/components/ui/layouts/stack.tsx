import React from 'react'
import { cn } from '@/lib/utils'
import { useDeviceType } from '@/hooks/use-theme'

interface StackProps {
  children: React.ReactNode
  className?: string
  direction?: 'vertical' | 'horizontal'
  spacing?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  align?: 'start' | 'center' | 'end' | 'stretch'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
  wrap?: boolean
  responsive?: {
    mobile?: Partial<Pick<StackProps, 'direction' | 'spacing' | 'align' | 'justify'>>
    tablet?: Partial<Pick<StackProps, 'direction' | 'spacing' | 'align' | 'justify'>>
    desktop?: Partial<Pick<StackProps, 'direction' | 'spacing' | 'align' | 'justify'>>
    tv?: Partial<Pick<StackProps, 'direction' | 'spacing' | 'align' | 'justify'>>
  }
  as?: React.ElementType
}

// const spacingClasses = {
//   vertical: {
//     xs: 'space-y-1',
//     sm: 'space-y-2',
//     md: 'space-y-4',
//     lg: 'space-y-6',
//     xl: 'space-y-8'
//   },
//   horizontal: {
//     xs: 'space-x-1',
//     sm: 'space-x-2',
//     md: 'space-x-4',
//     lg: 'space-x-6',
//     xl: 'space-x-8'
//   }
// }

const gapClasses = {
  xs: 'gap-1',
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-8'
}

const alignClasses = {
  vertical: {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch'
  },
  horizontal: {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch'
  }
}

const justifyClasses = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
  evenly: 'justify-evenly'
}

export function Stack({
  children,
  className,
  direction = 'vertical',
  spacing = 'md',
  align = 'stretch',
  justify = 'start',
  wrap = false,
  responsive,
  as: Component = 'div',
  ...props
}: StackProps) {
  const deviceType = useDeviceType()

  // Ajuster l'espacement pour TV
  const getTVSpacing = (baseSpacing: string) => {
    if (deviceType !== 'tv') return baseSpacing
    
    const spacingMap: Record<string, string> = {
      xs: 'sm',
      sm: 'md',
      md: 'lg',
      lg: 'xl',
      xl: 'xl'
    }
    
    return spacingMap[baseSpacing] || baseSpacing
  }

  const getClasses = () => {
    const classes = []

    // Direction et flex
    if (direction === 'horizontal') {
      classes.push('flex', wrap ? 'flex-wrap' : 'flex-nowrap')
    } else {
      classes.push('flex flex-col')
    }

    // Espacement - utiliser gap au lieu de space-* pour plus de flexibilité
    const effectiveSpacing = getTVSpacing(spacing) as keyof typeof gapClasses
    classes.push(gapClasses[effectiveSpacing])

    // Alignement
    classes.push(alignClasses[direction][align])

    // Justification
    classes.push(justifyClasses[justify])

    return classes.join(' ')
  }

  const getResponsiveClasses = () => {
    if (!responsive) return ''

    const responsiveClasses = []

    // Mobile
    if (responsive.mobile) {
      const { direction: mobileDir, spacing: mobileSpacing, align: mobileAlign, justify: mobileJustify } = responsive.mobile
      if (mobileDir === 'horizontal') responsiveClasses.push('flex-row')
      if (mobileDir === 'vertical') responsiveClasses.push('flex-col')
      if (mobileSpacing) responsiveClasses.push(gapClasses[mobileSpacing])
      if (mobileAlign) responsiveClasses.push(alignClasses[mobileDir || direction][mobileAlign])
      if (mobileJustify) responsiveClasses.push(justifyClasses[mobileJustify])
    }

    // Tablet
    if (responsive.tablet) {
      const { direction: tabletDir, spacing: tabletSpacing, align: tabletAlign, justify: tabletJustify } = responsive.tablet
      if (tabletDir === 'horizontal') responsiveClasses.push('sm:flex-row')
      if (tabletDir === 'vertical') responsiveClasses.push('sm:flex-col')
      if (tabletSpacing) responsiveClasses.push(`sm:${gapClasses[tabletSpacing]}`)
      if (tabletAlign) responsiveClasses.push(`sm:${alignClasses[tabletDir || direction][tabletAlign]}`)
      if (tabletJustify) responsiveClasses.push(`sm:${justifyClasses[tabletJustify]}`)
    }

    // Desktop
    if (responsive.desktop) {
      const { direction: desktopDir, spacing: desktopSpacing, align: desktopAlign, justify: desktopJustify } = responsive.desktop
      if (desktopDir === 'horizontal') responsiveClasses.push('lg:flex-row')
      if (desktopDir === 'vertical') responsiveClasses.push('lg:flex-col')
      if (desktopSpacing) responsiveClasses.push(`lg:${gapClasses[desktopSpacing]}`)
      if (desktopAlign) responsiveClasses.push(`lg:${alignClasses[desktopDir || direction][desktopAlign]}`)
      if (desktopJustify) responsiveClasses.push(`lg:${justifyClasses[desktopJustify]}`)
    }

    // TV
    if (responsive.tv) {
      const { direction: tvDir, spacing: tvSpacing, align: tvAlign, justify: tvJustify } = responsive.tv
      if (tvDir === 'horizontal') responsiveClasses.push('2xl:flex-row')
      if (tvDir === 'vertical') responsiveClasses.push('2xl:flex-col')
      if (tvSpacing) responsiveClasses.push(`2xl:${gapClasses[tvSpacing]}`)
      if (tvAlign) responsiveClasses.push(`2xl:${alignClasses[tvDir || direction][tvAlign]}`)
      if (tvJustify) responsiveClasses.push(`2xl:${justifyClasses[tvJustify]}`)
    }

    return responsiveClasses.join(' ')
  }

  return (
    <Component
      className={cn(
        getClasses(),
        getResponsiveClasses(),
        className
      )}
      {...props}
    >
      {children}
    </Component>
  )
}

// Stack horizontal (alias)
export function HStack(props: Omit<StackProps, 'direction'>) {
  return <Stack direction="horizontal" {...props} />
}

// Stack vertical (alias)
export function VStack(props: Omit<StackProps, 'direction'>) {
  return <Stack direction="vertical" {...props} />
}

// Stack centré
export function CenterStack({ 
  children, 
  className, 
  ...props 
}: Omit<StackProps, 'align' | 'justify'>) {
  return (
    <Stack
      align="center"
      justify="center"
      className={cn('min-h-full', className)}
      {...props}
    >
      {children}
    </Stack>
  )
}