import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useState, useRef } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Mail } from "lucide-react"
import { EMAIL_STYLES } from "./email-styles"
import { validateForm } from "./form-validation"

export function ContactForm() {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const formData = new FormData(form)
    
    // בדיקת ולידציה
    const { isValid, errors } = validateForm(formData);
    
    if (!isValid) {
      toast({
        title: "שגיאה בטופס",
        description: errors.join('\n'),
        duration: 5000,
        className: "bg-red-500/95 shadow-2xl text-center rtl",
      })
      return;
    }

    setIsSubmitting(true)
    
    try {
      toast({
        title: "שולח את ההודעה...",
        description: "אנא המתן",
        duration: 2000,
        className: "bg-primary/95 shadow-2xl text-center rtl",
      })

      const tempForm = document.createElement('form')
      tempForm.method = 'POST'
      tempForm.action = form.action
      tempForm.target = 'submitFrame'
      
      for (const [key, value] of formData.entries()) {
        const input = document.createElement('input')
        input.type = 'hidden'
        input.name = key
        input.value = value.toString()
        tempForm.appendChild(input)
      }

      document.body.appendChild(tempForm)
      tempForm.submit()
      document.body.removeChild(tempForm)

      setTimeout(() => {
        toast({
          title: "ההודעה נשלחה בהצלחה! 🎉",
          description: "תודה על פנייתך, נחזור אליך בהקדם",
          duration: 5000,
          className: "bg-green-500/95 shadow-2xl text-center rtl",
        })
        setIsSubmitting(false)
        setIsOpen(false)
        form.reset()
      }, 2000)
    } catch (error) {
      toast({
        title: "שגיאה בשליחת הטופס",
        description: "אנא נסה שוב מאוחר יותר",
        duration: 5000,
        className: "bg-red-500/95 shadow-2xl text-center rtl",
      })
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <iframe
        name="submitFrame"
        style={{ display: 'none' }}
        ref={iframeRef}
      />
      <Dialog open={isOpen} onOpenChange={(open) => !isSubmitting && setIsOpen(open)}>
        <DialogTrigger asChild>
          <Button 
            variant="default"
            className="bg-primary hover:bg-primary/90 text-white shadow-md transition-all duration-200 hover:scale-105 flex items-center gap-2 px-4"
          >
            <Mail className="h-4 w-4" />
            <span>צור קשר</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px] p-0 gap-0 overflow-hidden [&>[role=button]]:left-4 [&>[role=button]]:top-6 [&>[role=button]]:p-2 [&>[role=button]]:hover:bg-primary/10 [&>[role=button]]:rounded-full [&>[role=button]]:transition-colors">
          <div className="bg-primary/10 p-6">
            <DialogTitle className="text-xl font-semibold text-primary text-center">צור קשר</DialogTitle>
          </div>
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            action="https://formsubmit.co/a09aea30b021efbcf8b44ca97295d15f"
            method="POST"
            className="p-6 space-y-4"
          >
            <input type="hidden" name="_subject" value="פנייה חדשה מDateSpots האתר שלך: {subject}" />
            <input type="hidden" name="_captcha" value="false" />
            <input type="hidden" name="_template" value="box" />
            <input type="hidden" name="_autoresponse" value="תודה על פנייתך! קיבלנו את ההודעה ונחזור אליך בהקדם." />
            <input type="hidden" name="_ratelimit" value="60" />
            <input type="hidden" name="_style" value={EMAIL_STYLES} />
            
            <div className="space-y-2">
              <Label htmlFor="subject" className="text-sm font-medium">נושא</Label>
              <Input 
                id="subject" 
                name="subject" 
                required 
                disabled={isSubmitting}
                placeholder="נושא ההודעה"
                className="border-gray-200 focus:border-primary focus:ring-primary"
                onChange={(e) => {
                  const subjectInput = document.querySelector('input[name="_subject"]') as HTMLInputElement;
                  if (subjectInput) {
                    subjectInput.value = `פנייה חדשה מDateSpots האתר שלך: ${e.target.value}`;
                  }
                }}
                aria-label="נושא ההודעה"
                minLength={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">שם</Label>
              <Input 
                id="name" 
                name="name" 
                required 
                disabled={isSubmitting}
                className="border-gray-200 focus:border-primary focus:ring-primary"
                aria-label="שם השולח"
                minLength={2}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">אימייל לתגובה</Label>
              <Input 
                type="email" 
                id="email" 
                name="email" 
                required 
                dir="ltr" 
                disabled={isSubmitting}
                className="border-gray-200 focus:border-primary focus:ring-primary"
                aria-label="כתובת אימייל לתגובה"
                pattern="[^@\s]+@[^@\s]+\.[^@\s]+"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="message" className="text-sm font-medium">תוכן ההודעה</Label>
              <Textarea 
                id="message" 
                name="message" 
                required 
                disabled={isSubmitting}
                className="min-h-[120px] border-gray-200 focus:border-primary focus:ring-primary"
                aria-label="תוכן ההודעה"
                minLength={10}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90 text-white shadow-md transition-all duration-200"
              disabled={isSubmitting}
              aria-label="שלח טופס"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>שולח...</span>
                </div>
              ) : (
                "שלח"
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
} 