import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { useDeviceType } from "@/hooks/use-theme"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 touch-target transition-theme",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline min-h-0 min-w-0",
        // Variants spécialisés Baš-Malin
        jardin: "bg-jardin-green-500 text-white hover:bg-jardin-green-600 border-jardin-green-600",
        earth: "bg-jardin-earth-500 text-white hover:bg-jardin-earth-600 border-jardin-earth-600",
        success: "bg-success text-white hover:bg-success-dark",
        warning: "bg-warning text-white hover:bg-warning-dark",
        seasonal: "bg-gradient-to-r from-jardin-green-500 to-jardin-earth-500 text-white hover:from-jardin-green-600 hover:to-jardin-earth-600",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        xl: "h-12 rounded-lg px-10 text-base",
        icon: "h-10 w-10",
        // Tailles spécialisées par device
        mobile: "h-12 px-6 text-base", // 48px touch target
        desktop: "h-10 px-4 text-sm",   // 40px click target  
        tv: "h-16 px-12 text-xl",       // 64px focus target
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  loadingText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, loadingText, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    const deviceType = useDeviceType()
    const Comp = asChild ? Slot : "button"
    
    // Auto-size selon le device si pas spécifié
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
    const isDisabled = disabled || loading

    return (
      <Comp
        className={cn(buttonVariants({ variant, size: effectiveSize, className }))}
        ref={ref}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        {...props}
      >
        {loading && (
          <svg
            className="mr-2 h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        
        {!loading && leftIcon && (
          <span className="mr-2 flex-shrink-0">{leftIcon}</span>
        )}
        
        <span className="flex-1">
          {loading && loadingText ? loadingText : children}
        </span>
        
        {!loading && rightIcon && (
          <span className="ml-2 flex-shrink-0">{rightIcon}</span>
        )}
      </Comp>
    )
  }
)
Button.displayName = "Button"

// Variants spécialisés pour Baš-Malin
export const JardinButton = React.forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>(
  (props, ref) => <Button variant="jardin" ref={ref} {...props} />
)
JardinButton.displayName = "JardinButton"

export const EarthButton = React.forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>(
  (props, ref) => <Button variant="earth" ref={ref} {...props} />
)
EarthButton.displayName = "EarthButton"

export const SeasonalButton = React.forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>(
  (props, ref) => <Button variant="seasonal" ref={ref} {...props} />
)
SeasonalButton.displayName = "SeasonalButton"

// Button Group pour actions groupées
export interface ButtonGroupProps {
  children: React.ReactNode
  className?: string
  orientation?: 'horizontal' | 'vertical'
  spacing?: 'sm' | 'md' | 'lg'
  size?: ButtonProps['size']
  variant?: ButtonProps['variant']
}

export function ButtonGroup({
  children,
  className,
  orientation = 'horizontal',
  spacing = 'sm',
  size,
  variant,
  ...props
}: ButtonGroupProps) {
  const spacingClasses = {
    sm: orientation === 'horizontal' ? 'space-x-2' : 'space-y-2',
    md: orientation === 'horizontal' ? 'space-x-4' : 'space-y-4', 
    lg: orientation === 'horizontal' ? 'space-x-6' : 'space-y-6',
  }

  return (
    <div
      className={cn(
        'flex',
        orientation === 'horizontal' ? 'flex-row items-center' : 'flex-col items-start',
        spacingClasses[spacing],
        className
      )}
      {...props}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === Button) {
          return React.cloneElement(child, {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            size: size || (child.props as any).size,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            variant: variant || (child.props as any).variant,
          } as ButtonProps)
        }
        return child
      })}
    </div>
  )
}

export { Button, buttonVariants }