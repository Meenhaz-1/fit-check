import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import Papa from 'papaparse'

interface WardrobeItem {
  id: string
  filename: string
  item_type: string
  color: string
  material: string
  formality: string
  fit: string
  silhouette: string
  visual_weight: string
  uploaded_at: string
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

const store = {
  wardrobe_items: [] as WardrobeItem[],
  evaluations: [] as Evaluation[],
}

function ensureDataDir() {
  mkdirSync(dataDir, { recursive: true })
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
      }))
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
      console.log(`Loaded ${store.evaluations.length} evaluations from JSON`)
    }
  } catch (error: any) {
    if (error.code !== 'ENOENT') {
      console.error('Failed to load evaluations from JSON:', error)
    }
  }
}

function saveEvaluations() {
  try {
    writeFileSync(evaluationsFile, JSON.stringify(store.evaluations, null, 2), 'utf-8')
  } catch (error) {
    console.error('Failed to save evaluations to JSON:', error)
  }
}

function saveWardrobeItems() {
  try {
    const csv = Papa.unparse(store.wardrobe_items, { header: true })
    writeFileSync(sampleWardrobeFile, csv, 'utf-8')
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

export function insertWardrobeItem(item: WardrobeItem) {
  if (store.wardrobe_items.length >= 10_000) {
    throw new Error('Wardrobe item limit reached')
  }
  store.wardrobe_items.push(item)
  saveWardrobeItems()
  return item
}

export function getAllWardrobeItems(): WardrobeItem[] {
  return store.wardrobe_items
}

export function getWardrobeItem(id: string): WardrobeItem | undefined {
  return store.wardrobe_items.find((item) => item.id === id)
}

export function insertEvaluation(evaluation: Evaluation) {
  store.evaluations.push(evaluation)
  saveEvaluations()
  return evaluation
}

export function getAllEvaluations(): Evaluation[] {
  return store.evaluations
}

export function getEvaluation(id: string): Evaluation | undefined {
  return store.evaluations.find((evaluation) => evaluation.id === id)
}

export function clearDatabase() {
  store.wardrobe_items = []
  store.evaluations = []
  saveEvaluations()
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
