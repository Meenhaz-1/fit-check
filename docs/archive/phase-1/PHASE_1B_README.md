# Phase 1b: Wardrobe Upload & Metadata Extraction

## Goal

Enable users to upload wardrobe items. AI automatically extracts metadata (color, material, formality, fit, silhouette, visual weight). Users can verify/correct the extraction before saving.

## User Flow

```
User uploads image
    ↓
AI extracts metadata (color, material, formality, fit, silhouette, visual_weight)
    ↓
UI shows extracted metadata
    ↓
User reviews and corrects if needed
    ↓
Item is saved to wardrobe
```

## What to Build

### 1. **Upload Page** (`src/app/wardrobe/page.tsx`)
- File input for image upload
- Display uploaded image preview
- Show extracted metadata in form fields
- Allow user to edit/correct metadata
- Save button

### 2. **API Endpoint** (`src/app/api/wardrobe/upload/route.ts`)
- Accept POST with image file (base64 or multipart)
- Call OpenAI Vision to extract metadata
- Return extracted metadata as JSON

### 3. **Metadata Extraction Utility** (`src/lib/metadata.ts`)
- Function to extract metadata from image using OpenAI
- Handle errors gracefully (ask user for manual input if AI fails)
- Return structured metadata object

### 4. **Database Integration**
- Save wardrobe item to `data/evaluations.json`
- Generate unique ID for each item
- Store upload timestamp

## Implementation Steps

### Step 1: Create Wardrobe Page
- File: `src/app/wardrobe/page.tsx`
- Build a form with:
  - File input (`<input type="file" accept="image/*">`)
  - Image preview
  - Metadata form fields (all editable)
  - Save button

### Step 2: Create Metadata Extraction Function
- File: `src/lib/metadata.ts`
- Function: `extractMetadataFromImage(base64Image: string): Promise<ExtractedMetadata>`
- Use OpenAI Vision API to analyze image
- Return: `{ color, material, formality, fit, silhouette, visual_weight }`

### Step 3: Create Upload API Endpoint
- File: `src/app/api/wardrobe/upload/route.ts`
- POST endpoint
- Accept: image (base64)
- Call metadata extraction
- Return extracted data

### Step 4: Handle Save
- User submits form
- Call API to extract metadata
- Show results to user
- User confirms/edits
- Save to wardrobe (add to CSV or update store)

## Success Criteria

✅ User can upload an image  
✅ AI extracts metadata automatically  
✅ User sees extracted data in form fields  
✅ User can edit metadata  
✅ Clicking "Save" stores item in wardrobe  
✅ Item appears in `data/sample-wardrobe.csv` (or in-memory store)  
✅ Can upload multiple items without errors  

## Testing (Phase 1e)

During user testing:
- User uploads a shirt photo
- AI extracts: color, material, formality, fit, silhouette, visual_weight
- User verifies extraction is correct
- User saves item
- Item now appears in their wardrobe

## Edge Cases to Handle

- **Bad image upload** → Show error, ask user to try again
- **AI fails to extract metadata** → Ask user to manually enter fields
- **Missing fields** → Require user to fill before saving
- **Duplicate filenames** → Generate unique ID

## Notes

- Phase 1b focuses on **upload + extraction flow**
- No wardrobe recommendations yet (that's Phase 1d)
- Keep it simple: single item upload at a time
- Metadata extraction must be reliable (users will test this heavily)

---

## Reference

- See `PHASE_1_TEST_PLAN.md` for how Phase 1e testers will use this
- See `PHASE_1_CONFIG.md` for metadata field definitions
- See `src/lib/openai.ts` for AI integration helpers
- See `src/lib/db.ts` for database functions

---

## Next: Phase 1c

After Phase 1b is complete, move to:
**Phase 1c: Screenshot Upload & Item Detection**
- Users upload screenshot/product image
- AI detects clothing items in the image
- User selects which item to evaluate
