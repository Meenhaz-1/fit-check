import { readFileSync, mkdirSync } from 'fs'
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

const dataDir = join(process.cwd(), 'data')
const evaluationsFile = join(dataDir, 'evaluations.json')
const sampleWardrobeFile = join(dataDir, 'sample-wardrobe.csv')

let wardrobeFlushTimer: NodeJS.Timeout | null = null
let wardrobeFlushPromise: Promise<void> | null = null
let evaluationsFlushTimer: NodeJS.Timeout | null = null
let evaluationsFlushPromise: Promise<void> | null = null
const FLUSH_DELAY = 100

const store = {
  wardrobe_items: [] as WardrobeItem[],
  evaluations: [] as Evaluation[],
  // Indexes for O(1) lookups
  wardrobeById: new Map<string, WardrobeItem>(),
  wardrobeByType: new Map<string, WardrobeItem[]>(),
  wardrobeByColor: new Map<string, WardrobeItem[]>(),
  evaluationsById: new Map<string, Evaluation>(),
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
  store.wardrobeById.clear()
  store.wardrobeByType.clear()
  store.wardrobeByColor.clear()
  store.evaluationsById.clear()
  await Promise.all([ensureWardrobeFlush(), ensureEvaluationsFlush()])
}

export function getDatabaseStatus() {
  return {
    connected: true,
    type: 'file-based (CSV + JSON)',
    itemsCount: store.wardrobe_items.length,
    evaluationsCount: store.evaluations.length,
    sampleWardrobeLoaded: store.wardrobe_items.length > 0,
  }
}

initializeDatabase()
