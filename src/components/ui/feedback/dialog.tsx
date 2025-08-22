import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { useDeviceType } from "@/hooks/use-theme"

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 transition-theme",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const dialogContentVariants = cva(
  "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-lg transition-theme",
  {
    variants: {
      size: {
        sm: "max-w-sm",
        default: "max-w-lg",
        lg: "max-w-2xl",
        xl: "max-w-4xl",
        full: "max-w-[95vw] max-h-[95vh]",
        // Tailles device-aware
        mobile: "max-w-[95vw] max-h-[90vh] mx-4",
        desktop: "max-w-lg",
        tv: "max-w-3xl p-12 gap-6",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

export interface DialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>,
    VariantProps<typeof dialogContentVariants> {
  showClose?: boolean
}

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ className, children, size, showClose = true, ...props }, ref) => {
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
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(dialogContentVariants({ size: effectiveSize, className }))}
        {...props}
      >
        {children}
        {showClose && (
          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground touch-target">
            <X className={cn(
              "h-4 w-4",
              deviceType === 'tv' && "h-6 w-6"
            )} />
            <span className="sr-only">Fermer</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
})
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  const deviceType = useDeviceType()
  
  return (
    <div
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end",
        deviceType === 'mobile' ? "gap-4" : "gap-2",
        className
      )}
      {...props}
    />
  )
}
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-h3-responsive font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-body-responsive text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

// Composants spécialisés pour Baš-Malin
export interface ConfirmDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive' | 'jardin'
  onConfirm: () => void | Promise<void>
  onCancel?: () => void
  loading?: boolean
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirmer",
  cancelText = "Annuler",
  variant = 'default',
  onConfirm,
  onCancel,
  loading = false
}: ConfirmDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false)

  const handleConfirm = async () => {
    try {
      setIsLoading(true)
      await onConfirm()
      onOpenChange?.(false)
    } catch (error) {
      console.error('Error in confirm dialog:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    onCancel?.()
    onOpenChange?.(false)
  }

  // const confirmVariants = {
  //   default: "default",
  //   destructive: "destructive", 
  //   jardin: "jardin"
  // }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>
        
        <DialogFooter>
          <button
            type="button"
            onClick={handleCancel}
            disabled={isLoading || loading}
            className="touch-target inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
          >
            {cancelText}
          </button>
          
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading || loading}
            className={cn(
              "touch-target inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2",
              variant === 'destructive' && "bg-destructive text-destructive-foreground hover:bg-destructive/90",
              variant === 'jardin' && "bg-jardin-green-500 text-white hover:bg-jardin-green-600",
              variant === 'default' && "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            {(isLoading || loading) && (
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            )}
            {confirmText}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Dialog pour les formulaires
export interface FormDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  title: string
  description?: string
  children: React.ReactNode
  size?: DialogContentProps['size']
}

export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  size
}: FormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size={size}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>
        
        {children}
      </DialogContent>
    </Dialog>
  )
}

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}