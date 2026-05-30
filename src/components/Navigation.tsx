'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_LINKS = [
  { href: '/style', label: 'Style ID', short: 'Style' },
  { href: '/wardrobe/gallery', label: 'My Wardrobe', short: 'Wardrobe' },
  { href: '/wardrobe/suggest-pairing', label: 'Outfit Builder', short: 'Outfits' },
  { href: '/wardrobe/evaluate-item', label: 'Purchase Consultant', short: 'Evaluate' },
]

export function Navigation() {
  const pathname = usePathname()

  const isActive = (href: string) =>
    pathname === href || (href !== '/' && pathname.startsWith(href))

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-surface/80 border-b border-outline-variant/40 shadow-lg shadow-black/5">
      <div className="max-w-atelier mx-auto px-3 sm:px-6 md:px-8 lg:px-16 h-14 sm:h-16 flex items-center justify-between gap-3 sm:gap-6">
        <Link
          href="/"
          className="font-serif text-xs sm:text-base font-normal tracking-wide text-on-surface hover:text-on-surface-variant transition-colors duration-150 flex-shrink-0"
        >
          Atelier Digital
        </Link>

        <div className="flex items-center gap-1.5 sm:gap-4 md:gap-6 lg:gap-10 flex-shrink overflow-hidden">
          {NAV_LINKS.map(({ href, label, short }) => (
            <Link
              key={href}
              href={href}
              className={`label-caps text-xs sm:text-xs md:text-sm transition-all duration-150 whitespace-nowrap px-2 py-1.5 rounded-md ${
                isActive(href)
                  ? 'text-on-surface bg-surface/40 border-b border-on-surface pb-px'
                  : 'text-outline hover:text-on-surface-variant hover:bg-surface/20'
              }`}
            >
              <span className="sm:hidden">{short}</span>
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
