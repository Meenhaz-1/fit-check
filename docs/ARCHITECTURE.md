# Architecture & Design

## Overview

AI Wardrobe Assistant is a full-stack Next.js application that analyzes clothing images and extracts structured metadata using OpenAI's Vision API.

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js Frontend                      │
│  (React Components, Pages, Layouts)                      │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│              Next.js API Routes                          │
│  POST /api/wardrobe/upload                              │
│  POST /api/wardrobe/detect                              │
│  POST /api/wardrobe/save                                │
│  GET  /api/health                                       │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│           Business Logic Layer                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │ src/lib/openai.ts                                │   │
│  │ - detectClothingItems()                          │   │
│  │ - extractMetadata()                              │   │
│  │ - OpenAI Vision API calls                        │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │ src/lib/metadata.ts                              │   │
│  │ - Metadata validation & transformation           │   │
│  └──────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│           Data Access Layer                              │
│  src/lib/db.ts                                          │
│  - Wardrobe storage & retrieval                         │
│  - Evaluation history tracking                          │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│              External Services                           │
│  - OpenAI GPT-4o Vision API                             │
│  - Local JSON file storage                              │
└──────────────────────────────────────────────────────────┘
```

## Data Flow: Image to Metadata

```
1. User uploads image
   ↓
2. Upload API endpoint validates request
   - Check file size (<5MB)
   - Validate media type (JPEG, PNG, WebP, GIF)
   - Validate item description format
   ↓
3. Convert image to base64
   ↓
4. Call extractMetadata(imageBase64, itemDescription)
   ↓
5. OpenAI API processes request
   - Encodes image as data URI
   - Sends extraction prompt with:
     * Image
     * Target item description
     * Explicit extraction rules
   ↓
6. OpenAI returns JSON with 7 metadata fields
   - item_type
   - color
   - material
   - formality
   - fit
   - silhouette
   - visual_weight
   ↓
7. Parse & validate response
   ↓
8. Return metadata to client
   ↓
9. Client saves to wardrobe (optional)
```

## Extraction Prompt Strategy

The extraction prompt uses **strong grounding** to improve accuracy:

```typescript
// Explicit instructions to model:
1. Focus ONLY on the target item (ignore background, people)
2. Required fields (all 7 must be provided)
3. Concrete examples for each field
4. Valid values enumerated (item types, formality levels)
5. JSON output requirement
6. "unknown" only if truly impossible to determine
```

Key insight: Generic prompts yielded 2.3% accuracy; grounded prompts achieved 29.3% accuracy.

## Evaluation Framework

```
Ground Truth Data
    ↓
Test Harness (eval_extraction_accuracy.py)
    ↓
    ├─→ Load ground_truth.json
    ├─→ For each test case:
    │   ├─ Encode test image
    │   ├─ Call API /api/wardrobe/upload
    │   ├─ Compare extracted vs expected
    │   ├─ Check field tolerances
    │   └─ Calculate accuracy
    └─→ Generate report
        ├─ Overall pass rate
        ├─ Field-by-field accuracy
        └─ Problem cases identified
```

### Ground Truth Structure

```json
{
  "tests": [
    {
      "id": "red-tshirt-realistic",
      "image": "red-tshirt-realistic.jpg",
      "description": "red t-shirt",
      "expected": {
        "item_type": "t-shirt",
        "color": "red",
        "material": "cotton",
        "formality": "casual",
        "fit": "regular",
        "silhouette": "straight",
        "visual_weight": "light"
      },
      "tolerance": {
        "color": ["red", "light red", "dark red"],
        "material": ["cotton"]
      }
    }
  ]
}
```

## API Endpoint Design

### POST /api/wardrobe/upload

Extracts metadata from an image.

**Request:**
```json
{
  "image": "base64_encoded_image",
  "mediaType": "image/jpeg",
  "itemDescription": "red t-shirt"
}
```

**Response:**
```json
{
  "success": true,
  "metadata": {
    "item_type": "t-shirt",
    "color": "red",
    "material": "cotton",
    "formality": "casual",
    "fit": "regular",
    "silhouette": "straight",
    "visual_weight": "light"
  },
  "timestamp": "2025-05-28T12:34:56.789Z"
}
```

**Validation:**
- Image size: max 5MB
- Media type: jpeg, png, webp, gif
- Description: 1-80 chars, alphanumeric + hyphens
- Rate limit: 20 requests per minute per IP

## File Organization

**Core Application:**
- `src/app/` - Next.js pages and routes
- `src/lib/` - Reusable business logic
- `src/components/` - React UI components
- `src/types/` - TypeScript type definitions

**Testing & Evaluation:**
- `tests/eval_extraction_accuracy.py` - Main evaluation harness
- `tests/fixtures/` - Test data (images, ground truth)
- `__tests__/` - Unit tests

**Documentation:**
- `docs/` - All documentation
- `docs/phase-1/` - Phase 1 reference materials

**Configuration:**
- Root level: `tsconfig.json`, `next.config.js`, etc.
- Project root must contain build config files

## Key Design Decisions

1. **Grounded Prompting**: Explicit instructions improve accuracy 12x vs generic prompts
2. **Tolerance-based Testing**: Allows for subjective field variation
3. **JSON-based Ground Truth**: Easy to version control and compare
4. **Separate Evaluation Script**: Decouples testing from application code
5. **7 Metadata Fields**: Balance between specificity and extraction reliability

## Future Extensibility

Current design supports:
- Additional metadata fields (size, price, condition, etc.)
- Multiple clothing items per image
- Fine-tuned models for improved accuracy
- User feedback loop for ground truth refinement
- Integration with wardrobe database (currently local)
