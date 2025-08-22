import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { useDeviceType } from "@/hooks/use-theme"

const cardVariants = cva(
  "rounded-lg border bg-card text-card-foreground shadow-sm transition-theme",
  {
    variants: {
      variant: {
        default: "border-border",
        elevated: "shadow-md hover:shadow-lg transition-shadow",
        outlined: "border-2 border-border shadow-none",
        filled: "bg-muted border-muted",
        jardin: "border-jardin-green-200 bg-gradient-to-br from-white to-jardin-green-50",
        earth: "border-jardin-earth-200 bg-gradient-to-br from-white to-jardin-earth-50",
        success: "border-success-light bg-success-light/20",
        warning: "border-warning-light bg-warning-light/20",
        error: "border-error-light bg-error-light/20",
        culture: "border-jardin-green-300 bg-jardin-green-50 hover:bg-jardin-green-100 transition-colors",
        harvest: "border-jardin-earth-300 bg-jardin-earth-50 hover:bg-jardin-earth-100 transition-colors",
        weather: "border-jardin-sky-300 bg-jardin-sky-50 hover:bg-jardin-sky-100 transition-colors",
      },
      size: {
        sm: "p-3",
        default: "p-4",
        lg: "p-6", 
        xl: "p-8",
        // Tailles device-aware
        mobile: "p-4",
        desktop: "p-6",
        tv: "p-8",
      },
      hover: {
        none: "",
        lift: "hover:-translate-y-1 hover:shadow-lg transition-all duration-200",
        scale: "hover:scale-105 transition-transform duration-200", 
        glow: "hover:shadow-lg hover:shadow-primary/20 transition-shadow duration-200",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      hover: "none",
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  asChild?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, size, hover, ...props }, ref) => {
    const deviceType = useDeviceType()
    
    const getAutoSize = () => {
      if (size) return size
      
      switch (deviceType) {
        case 'mobile':
          return 'mobile'
        case 'tv':
          return 'tv'
        default:
          return 'desktop'
      }
    }

    const effectiveSize = getAutoSize()
    
    return (
      <div
        ref={ref}
        className={cn(cardVariants({ variant, size: effectiveSize, hover, className }))}
        {...props}
      />
    )
  }
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5", className)}
      {...props}
    />
  )
)
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => {
    const deviceType = useDeviceType()
    
    const titleClass = deviceType === 'tv' 
      ? "text-h2-responsive" 
      : "text-h3-responsive"
    
    return (
      <h3
        ref={ref}
        className={cn(
          "font-semibold leading-none tracking-tight",
          titleClass,
          className
        )}
        {...props}
      />
    )
  }
)
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-body-responsive text-muted-foreground", className)}
      {...props}
    />
  )
)
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const deviceType = useDeviceType()
    
    const paddingClass = deviceType === 'tv' ? "pt-6" : "pt-4"
    
    return (
      <div 
        ref={ref} 
        className={cn(paddingClass, className)} 
        {...props} 
      />
    )
  }
)
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const deviceType = useDeviceType()
    
    const spacingClass = deviceType === 'tv' ? "pt-6" : "pt-4"
    
    return (
      <div
        ref={ref}
        className={cn("flex items-center", spacingClass, className)}
        {...props}
      />
    )
  }
)
CardFooter.displayName = "CardFooter"

// Cards spécialisées pour Baš-Malin
export interface MetricCardProps extends Omit<CardProps, 'variant'> {
  title: string
  value: string | number
  description?: string
  icon?: React.ReactNode
  trend?: 'up' | 'down' | 'stable'
  trendValue?: string
}

const MetricCard = React.forwardRef<HTMLDivElement, MetricCardProps>(
  ({ title, value, description, icon, trend, trendValue, className, ...props }, ref) => {
    const trendIcons = {
      up: "↗️",
      down: "↘️", 
      stable: "→"
    }
    
    const trendColors = {
      up: "text-success",
      down: "text-error",
      stable: "text-muted-foreground"
    }
    
    return (
      <Card ref={ref} variant="elevated" hover="lift" className={className} {...props}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {icon && <div className="text-muted-foreground">{icon}</div>}
        </CardHeader>
        <CardContent>
          <div className="text-h2-responsive font-bold">{value}</div>
          {(description || trend) && (
            <div className="flex items-center gap-2 mt-2">
              {description && (
                <p className="text-xs text-muted-foreground">{description}</p>
              )}
              {trend && trendValue && (
                <div className={cn("flex items-center text-xs", trendColors[trend])}>
                  <span className="mr-1">{trendIcons[trend]}</span>
                  <span>{trendValue}</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }
)
MetricCard.displayName = "MetricCard"

// Card pour les cultures
export interface CultureCardProps extends Omit<CardProps, 'variant'> {
  name: string
  variety: string
  stage: string
  daysFromPlanting: number
  image?: string
  zone?: string
  health?: 'good' | 'warning' | 'poor'
  onAction?: () => void
}

const CultureCard = React.forwardRef<HTMLDivElement, CultureCardProps>(
  ({ name, variety, stage, daysFromPlanting, image, zone, health, onAction, className, ...props }, ref) => {
    const healthColors = {
      good: "text-success",
      warning: "text-warning", 
      poor: "text-error"
    }
    
    const healthBorders = {
      good: "border-l-success",
      warning: "border-l-warning",
      poor: "border-l-error" 
    }
    
    return (
      <Card 
        ref={ref} 
        variant="culture" 
        hover="lift" 
        className={cn(
          "cursor-pointer border-l-4",
          health && healthBorders[health],
          className
        )}
        onClick={onAction}
        {...props}
      >
        {image && (
          <div className="h-32 bg-cover bg-center rounded-t-lg" style={{ backgroundImage: `url(${image})` }} />
        )}
        
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-base">{name}</CardTitle>
            {health && (
              <div className={cn("w-3 h-3 rounded-full", `bg-current ${healthColors[health]}`)} />
            )}
          </div>
          <CardDescription>{variety}</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Étape:</span>
            <span className="font-medium">{stage}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Jours:</span>
            <span className="font-medium">{daysFromPlanting}j</span>
          </div>
          
          {zone && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Zone:</span>
              <span className="font-medium">{zone}</span>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }
)
CultureCard.displayName = "CultureCard"

export { 
  Card, 
  CardHeader, 
  CardFooter, 
  CardTitle, 
  CardDescription, 
  CardContent,
  MetricCard,
  CultureCard,
  cardVariants 
}