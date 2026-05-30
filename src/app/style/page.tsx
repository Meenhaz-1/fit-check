'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { UserProfile, SkinAnalysis } from '@/lib/db'

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

const BUILD_TYPES = ['hourglass', 'pear', 'apple', 'rectangle', 'inverted-triangle']

interface AnalysisResult {
  skinAnalysis: SkinAnalysis | null
  suggestedBodyShape: string | null
  suggestedColors: string[]
}

export default function StyleIDPage() {
  const searchParams = useSearchParams()
  const [profiles, setProfiles] = useState<UserProfile[]>([])
  const [activeProfile, setActiveProfile] = useState<UserProfile | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)

  // Form state
  const [formName, setFormName] = useState('')
  const [formGender, setFormGender] = useState<string>('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Analysis state
  const [analysisStep, setAnalysisStep] = useState<'info' | 'analysis' | 'saved'>('info')
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [confirmedBodyShape, setConfirmedBodyShape] = useState<string | null>(null)
  const [confirmedSkinAnalysis, setConfirmedSkinAnalysis] = useState<SkinAnalysis | null>(null)
  const [analyzeLoading, setAnalyzeLoading] = useState(false)

  // Style preferences
  const [selectedAesthetics, setSelectedAesthetics] = useState<string[]>([])
  const [selectedFormality, setSelectedFormality] = useState<string>('')
  const [palettePreference, setPalettePreference] = useState<'ai' | 'user'>('user')
  const [selectedPalette, setSelectedPalette] = useState<string>('')
  const [customAiPalette, setCustomAiPalette] = useState<string[]>([])

  // UI state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [deleteConfirming, setDeleteConfirming] = useState(false)

  // Load profiles on mount
  useEffect(() => {
    loadProfiles()
  }, [])

  // Check if coming from "Create New Profile" link
  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setShowCreateForm(true)
    }
  }, [searchParams])

  // Update form when active profile changes
  useEffect(() => {
    if (activeProfile && !showCreateForm) {
      setSelectedAesthetics(activeProfile.aesthetics || [])
      setSelectedFormality(activeProfile.formality || '')
      setSelectedPalette(activeProfile.paletteAffinity || '')
      setCustomAiPalette(activeProfile.colorPalettes?.aiSuggested || [])
      const pref = activeProfile.colorPalettes?.userSelected ? 'user' : 'ai'
      setPalettePreference(pref === 'user' && activeProfile.paletteAffinity ? 'user' : 'ai')
    }
  }, [activeProfile, showCreateForm])

  const loadProfiles = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/profiles')
      const data = await response.json()
      setProfiles(data.profiles || [])
      setActiveProfile(data.defaultProfile || null)
    } catch (err) {
      setError('Failed to load profiles')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    setSelectedFile(file)

    // Show preview
    const reader = new FileReader()
    reader.onload = (event) => {
      setPhotoPreview(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleAnalyzePhoto = async () => {
    if (!photoPreview) return

    setAnalyzeLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/profiles/analyze-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: photoPreview,
          mediaType: selectedFile?.type,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to analyze photo')
      }

      const result = await response.json()
      setAnalysis(result)
      setConfirmedSkinAnalysis(result.skinAnalysis)
      setConfirmedBodyShape(result.suggestedBodyShape)
      setCustomAiPalette(result.suggestedColors)
      setAnalysisStep('analysis')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze photo')
    } finally {
      setAnalyzeLoading(false)
    }
  }

  const handleCreateProfile = async () => {
    if (!formName.trim()) {
      setError('Profile name is required')
      return
    }

    setError(null)
    setLoading(true)

    try {
      // Create profile first
      const createResponse = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName.trim(),
          gender: formGender || undefined,
          buildType: confirmedBodyShape || undefined,
          buildTypeConfirmed: !!confirmedBodyShape,
        }),
      })

      if (!createResponse.ok) {
        throw new Error('Failed to create profile')
      }

      const newProfile = await createResponse.json()

      // Upload photo if provided
      if (photoPreview) {
        await fetch(`/api/profiles/${newProfile.id}/photo`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: photoPreview,
            mediaType: selectedFile?.type,
            skinAnalysis: confirmedSkinAnalysis,
            buildType: confirmedBodyShape,
            buildTypeConfirmed: true,
          }),
        })
      }

      // Reload profiles and set active
      await loadProfiles()
      setActiveProfile(newProfile)
      setShowCreateForm(false)
      setAnalysisStep('saved')

      // Reset form
      resetForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create profile')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!activeProfile) return

    setError(null)
    setLoading(true)

    try {
      const updateData: any = {
        aesthetics: selectedAesthetics,
        formality: selectedFormality,
        paletteAffinity: selectedPalette,
        colorPalettes: {
          aiSuggested: customAiPalette,
          userSelected: palettePreference === 'user' ? selectedPalette : undefined,
        },
      }

      const response = await fetch(`/api/profiles/${activeProfile.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        throw new Error('Failed to save profile')
      }

      const updated = await response.json()
      setActiveProfile(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteProfile = async () => {
    if (!activeProfile) return

    setLoading(true)
    try {
      const response = await fetch(`/api/profiles/${activeProfile.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete profile')
      }

      await loadProfiles()
      setDeleteConfirming(false)
      if (profiles.length > 1) {
        // Find another profile to set as active
        const other = profiles.find((p) => p.id !== activeProfile.id)
        if (other) {
          setActiveProfile(other)
        }
      } else {
        setActiveProfile(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete profile')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormName('')
    setFormGender('')
    setSelectedFile(null)
    setPhotoPreview(null)
    setAnalysisStep('info')
    setAnalysis(null)
    setConfirmedBodyShape(null)
    setConfirmedSkinAnalysis(null)
    setCustomAiPalette([])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const toggleAesthetic = (a: string) => {
    setSelectedAesthetics((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : prev.length < 4 ? [...prev, a] : prev,
    )
  }

  // Empty state
  if (loading) {
    return (
      <div className="bg-surface min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-on-surface-variant">Loading...</div>
      </div>
    )
  }

  if (!activeProfile && !showCreateForm) {
    return (
      <div className="bg-surface min-h-screen">
        <div className="border-b border-outline-variant">
          <div className="max-w-atelier mx-auto px-16 py-16">
            <p className="label-caps mb-4">Style ID</p>
            <h1 className="font-serif text-headline-md font-normal text-on-surface mb-3">
              Define Your Aesthetic
            </h1>
            <p className="text-sm text-on-surface-variant max-w-lg">
              Create a style profile to get personalized recommendations based on your unique style and coloring.
            </p>
          </div>
        </div>

        <div className="max-w-atelier mx-auto px-16 py-20">
          <div className="border border-outline-variant p-16 text-center">
            <div className="w-24 h-24 bg-on-surface/10 rounded-full mx-auto mb-8 flex items-center justify-center">
              <span className="text-4xl">👤</span>
            </div>

            <h2 className="font-serif text-2xl font-normal text-on-surface mb-3">
              You haven&apos;t created any style profiles yet
            </h2>

            <p className="text-on-surface-variant max-w-md mx-auto mb-8">
              Create your first profile now to get AI-powered style recommendations based on your skin tone, body shape,
              and aesthetic preferences.
            </p>

            <p className="text-sm text-on-surface-variant mb-6 max-w-md mx-auto">
              This will save:
            </p>
            <ul className="text-sm text-on-surface-variant max-w-md mx-auto mb-12 space-y-1 text-left inline-block">
              <li>✓ Your personal info (name, gender, body type)</li>
              <li>✓ Your profile photo for AI analysis</li>
              <li>✓ Analyzed skin tone & flattering colors</li>
              <li>✓ Your style preferences (aesthetics, formality, palette)</li>
            </ul>

            <button
              onClick={() => setShowCreateForm(true)}
              className="px-8 py-3 bg-on-surface text-surface text-sm font-medium tracking-btn uppercase hover:bg-black transition-colors duration-150"
            >
              Create Your First Profile
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Profile creation form
  if (showCreateForm) {
    return (
      <div className="bg-surface min-h-screen">
        <div className="border-b border-outline-variant">
          <div className="max-w-atelier mx-auto px-16 py-16">
            <p className="label-caps mb-4">Create Profile</p>
            <h1 className="font-serif text-headline-md font-normal text-on-surface mb-3">
              {analysisStep === 'info' && 'Basic Information'}
              {analysisStep === 'analysis' && 'Your Analysis Results'}
              {analysisStep === 'saved' && 'Profile Created!'}
            </h1>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-16 py-16">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
              {error}
            </div>
          )}

          {/* Step 1: Basic Info */}
          {analysisStep === 'info' && (
            <div className="space-y-8">
              <div>
                <label className="block text-sm font-medium text-on-surface mb-2">
                  Profile Name
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g., Everyday Look, Work Style"
                  className="w-full px-4 py-2 border border-outline-variant bg-surface text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-on-surface transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface mb-2">
                  Gender (Optional)
                </label>
                <select
                  value={formGender}
                  onChange={(e) => setFormGender(e.target.value)}
                  className="w-full px-4 py-2 border border-outline-variant bg-surface text-on-surface focus:outline-none focus:border-on-surface transition-colors"
                >
                  <option value="">Select one...</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="non-binary">Non-binary</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface mb-4">
                  Upload Photo for Analysis
                </label>
                <p className="text-xs text-on-surface-variant mb-4">
                  This helps us detect your skin tone and body shape for personalized color recommendations.
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="sr-only"
                />

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full px-4 py-3 border-2 border-dashed border-outline-variant text-on-surface-variant hover:border-on-surface hover:text-on-surface transition-colors text-sm font-medium"
                >
                  {photoPreview ? 'Change Photo' : 'Choose Photo or Drag & Drop'}
                </button>

                {photoPreview && (
                  <div className="mt-4">
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="max-h-64 rounded border border-outline-variant"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4 border-t border-outline-variant">
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="px-6 py-2 border border-outline-variant text-on-surface-variant hover:text-on-surface hover:border-on-surface transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAnalyzePhoto}
                  disabled={!photoPreview || analyzeLoading}
                  className="px-6 py-2 bg-on-surface text-surface text-sm font-medium hover:bg-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {analyzeLoading ? 'Analyzing...' : 'Next →'}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Analysis Results */}
          {analysisStep === 'analysis' && analysis && (
            <div className="space-y-8">
              {/* Skin Tone */}
              <div className="p-6 border border-outline-variant">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-medium text-on-surface mb-1">Skin Tone Analysis</h3>
                    <p className="text-sm text-on-surface-variant">
                      {confirmedSkinAnalysis?.skinTone} • {confirmedSkinAnalysis?.undertone} undertone
                    </p>
                  </div>
                  <button
                    onClick={() => setAnalysisStep('info')}
                    className="text-xs text-on-surface-variant hover:text-on-surface"
                  >
                    [Change]
                  </button>
                </div>
              </div>

              {/* Body Shape */}
              <div className="p-6 border border-outline-variant">
                <div className="mb-4">
                  <h3 className="font-medium text-on-surface mb-4">Body Shape</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {BUILD_TYPES.map((type) => (
                      <button
                        key={type}
                        onClick={() => setConfirmedBodyShape(type)}
                        className={`px-3 py-2 text-sm border transition-colors ${
                          confirmedBodyShape === type
                            ? 'bg-on-surface text-surface border-on-surface'
                            : 'border-outline-variant text-on-surface-variant hover:border-on-surface hover:text-on-surface'
                        }`}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Color Palette */}
              <div className="p-6 border border-outline-variant">
                <h3 className="font-medium text-on-surface mb-4">Flattering Colors For You</h3>
                <p className="text-sm text-on-surface-variant mb-4">
                  Based on your {confirmedSkinAnalysis?.undertone} undertone:
                </p>
                <div className="flex gap-2">
                  {customAiPalette.map((color, i) => (
                    <div
                      key={i}
                      className="flex-1 aspect-square border border-outline-variant"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
                <p className="text-xs text-on-surface-variant mt-3">
                  These colors will enhance your natural coloring. You can refine your preferences later.
                </p>
              </div>

              <div className="flex gap-4 pt-4 border-t border-outline-variant">
                <button
                  onClick={() => setAnalysisStep('info')}
                  className="px-6 py-2 border border-outline-variant text-on-surface-variant hover:text-on-surface hover:border-on-surface transition-colors text-sm font-medium"
                >
                  ← Back
                </button>
                <button
                  onClick={handleCreateProfile}
                  disabled={loading}
                  className="px-6 py-2 bg-on-surface text-surface text-sm font-medium hover:bg-black transition-colors disabled:opacity-40"
                >
                  {loading ? 'Creating...' : 'Create Profile →'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Profile Created */}
          {analysisStep === 'saved' && activeProfile && (
            <div className="text-center space-y-6">
              <div className="text-4xl">✓</div>
              <h2 className="font-serif text-2xl font-normal text-on-surface">
                Profile Created!
              </h2>
              <p className="text-on-surface-variant max-w-md mx-auto">
                Now let&apos;s define your aesthetic preferences.
              </p>
              <button
                onClick={() => setAnalysisStep('info')}
                className="px-6 py-2 bg-on-surface text-surface text-sm font-medium hover:bg-black transition-colors"
              >
                Continue to Style Preferences →
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Main style page with active profile
  return (
    <div className="bg-surface min-h-screen">
      {/* Header */}
      <div className="border-b border-outline-variant">
        <div className="max-w-atelier mx-auto px-16 py-16">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="label-caps mb-4">Style ID</p>
              <h1 className="font-serif text-headline-md font-normal text-on-surface mb-3">
                {activeProfile.name}
              </h1>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowEditForm(true)}
                className="px-4 py-2 border border-outline-variant text-on-surface-variant text-xs font-medium hover:border-on-surface hover:text-on-surface transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => setDeleteConfirming(true)}
                className="px-4 py-2 border border-outline-variant text-on-surface-variant text-xs font-medium hover:border-on-surface hover:text-on-surface transition-colors"
              >
                Delete
              </button>
            </div>
          </div>

          {/* Delete confirmation */}
          {deleteConfirming && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <div className="bg-surface border border-outline-variant p-6 rounded max-w-md">
                <h3 className="font-medium text-on-surface mb-2">Delete Profile?</h3>
                <p className="text-sm text-on-surface-variant mb-6">
                  Are you sure you want to delete &quot;{activeProfile.name}&quot;? This cannot be undone.
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => setDeleteConfirming(false)}
                    className="flex-1 px-4 py-2 border border-outline-variant text-on-surface-variant text-sm font-medium hover:border-on-surface hover:text-on-surface transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteProfile}
                    className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit form modal */}
      {showEditForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-surface border border-outline-variant p-8 rounded max-w-md w-full m-4 my-8">
            <h2 className="font-serif text-xl font-normal text-on-surface mb-6">Edit Profile</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-on-surface mb-2">
                  Profile Name
                </label>
                <input
                  type="text"
                  defaultValue={activeProfile.name}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-4 py-2 border border-outline-variant bg-surface text-on-surface focus:outline-none focus:border-on-surface transition-colors text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface mb-2">
                  Gender
                </label>
                <select
                  defaultValue={activeProfile.gender || ''}
                  onChange={(e) => setFormGender(e.target.value)}
                  className="w-full px-4 py-2 border border-outline-variant bg-surface text-on-surface focus:outline-none focus:border-on-surface transition-colors text-sm"
                >
                  <option value="">Select one...</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="non-binary">Non-binary</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
              </div>

              <div>
                <p className="text-sm text-on-surface-variant mb-2">Body Shape: {activeProfile.buildType}</p>
                <button
                  onClick={() => setShowEditForm(false)}
                  className="text-xs text-on-surface-variant hover:text-on-surface"
                >
                  [Change photo to re-analyze]
                </button>
              </div>

              <div className="flex gap-4 pt-4 border-t border-outline-variant">
                <button
                  onClick={() => setShowEditForm(false)}
                  className="flex-1 px-4 py-2 border border-outline-variant text-on-surface-variant text-sm font-medium hover:border-on-surface hover:text-on-surface transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="max-w-atelier mx-auto px-16 py-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
            {error}
          </div>
        </div>
      )}

      <div className="max-w-atelier mx-auto px-16 py-16 space-y-16">
        {/* Profile Info */}
        <section className="border border-outline-variant p-8">
          <div className="flex items-center gap-6">
            {activeProfile.photoUrl ? (
              <img
                src={activeProfile.photoUrl}
                alt={activeProfile.name}
                className="w-24 h-24 rounded-lg object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-lg bg-on-surface/10 flex items-center justify-center text-2xl">
                {activeProfile.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h2 className="font-serif text-xl font-normal text-on-surface mb-1">
                {activeProfile.name}
              </h2>
              {activeProfile.gender && (
                <p className="text-sm text-on-surface-variant mb-1">
                  {activeProfile.gender.charAt(0).toUpperCase() + activeProfile.gender.slice(1)}
                </p>
              )}
              {activeProfile.buildType && (
                <p className="text-sm text-on-surface-variant">
                  {activeProfile.buildType.charAt(0).toUpperCase() + activeProfile.buildType.slice(1).replace('-', ' ')}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Flattering Colors */}
        <section>
          <div className="border-b border-outline-variant pb-6 mb-8">
            <h2 className="font-serif text-xl font-normal text-on-surface">
              Flattering Colors For You
            </h2>
          </div>

          <div className="space-y-8">
            {/* AI Recommended Tab */}
            {customAiPalette.length > 0 && (
              <div className="border border-outline-variant p-6">
                <h3 className="font-medium text-on-surface mb-4">AI Recommended</h3>
                <div className="flex gap-3">
                  {customAiPalette.map((color, i) => (
                    <div
                      key={i}
                      className="flex-1 aspect-square border border-outline-variant rounded"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
                <p className="text-xs text-on-surface-variant mt-3">
                  Colors optimized for your skin tone and undertone.
                </p>
              </div>
            )}

            {/* Palette Affinity Selection */}
            <div>
              <h3 className="font-medium text-on-surface mb-4">Your Color Preferences</h3>
              <div className="grid grid-cols-4 gap-4">
                {PALETTE_AFFINITIES.map(({ key, label, swatches }) => (
                  <button
                    key={key}
                    onClick={() => setSelectedPalette(key)}
                    className={`p-4 border text-left transition-colors ${
                      selectedPalette === key
                        ? 'border-on-surface'
                        : 'border-outline-variant hover:border-on-surface-variant'
                    }`}
                  >
                    <div className="flex gap-1 mb-3">
                      {swatches.map((swatch, i) => (
                        <div
                          key={i}
                          className="h-6 flex-1 border border-outline-variant/40"
                          style={{ backgroundColor: swatch }}
                        />
                      ))}
                    </div>
                    <p className="label-caps text-xs">{label}</p>
                    {selectedPalette === key && (
                      <p className="label-caps text-on-surface mt-1 text-xs">✓</p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Aesthetics */}
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

        {/* Formality */}
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
                  <p className="label-caps text-on-surface mt-3 text-xs">Selected</p>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Save */}
        <div className="flex gap-4 pt-4 border-t border-outline-variant">
          <button
            onClick={handleSaveProfile}
            disabled={!selectedAesthetics.length || !selectedFormality || !selectedPalette || loading}
            className="px-8 py-3 bg-on-surface text-surface text-sm font-medium tracking-btn uppercase hover:bg-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saved ? 'Profile Saved ✓' : 'Save Profile'}
          </button>
          <Link
            href="/wardrobe/suggest-pairing"
            className="px-8 py-3 border border-outline text-on-surface-variant text-sm font-medium tracking-btn uppercase hover:border-on-surface hover:text-on-surface transition-colors"
          >
            Build an Outfit →
          </Link>
        </div>
      </div>
    </div>
  )
}
