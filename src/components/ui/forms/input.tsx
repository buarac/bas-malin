import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { useDeviceType } from "@/hooks/use-theme"

const inputVariants = cva(
  "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-theme touch-target",
  {
    variants: {
      variant: {
        default: "border-input",
        success: "border-success focus-visible:ring-success",
        warning: "border-warning focus-visible:ring-warning",
        error: "border-error focus-visible:ring-error",
        jardin: "border-jardin-green-300 focus-visible:ring-jardin-green-500",
      },
      size: {
        default: "h-10",
        sm: "h-9 px-2 text-xs",
        lg: "h-11 px-4",
        xl: "h-12 px-4 text-base",
        // Tailles device-aware
        mobile: "h-12 px-4 text-base",
        desktop: "h-10 px-3 text-sm", 
        tv: "h-16 px-6 text-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  label?: string
  description?: string
  error?: string
  success?: string
  warning?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  leftAddon?: React.ReactNode
  rightAddon?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    variant, 
    size,
    type = "text",
    label,
    description,
    error,
    success,
    warning,
    leftIcon,
    rightIcon,
    leftAddon,
    rightAddon,
    id,
    ...props 
  }, ref) => {
    const deviceType = useDeviceType()
    const generatedId = React.useId()
    const inputId = id || generatedId
    
    // Auto-size selon le device
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

    // Auto-variant selon l'état
    const getAutoVariant = () => {
      if (error) return 'error'
      if (success) return 'success'
      if (warning) return 'warning'
      return variant || 'default'
    }

    const effectiveSize = getAutoSize()
    const effectiveVariant = getAutoVariant()

    const inputElement = (
      <input
        type={type}
        className={cn(
          inputVariants({ variant: effectiveVariant, size: effectiveSize }),
          leftIcon && "pl-10",
          rightIcon && "pr-10",
          leftAddon && "rounded-l-none border-l-0",
          rightAddon && "rounded-r-none border-r-0",
          className
        )}
        ref={ref}
        id={inputId}
        aria-describedby={
          [
            description && `${inputId}-description`,
            error && `${inputId}-error`,
            success && `${inputId}-success`,
            warning && `${inputId}-warning`
          ].filter(Boolean).join(' ') || undefined
        }
        aria-invalid={error ? 'true' : undefined}
        {...props}
      />
    )

    return (
      <div className="space-y-2">
        {label && (
          <label 
            htmlFor={inputId}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-body-responsive"
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftAddon && (
            <div className="absolute left-0 top-0 h-full flex items-center">
              <div className="px-3 py-2 bg-muted border border-r-0 border-input rounded-l-md text-sm text-muted-foreground">
                {leftAddon}
              </div>
            </div>
          )}
          
          {leftIcon && !leftAddon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
              {leftIcon}
            </div>
          )}
          
          {inputElement}
          
          {rightIcon && !rightAddon && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
              {rightIcon}
            </div>
          )}
          
          {rightAddon && (
            <div className="absolute right-0 top-0 h-full flex items-center">
              <div className="px-3 py-2 bg-muted border border-l-0 border-input rounded-r-md text-sm text-muted-foreground">
                {rightAddon}
              </div>
            </div>
          )}
        </div>

        {description && !error && !success && !warning && (
          <p id={`${inputId}-description`} className="text-sm text-muted-foreground">
            {description}
          </p>
        )}

        {error && (
          <p id={`${inputId}-error`} className="text-sm text-error">
            {error}
          </p>
        )}

        {success && !error && (
          <p id={`${inputId}-success`} className="text-sm text-success">
            {success}
          </p>
        )}

        {warning && !error && !success && (
          <p id={`${inputId}-warning`} className="text-sm text-warning">
            {warning}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

// Textarea component
export interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  variant?: InputProps['variant']
  size?: InputProps['size']
  label?: string
  description?: string
  error?: string
  success?: string
  warning?: string
  helper?: string
  resize?: 'none' | 'vertical' | 'horizontal' | 'both'
  minRows?: number
  maxRows?: number
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ 
    className, 
    variant,
    size,
    label,
    description,
    error,
    success,
    warning,
    resize = 'vertical',
    minRows = 3,
    maxRows,
    id,
    ...props 
  }, ref) => {
    const deviceType = useDeviceType()
    const generatedId = React.useId()
    const textareaId = id || generatedId
    
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

    const getAutoVariant = () => {
      if (error) return 'error'
      if (success) return 'success'  
      if (warning) return 'warning'
      return variant || 'default'
    }

    const resizeClasses = {
      none: 'resize-none',
      vertical: 'resize-y',
      horizontal: 'resize-x', 
      both: 'resize'
    }

    const effectiveSize = getAutoSize()
    const effectiveVariant = getAutoVariant()

    return (
      <div className="space-y-2">
        {label && (
          <label 
            htmlFor={textareaId}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-body-responsive"
          >
            {label}
          </label>
        )}
        
        <textarea
          className={cn(
            inputVariants({ variant: effectiveVariant, size: effectiveSize }),
            resizeClasses[resize],
            'min-h-[80px]',
            className
          )}
          ref={ref}
          id={textareaId}
          rows={minRows}
          style={{
            maxHeight: maxRows ? `${maxRows * 1.5}rem` : undefined
          }}
          aria-describedby={
            [
              description && `${textareaId}-description`,
              error && `${textareaId}-error`,
              success && `${textareaId}-success`,
              warning && `${textareaId}-warning`
            ].filter(Boolean).join(' ') || undefined
          }
          aria-invalid={error ? 'true' : undefined}
          {...props}
        />

        {description && !error && !success && !warning && (
          <p id={`${textareaId}-description`} className="text-sm text-muted-foreground">
            {description}
          </p>
        )}

        {error && (
          <p id={`${textareaId}-error`} className="text-sm text-error">
            {error}
          </p>
        )}

        {success && !error && (
          <p id={`${textareaId}-success`} className="text-sm text-success">
            {success}
          </p>
        )}

        {warning && !error && !success && (
          <p id={`${textareaId}-warning`} className="text-sm text-warning">
            {warning}
          </p>
        )}
      </div>
    )
  }
)
Textarea.displayName = "Textarea"

export { Input, Textarea, inputVariants }