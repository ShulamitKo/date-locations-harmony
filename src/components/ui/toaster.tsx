import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        // בודקים אם זו הודעת טעינה לפי הכותרת
        const isLoading = title?.includes("שולח")
        
        return (
          <div key={id} className="relative">
            {/* שכבת Overlay רק להודעת טעינה */}
            {isLoading && (
              <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[99999]" />
            )}
            <Toast 
              {...props} 
              className={`
                relative z-[100000] min-w-[300px] p-4 rounded-lg shadow-2xl text-center
                ${props.className || 'bg-primary text-white'}
              `}
            >
              <div className="grid gap-2 text-center">
                {title && <ToastTitle className="text-lg font-semibold">{title}</ToastTitle>}
                {description && (
                  <ToastDescription className="text-sm opacity-90">{description}</ToastDescription>
                )}
              </div>
              {action}
              <ToastClose className="absolute left-2 top-2 opacity-70 hover:opacity-100 transition-opacity" />
            </Toast>
          </div>
        )
      })}
      <ToastViewport 
        className="
          fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
          z-[100000] flex flex-col items-center justify-center gap-3 
          w-[90vw] max-w-[400px] p-4 pointer-events-none
        " 
      />
    </ToastProvider>
  )
}
