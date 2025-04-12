
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { useEffect } from "react"

export function Toaster() {
  const { toasts, dismiss } = useToast()

  // Measure performance for toast component rendering
  useEffect(() => {
    if (toasts.length > 0) {
      console.log(`Currently displaying ${toasts.length} toast(s)`)
    }
  }, [toasts.length])

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, onOpenChange, ...props }) {
        return (
          <Toast 
            key={id} 
            {...props} 
            className="transition-all duration-300 ease-in-out group"
            onOpenChange={(open) => {
              if (!open) {
                console.log('Toast closed via onOpenChange');
                dismiss(id);
              }
              onOpenChange?.(open);
            }}
          >
            <div className="grid gap-1">
              {title && <ToastTitle className="animate-fade-in">{title}</ToastTitle>}
              {description && (
                <ToastDescription className="animate-fade-in delay-75">{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose 
              onClick={() => {
                console.log('Toast close button clicked');
                dismiss(id);
              }}
              className="absolute right-2 top-2 opacity-70 transition-opacity hover:opacity-100 focus:opacity-100"
            />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
