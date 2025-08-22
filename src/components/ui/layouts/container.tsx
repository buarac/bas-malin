import React from 'react'
import { cn } from '@/lib/utils'
import { useDeviceType } from '@/hooks/use-theme'

interface ContainerProps {
  children: React.ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  center?: boolean
  as?: React.ElementType
}

const containerSizes = {
  sm: 'max-w-2xl',
  md: 'max-w-4xl', 
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
  full: 'max-w-none'
}

const containerPadding = {
  none: '',
  sm: 'px-4 sm:px-6',
  md: 'px-4 sm:px-6 lg:px-8',
  lg: 'px-6 sm:px-8 lg:px-12'
}

export function Container({
  children,
  className,
  size = 'lg',
  padding = 'md',
  center = true,
  as: Component = 'div',
  ...props
}: ContainerProps) {
  const deviceType = useDeviceType()

  // Ajuster le padding selon le type de device
  const getDevicePadding = () => {
    if (deviceType === 'tv') {
      return 'safe-area-tv'
    }
    return containerPadding[padding]
  }

  return (
    <Component
      className={cn(
        'w-full',
        containerSizes[size],
        getDevicePadding(),
        center && 'mx-auto',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  )
}

// Container spécialisé pour le contenu principal
export function MainContainer({ children, className, ...props }: Omit<ContainerProps, 'as'>) {
  return (
    <Container
      as="main"
      className={cn('min-h-screen transition-theme', className)}
      {...props}
    >
      {children}
    </Container>
  )
}

// Container pour sections
export function Section({ 
  children, 
  className,
  spacing = 'md',
  ...props 
}: ContainerProps & { spacing?: 'sm' | 'md' | 'lg' }) {
  const spacingClasses = {
    sm: 'py-8',
    md: 'py-12 lg:py-16',
    lg: 'py-16 lg:py-24'
  }

  return (
    <Container
      as="section"
      className={cn(spacingClasses[spacing], className)}
      {...props}
    >
      {children}
    </Container>
  )
}