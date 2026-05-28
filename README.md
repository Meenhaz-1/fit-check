# AI Wardrobe Assistant

A Next.js full-stack application that uses OpenAI Vision API (gpt-4o) to extract detailed clothing metadata from images, with automated evaluation framework for accuracy testing.

## MVP Status

**Current Focus:** Metadata extraction accuracy evaluation and ground truth verification

---

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.8+
- OpenAI API key

### Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   # Create .env.local
   OPENAI_API_KEY=sk_...your_key...
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```
   Visit http://localhost:3000

### Evaluate Accuracy

```bash
# Compare AI extraction against ground truth
python tests/eval_extraction_accuracy.py
```

Results: `tests/fixtures/evaluation_report.txt`

---

## Project Structure

```
src/
├── app/                      # Next.js app & API routes
│   ├── api/wardrobe/        # Core endpoints (detect, upload, save)
│   └── wardrobe/            # Pages
├── components/              # React components
├── lib/                     # Utility libraries
│   ├── openai.ts           # OpenAI Vision API integration
│   ├── metadata.ts         # Metadata extraction utilities
│   ├── db.ts               # Data persistence
│   ├── rateLimit.ts        # Rate limiting
│   └── apiFetch.ts         # API client
├── types/                  # TypeScript types
└── middleware.ts           # Request middleware

tests/
├── eval_extraction_accuracy.py  # Evaluation framework
└── fixtures/
    ├── images/             # 19 test clothing items
    ├── ground_truth.json   # Expected metadata values
    └── evaluation_report.txt # Latest evaluation results

docs/
├── README.md               # Documentation index
├── ARCHITECTURE.md         # Technical design
├── API.md                 # API endpoints
└── phase-1/               # Phase 1 reference docs
```

---

## Metadata Extraction

AI extracts **7 fields** from clothing images:

1. **item_type** - Clothing type (t-shirt, dress, jacket, etc.)
2. **color** - Primary visible color
3. **material** - Fabric type (cotton, silk, denim, wool, etc.)
4. **formality** - Context (casual, business casual, business, formal)
5. **fit** - Body fit (slim, regular, loose, fitted, oversized, tailored, relaxed)
6. **silhouette** - Shape (straight, tapered, fitted, oversized, A-line, flowing, structured)
7. **visual_weight** - Thickness (light, medium, heavy)

---

## Evaluation Framework

Automated testing that compares AI extraction against ground truth:

- **27 test cases** with expected metadata values
- **Tolerance-based matching** for subjective fields
- **Field-by-field accuracy** breakdown
- **Detailed reports** showing pass/fail per test

Run evaluation:
```bash
python tests/eval_extraction_accuracy.py
```

---

## Ground Truth Verification

Evaluation accuracy depends on correct ground truth data:

1. Download: `ground_truth_template.xlsx`
2. Review test images in `tests/fixtures/images/`
3. Fill in actual values for all 19 images
4. Return Excel for import to `tests/fixtures/ground_truth.json`

---

## API Endpoints

- `POST /api/wardrobe/upload` - Extract metadata from image
- `POST /api/wardrobe/detect` - Detect clothing items
- `POST /api/wardrobe/save` - Save to wardrobe
- `GET /api/health` - Health check

---

## Technologies

- **Framework:** Next.js 15, TypeScript
- **AI:** OpenAI GPT-4o Vision API
- **Styling:** Tailwind CSS
- **Testing:** Python evaluation framework
- **Database:** JSON-based (extensible)

---

## Development

```bash
# Build
npm run build

# Production
npm start

# Type check
npm run type-check

# Lint
npm run lint
```

---

## Documentation

- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** — Technical design & data flow
- **[docs/API.md](docs/API.md)** — API endpoint documentation
- **[docs/phase-1/](docs/phase-1/)** — Phase 1 development notes (reference)

---

## Configuration

Build tools require these files in project root:
- `tsconfig.json` - TypeScript
- `next.config.js` - Next.js
- `tailwind.config.ts` - Tailwind
- `postcss.config.js` - PostCSS
- `jest.config.js` - Jest

---

## Environment Variables

**Required:**
- `OPENAI_API_KEY` - OpenAI API key

**Optional:**
- `NODE_ENV` - Set to 'production' for production builds

---

## License

Internal project. All rights reserved.
