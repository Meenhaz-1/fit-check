# AI Wardrobe Intelligence Assistant

An AI-powered wardrobe intelligence system that helps users make better clothing decisions.

## Project Status: Phase 1 - Intelligence Validation MVP

**Current Phase:** Sub-Phase 1a (Setup & Infrastructure)

See [PHASE_1_BUILD_PLAN.md](PHASE_1_BUILD_PLAN.md) for the full roadmap.

---

## Quick Start

### Prerequisites
- Node.js 20+ LTS
- npm
- OpenAI API key

### Setup

1. **Clone/Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local and add your OPENAI_API_KEY
   ```

3. **Create Directories**
   ```bash
   mkdir -p public/uploads data
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

Visit: http://localhost:3000

---

## Project Structure

```
├── src/
│   ├── app/              # Next.js app (pages, layouts, API routes)
│   ├── components/       # React components
│   ├── lib/              # Utilities (db, OpenAI, etc.)
│   └── types/            # TypeScript types
├── __tests__/            # Test files
├── public/uploads/       # User uploaded files (in .gitignore)
├── data/wardrobe.db      # SQLite database (in .gitignore)
├── PHASE_1_BUILD_PLAN.md # Detailed Phase 1 roadmap
├── PHASE_1_CONFIG.md     # All design decisions documented
└── README.md             # This file
```

---

## Key Technologies

- **Frontend:** Next.js 15, TypeScript, Tailwind CSS
- **Backend:** Next.js API routes
- **Database:** SQLite (local, file-based)
- **AI:** OpenAI Vision & GPT models
- **Testing:** Jest, React Testing Library

---

## Development Commands

```bash
# Start development server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Lint code
npm run lint
```

---

## Documentation

- **[PHASE_1_TEST_PLAN.md](PHASE_1_TEST_PLAN.md)** — User testing strategy and success criteria
- **[PHASE_1_BUILD_PLAN.md](PHASE_1_BUILD_PLAN.md)** — Sub-phases and development roadmap
- **[PHASE_1_CONFIG.md](PHASE_1_CONFIG.md)** — All configuration decisions documented
- **[PHASE_1A_README.md](PHASE_1A_README.md)** — Sub-Phase 1a specific instructions
- **[PRD.md](PRD.md)** — Full product requirements document

---

## Phase 1 Roadmap

| Sub-Phase | Goal | Status |
|-----------|------|--------|
| **1a** | Setup & Infrastructure | 🔄 In Progress |
| **1b** | Wardrobe Upload & Metadata | ⏳ Next |
| **1c** | Screenshot Upload & Detection | ⏳ Planned |
| **1d** | Recommendation Engine | ⏳ Planned |
| **1e** | Testing & Iteration | ⏳ Planned |

See [PHASE_1_BUILD_PLAN.md](PHASE_1_BUILD_PLAN.md) for details.

---

## Configuration

### Environment Variables

Create `.env.local` (see `.env.local.example`):

```env
OPENAI_API_KEY=sk_...your_key...
DATABASE_PATH=./data/wardrobe.db
UPLOAD_DIR=./public/uploads
NODE_ENV=development
```

### OpenAI API Setup

1. Get API key: https://platform.openai.com/api-keys
2. Add to `.env.local`
3. Verify with: `curl http://localhost:3000/api/health`

---

## Testing

### Run Tests
```bash
npm run test
```

### Expected Output
```
PASS  __tests__/setup.test.ts
  ✓ should pass (placeholder test)
  ✓ should have NODE_ENV set
```

---

## Troubleshooting

### Port 3000 in Use
```bash
npm run dev -- -p 3001
```

### OpenAI API Errors
- Verify API key is valid and active
- Check usage limits: https://platform.openai.com/account/usage/overview
- Ensure `.env.local` is properly formatted

### Database Errors
```bash
# Reset database
rm data/wardrobe.db
npm run dev  # Will reinitialize on startup
```

### Module Not Found Errors
```bash
rm -rf node_modules .next
npm install
npm run dev
```

---

## Contributing

This is a solo project in active development. All work follows [PHASE_1_BUILD_PLAN.md](PHASE_1_BUILD_PLAN.md).

---

## Next Steps

Once Sub-Phase 1a is complete:
1. Start Sub-Phase 1b: Wardrobe Upload
2. Implement wardrobe item upload flow
3. Set up metadata extraction from AI
4. Build verification UI for users

See [PHASE_1_BUILD_PLAN.md](PHASE_1_BUILD_PLAN.md) for the full plan.

---

## License

Internal project. All rights reserved.
