'use client'

import { useState } from 'react'
import Link from 'next/link'

const AESTHETICS = [
  'Minimalist',
  'Avant-Garde',
  'Classic',
  'Contemporary',
  'Romantic',
  'Utilitarian',
  'Preppy',
  'Bohemian',
  'Streetwear',
  'Androgynous',
  'Dark Academia',
  'Old Money',
]

const FORMALITY_PROFILES = [
  { value: 'creative', label: 'Creative Professional', desc: 'Smart casual with expressive touches' },
  { value: 'executive', label: 'Executive', desc: 'Polished business attire, always refined' },
  { value: 'casual', label: 'Relaxed Casual', desc: 'Comfort-led, effortlessly laid-back' },
  { value: 'mixed', label: 'Context-Adaptive', desc: 'Shifts fluidly from boardroom to weekend' },
]

const PALETTE_AFFINITIES = [
  { key: 'neutrals', label: 'Neutrals', swatches: ['#1c1b1b', '#5e5e5d', '#c4c7c7', '#fdf8f8'] },
  { key: 'earth', label: 'Earth Tones', swatches: ['#6b4c3b', '#a0785a', '#c9a87c', '#e8d5b7'] },
  { key: 'jewel', label: 'Jewel Tones', swatches: ['#1a3a6e', '#6b2f7a', '#1a6b4e', '#8b2020'] },
  { key: 'pastels', label: 'Pastels', swatches: ['#b8d4e8', '#e8c4d4', '#c4e8cc', '#e8e4b8'] },
]

export default function StyleIDPage() {
  const [selectedAesthetics, setSelectedAesthetics] = useState<string[]>([])
  const [selectedFormality, setSelectedFormality] = useState<string>('')
  const [selectedPalette, setSelectedPalette] = useState<string>('')
  const [saved, setSaved] = useState(false)

  const toggleAesthetic = (a: string) => {
    setSelectedAesthetics((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : prev.length < 4 ? [...prev, a] : prev
    )
  }

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const profileComplete = selectedAesthetics.length > 0 && selectedFormality && selectedPalette

  return (
    <div className="bg-surface min-h-screen">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="border-b border-outline-variant">
        <div className="max-w-atelier mx-auto px-16 py-16">
          <p className="label-caps mb-4">Style ID</p>
          <h1 className="font-serif text-headline-md font-normal text-on-surface mb-3">
            Define Your Aesthetic
          </h1>
          <p className="text-sm text-on-surface-variant max-w-lg">
            Your style profile shapes every recommendation Atelier Digital makes.
            Select the keywords that resonate — our AI will calibrate its
            suggestions to your sensibility.
          </p>
        </div>
      </div>

      <div className="max-w-atelier mx-auto px-16 py-16 space-y-16">

        {/* ── Aesthetic Keywords ─────────────────────────────────────────── */}
        <section>
          <div className="border-b border-outline-variant pb-6 mb-8">
            <h2 className="font-serif text-xl font-normal text-on-surface">
              Aesthetic Keywords
            </h2>
            <p className="text-sm text-on-surface-variant mt-1">
              Select up to 4 that best describe your style.{' '}
              <span className="text-outline">{selectedAesthetics.length}/4 selected</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {AESTHETICS.map((a) => {
              const selected = selectedAesthetics.includes(a)
              return (
                <button
                  key={a}
                  onClick={() => toggleAesthetic(a)}
                  disabled={!selected && selectedAesthetics.length >= 4}
                  className={`px-4 py-2 border text-xs font-medium tracking-caps uppercase transition-colors duration-150 ${
                    selected
                      ? 'bg-on-surface text-surface border-on-surface'
                      : 'border-outline-variant text-on-surface-variant hover:border-on-surface hover:text-on-surface disabled:opacity-30 disabled:cursor-not-allowed'
                  }`}
                >
                  {a}
                </button>
              )
            })}
          </div>
        </section>

        {/* ── Formality Profile ──────────────────────────────────────────── */}
        <section>
          <div className="border-b border-outline-variant pb-6 mb-8">
            <h2 className="font-serif text-xl font-normal text-on-surface">
              Lifestyle Formality
            </h2>
            <p className="text-sm text-on-surface-variant mt-1">
              How do you primarily dress for your daily life?
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {FORMALITY_PROFILES.map(({ value, label, desc }) => (
              <button
                key={value}
                onClick={() => setSelectedFormality(value)}
                className={`p-6 border text-left transition-colors duration-150 ${
                  selectedFormality === value
                    ? 'border-on-surface bg-surface-container'
                    : 'border-outline-variant hover:border-on-surface-variant'
                }`}
              >
                <h3 className="font-serif text-base font-normal text-on-surface mb-1">
                  {label}
                </h3>
                <p className="text-xs text-on-surface-variant">{desc}</p>
                {selectedFormality === value && (
                  <p className="label-caps text-on-surface mt-3">Selected</p>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* ── Colour Palette Affinity ────────────────────────────────────── */}
        <section>
          <div className="border-b border-outline-variant pb-6 mb-8">
            <h2 className="font-serif text-xl font-normal text-on-surface">
              Colour Palette Affinity
            </h2>
            <p className="text-sm text-on-surface-variant mt-1">
              Which palette speaks most to your wardrobe?
            </p>
          </div>
          <div className="grid grid-cols-4 gap-6">
            {PALETTE_AFFINITIES.map(({ key, label, swatches }) => (
              <button
                key={key}
                onClick={() => setSelectedPalette(key)}
                className={`p-5 border text-left transition-colors duration-150 ${
                  selectedPalette === key
                    ? 'border-on-surface'
                    : 'border-outline-variant hover:border-on-surface-variant'
                }`}
              >
                <div className="flex gap-1.5 mb-4">
                  {swatches.map((swatch, i) => (
                    <div
                      key={i}
                      className="h-6 flex-1 border border-outline-variant/40"
                      style={{ backgroundColor: swatch }}
                    />
                  ))}
                </div>
                <p className="label-caps">{label}</p>
                {selectedPalette === key && (
                  <p className="label-caps text-on-surface mt-1">✓</p>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* ── Style Summary ──────────────────────────────────────────────── */}
        {profileComplete && (
          <section className="border border-outline-variant p-8 animate-fade-in">
            <p className="label-caps mb-5">Your Style Profile</p>
            <div className="grid grid-cols-3 gap-8">
              <div>
                <p className="label-caps text-outline mb-2">Aesthetic</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedAesthetics.map((a) => (
                    <span key={a} className="px-2 py-1 bg-on-surface text-surface text-xs font-medium tracking-caps uppercase">
                      {a}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="label-caps text-outline mb-2">Lifestyle</p>
                <p className="font-serif text-base text-on-surface mt-1">
                  {FORMALITY_PROFILES.find((f) => f.value === selectedFormality)?.label}
                </p>
              </div>
              <div>
                <p className="label-caps text-outline mb-2">Palette</p>
                <p className="font-serif text-base text-on-surface mt-1">
                  {PALETTE_AFFINITIES.find((p) => p.key === selectedPalette)?.label}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* ── Save & navigate ────────────────────────────────────────────── */}
        <div className="flex gap-4 pt-4 border-t border-outline-variant">
          <button
            onClick={handleSave}
            disabled={!profileComplete}
            className="px-8 py-3 bg-on-surface text-surface text-sm font-medium tracking-btn uppercase hover:bg-black transition-colors duration-150 disabled:opacity-40"
          >
            {saved ? 'Profile Saved ✓' : 'Save Profile'}
          </button>
          <Link
            href="/wardrobe/suggest-pairing"
            className="px-8 py-3 border border-outline text-on-surface-variant text-sm font-medium tracking-btn uppercase hover:border-on-surface hover:text-on-surface transition-colors duration-150"
          >
            Build an Outfit →
          </Link>
        </div>
      </div>
    </div>
  )
}
