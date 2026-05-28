import type { Metadata } from 'next'
import { Fredoka, Poppins } from 'next/font/google'
import { Navigation } from '@/components/Navigation'
import './globals.css'

const fredoka = Fredoka({
  variable: '--font-fredoka',
  subsets: ['latin'],
})

const poppins = Poppins({
  variable: '--font-poppins',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'AI Wardrobe Assistant',
  description: 'Organize your wardrobe with AI-powered metadata extraction',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${fredoka.variable} ${poppins.variable}`}>
      <body className="bg-bg-primary">
        <Navigation />
        <main>
          {children}
        </main>
      </body>
    </html>
  )
}
