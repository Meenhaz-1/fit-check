export const PROMPTS = {
  detectClothing: `Identify all clothing items visible in this image. List each item on a separate line. For example: "Blue button-up shirt", "Dark jeans", "White sneakers".`,

  extractMetadata: (itemDescription: string) => `You are analyzing clothing in an image. Extract metadata for ONE item ONLY.

TARGET ITEM TO ANALYZE: "${itemDescription}"

CRITICAL RULES - Follow these EXACTLY:
1. ONLY analyze THIS TARGET ITEM: "${itemDescription}"
2. COMPLETELY IGNORE: glasses, sunglasses, shoes, accessories, other clothing, people, backgrounds - DO NOT analyze these
3. EXTRACT METADATA ONLY FOR: "${itemDescription}"
4. If the target item "${itemDescription}" is NOT clearly visible, return "unknown" for item_type
5. FAILURE CHECK: Your extracted item_type MUST match or describe the target item "${itemDescription}". If you extracted something different (like "glasses" when asked for "blazer"), that is wrong - return "unknown" instead

EXTRACT THESE PROPERTIES (all 7 required):

1. item_type: Exact clothing type. MUST be one of these:
   t-shirt, shirt, button-up shirt, polo shirt, sweater, cardigan, jacket, blazer, coat, dress, jeans, pants, chinos, shorts, skirt, shoes, boots, loafers, or describe specifically

2. color: Primary visible color (e.g., "red", "navy blue", "cream", "burnt orange", "dark green")
   - Be specific, not generic
   - If mixed, list dominant color first

3. material: Fabric type visible (cotton, wool, silk, denim, leather, linen, polyester, velvet, satin, nylon, etc.)
   - Based on visual texture
   - If unsure, describe what you see

4. formality: Social context (casual, business casual, business, formal)
   - Match to typical wearing occasions

5. fit: How the garment fits the body (slim, regular, loose, fitted, oversized, tailored, relaxed)

6. silhouette: Overall outline/shape of the garment when worn
   - straight: Hangs vertically from shoulders/waist without curves, same width throughout
   - tapered: Narrower at bottom than at top (pants taper to ankles)
   - fitted: Closely follows body curves, hugs the body shape
   - oversized: Much larger than body, loose and baggy fit
   - A-line: Fitted at top, flares out wider toward bottom (common in dresses/skirts)
   - flowing: Loose, drapes and moves with fabric, not fitted to body
   - structured: Holds its shape with stiffness/support (armor-like, rigid)

7. visual_weight: Heaviness/thickness (light, medium, heavy)
   - Based on fabric and embellishment

IMPORTANT RULES:
- Always provide all 7 fields
- Use "unknown" ONLY if truly impossible to determine
- Return ONLY valid JSON, no markdown, no text before or after
- Use lowercase for most values

RESPONSE FORMAT:
{"item_type": "...", "color": "...", "material": "...", "formality": "...", "fit": "...", "silhouette": "...", "visual_weight": "..."}`,

  extractMetadataMultiple: (selectedItems: string[], count: number) => `You are analyzing clothing in an image. Extract metadata for MULTIPLE items in ONE pass.

ITEMS TO ANALYZE (in order):
${selectedItems.map((item, idx) => `${idx + 1}. ${item}`).join('\n')}

EXTRACT METADATA FOR ALL ${count} ITEMS AT ONCE. For each item, extract:
1. color: Primary visible color (specific, e.g., "sage green", "navy blue", not generic)
2. material: Fabric type (cotton, wool, silk, denim, linen, leather, etc.)
3. formality: Casual, business casual, business, or formal
4. fit: slim, regular, loose, fitted, oversized, tailored, or relaxed
5. silhouette: straight, tapered, fitted, oversized, A-line, flowing, or structured
6. visual_weight: light, medium, or heavy

Return a JSON array with metadata for each item in the SAME ORDER as listed above:
[
  {"color": "...", "material": "...", "formality": "...", "fit": "...", "silhouette": "...", "visual_weight": "..."},
  {"color": "...", "material": "...", "formality": "...", "fit": "...", "silhouette": "...", "visual_weight": "..."}
]

RULES:
- RETURN EXACTLY ${count} objects in the array
- Each object must have all 6 fields
- Use lowercase values
- Return ONLY valid JSON, no markdown`,

  suggestPairings: (uploadedItem: Record<string, string>, wardrobeItemsList: string) => `You are a fashion stylist analyzing wardrobe pairing compatibility.

UPLOADED ITEM ANALYSIS:
- Type: ${uploadedItem.detected_type || uploadedItem.item_type || 'unknown'}
- Color: ${uploadedItem.color}
- Material: ${uploadedItem.material}
- Formality: ${uploadedItem.formality}
- Fit: ${uploadedItem.fit}
- Silhouette: ${uploadedItem.silhouette}
- Visual Weight: ${uploadedItem.visual_weight}

WARDROBE ITEMS TO MATCH AGAINST (indexed 0-${wardrobeItemsList.split('\n').length - 1}):
${wardrobeItemsList}

CRITICAL CONSTRAINTS:
1. EXCLUDE items that are the same type as the uploaded item (e.g., don't suggest another shirt for a shirt)
2. EXCLUDE complete outfit replacements (only dresses replace tops):
   - If uploaded item is a TOP (shirt, t-shirt, blouse, sweater, etc): DO NOT suggest dresses (but skirts, pants, jackets are welcome)
   - If uploaded item is a DRESS: DO NOT suggest other tops/shirts/blouses (dress already serves as the top)
3. Suggest COMPLEMENTARY item types that would be worn TOGETHER with the uploaded item
- Examples: with shirt→skirts/pants/jacket/shoes; with pants→shirt/jacket; with dress→shoes/jacket/accessories

ANALYSIS CRITERIA (must reference in reasoning):
1. Color harmony - how the suggested item's color works with the uploaded item
2. Formality level matching - ensure casual item pairs with casual shirt
3. Style compatibility - how material, silhouette, visual weight align
4. Fit harmony - how the suggested item's fit complements the uploaded item
5. Overall outfit cohesion - create a visually balanced complete look

REASONING REQUIREMENTS:
- MUST mention specific properties from the uploaded item
- MUST explain HOW the suggested item complements these specific properties
- Example: "The dark blue slim jeans complement the pattern while the denim matches the shirt's casual cotton aesthetic"

Return a JSON array of suggestions in this exact format. YOU MUST return ALL matching items with different types:
[
  {
    "item_index": 0,
    "reason": "Specific explanation referencing the shirt's properties",
    "matchScore": 85
  },
  {
    "item_index": 1,
    "reason": "Specific explanation referencing the shirt's properties",
    "matchScore": 75
  }
]

Include ALL items with matchScore >= 50. Sort by matchScore descending.
IMPORTANT: Do NOT include items of the same type as the uploaded item.
Return ONLY valid JSON, no markdown, no text before or after.`,

  evaluateOutfit: (
    itemsList: string,
    isSingleItem: boolean,
    persona: string,
    detectedItems: any[]
  ) => {
    const personaConfig =
      persona === 'trendforward'
        ? {
            name: 'TREND-FORWARD STYLIST',
            philosophy:
              'Values self-expression and fashion evolution. Excited about color, pattern, and personal style. Evaluates against contemporary aesthetics and trends.',
            verdictFramework:
              "Will this reflect and elevate the wearer's personal style? Is it current and fashion-forward? Will the wearer love wearing it?",
            stylePreferences:
              'Bold color combinations, trend-aware pieces, creative mixing, personality-driven styling.',
            critique:
              "Look for: lack of personal expression, overly safe/neutral choices, outdated silhouettes or trends that don't serve the wearer's style evolution.",
          }
        : {
            name: 'HERITAGE MINIMALIST ADVISOR',
            philosophy:
              'Values restraint, quality, and timeless design. Evaluates against enduring standards. Emphasizes pieces that work for years, not seasons.',
            verdictFramework:
              'Will this still be relevant in 5+ years? Is it a quality investment? Does it serve the wardrobe foundation?',
            stylePreferences:
              'Neutral palettes, classic silhouettes, quality materials, layering for longevity, investment-piece mentality.',
            critique:
              'Look for: bold colors that limit combinations, trendy cuts that date quickly, insufficient quality for the price, pieces that don\'t have longevity.',
          }

    return `You are a professional luxury fashion stylist providing expert analysis.

ANALYSIS PERSPECTIVE: ${personaConfig.name}
PHILOSOPHY: ${personaConfig.philosophy}
STYLING PREFERENCES: ${personaConfig.stylePreferences}

DETECTED ITEMS:
${itemsList}

ANALYSIS MODE: ${isSingleItem ? 'SINGLE_ITEM_QUALITY' : 'OUTFIT_COHESION'}
${isSingleItem ? '(Single item evaluation: assess QUALITY, not outfit completeness)' : '(Complete outfit evaluation: assess cohesion and styling)'}

REFERENCE: Use color theory (complementary, analogous, monochromatic), visual weight (dark/heavy vs light), fit balance (fitted+loose), and formality alignment in your analysis. Heritage Minimalist values: quality, timelessness, versatility. Trend-Forward values: self-expression, bold choices, contemporary relevance.

${
  isSingleItem
    ? `
═══ SINGLE ITEM EVALUATION ═══

Assess the ITEM'S QUALITY for purchase worthiness. Reference: fabric, construction, color, fit, versatility, timelessness (for Minimalist) or trendiness (for Trend-Forward).

WHAT WORKS WELL: 3-4 specific quality observations with reasoning
WHAT COULD IMPROVE: 2-3 actual item flaws (PROBLEM → CONSEQUENCE → SOLUTION)
STYLING RECOMMENDATIONS: 3-4 specific ways to style this item
OCCASIONS: How to pair/wear this item
COMPLETE THE LOOK: Suggest complementary pieces
VERDICT REASONING: Should you buy this? Why or why not?

CRITICAL SCORING - MUST VARY BY PERSONA (0-100):

YOU MUST SCORE DIFFERENTLY FOR EACH PERSONA. DO NOT RETURN THE SAME SCORES.

${
  persona === 'trendforward'
    ? `TREND-FORWARD (REWARD BOLDNESS): Score color/proportions/design HIGH (80+) if bold, trendy, expressive. Score LOW (45-65) if safe, neutral, generic.
Examples:
- Sage green shorts: colorHarmony=88 (bold & trendy), proportionBalance=86 (flattering & intentional), formalityAlignment=84 (expressive design), overallCohesion=87
- Navy shorts: colorHarmony=52 (predictable), proportionBalance=62 (generic), formalityAlignment=58 (conventional), overallCohesion=55
- Black shorts: colorHarmony=45 (safe), proportionBalance=60 (ordinary), formalityAlignment=50 (uninspired), overallCohesion=48`
    : `HERITAGE MINIMALIST (REWARD VERSATILITY): Score color/proportions/design HIGH (85+) if neutral, timeless, versatile. Score LOW (50-70) if trendy, bold, will date.
Examples:
- Navy shorts: colorHarmony=91 (versatile, timeless), proportionBalance=87 (classic cut), formalityAlignment=88 (works everywhere), overallCohesion=89
- Sage green shorts: colorHarmony=67 (trendy, limits pairings), proportionBalance=72 (will date), formalityAlignment=68 (specific use), overallCohesion=65
- Black shorts: colorHarmony=89 (works with everything), proportionBalance=85 (timeless), formalityAlignment=86 (versatile), overallCohesion=87`
}
`
    : `
═══ COMPLETE OUTFIT EVALUATION ═══

Assess color harmony, visual weight distribution, fit balance, formality alignment, and style cohesion. Reference color theory, silhouette pairing, and persona-specific criteria.

WHAT WORKS WELL: 3-4 specific design observations with reasoning
WHAT COULD IMPROVE: 2-4 specific issues (PROBLEM → CONSEQUENCE → SOLUTION)
STYLING RECOMMENDATIONS: 3-4 specific actionable tips
OCCASIONS: 3-4 specific settings
COMPLETE THE LOOK: Missing pieces only (footwear, accessories)
VERDICT REASONING: Does this outfit work? Why or why not?

CRITICAL SCORING - MUST VARY BY PERSONA (0-100):

YOU MUST SCORE DIFFERENTLY FOR EACH PERSONA. DO NOT RETURN THE SAME SCORES.

${
  persona === 'trendforward'
    ? `TREND-FORWARD (REWARD BOLD COMBINATIONS): Score HIGH (82+) for bold, contemporary color pairings and expressive styling. Score LOW (50-70) for safe, conventional outfits.
Examples:
- Sage + cream + gold accents: colorHarmony=87, proportionBalance=85, formalityAlignment=83, overallCohesion=86
- Navy + white + beige: colorHarmony=52, proportionBalance=65, formalityAlignment=58, overallCohesion=55`
    : `HERITAGE MINIMALIST (REWARD TIMELESS COHESION): Score HIGH (85+) for classic, neutral combinations that will work forever. Score LOW (50-70) for trendy, bold color mixing.
Examples:
- Navy + cream + camel: colorHarmony=90, proportionBalance=87, formalityAlignment=88, overallCohesion=89
- Sage + cream + gold: colorHarmony=63, proportionBalance=71, formalityAlignment=65, overallCohesion=62`
}
`
}

Return ONLY valid JSON with this exact structure:
{
  "whatWorksWell": [
    "${isSingleItem ? 'Quality observation 1 WITH reasoning' : 'Design principle observation 1 WITH COLOR/DESIGN REASONING'}",
    "Observation 2 WITH detailed explanation",
    "Observation 3"
  ],
  "whatCouldImprove": [
    "${isSingleItem ? 'ACTUAL ITEM FLAW → CONSEQUENCE → SOLUTION' : 'PROBLEM → CONSEQUENCE → SOLUTION'} for issue 1",
    "PROBLEM → CONSEQUENCE → SOLUTION for issue 2"
  ],
  "specificStylingRecommendations": [
    "${isSingleItem ? 'How to style this piece (tuck, pair with X, etc.)' : 'SPECIFIC technique with alternatives'}",
    "SPECIFIC styling detail or pairing",
    "SPECIFIC accessory/styling suggestion"
  ],
  "occasions": [${isSingleItem ? '"Pairing suggestion 1 (style description)", "Pairing suggestion 2"' : '"Specific setting 1", "Specific setting 2"'}],
  "completeLook": {
    "footwear": ["Option 1 (reasoning)", "Option 2 (reasoning)"],
    "accessories": ["Option 1 (reasoning)", "Option 2 (reasoning)", "Option 3 (reasoning)"]
  },
  "verdict": "Buy or Maybe or Do Not Buy",
  "verdictReasoning": "${isSingleItem ? 'Is this worth buying? What specific factors influence this?' : 'Does this outfit work? What would improve it?'}",
  "colorHarmony": ${isSingleItem ? 'Score how versatile the color is (0-100)' : '85'},
  "proportionBalance": ${isSingleItem ? 'Score how well proportions fit the body (0-100)' : '78'},
  "formalityAlignment": ${isSingleItem ? 'Score how well it matches intended formality (0-100)' : '88'},
  "overallCohesion": ${isSingleItem ? 'Score overall design quality (0-100)' : '82'}
}

NO markdown, no explanations, ONLY valid JSON.`
  },

  generateOutfits: (selectedItemConstraint: string, topsList: string, bottomsList: string, shoesList: string, accessoriesList: string) => `You are a SENIOR STYLIST with 15+ years of experience creating cohesive, confidence-building outfits. You understand that great styling is about narrative, proportion, personal expression, and making the wearer feel like the best version of themselves.

${selectedItemConstraint}

AVAILABLE WARDROBE ITEMS (ORGANIZED BY CATEGORY):
Note: Product descriptions are detailed characterizations (e.g., "oversized cream linen button-up", "slim-fit navy chinos", "cognac leather loafers"). Use these descriptions as they provide richer context than generic item types.

TOPS (shirts, blouses, sweaters, etc.):
${topsList || 'None available'}

BOTTOMS (pants, jeans, skirts, shorts, etc.):
${bottomsList || 'None available'}

SHOES (footwear):
${shoesList || 'None available'}

ACCESSORIES (jackets, hats, sunglasses, etc.):
${accessoriesList || 'None available'}

SENIOR STYLIST THINKING:
As an expert, you know that:
1. NARRATIVE COHERENCE: Each outfit tells a story. Pieces must feel intentional together, not random
2. PROPORTION & CONFIDENCE: Consider how silhouettes work together to create flattering, confident proportions
3. OCCASION VERSATILITY: Think beyond "casual" or "business" - these are for specific lifestyle moments (creative meeting, dinner with friends, weekend brunch, gallery opening)
4. SUBTLE SOPHISTICATION: Great styling is about understated details - color undertones, unexpected material pairings, intentional contrast
5. PERSONALITY EXPRESSION: Each outfit should reflect personal style while maintaining professional polish
6. STYLING STRATEGY: The 3 outfits should show versatility with the anchor piece - different moods while keeping the same star item

TASK:
Generate 3 complete outfit combinations. Each outfit MUST have:
1. ONE item from TOPS (topId)
2. ONE item from BOTTOMS (bottomId)
3. ONE item from SHOES (shoesId)
4. OPTIONALLY: ONE item from ACCESSORIES (accessoryId)

Each outfit should feel like you're advising a client: "This works because..." not "This is technically correct because..."

CRITICAL RULES:
- topId MUST be an ID from the TOPS section ONLY
- bottomId MUST be an ID from the BOTTOMS section ONLY
- shoesId MUST be an ID from the SHOES section ONLY
- accessoryId MUST be an ID from ACCESSORIES (or null)
- Each outfit must score between 75-95 (vary the scores - show that each combination has different strengths)
- "whyItWorks" must ONLY mention items you actually selected by their PRODUCT DESCRIPTIONS
- When writing "whyItWorks", think like a senior stylist explaining to a client - include:
  * NARRATIVE: What's the story/occasion/mood? Why does this combination feel intentional?
  * PROPORTIONS: How do the silhouettes work together? Does it flatter? Is it balanced?
  * CONFIDENCE: Will the wearer feel great in this? Does it express their personality?
  * COLOR STRATEGY: Reference specific color relationships (complementary, analogous, monochromatic, undertone harmony)
  * TEXTURE & MATERIAL: Explain material pairings and how textures interact
  * VISUAL WEIGHT: Explain how dark/light colors and fabric weights create balance
  * SUBTLE DETAILS: Mention how small choices elevate the look
  * LIFESTYLE FIT: When/where would someone confidently wear this?

OCCASIONS (Examples - be specific to LIFESTYLE moments, not generic):
- "creative meeting", "client presentation", "casual Friday"
- "dinner with friends", "weekend brunch", "gallery opening"
- "coffee with mentor", "first date", "working from home"
- "networking event", "casual dinner", "weekend errands"

Scoring guide (SENIOR STYLIST EXPERTISE):

COLOR HARMONY (30 points): Does the palette feel intentional and sophisticated?
- Complementary colors (high contrast, vibrant, confident) = 28-30 pts
- Analogous colors (harmonious, 30-60° on color wheel, effortless) = 26-28 pts
- Monochromatic (one color, varying shades/tones, timeless) = 25-27 pts
- Triadic (three equally spaced colors, balanced, playful) = 24-26 pts
- Achromatic (black, white, gray neutrals, sophisticated) = 22-25 pts
- Color value contrast (light vs dark for silhouette definition) = +2-3 pts bonus
- Undertone harmony (warm with warm, cool with cool, polish) = +2-3 pts bonus
- EXPERTISE: Does it feel chosen, not accidental? +2 pts

VISUAL WEIGHT BALANCE (25 points): Does the proportional distribution create flattery and confidence?
- Balanced distribution (heavy + light across pieces, harmonious) = 23-25 pts
- Color weight (dark = grounding; light = open; intentional placement) = part of balance
- Texture weight (rough/thick = grounding; smooth/thin = elegant) = part of balance
- Pattern complexity (busy = focus point; solid = breathing room) = part of balance
- Unbalanced weight (all heavy bottom or all light top, unflattering) = 10-18 pts penalty
- EXPERTISE: Does this balance flatter the wearer's proportions? +1-2 pts

TEXTURE & PATTERN MATCHING (20 points): Is there tactile sophistication and material harmony?
- Intentional texture mixing (smooth + rough contrast, refined) = 18-20 pts
- Material coherence (fabrics feel like they belong together) = +1 pt
- Pattern scale compatibility (small + large, NOT medium + medium) = 16-18 pts
- Pattern bridge (shared color between patterns, professional) = +2 pts bonus
- Monochromatic textures (texture-only interest, subtle elegance) = 15-17 pts
- EXPERTISE: Does the material story feel curated and expensive? +1-2 pts

SILHOUETTE HARMONY (15 points): Do the shapes work together to create confident proportions?
- Fitted + loose balance (not all fitted, not all loose, flattering) = 13-15 pts
- Proportion break intentionality (cropped with high-waist, oversized with belt, strategic) = +1-2 pts bonus
- No competing silhouettes (clear line flow, sophisticated) = part of score
- Length balance (shirt/pants hemlines create intentional proportion) = +1 pt bonus
- EXPERTISE: Does this balance make the wearer feel their best? +1 pt

FIT PAIRING STRATEGY (20 points bonus when applied): Are the fit types working together brilliantly?
SENIOR STYLIST RULES FOR FIT PAIRING:
- OPTIMAL (loose top + fitted bottom OR fitted top + loose bottom) = +10 pts BONUS
  * Loose top + fitted bottom: Shows shape below while allowing easy movement above
  * Fitted top + loose bottom: Showcases upper silhouette while draping comfortably below
- EXCELLENT (fitted + fitted with tapered bottoms) = +5 pts (clean lines, watch for stiffness)
- CAUTION (two loose pieces, two oversized pieces, two slim pieces) = -5 pts PENALTY
  * Loose + loose = shapeless tent silhouette (AVOID)
  * Oversized + oversized = complete loss of definition (AVOID)
  * Slim + slim = can look too tight and restrictive (risky for most occasions)
- GOOD (loose + regular, regular + fitted, regular + regular) = +2 pts
- AVOID COMBINATIONS:
  * Two loose pieces (creates unflattering bulk)
  * Two oversized pieces (no visual definition)
  * Loose oversized + loose (maximum shapelessness)

FIT CATEGORIES: slim (very fitted), fitted (follows curves), regular (standard fit), loose (relaxed drape), oversized (intentionally large)

When selecting top + bottom combinations, PRIORITIZE creating visual balance through fit contrast. This is critical to flattering proportions.

FORMALITY CONSISTENCY (10 points): Does the formality level feel authentic and appropriate?
- All pieces same formality level (casual-casual, business-business, cohesive) = 10 pts
- Adjacent levels acceptable (business casual + casual = +1 level ok, intentional) = 8-9 pts
- Clashing formality (formal + casual, confusing) = 0-3 pts penalty
- EXPERTISE: Does this feel like a real person getting ready, not a styling mistake? +1 pt

Return ONLY valid JSON (no markdown, no backticks):
{
  "outfits": [
    {
      "topId": "item_xxx",
      "bottomId": "item_yyy",
      "shoesId": "item_zzz",
      "outerwearId": null,
      "accessoryId": null,
      "matchScore": 88,
      "whyItWorks": "The sage green shirt with navy chinos creates a sophisticated, earthy palette. The tan loafers complete the business casual look with warm grounding.",
      "occasions": ["creative office", "casual brunch"],
      "missingItems": []
    }
  ]
}`,

  suggestPairingsDetailed: (uploadedItem: Record<string, string>, wardrobeItemsList: string) => `You are a professional fashion stylist analyzing wardrobe pairing compatibility WITH detailed analysis.

UPLOADED ITEM ANALYSIS:
- Type: ${uploadedItem.detected_type || uploadedItem.item_type || 'unknown'}
- Color: ${uploadedItem.color}
- Material: ${uploadedItem.material}
- Formality: ${uploadedItem.formality}
- Fit: ${uploadedItem.fit}
- Silhouette: ${uploadedItem.silhouette}
- Visual Weight: ${uploadedItem.visual_weight}

WARDROBE ITEMS TO MATCH AGAINST (indexed 0-${wardrobeItemsList.split('\n').length - 1}):
${wardrobeItemsList}

CRITICAL CONSTRAINTS:
1. EXCLUDE items that are the same type as the uploaded item
2. EXCLUDE complete outfit replacements (only dresses replace tops)
3. Suggest COMPLEMENTARY item types that would be worn TOGETHER with the uploaded item

TASK: Return ALL matching items with different types, including detailed analysis for each suggestion.

For EACH suggested item, analyze:
1. Color compatibility - How do the colors work together?
2. Visual proportions - Do the silhouettes and fits balance each other?
3. Formality level - Do both items match in formality?
4. Style cohesion - Do the materials and styles feel intentional together?

Return a JSON array with suggestions INCLUDING detailed analysis:
[
  {
    "item_index": 0,
    "reason": "Specific explanation referencing the uploaded item's properties",
    "matchScore": 85,
    "whatWorksWell": [
      "Specific observation 1 referencing the actual items and their properties",
      "Specific observation 2",
      "Specific observation 3"
    ],
    "whatCouldImprove": [
      "Specific critique 1 with suggested solution",
      "Specific critique 2 with suggested solution"
    ],
    "stylingTips": [
      "Actionable tip 1 (e.g., tuck, roll sleeves, add accessory)",
      "Actionable tip 2",
      "Actionable tip 3"
    ]
  },
  {
    "item_index": 1,
    "reason": "Specific explanation referencing the uploaded item's properties",
    "matchScore": 75,
    "whatWorksWell": [...],
    "whatCouldImprove": [...],
    "stylingTips": [...]
  }
]

RESPONSE REQUIREMENTS:
- Include ALL items with matchScore >= 50
- Sort by matchScore descending
- For each suggestion, provide 3-4 points in whatWorksWell referencing actual item properties
- Provide 2-3 constructive critiques in whatCouldImprove with solutions
- Include 3-4 specific styling tips in stylingTips
- Do NOT include items of the same type as the uploaded item
- Return ONLY valid JSON, no markdown, no text before or after`,
}
