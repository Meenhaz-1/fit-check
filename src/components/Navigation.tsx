'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function Navigation() {
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  return (
    <nav className="bg-white border-b-2 border-primary-hot/10 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <Link
            href="/"
            className="font-display text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent hover:opacity-80 transition-opacity"
          >
            👗 Wardrobe
          </Link>

          <div className="flex gap-8">
            <Link
              href="/"
              className={`font-medium transition-all duration-300 ${
                isActive('/')
                  ? 'text-primary-hot border-b-2 border-primary-hot'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              🏠 Home
            </Link>
            <Link
              href="/wardrobe"
              className={`font-medium transition-all duration-300 ${
                isActive('/wardrobe')
                  ? 'text-primary-hot border-b-2 border-primary-hot'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              📸 Upload
            </Link>
            <Link
              href="/wardrobe/gallery"
              className={`font-medium transition-all duration-300 ${
                isActive('/wardrobe/gallery')
                  ? 'text-primary-hot border-b-2 border-primary-hot'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              👗 Gallery
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
