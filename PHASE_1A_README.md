# Phase 1a: Setup & Infrastructure

## Goal
Get a working Next.js app with OpenAI integration and local storage ready.

## What This Phase Delivers

- ✅ Working Next.js dev server
- ✅ File upload handler (images to local filesystem)
- ✅ OpenAI Vision API integration (clothing detection)
- ✅ SQLite database setup and initialized
- ✅ Basic UI shell with navigation and layout
- ✅ Environment variables configured
- ✅ Testing setup (Jest) ready
- ✅ Git initialized with initial commit

## Project Structure (After Phase 1a)

```
ai-wardrobe-assistant/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout with navigation
│   │   ├── page.tsx            # Home page
│   │   └── globals.css         # Tailwind styles
│   ├── components/
│   │   ├── Navigation.tsx       # Top nav
│   │   └── Layout.tsx           # Page wrapper
│   ├── lib/
│   │   ├── db.ts              # SQLite setup
│   │   └── openai.ts          # OpenAI client
│   ├── api/
│   │   └── health/            # Health check endpoint
│   └── types/
│       └── index.ts           # TypeScript types
├── public/
│   └── uploads/               # Image upload directory
├── data/
│   └── wardrobe.db            # SQLite database file
├── __tests__/
│   └── setup.test.ts          # Example test
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
├── jest.config.js
├── .env.local                 # (not in git, create from .env.local.example)
├── .gitignore
└── README.md
```

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
```bash
cp .env.local.example .env.local
```

Then edit `.env.local` and add:
```
OPENAI_API_KEY=your_actual_api_key_here
```

Get your API key from: https://platform.openai.com/api-keys

### 3. Create Directories
```bash
mkdir -p public/uploads
mkdir -p data
```

### 4. Initialize Database
```bash
npm run db:init
```

### 5. Start Development Server
```bash
npm run dev
```

Visit: http://localhost:3000

## Key Files & What They Do

### `src/lib/db.ts`
- SQLite database connection
- Create tables on startup
- Wardrobe and evaluation schemas

### `src/lib/openai.ts`
- OpenAI Vision API setup
- Clothing detection function
- Error handling

### `src/components/Layout.tsx`
- Page wrapper with navigation
- Consistent styling across pages

### `src/app/api/health/route.ts`
- Simple health check endpoint
- Test OpenAI connectivity
- Test database connectivity

## Testing Phase 1a Success

### ✅ Phase 1a Succeeds When:

1. **Dev server starts without errors**
   ```bash
   npm run dev
   # Should see: ▲ Next.js 15.x.x
   ```

2. **You can visit http://localhost:3000**
   - Page loads
   - Navigation is visible
   - No console errors

3. **Health check endpoint responds**
   ```bash
   curl http://localhost:3000/api/health
   # Should return: {"status": "ok"}
   ```

4. **Database is initialized**
   - `data/wardrobe.db` file exists
   - Tables are created (wardrobe_items, evaluations)

5. **Environment variables are loaded**
   - No "OPENAI_API_KEY is undefined" errors
   - No "DATABASE_PATH is undefined" errors

6. **Tests run without errors**
   ```bash
   npm run test
   # Should show passing tests
   ```

7. **Git is initialized**
   ```bash
   git log
   # Should show initial commit
   ```

## Next Phase

Once Phase 1a is complete and all success criteria are met, move to **Sub-Phase 1b: Wardrobe Upload & Metadata Extraction**.

See `PHASE_1_BUILD_PLAN.md` for the roadmap.

## Troubleshooting

### Port 3000 Already in Use
```bash
npm run dev -- -p 3001
# Runs on port 3001 instead
```

### OpenAI API Errors
- Check `.env.local` has valid `OPENAI_API_KEY`
- Verify API key is active: https://platform.openai.com/api-keys
- Check API usage/limits: https://platform.openai.com/account/usage/overview

### Database Errors
- Delete `data/wardrobe.db` and run `npm run db:init` again
- Check that `data/` directory exists

### Build Errors
- Delete `node_modules/` and `.next/`
- Run `npm install` again
- Run `npm run build` to verify

## Notes

- Phase 1a is **infrastructure only** — no user-facing features yet
- Focus on getting the foundation solid before Phase 1b
- Keep this simple and lean — complexity comes later
- Use this README as reference while building
