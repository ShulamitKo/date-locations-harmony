import { Copyright, MessageCircle } from 'lucide-react'

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
          <a 
            href="https://wa.me/972527609961" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-green-600 hover:text-green-700 transition-colors duration-200 hover:scale-105 active:scale-100"
          >
            <MessageCircle className="h-4 w-4" />
            <span className="text-sm font-medium">צור קשר</span>
          </a>
        </div>
      </div>
    </footer>
  )
} 