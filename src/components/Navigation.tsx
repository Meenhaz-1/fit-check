'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { UserProfile } from '@/lib/db'

const NAV_LINKS = [
  { href: '/style', label: 'Style ID', short: 'Style' },
  { href: '/wardrobe/gallery', label: 'My Wardrobe', short: 'Wardrobe' },
  { href: '/wardrobe/suggest-pairing', label: 'Outfit Builder', short: 'Outfits' },
  { href: '/wardrobe/evaluate-item', label: 'Purchase Consultant', short: 'Evaluate' },
]

export function Navigation() {
  const pathname = usePathname()
  const [profiles, setProfiles] = useState<UserProfile[]>([])
  const [activeProfile, setActiveProfile] = useState<UserProfile | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(true)

  // Load profiles on mount
  useEffect(() => {
    const loadProfiles = async () => {
      try {
        const response = await fetch('/api/profiles')
        const data = await response.json()
        setProfiles(data.profiles || [])
        setActiveProfile(data.defaultProfile || null)
      } catch (error) {
        console.error('Failed to load profiles:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProfiles()
  }, [])

  const isActive = (href: string) =>
    pathname === href || (href !== '/' && pathname.startsWith(href))

  const handleSwitchProfile = async (profileId: string) => {
    try {
      const response = await fetch('/api/profiles/default', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId }),
      })

      if (response.ok) {
        const newDefault = await response.json()
        setActiveProfile(newDefault)
        setShowDropdown(false)

        // Reload profiles list
        const profilesResponse = await fetch('/api/profiles')
        const profilesData = await profilesResponse.json()
        setProfiles(profilesData.profiles || [])
      }
    } catch (error) {
      console.error('Failed to switch profile:', error)
    }
  }

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

        {/* Profile Avatar & Dropdown */}
        <div className="relative ml-auto flex-shrink-0">
          {loading ? (
            <div className="w-10 h-10 bg-outline-variant/20 rounded-full animate-pulse" />
          ) : activeProfile ? (
            <>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-outline-variant hover:border-on-surface-variant transition-colors duration-150"
                title={activeProfile.name}
              >
                {activeProfile.photoUrl ? (
                  <img
                    src={activeProfile.photoUrl}
                    alt={activeProfile.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-on-surface/10 flex items-center justify-center text-xs font-medium">
                    {activeProfile.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-xs sm:text-sm font-medium text-on-surface hidden sm:inline max-w-[120px] truncate">
                  {activeProfile.name}
                </span>
                <span className="text-outline text-xs">▼</span>
              </button>

              {/* Dropdown Menu */}
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-surface border border-outline-variant rounded-lg shadow-lg p-2 z-50">
                  <div className="max-h-72 overflow-y-auto">
                    {profiles.map((profile) => (
                      <button
                        key={profile.id}
                        onClick={() => handleSwitchProfile(profile.id)}
                        className={`w-full text-left px-3 py-2 rounded-md flex items-center gap-3 transition-colors duration-150 ${
                          profile.id === activeProfile.id
                            ? 'bg-surface-container text-on-surface'
                            : 'hover:bg-surface-container/50 text-on-surface-variant hover:text-on-surface'
                        }`}
                      >
                        {profile.photoUrl ? (
                          <img
                            src={profile.photoUrl}
                            alt={profile.name}
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-on-surface/10 flex items-center justify-center text-xs font-medium flex-shrink-0">
                            {profile.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {profile.name}
                          </div>
                          {profile.gender && profile.buildType && (
                            <div className="text-xs text-on-surface-variant truncate">
                              {profile.gender} • {profile.buildType}
                            </div>
                          )}
                        </div>
                        {profile.id === activeProfile.id && (
                          <span className="text-on-surface">✓</span>
                        )}
                      </button>
                    ))}

                    <div className="border-t border-outline-variant/40 my-2" />

                    <Link
                      href="/style?create=true"
                      onClick={() => setShowDropdown(false)}
                      className="block w-full text-left px-3 py-2 rounded-md text-sm text-on-surface hover:bg-surface-container/50 transition-colors duration-150"
                    >
                      + Create New Profile
                    </Link>

                    <Link
                      href="/style"
                      onClick={() => setShowDropdown(false)}
                      className="block w-full text-left px-3 py-2 rounded-md text-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container/50 transition-colors duration-150"
                    >
                      Edit Profile
                    </Link>
                  </div>
                </div>
              )}
            </>
          ) : (
            <Link
              href="/style"
              className="px-4 py-2 bg-on-surface text-surface text-xs sm:text-sm font-medium rounded-lg hover:bg-black transition-colors duration-150 whitespace-nowrap"
            >
              Create Profile
            </Link>
          )}
        </div>

        {/* Close dropdown when clicking elsewhere */}
        {showDropdown && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />
        )}
      </div>
    </nav>
  )
}
