import { readFileSync, mkdirSync, unlinkSync } from 'fs'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import Papa from 'papaparse'

interface WardrobeItem {
  id: string
  filename: string
  description?: string
  item_type: string
  color: string
  material: string
  formality: string
  fit: string
  silhouette: string
  visual_weight: string
  uploaded_at: string
  imageUrl?: string
}

interface Evaluation {
  id: string
  item_filename: string
  verdict: 'Buy' | 'Maybe' | 'Do Not Buy'
  reasoning: string
  pairings?: string
  created_at: string
}

interface SkinAnalysis {
  skinTone: 'fair' | 'light' | 'medium' | 'tan' | 'deep'
  undertone: 'warm' | 'cool' | 'neutral'
  confidence: number
}

interface UserProfile {
  id: string
  name: string
  gender?: 'male' | 'female' | 'non-binary' | 'prefer-not-to-say'
  buildType?: 'hourglass' | 'pear' | 'apple' | 'rectangle' | 'inverted-triangle'
  buildTypeConfirmed?: boolean
  photoUrl?: string
  skinAnalysis?: SkinAnalysis
  colorPalettes?: {
    aiSuggested?: string[]
    userSelected?: string
  }
  aesthetics?: string[]
  formality?: string
  paletteAffinity?: string
  isDefault?: boolean
  created_at: string
  updated_at: string
}

const dataDir = join(process.cwd(), 'data')
const evaluationsFile = join(dataDir, 'evaluations.json')
const sampleWardrobeFile = join(dataDir, 'sample-wardrobe.csv')
const profilesFile = join(dataDir, 'profiles.json')

let wardrobeFlushTimer: NodeJS.Timeout | null = null
let wardrobeFlushPromise: Promise<void> | null = null
let evaluationsFlushTimer: NodeJS.Timeout | null = null
let evaluationsFlushPromise: Promise<void> | null = null
let profilesFlushTimer: NodeJS.Timeout | null = null
let profilesFlushPromise: Promise<void> | null = null
const FLUSH_DELAY = 100

const store = {
  wardrobe_items: [] as WardrobeItem[],
  evaluations: [] as Evaluation[],
  profiles: [] as UserProfile[],
  // Indexes for O(1) lookups
  wardrobeById: new Map<string, WardrobeItem>(),
  wardrobeByType: new Map<string, WardrobeItem[]>(),
  wardrobeByColor: new Map<string, WardrobeItem[]>(),
  evaluationsById: new Map<string, Evaluation>(),
  profilesById: new Map<string, UserProfile>(),
}

function ensureDataDir() {
  mkdirSync(dataDir, { recursive: true })
}

async function ensureWardrobeFlush(): Promise<void> {
  if (wardrobeFlushTimer) clearTimeout(wardrobeFlushTimer)
  if (wardrobeFlushPromise) return wardrobeFlushPromise

  wardrobeFlushPromise = new Promise<void>((resolve) => {
    wardrobeFlushTimer = setTimeout(async () => {
      await saveWardrobeItems()
      wardrobeFlushTimer = null
      wardrobeFlushPromise = null
      resolve()
    }, FLUSH_DELAY)
  })

  return wardrobeFlushPromise
}

async function ensureEvaluationsFlush(): Promise<void> {
  if (evaluationsFlushTimer) clearTimeout(evaluationsFlushTimer)
  if (evaluationsFlushPromise) return evaluationsFlushPromise

  evaluationsFlushPromise = new Promise<void>((resolve) => {
    evaluationsFlushTimer = setTimeout(async () => {
      await saveEvaluations()
      evaluationsFlushTimer = null
      evaluationsFlushPromise = null
      resolve()
    }, FLUSH_DELAY)
  })

  return evaluationsFlushPromise
}

async function ensureProfilesFlush(): Promise<void> {
  if (profilesFlushTimer) clearTimeout(profilesFlushTimer)
  if (profilesFlushPromise) return profilesFlushPromise

  profilesFlushPromise = new Promise<void>((resolve) => {
    profilesFlushTimer = setTimeout(async () => {
      await saveProfiles()
      profilesFlushTimer = null
      profilesFlushPromise = null
      resolve()
    }, FLUSH_DELAY)
  })

  return profilesFlushPromise
}

function loadSampleWardrobe() {
  try {
    const csvContent = readFileSync(sampleWardrobeFile, 'utf-8')
    const result = Papa.parse(csvContent, { header: true, skipEmptyLines: true })
    if (result.data && Array.isArray(result.data)) {
      store.wardrobe_items = result.data.map((row: any) => ({
        id: row.id,
        filename: row.filename,
        item_type: row.item_type || 'clothing item',
        color: row.color,
        material: row.material,
        formality: row.formality,
        fit: row.fit,
        silhouette: row.silhouette,
        visual_weight: row.visual_weight,
        uploaded_at: row.uploaded_at || new Date().toISOString(),
        imageUrl: row.imageUrl,
      }))

      // Build indexes
      store.wardrobeById.clear()
      store.wardrobeByType.clear()
      store.wardrobeByColor.clear()
      for (const item of store.wardrobe_items) {
        store.wardrobeById.set(item.id, item)
        const type = (item.item_type || 'unknown').toLowerCase()
        store.wardrobeByType.set(type, [...(store.wardrobeByType.get(type) || []), item])
        const color = (item.color || 'unknown').toLowerCase()
        store.wardrobeByColor.set(color, [...(store.wardrobeByColor.get(color) || []), item])
      }

      console.log(`Loaded ${store.wardrobe_items.length} wardrobe items from CSV`)
    }
  } catch (error: any) {
    if (error.code !== 'ENOENT') {
      console.error('Failed to load sample wardrobe from CSV:', error)
    }
  }
}

function loadEvaluations() {
  try {
    const content = readFileSync(evaluationsFile, 'utf-8')
    const data = JSON.parse(content)
    if (Array.isArray(data)) {
      store.evaluations = data
      store.evaluationsById.clear()
      for (const evaluation of store.evaluations) {
        store.evaluationsById.set(evaluation.id, evaluation)
      }
      console.log(`Loaded ${store.evaluations.length} evaluations from JSON`)
    }
  } catch (error: any) {
    if (error.code !== 'ENOENT') {
      console.error('Failed to load evaluations from JSON:', error)
    }
  }
}

async function saveEvaluations() {
  try {
    await writeFile(evaluationsFile, JSON.stringify(store.evaluations, null, 2), 'utf-8')
  } catch (error) {
    console.error('Failed to save evaluations to JSON:', error)
  }
}

function loadProfiles() {
  try {
    const content = readFileSync(profilesFile, 'utf-8')
    const data = JSON.parse(content)
    if (Array.isArray(data)) {
      store.profiles = data
      store.profilesById.clear()
      for (const profile of store.profiles) {
        store.profilesById.set(profile.id, profile)
      }
      console.log(`Loaded ${store.profiles.length} profiles from JSON`)
    }
  } catch (error: any) {
    if (error.code !== 'ENOENT') {
      console.error('Failed to load profiles from JSON:', error)
    }
  }
}

async function saveProfiles() {
  try {
    await writeFile(profilesFile, JSON.stringify(store.profiles, null, 2), 'utf-8')
  } catch (error) {
    console.error('Failed to save profiles to JSON:', error)
  }
}

async function saveWardrobeItems() {
  try {
    const csv = Papa.unparse(store.wardrobe_items, { header: true })
    await writeFile(sampleWardrobeFile, csv, 'utf-8')
    console.log(`Saved ${store.wardrobe_items.length} wardrobe items to CSV`)
  } catch (error) {
    console.error('Failed to save wardrobe items to CSV:', error)
  }
}

export function initializeDatabase() {
  ensureDataDir()
  loadSampleWardrobe()
  loadEvaluations()
  loadProfiles()
  console.log('Database initialized')
}

export function getDb() {
  return store
}

export async function insertWardrobeItem(item: WardrobeItem) {
  if (store.wardrobe_items.length >= 10_000) {
    throw new Error('Wardrobe item limit reached')
  }
  store.wardrobe_items.push(item)
  store.wardrobeById.set(item.id, item)
  const type = (item.item_type || 'unknown').toLowerCase()
  store.wardrobeByType.set(type, [...(store.wardrobeByType.get(type) || []), item])
  const color = (item.color || 'unknown').toLowerCase()
  store.wardrobeByColor.set(color, [...(store.wardrobeByColor.get(color) || []), item])
  await ensureWardrobeFlush()
  return item
}

export function getAllWardrobeItems(): WardrobeItem[] {
  return store.wardrobe_items
}

export function getWardrobeItem(id: string): WardrobeItem | undefined {
  return store.wardrobeById.get(id)
}

export async function deleteWardrobeItem(id: string): Promise<boolean> {
  const item = store.wardrobeById.get(id)
  if (!item) {
    return false
  }
  store.wardrobe_items = store.wardrobe_items.filter((i) => i.id !== id)
  store.wardrobeById.delete(id)
  const type = (item.item_type || 'unknown').toLowerCase()
  const typeItems = store.wardrobeByType.get(type) || []
  store.wardrobeByType.set(type, typeItems.filter((i) => i.id !== id))
  const color = (item.color || 'unknown').toLowerCase()
  const colorItems = store.wardrobeByColor.get(color) || []
  store.wardrobeByColor.set(color, colorItems.filter((i) => i.id !== id))
  await ensureWardrobeFlush()
  return true
}

export async function insertEvaluation(evaluation: Evaluation) {
  store.evaluations.push(evaluation)
  store.evaluationsById.set(evaluation.id, evaluation)
  await ensureEvaluationsFlush()
  return evaluation
}

export function getAllEvaluations(): Evaluation[] {
  return store.evaluations
}

export function getEvaluation(id: string): Evaluation | undefined {
  return store.evaluationsById.get(id)
}

export async function insertProfile(profile: UserProfile): Promise<UserProfile> {
  if (store.profiles.length >= 100) {
    throw new Error('Profile limit reached')
  }
  store.profiles.push(profile)
  store.profilesById.set(profile.id, profile)
  await ensureProfilesFlush()
  return profile
}

export function getAllProfiles(): UserProfile[] {
  return store.profiles
}

export function getProfile(id: string): UserProfile | undefined {
  return store.profilesById.get(id)
}

export function getDefaultProfile(): UserProfile | undefined {
  return store.profiles.find(p => p.isDefault)
}

export async function updateProfile(id: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
  const profile = store.profilesById.get(id)
  if (!profile) return null

  const updated = { ...profile, ...updates, updated_at: new Date().toISOString() }
  store.profilesById.set(id, updated)

  const index = store.profiles.findIndex(p => p.id === id)
  if (index !== -1) {
    store.profiles[index] = updated
  }

  await ensureProfilesFlush()
  return updated
}

export async function setDefaultProfile(id: string): Promise<boolean> {
  const profile = store.profilesById.get(id)
  if (!profile) return false

  // Unset all other defaults
  for (const p of store.profiles) {
    if (p.id !== id && p.isDefault) {
      p.isDefault = false
    }
  }

  profile.isDefault = true
  store.profilesById.set(id, profile)
  await ensureProfilesFlush()
  return true
}

export async function deleteProfile(id: string): Promise<boolean> {
  const profile = store.profilesById.get(id)
  if (!profile) return false

  store.profiles = store.profiles.filter(p => p.id !== id)
  store.profilesById.delete(id)

  // If deleted profile was default, set another as default
  if (profile.isDefault && store.profiles.length > 0) {
    store.profiles[0].isDefault = true
  }

  // Clean up profile photo file
  if (profile.photoUrl) {
    try {
      const photoPath = join(process.cwd(), 'public', profile.photoUrl)
      unlinkSync(photoPath)
    } catch (error) {
      console.warn(`Failed to delete profile photo at ${profile.photoUrl}:`, error)
    }
  }

  await ensureProfilesFlush()
  return true
}

export async function clearWardrobeItems() {
  store.wardrobe_items = []
  store.wardrobeById.clear()
  store.wardrobeByType.clear()
  store.wardrobeByColor.clear()
  await ensureWardrobeFlush()
}

export async function clearDatabase() {
  store.wardrobe_items = []
  store.evaluations = []
  store.profiles = []
  store.wardrobeById.clear()
  store.wardrobeByType.clear()
  store.wardrobeByColor.clear()
  store.evaluationsById.clear()
  store.profilesById.clear()
  await Promise.all([ensureWardrobeFlush(), ensureEvaluationsFlush(), ensureProfilesFlush()])
}

export function getDatabaseStatus() {
  return {
    connected: true,
    type: 'file-based (CSV + JSON)',
    itemsCount: store.wardrobe_items.length,
    evaluationsCount: store.evaluations.length,
    profilesCount: store.profiles.length,
    sampleWardrobeLoaded: store.wardrobe_items.length > 0,
  }
}

export type { WardrobeItem, Evaluation, UserProfile, SkinAnalysis }

initializeDatabase()
