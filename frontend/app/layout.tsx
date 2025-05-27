import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { cn } from '@/lib/utils'
import { Providers } from "./providers";
import { Navbar } from '@/components/ui/navbar';
import { Sparkles } from 'lucide-react';

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ShadowVote',
  description: 'ShadowVote is a platform for creating and participating in encrypted votes.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
          integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>
      <body className={cn(
        'min-h-screen bg-background font-sans antialiased',
        inter.className
      )}>
        <div className="relative flex min-h-screen flex-col">
          <Providers>
            <Navbar />
            <div className="flex-1">
              {children}
            </div>
          </Providers>

          <footer className="border-t border-purple-900/30 py-8 backdrop-blur-sm">
            <div className="container mx-auto">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <div className="flex items-center mb-4 md:mb-0">
                  <Sparkles className="w-4 h-4 mr-2 text-purple-400" />
                  <span className="text-sm font-medium text-gray-400">ShadowVote © 2025</span>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
