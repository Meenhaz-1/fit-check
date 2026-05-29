'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { apiFetch } from '@/lib/apiFetch'
import type { EvaluationAnalysis } from '@/types'

interface EvaluationResult {
  detectedItems: string[]
  evaluation: EvaluationAnalysis
  evaluationId: string
  persona?: string
}

interface DetectionResult {
  detectedItems: string[]
}

type Persona = 'minimalist' | 'trendforward'

const PERSONAS = {
  minimalist: {
    name: 'Heritage Minimalist',
    icon: '⏳',
    tagline: 'Timeless & Curated',
    description: 'Evaluates against timeless standards. Emphasizes quality, restraint, and pieces that work for years.',
  },
  trendforward: {
    name: 'Trend-Forward',
    icon: '✨',
    tagline: 'Current & Expressive',
    description: 'Values self-expression and fashion evolution. Excited about color, trends, and personal style.',
  },
} as const

const SCORE_LABELS_BY_PERSONA = {
  minimalist: [
    ['Timeless Appeal', 'overallCohesion'],
    ['Investment Value', 'colorHarmony'],
    ['Quality Construction', 'proportionBalance'],
    ['Neutral Versatility', 'formalityAlignment'],
  ],
  trendforward: [
    ['Style Expression', 'overallCohesion'],
    ['Trend Relevance', 'colorHarmony'],
    ['Personal Impact', 'proportionBalance'],
    ['Fashion Dynamism', 'formalityAlignment'],
  ],
} as const

const VERDICT_CONFIG = {
  Buy: {
    bg: 'bg-surface-low',
    border: 'border-success',
    text: 'text-success',
    label: 'Verdict: Approved',
  },
  Maybe: {
    bg: 'bg-surface-container',
    border: 'border-atelier-gold-dim',
    text: 'text-atelier-gold-dim',
    label: 'Verdict: Consider',
  },
  'Don\'t Buy': {
    bg: 'bg-error-container',
    border: 'border-error',
    text: 'text-error',
    label: 'Verdict: Decline',
  },
} as const

export default function EvaluateItemPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [mediaType, setMediaType] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [detectedItems, setDetectedItems] = useState<string[]>([])
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [selectedPersona, setSelectedPersona] = useState<Persona>('minimalist')
  const [result, setResult] = useState<EvaluationResult | null>(null)
  const [buttonPressed, setButtonPressed] = useState(false)
  const [showRipple, setShowRipple] = useState(false)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setError(null)
    setResult(null)
    setDetectedItems([])
    setSelectedItems(new Set())

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file')
      return
    }

    const reader = new FileReader()
    reader.onload = async (e) => {
      const base64 = e.target?.result as string
      setImagePreview(base64)
      setMediaType(file.type || 'image/jpeg')

      // Auto-detect items
      setLoading(true)
      try {
        const response = await apiFetch('/api/wardrobe/evaluate-item/detect', {
          method: 'POST',
          body: JSON.stringify({
            image: base64,
            mediaType: file.type || 'image/jpeg',
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to detect items')
        }

        setDetectedItems(data.detectedItems || [])
        // Auto-select all items by default
        setSelectedItems(new Set(data.detectedItems || []))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to detect items')
      } finally {
        setLoading(false)
      }
    }

    reader.readAsDataURL(file)
  }

  const toggleItemSelection = (item: string) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(item)) {
      newSelected.delete(item)
    } else {
      newSelected.add(item)
    }
    setSelectedItems(newSelected)
  }

  const handleEvaluate = async () => {
    if (!imagePreview || selectedItems.size === 0) {
      setError('Please select at least one item to evaluate')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await apiFetch('/api/wardrobe/evaluate-item/evaluate', {
        method: 'POST',
        body: JSON.stringify({
          image: imagePreview,
          mediaType: mediaType || 'image/jpeg',
          selectedItems: Array.from(selectedItems),
          persona: selectedPersona,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to evaluate outfit')
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to evaluate outfit')
    } finally {
      setLoading(false)
    }
  }

  const handleButtonMouseDown = () => {
    setButtonPressed(true)
    setShowRipple(true)
    if (buttonRef.current) {
      buttonRef.current.classList.add('animate-button-press', 'animate-accent-ripple')
    }
  }

  const handleButtonMouseUp = () => {
    setButtonPressed(false)
    if (buttonRef.current) {
      buttonRef.current.classList.remove('animate-button-press')
      buttonRef.current.classList.add('animate-button-release')
      setTimeout(() => {
        if (buttonRef.current) {
          buttonRef.current.classList.remove('animate-button-release')
        }
      }, 200)
    }
  }

  const handleReset = () => {
    setImagePreview(null)
    setMediaType(null)
    setDetectedItems([])
    setSelectedItems(new Set())
    setResult(null)
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const verdictKey = result?.evaluation?.verdict as keyof typeof VERDICT_CONFIG | undefined
  const verdictStyle = verdictKey ? VERDICT_CONFIG[verdictKey] : null

  return (
    <div className="bg-surface min-h-screen">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="border-b border-outline-variant">
        <div className="max-w-atelier mx-auto px-4 sm:px-6 md:px-8 lg:px-16 py-6 sm:py-8 md:py-12 lg:py-16">
          <p className="label-caps mb-2 sm:mb-3 md:mb-4 text-xs sm:text-sm">Purchase Consultant</p>
          <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-normal text-on-surface mb-2 sm:mb-3">
            {result ? 'Style Analysis' : 'Evaluate a Look'}
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant max-w-md">
            {result
              ? 'A complete professional analysis of your outfit.'
              : 'Upload a potential purchase or styled outfit. Receive an honest verdict and professional critique from your AI stylist.'}
          </p>
        </div>
      </div>

      <div className="max-w-atelier mx-auto px-4 sm:px-6 md:px-8 lg:px-16 py-6 sm:py-8 md:py-12 lg:py-16">

        {!result ? (
          /* ── Upload / Detection / Selection state ──────────────────────── */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 lg:gap-24">
            <div>
              {!imagePreview ? (
                <label className="block cursor-pointer group">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="sr-only"
                  />
                  <div className="border border-outline-variant bg-surface-low aspect-[3/4] flex flex-col items-center justify-center group-hover:border-on-surface transition-colors duration-150">
                    <div className="w-10 h-10 border border-outline flex items-center justify-center mb-6">
                      <span className="text-lg text-outline">+</span>
                    </div>
                    <p className="label-caps mb-2">Upload Outfit</p>
                    <p className="text-xs text-outline">JPG, PNG up to 10 MB</p>
                  </div>
                </label>
              ) : (
                <div>
                  <div className="border border-outline-variant bg-surface-container aspect-[3/4] overflow-hidden flex items-center justify-center">
                    <img
                      src={imagePreview}
                      alt="Outfit preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <button
                    onClick={() => {
                      setImagePreview(null)
                      setMediaType(null)
                      if (fileInputRef.current) fileInputRef.current.value = ''
                    }}
                    className="mt-4 label-caps text-outline hover:text-on-surface transition-colors duration-150"
                  >
                    ← Replace Image
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-col justify-center">
              {error && (
                <div className="mb-8 p-4 border border-error bg-error-container">
                  <p className="text-sm text-error">{error}</p>
                </div>
              )}

              {imagePreview && detectedItems.length > 0 ? (
                <div>
                  <h2 className="font-serif text-lg sm:text-xl font-normal text-on-surface mb-4">
                    Items Detected
                  </h2>
                  <p className="text-xs sm:text-sm text-on-surface-variant mb-6">
                    {"Select the piece(s) you'd like analyzed. Evaluate the entire outfit or focus on specific items."}
                  </p>

                  <div className="space-y-3 mb-8 pb-8 border-b border-outline-variant">
                    {detectedItems.map((item) => (
                      <label
                        key={item}
                        className="flex items-center gap-3 cursor-pointer py-3 px-3 border border-outline-variant hover:border-on-surface transition-colors duration-150"
                      >
                        <input
                          type="checkbox"
                          checked={selectedItems.has(item)}
                          onChange={() => toggleItemSelection(item)}
                          className="w-4 h-4 accent-on-surface cursor-pointer"
                        />
                        <span className="text-sm text-on-surface flex-1">{item}</span>
                      </label>
                    ))}
                  </div>

                  {/* Persona selector */}
                  <div className="mb-8 pb-8 border-b border-outline-variant">
                    <h3 className="label-caps text-on-surface mb-4">Choose Perspective</h3>
                    <div className="space-y-3">
                      {(Object.entries(PERSONAS) as [Persona, typeof PERSONAS['minimalist']][]).map(([key, persona]) => (
                        <label
                          key={key}
                          className={`block p-4 border cursor-pointer transition-colors duration-150 ${
                            selectedPersona === key
                              ? 'border-on-surface bg-surface-container'
                              : 'border-outline-variant hover:border-on-surface-variant'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="radio"
                              name="persona"
                              value={key}
                              checked={selectedPersona === key}
                              onChange={() => setSelectedPersona(key)}
                              className="w-4 h-4 accent-on-surface cursor-pointer mt-0.5"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-lg">{persona.icon}</span>
                                <p className="label-caps text-on-surface">{persona.name}</p>
                                <span className="text-xs text-on-surface-variant">{persona.tagline}</span>
                              </div>
                              <p className="text-xs text-on-surface-variant">{persona.description}</p>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <button
                    ref={buttonRef}
                    onClick={handleEvaluate}
                    onMouseDown={handleButtonMouseDown}
                    onMouseUp={handleButtonMouseUp}
                    onMouseLeave={handleButtonMouseUp}
                    disabled={loading || selectedItems.size === 0}
                    className={`w-full px-6 py-4 bg-on-surface text-surface text-sm font-medium tracking-btn uppercase hover:bg-black transition-colors duration-150 disabled:opacity-40 ${
                      loading ? 'animate-loading-pulse' : ''
                    }`}
                  >
                    {loading ? 'Analysing…' : `Evaluate ${selectedItems.size === detectedItems.length ? 'Entire Outfit' : `${selectedItems.size} Item${selectedItems.size !== 1 ? 's' : ''}`} with ${PERSONAS[selectedPersona].name}`}
                  </button>
                </div>
              ) : imagePreview ? (
                <div>
                  <h2 className="font-serif text-lg sm:text-xl font-normal text-on-surface mb-4">
                    Detecting items…
                  </h2>
                  <p className="text-xs sm:text-sm text-on-surface-variant mb-8">
                    Please wait while we analyze your outfit.
                  </p>
                  <div className="h-2 bg-outline-variant rounded-full overflow-hidden">
                    <div className="h-full bg-on-surface animate-pulse" style={{width: '60%'}} />
                  </div>
                </div>
              ) : (
                <div>
                  <h2 className="font-serif text-lg sm:text-xl font-normal text-on-surface mb-6">
                    What you&rsquo;ll receive
                  </h2>
                  <div className="space-y-6">
                    {[
                      ['Scores', 'Cohesion, colour harmony, proportions, and formality alignment.'],
                      ['Critique', 'What works and what could be improved.'],
                      ['Verdict', 'Buy, Maybe, or Don\'t Buy — with honest reasoning.'],
                      ['Occasions', 'Where and when this outfit belongs.'],
                    ].map(([label, desc]) => (
                      <div key={label} className="flex gap-3 sm:gap-5 items-start border-b border-outline-variant pb-5 last:border-0">
                        <span className="label-caps text-on-surface w-16 sm:w-20 shrink-0 text-xs sm:text-sm">{label}</span>
                        <p className="text-xs sm:text-sm text-on-surface-variant">{desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ── Results state ────────────────────────────────────────────── */
          <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-6 md:gap-8 lg:gap-16">

            {/* Left column: image + scores */}
            <div>
              {imagePreview && (
                <div className="border border-outline-variant bg-surface-container aspect-[3/4] overflow-hidden flex items-center justify-center mb-8">
                  <img
                    src={imagePreview}
                    alt="Outfit"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}

              {/* Analysis scores */}
              <p className="label-caps mb-5">Analysis Scores</p>
              <p className="text-xs text-on-surface-variant mb-5">
                Evaluated by {result.persona ? PERSONAS[result.persona as Persona]?.name : 'Professional Stylist'}
              </p>
              <div className="space-y-5">
                {SCORE_LABELS_BY_PERSONA[result.persona as Persona || 'minimalist'].map(([label, key]) => {
                  const score = (result.evaluation as any)[key] as number
                  return (
                    <div key={key}>
                      <div className="flex justify-between items-baseline mb-2">
                        <span className="label-caps">{label}</span>
                        <span
                          className="text-sm font-medium"
                          style={{ color: 'var(--sage)' }}
                        >
                          {score}%
                        </span>
                      </div>
                      <div className="h-px bg-outline-variant w-full relative">
                        <div
                          className="h-px absolute left-0 top-0 transition-all duration-700"
                          style={{
                            width: `${Math.min(score, 100)}%`,
                            backgroundColor: 'var(--sage)',
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Occasions */}
              {result.evaluation.occasions?.length > 0 && (
                <div className="mt-8 border-t border-outline-variant pt-8">
                  <p className="label-caps mb-4">Perfect For</p>
                  <div className="flex flex-wrap gap-2">
                    {result.evaluation.occasions.map((occ, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 border border-outline-variant text-xs text-on-surface-variant"
                      >
                        {occ}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right column: critique */}
            <div className="animate-slide-up">

              {/* Persona badge */}
              {result.persona && (
                <div className="mb-8 pb-8 border-b border-outline-variant flex items-center gap-3">
                  <span className="text-2xl">{PERSONAS[result.persona as Persona]?.icon}</span>
                  <div>
                    <p className="label-caps text-on-surface-variant">Analysis Perspective</p>
                    <p className="font-serif text-base font-normal text-on-surface">
                      {PERSONAS[result.persona as Persona]?.name}
                    </p>
                  </div>
                </div>
              )}

              {/* Verdict */}
              {result.evaluation.verdict && verdictStyle && (
                <div
                  className={`p-4 sm:p-6 border mb-10 ${verdictStyle.bg} ${verdictStyle.border}`}
                >
                  <p className="label-caps mb-2 text-xs sm:text-sm">{verdictStyle.label}</p>
                  <h2 className={`font-serif text-lg sm:text-xl font-normal mb-3 ${verdictStyle.text}`}>
                    {result.evaluation.verdict}
                  </h2>
                  <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                    {result.evaluation.verdictReasoning}
                  </p>
                </div>
              )}

              {/* Detected items */}
              {result.detectedItems?.length > 0 && (
                <div className="border-b border-outline-variant pb-6 sm:pb-8 mb-6 sm:mb-8">
                  <p className="label-caps mb-3 sm:mb-4 text-xs sm:text-sm">Detected Items</p>
                  <ul className="space-y-2">
                    {result.detectedItems.map((item, i) => (
                      <li key={i} className="text-xs sm:text-sm text-on-surface flex gap-3">
                        <span className="text-outline">·</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* What works well */}
              {result.evaluation.whatWorksWell?.length > 0 && (
                <div className="border-b border-outline-variant pb-6 sm:pb-8 mb-6 sm:mb-8">
                  <p className="label-caps text-success mb-3 sm:mb-4 text-xs sm:text-sm">What Works Well</p>
                  <ul className="space-y-3">
                    {result.evaluation.whatWorksWell.map((point, i) => (
                      <li key={i} className="text-xs sm:text-sm text-on-surface flex gap-3">
                        <span className="text-success shrink-0 mt-0.5">✓</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* What could improve */}
              {result.evaluation.whatCouldImprove?.length > 0 && (
                <div className="border-b border-outline-variant pb-6 sm:pb-8 mb-6 sm:mb-8">
                  <p className="label-caps text-atelier-gold-dim mb-3 sm:mb-4 text-xs sm:text-sm">What Could Improve</p>
                  <ul className="space-y-3">
                    {result.evaluation.whatCouldImprove.map((point, i) => (
                      <li key={i} className="text-xs sm:text-sm text-on-surface flex gap-3">
                        <span className="text-atelier-gold-dim shrink-0 mt-0.5">·</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Styling recommendations */}
              {result.evaluation.specificStylingRecommendations?.length > 0 && (
                <div className="border-b border-outline-variant pb-6 sm:pb-8 mb-6 sm:mb-8">
                  <p className="label-caps mb-3 sm:mb-4 text-xs sm:text-sm">Styling Recommendations</p>
                  <ul className="space-y-3">
                    {result.evaluation.specificStylingRecommendations.map((rec, i) => (
                      <li key={i} className="text-xs sm:text-sm text-on-surface flex gap-3">
                        <span className="text-outline shrink-0 mt-0.5">→</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-4">
                <button
                  onClick={handleReset}
                  className="px-6 sm:px-8 py-2.5 sm:py-3 border border-outline text-on-surface-variant text-xs sm:text-sm font-medium tracking-btn uppercase hover:border-on-surface hover:text-on-surface transition-colors duration-150"
                >
                  Evaluate Another
                </button>
                <Link
                  href="/wardrobe/gallery"
                  className="px-6 sm:px-8 py-2.5 sm:py-3 bg-on-surface text-surface text-xs sm:text-sm font-medium tracking-btn uppercase hover:bg-black transition-colors duration-150"
                >
                  View Wardrobe
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
