import { Copyright, MessageCircle } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="w-full py-6 mt-auto bg-white border-t">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center gap-2 text-gray-600">
          <Copyright className="h-4 w-4" />
          <span>כל הזכויות שמורות 2025 | Developed by Shulamit</span>
          <a 
            href="https://wa.me/972527609961" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-green-600 hover:text-green-700 transition-colors"
          >
            <MessageCircle className="h-5 w-5" />
            <span>צור קשר</span>
          </a>
        </div>
      </div>
    </footer>
  )
} 