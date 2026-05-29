/**
 * OUTFIT UTILITIES
 *
 * Consolidates outfit-related logic to reduce duplication in:
 * - src/app/api/wardrobe/outfit-builder/upload/route.ts
 * - src/app/api/wardrobe/outfit-builder/select/route.ts
 */

import { getWardrobeItem } from '@/lib/db'

export interface OutfitSuggestion {
  id: number
  topId: string
  bottomId: string
  shoesId: string
  outerwearId?: string
  accessoryId?: string
}

interface ItemPreview {
  id: string
  item_type: string
  color: string
  material: string
  visual_weight: string
  imageUrl?: string
}

export interface HydratedOutfit {
  id: number
  top: ItemPreview | null
  bottom: ItemPreview | null
  shoes: ItemPreview | null
  outerwear: ItemPreview | null
  accessory: ItemPreview | null
}

/**
 * Format a wardrobe item for outfit preview
 *
 * Extracts the minimal set of properties needed for outfit display
 */
function formatItemPreview(item: any): ItemPreview | null {
  if (!item) return null
  return {
    id: item.id,
    item_type: item.item_type,
    color: item.color,
    material: item.material,
    visual_weight: item.visual_weight,
    imageUrl: item.imageUrl,
  }
}

/**
 * Hydrate outfit suggestions with full wardrobe item details
 *
 * Takes outfit suggestion IDs and fetches the full item objects from the wardrobe
 * for rendering and display. Formats items with essential properties only.
 *
 * @param outfits Array of outfit suggestions with item IDs
 * @returns Array of hydrated outfits with formatted item details
 */
export function hydrateOutfits(outfits: OutfitSuggestion[]): HydratedOutfit[] {
  return outfits.map((outfit, idx) => {
    const topItem = getWardrobeItem(outfit.topId)
    const bottomItem = getWardrobeItem(outfit.bottomId)
    const shoesItem = getWardrobeItem(outfit.shoesId)
    const outerwearItem = outfit.outerwearId ? getWardrobeItem(outfit.outerwearId) : null
    const accessoryItem = outfit.accessoryId ? getWardrobeItem(outfit.accessoryId) : null

    return {
      id: idx + 1,
      top: formatItemPreview(topItem),
      bottom: formatItemPreview(bottomItem),
      shoes: formatItemPreview(shoesItem),
      outerwear: formatItemPreview(outerwearItem),
      accessory: formatItemPreview(accessoryItem),
    }
  })
}

/**
 * Hydrate a single outfit suggestion
 *
 * @param outfit Single outfit suggestion
 * @param outfitIndex Index for the outfit ID (optional)
 * @returns Hydrated outfit with full item details
 */
export function hydrateOutfit(outfit: OutfitSuggestion, outfitIndex: number = 1): HydratedOutfit {
  const topItem = getWardrobeItem(outfit.topId)
  const bottomItem = getWardrobeItem(outfit.bottomId)
  const shoesItem = getWardrobeItem(outfit.shoesId)
  const outerwearItem = outfit.outerwearId ? getWardrobeItem(outfit.outerwearId) : null
  const accessoryItem = outfit.accessoryId ? getWardrobeItem(outfit.accessoryId) : null

  return {
    id: outfitIndex,
    top: formatItemPreview(topItem),
    bottom: formatItemPreview(bottomItem),
    shoes: formatItemPreview(shoesItem),
    outerwear: formatItemPreview(outerwearItem),
    accessory: formatItemPreview(accessoryItem),
  }
}
