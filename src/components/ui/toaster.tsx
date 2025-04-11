// Likely path: @/components/ui/toaster.tsx

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  ToastAction // Import if you use actions
} from "@/components/ui/toast" // Adjust path if needed
import { useToast } from "@/hooks/use-toast" // Adjust path if needed

export function Toaster() {
  const { toasts } = useToast()

  return (
    // Provider sets defaults like duration, swipe direction for all toasts
    <ToastProvider swipeDirection="right" duration={5000}>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        // Props passed down include: open, onOpenChange, variant, duration (if set per-toast)
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action} {/* Render action button if provided */}
            <ToastClose /> {/* Essential for manual closing */}
          </Toast>
        )
      })}
      {/* Viewport defines where toasts appear */}
      <ToastViewport />
    </ToastProvider>
  )
}