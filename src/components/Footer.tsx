import { Copyright } from 'lucide-react'
import { ContactForm } from './ContactForm'

export default function Footer() {
  return (
    <footer className="w-full py-4 mt-auto bg-white/95 backdrop-blur-sm border-t border-gray-100 shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-gray-600">
          <div className="flex items-center gap-2">
            <Copyright className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-sm">כל הזכויות שמורות 2025</span>
          </div>
          <div className="text-sm text-gray-400">
            Developed by Shulamit
          </div>
          <ContactForm />
        </div>
      </div>
    </footer>
  )
} 