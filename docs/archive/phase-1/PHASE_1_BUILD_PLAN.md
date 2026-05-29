# Phase 1 Build Plan: Sub-Phases & Progressive Development

## Overview

Phase 1 is split into **5 sequential sub-phases**. Each sub-phase is small, testable, and enables the next phase.

**Philosophy:** Build vertically (end-to-end on one feature) before moving to the next.

---

## Sub-Phase 1a: Setup & Infrastructure

### Goal
Get a working Next.js app with OpenAI integration and local storage ready.

### What You'll Build
- [x] Next.js project setup (TypeScript, Tailwind, shadcn/ui)
- [x] SQLite database (local file-based)
- [x] File upload handler (image upload to local filesystem)
- [x] OpenAI Vision API integration (basic clothing detection)
- [x] Basic UI shell (navigation, layout)

### Deliverables
- Working Next.js dev server
- File upload working locally
- OpenAI API responding with clothing detection
- SQLite database tables created

### Success Criteria
- You can upload an image and see OpenAI detect clothing items
- No errors in console when uploading
- Database is created and tables exist

### Estimated Time
**2–3 days**

### Tech Stack
- Next.js (TypeScript)
- Tailwind + shadcn/ui
- OpenAI SDK
- SQLite3 (Node.js driver)
- Node.js file system APIs

---

## Sub-Phase 1b: Wardrobe Upload & Metadata Extraction

### Goal
Users can upload wardrobe items, AI extracts metadata, users verify/correct it.

### What You'll Build
- [x] Wardrobe upload UI
- [x] Metadata extraction (AI: color, material, formality, fit, silhouette)
- [x] Metadata verification UI (user reviews and corrects)
- [x] Store wardrobe in SQLite + local filesystem

### Deliverables
- Wardrobe page with upload button
- After upload: AI extracts metadata and shows it to user
- User can correct metadata before saving
- Wardrobe stored in SQLite + images in filesystem

### Sample Data
Create 10-item sample wardrobe:
- Navy button-up shirt (color: navy, material: cotton, formality: casual/business, fit: regular)
- White t-shirt (color: white, material: cotton, formality: casual, fit: regular)
- Gray sweatshirt (color: gray, material: cotton blend, formality: casual, fit: regular)
- Navy chinos (color: navy, material: cotton, formality: business casual, fit: regular)
- Dark jeans (color: dark blue, material: denim, formality: casual, fit: regular)
- White sneakers (color: white, material: canvas, formality: casual, fit: regular)
- Brown loafers (color: brown, material: leather, formality: business casual, fit: regular)
- Navy blazer (color: navy, material: wool, formality: business, fit: fitted)
- Gray cardigan (color: gray, material: wool, formality: business casual, fit: regular)
- Leather belt (color: brown, material: leather, formality: neutral, fit: one-size)

### Success Criteria
- Can upload 1+ wardrobe items
- Metadata is extracted and displayed
- User can edit metadata
- Wardrobe persists to SQLite
- Can view previously uploaded items

### Estimated Time
**3–4 days**

### Tech Stack
- React form components (shadcn/ui)
- OpenAI Vision for metadata extraction
- SQLite for storage
- File system for images

---

## Sub-Phase 1c: Screenshot Upload & Item Detection

### Goal
Users can upload a screenshot/item photo, system detects clothing, user selects target item.

### What You'll Build
- [x] Screenshot/item upload page
- [x] Display uploaded image
- [x] Detect clothing items in image (OpenAI Vision)
- [x] Allow user to select which item to evaluate
- [x] Display selected item with detected metadata

### Deliverables
- Upload page for screenshots/items
- AI detects all clothing in image
- User sees labeled items, clicks one to select
- Selected item metadata extracted and displayed

### Example Flow
1. User uploads Instagram screenshot of an outfit
2. AI detects: shirt, trousers, shoes
3. User clicks "Evaluate shirt"
4. System shows: "Detected as: oxford button-up, color: blue, material: cotton, formality: business"

### Success Criteria
- Can upload screenshot and detect items
- User can select one item to evaluate
- Detected metadata is shown and makes sense

### Estimated Time
**2–3 days**

### Tech Stack
- React image display + interaction
- OpenAI Vision for detection
- Basic image labeling/annotation UI

---

## Sub-Phase 1d: Recommendation Engine & Verdict Generation

### Goal
System recommends wardrobe pairings and generates Buy/Maybe/Don't Buy verdicts with reasoning.

### What You'll Build
- [x] Wardrobe matching logic (find items that pair with selected item)
- [x] Compatibility scoring (color harmony, silhouette balance, etc.)
- [x] LLM-based verdict generation (Buy/Maybe/Don't Buy + reasoning)
- [x] Recommendation display (show paired items + explanations)

### Deliverables
- Matching logic that retrieves compatible wardrobe items
- Verdict generation (what to buy, what to skip)
- Display: verdict + reasoning + recommended pairings

### Example Output
```
VERDICT: Buy

REASONING:
- Color: Navy blue complements warm skin tones well
- Formality: Sits between casual and business casual (versatile)
- Silhouette: Regular fit works with your chinos and jeans
- Material: Cotton is easy to maintain

BEST PAIRINGS:
1. Navy chinos + white sneakers (casual)
2. Dark jeans + brown loafers (smart casual)
3. Gray sweatshirt layer (winter option)
```

### Success Criteria
- Verdicts are generated (Buy/Maybe/Don't Buy)
- Reasoning is clear and references styling principles
- Pairing recommendations show actual wardrobe items
- No obvious logic contradictions

### Estimated Time
**3–4 days**

### Tech Stack
- Python or Node.js for matching logic
- OpenAI GPT for verdict generation
- Scoring algorithms (simple rule-based)

---

## Sub-Phase 1e: Testing & Iteration

### Goal
Run Phase 1 user testing with 5 people, gather feedback, iterate on logic/prompts.

### What You'll Do
- [x] Prepare test images (25–30 items)
- [x] Reach out to 5 testers
- [x] Run 25 evaluations (5 per tester)
- [x] Capture feedback during conversations
- [x] Identify failure patterns
- [x] Iterate on prompts/logic
- [x] Reach saturation (same feedback repeating)

### Testing Artifacts
- [x] Test image set (pre-prepared)
- [x] Note-taking template (feedback capture)
- [x] Iteration log (what changed, why)

### Success Criteria (From Test Plan)
- Testers understand reasoning (even if they disagree with verdicts)
- No recurring logic contradictions
- Last 5 evaluations show no new failure patterns (saturation)
- Team agrees reasoning is sound

### Estimated Time
**2 weeks** (including iteration)

### Key Activities
1. Prepare test images (Day 1–2)
2. Test with 5 people (Day 3–7, 1–2 people per day)
3. Review feedback patterns (Day 8)
4. Iterate on prompts/logic (Day 9–10)
5. Final decision: Phase 2? (Day 11)

---

## Dependency Chain

```
Sub-Phase 1a (Setup)
    ↓
Sub-Phase 1b (Wardrobe Upload)
    ↓
Sub-Phase 1c (Screenshot Upload)
    ↓
Sub-Phase 1d (Recommendation Engine)
    ↓
Sub-Phase 1e (Testing & Iteration)
    ↓
Phase 2 (If saturation reached + team agrees)
```

**Each phase depends on the previous one completing successfully.**

---

## Parallel Work (Optional)

While you're building sub-phases:
- Prepare test images for 1e (can do during 1b/1c)
- Reach out to testers (can do during 1d)
- Think about Phase 2 architecture (can do during 1e)

But **don't skip sub-phases.** Build 1a → 1b → 1c → 1d → 1e in order.

---

## Checkpoints & Decisions

### After Sub-Phase 1a
**Decision:** Ready to build wardrobe upload?
- Yes: Proceed to 1b
- No: Fix infrastructure issues

### After Sub-Phase 1b
**Decision:** Ready to build screenshot evaluation?
- Yes: Proceed to 1c
- No: Revisit metadata extraction logic

### After Sub-Phase 1c
**Decision:** Ready to build recommendation engine?
- Yes: Proceed to 1d
- No: Revisit clothing detection

### After Sub-Phase 1d
**Decision:** Ready to test with real users?
- Yes: Proceed to 1e
- No: Refine verdict logic first

### After Sub-Phase 1e
**Decision:** Logic is sound, ready for Phase 2?
- Yes: Move to Phase 2 (production infrastructure)
- No: Iterate more on logic/prompts, then test again

---

## Success Outcome

**Phase 1 is complete when:**
- All 5 sub-phases are done
- 25 evaluations completed with saturation reached
- Team agrees: reasoning is sound, testers understand it, contradictions resolved
- Ready to commit to Phase 2 (infrastructure, persistence, production)

**Estimated total Phase 1 duration: 3–4 weeks**
