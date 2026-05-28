'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function Navigation() {
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  return (
    <nav className="bg-white border-b border-divider sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <Link
            href="/"
            className="text-xl font-bold text-primary hover:text-primary-dark transition-colors"
          >
            Wardrobe
          </Link>

          <div className="flex gap-12">
            <Link
              href="/"
              className={`text-sm font-medium transition-colors duration-150 ${
                isActive('/')
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-text-secondary hover:text-primary'
              }`}
            >
              Home
            </Link>
            <Link
              href="/wardrobe"
              className={`text-sm font-medium transition-colors duration-150 ${
                isActive('/wardrobe')
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-text-secondary hover:text-primary'
              }`}
            >
              Upload
            </Link>
            <Link
              href="/wardrobe/gallery"
              className={`text-sm font-medium transition-colors duration-150 ${
                isActive('/wardrobe/gallery')
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-text-secondary hover:text-primary'
              }`}
            >
              Gallery
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
