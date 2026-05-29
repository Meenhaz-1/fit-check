# Fit Compatibility System Implementation

## Overview

A senior fashion stylist-driven fit compatibility system has been integrated into the AI Wardrobe Assistant. This system encodes expert styling rules for how different garment fits work together to create flattering, balanced silhouettes.

## Key Principle

**Two loose items = shapeless; two fitted items = can look stiff**  
The goal is visual balance and definition through strategic fit contrasts.

## What Was Implemented

### 1. **src/lib/fit-compatibility.ts** (New Module)
Comprehensive fit compatibility scoring system with:

#### Core Functions

**`calculateFitCompatibility(topFit, bottomFit): FitCompatibility`**
- Returns score (0-100), reasoning, and optional warnings
- Analyzes all 25 fit type combinations (5 types × 5 types)
- Encodes senior stylist expertise in scoring

**`getFitPairingRecommendations(topFit): { ideal, avoid }`**
- Recommends ideal bottom fits for a given top fit
- Lists fits to avoid for poor silhouette balance

**`getFitAdviceByBodyType(bodyType): Record<FitType, number>`**
- Personalized fit recommendations by body shape
- Supports: pear, apple, hourglass, rectangle, inverted-triangle

**`validateFitFormality(topFit, topFormality, bottomFit, bottomFormality): { valid, score, note }`**
- Ensures fit choices work with formality level
- Formal events need fitted pieces for polished look
- Casual wear can experiment with fitted pieces

**`analyzeOutfitProportions(topFit, topVisualWeight, bottomFit, bottomVisualWeight): { balanceScore, analysis, recommendation }`**
- Combines fit compatibility with visual weight
- Weighted scoring: 70% fit + 30% visual weight
- Provides recommendations and confidence assessment

#### FIT_COMPATIBILITY Matrix

Scoring for all 25 top-bottom fit combinations:

| Top \ Bottom | Loose | Regular | Fitted | Slim | Oversized |
|---|---|---|---|---|---|
| **Loose** | 15 ⚠️ | 70 | **95** ✅ | 85 | 10 ⚠️ |
| **Regular** | 70 | 75 | 80 | 78 | 45 |
| **Fitted** | **95** ✅ | 82 | 70 | 65 ⚠️ | 50 |
| **Slim** | 88 | 80 | 72 | 60 ⚠️ | 65 |
| **Oversized** | 12 ⚠️ | 48 | 78 | 82 | 8 ⚠️ |

#### Senior Stylist Rules Encoded

✅ **OPTIMAL (Score 95)**
- Loose top + Fitted bottom: Shows shape below, flows freely above
- Fitted top + Loose bottom: Showcases upper silhouette, drapes comfortably below

✅ **GOOD (Score 70-85)**
- Fitted + Fitted: Clean lines, watch for stiffness
- Loose + Slim: Great contrast and balance
- Loose + Regular: Some definition, flows below
- Fitted + Regular: Streamlined silhouette

⚠️ **CAUTION (Score 60-72)**
- Fitted + Slim: Can look too tight-fitting overall
- Slim + Slim: Can appear too form-fitting and restrictive
- Slim + Fitted: May feel restrictive

❌ **AVOID (Score < 40)**
- Loose + Loose: Creates tent silhouette, shapeless and unflattering
- Oversized + Oversized: Eliminates all definition
- Loose + Oversized: Extreme shapelessness

### 2. **Integration into suggestPairings() Function**

Enhanced to apply fit compatibility scoring:

```typescript
// When suggesting items, calculate fit compatibility
const fitCompat = calculateFitCompatibility(uploadedFit, suggestionFit)

// Adjust match scores based on fit pairing quality
if (fitCompat.score > 85) {
  adjustedMatchScore = Math.min(100, adjustedMatchScore + 10)
} else if (fitCompat.score < 40) {
  adjustedMatchScore = Math.max(0, adjustedMatchScore - 15)
}

// Include fit reasoning in suggestions
reason = s.reason + ` | Fit pairing: ${fitCompat.reasoning}${fitCompat.warning || ''}`
```

**Impact:**
- Excellent fit pairings (+10 to match score)
- Poor fit pairings (-15 to match score)
- Fit reasoning added to suggestion explanations
- Only applied to top/bottom pairs (shoes excluded)

### 3. **Enhanced generateOutfits Prompt**

Added "FIT PAIRING STRATEGY" section to guide the AI:

```
FIT PAIRING STRATEGY (20 points bonus when applied):
- OPTIMAL (loose top + fitted bottom OR fitted top + loose bottom) = +10 pts BONUS
- EXCELLENT (fitted + fitted with tapered bottoms) = +5 pts
- CAUTION (two loose/oversized/slim pieces) = -5 pts PENALTY
- GOOD (loose + regular, regular + fitted) = +2 pts
```

The prompt teaches AI about fit compatibility rules and rewards applying them.

### 4. **generateOutfitSuggestions Already Includes Fit Data**

The function already passes fit information in formatted item lists:
```
ID:item_123 | oversized cream linen button-up | Color:cream | Fit:oversized | ...
```

This allows the AI to see fit data clearly when building outfit combinations.

## How It Works in Practice

### Scenario 1: Suggest-Pairing with Fit Compatibility

**User uploads:** Loose-fitting linen shirt
- Fit detected: `loose`
- Type detected: `top`

**AI suggests wardrobe bottoms:**
1. Navy fitted jeans (60 items in wardrobe)
   - Base match score: 75
   - **Fit compatibility:** Loose + Fitted = 95 (OPTIMAL)
   - **Adjusted score:** 75 + 10 = **85**
   - Reason: "Creates great visual balance with fitted bottoms defining the lower silhouette"

2. Khaki regular fit chinos (45 items)
   - Base match score: 68
   - **Fit compatibility:** Loose + Regular = 70 (GOOD)
   - **Adjusted score:** 68 + 0 = **68**
   - Reason: "Provides some definition below while allowing comfortable fit"

3. Black oversized trousers (30 items)
   - Base match score: 55
   - **Fit compatibility:** Loose + Oversized = 10 (AVOID)
   - **Adjusted score:** 55 - 15 = **40**
   - Reason: "Two oversized pieces create shapeless silhouette ❌ AVOID"

**Result:** Best suggestions rise to top due to fit compatibility advantages.

### Scenario 2: Generate Outfit Suggestions

When building 3 complete outfits around a selected piece, the AI considers:
- Fit pairing rules (bonus points for optimal combinations)
- Body type recommendations (if implemented)
- Overall balance of loose/fitted pieces across outfit

## File Structure

```
src/
├── lib/
│   ├── fit-compatibility.ts          (NEW - 358 lines)
│   └── openai.ts                      (MODIFIED - imports + suggestPairings enhanced)
├── config/
│   └── prompts.ts                     (MODIFIED - generateOutfits prompt enhanced)
└── app/api/wardrobe/
    └── suggest-pairing/
        └── route.ts                   (Uses enhanced suggestPairings with fit logic)
```

## Compatibility Matrix Reference

### For Loose Top
- **Ideal bottoms:** fitted, slim (balance and definition)
- **Avoid bottoms:** loose, oversized (creates tent)

### For Fitted Top
- **Ideal bottoms:** loose, regular (balance and flow)
- **Avoid bottoms:** slim (too restrictive together)

### For Oversized Top
- **Ideal bottoms:** fitted, slim (grounds the look)
- **Avoid bottoms:** loose, oversized (no definition)

### For Regular/Slim Top
- **Flexible:** works well with most fits
- **Best with:** regular, fitted bottoms

## Body Type Recommendations (Implemented)

| Body Type | Best Fits | Scores |
|---|---|---|
| **Pear** | Fitted tops + loose/regular bottoms to balance wider hips | Fitted: 95, Loose: 90 |
| **Apple** | Loose tops + fitted bottoms to draw eye down | Loose: 95, Regular: 80 |
| **Hourglass** | Fitted pieces that follow curves | Fitted: 95, Regular: 85 |
| **Rectangle** | Create definition with fitted + strategic volume | Fitted: 90, Loose: 85 |
| **Inverted Triangle** | Fitted tops + loose bottoms to balance wide shoulders | Loose: 90, Fitted: 70 |

## Testing the Integration

### API Endpoint: POST /api/wardrobe/suggest-pairing

**Request:**
```json
{
  "image": "base64_encoded_image",
  "mediaType": "image/jpeg"
}
```

**Response includes:**
- Match scores adjusted by fit compatibility
- Fit reasoning appended to suggestions
- Best top-bottom pairings ranked by fit balance + color harmony

### Example Response
```json
{
  "success": true,
  "uploadedItem": {
    "detected_type": "loose linen shirt",
    "fit": "loose",
    "color": "cream",
    "formality": "casual"
  },
  "suggestions": [
    {
      "item": { "id": "item_123", "fit": "fitted", ... },
      "reason": "Navy color creates depth against cream... | Fit pairing: OPTIMAL: Loose top flows freely while fitted bottom defines the lower silhouette. Creates visual balance.",
      "matchScore": 85  // Boosted from 75 due to fit compatibility
    }
  ]
}
```

## Future Enhancements

1. **Body Type Detection:** Analyze uploaded image for body type recommendations
2. **Fit Data Enrichment:** Ensure all wardrobe items have fit data populated
3. **Visual Weight Integration:** Combine fit with fabric weight for more sophisticated scoring
4. **Formality-Fit Validation:** Warn if casual fit with formal occasion
5. **Trend Awareness:** Allow oversized + tight combinations for fashion-forward looks

## Summary

The fit compatibility system brings professional styling expertise to outfit suggestions by:
- Scoring all 25 fit combinations based on senior stylist rules
- Adjusting match scores to reward excellent pairings (+10) and penalize poor ones (-15)
- Teaching the AI about fit strategy in prompt engineering
- Providing personalized recommendations by body type
- Creating visual balance that flatters and builds confidence

This ensures that outfit suggestions don't just color-coordinate—they create balanced, flattering silhouettes.
