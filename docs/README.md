# AI Wardrobe Assistant - Documentation

Complete documentation for the AI Wardrobe Assistant system.

## Quick Navigation

### Core Documentation
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System design, API routes, component structure
- **[API.md](./API.md)** - Complete API endpoint reference with examples
- **[PROJECT.md](./PROJECT.md)** - High-level project overview and features

### Implementation Details
See [implementation/](./implementation/) for detailed guides on specific features:
- **[DESIGN_SYSTEM.md](./implementation/DESIGN_SYSTEM.md)** - UI design tokens, colors, typography
- **[FIT_COMPATIBILITY_IMPLEMENTATION.md](./implementation/FIT_COMPATIBILITY_IMPLEMENTATION.md)** - Fit pairing system with senior stylist rules
- **[STYLE_GUIDE.md](./implementation/STYLE_GUIDE.md)** - Code style, patterns, and conventions
- **[OUTFIT_BUILDER_PROGRESS.md](./implementation/OUTFIT_BUILDER_PROGRESS.md)** - Outfit builder feature development notes

### Performance & Optimization
See [performance/](./performance/) for performance documentation:
- **[PERFORMANCE.md](./performance/PERFORMANCE.md)** - Benchmarks, optimization details, and metrics
- **[PERF_QUICK_REFERENCE.md](./performance/PERF_QUICK_REFERENCE.md)** - Quick reference for performance improvements

### Historical Documentation
See [archive/](./archive/) for historical planning and phase documentation (archived).

## Project Structure Overview

```
src/
├── app/
│   ├── api/                    (API routes)
│   └── wardrobe/              (UI pages)
├── components/                 (React components)
├── lib/                        (Core utilities)
│   ├── db.ts                  (Database layer with indexing)
│   ├── openai.ts              (AI/LLM integration)
│   ├── fit-compatibility.ts   (Fit pairing system)
│   ├── validation.ts          (Input validation)
│   ├── rateLimit.ts          (Rate limiting)
│   └── ...
├── config/
│   └── prompts.ts            (LLM prompts)
├── types/
│   └── index.ts              (TypeScript types)
├── hooks/                    (React hooks)
└── styles/                   (CSS and design)

middleware.ts                  (Next.js middleware - auth + rate limiting)
```

## Key Features

### 1. AI-Powered Detection & Analysis
- GPT-4o vision for clothing detection
- Metadata extraction (color, material, fit, formality)
- Intelligent pairing suggestions

### 2. Fit Compatibility System
- Senior stylist rules encoded as scoring matrix
- All 25 fit type combinations analyzed
- Match scores adjusted based on fit balance
- Body-type specific recommendations

### 3. Performance Optimizations
- **Database:** O(1) lookups via Map indexing (was O(n))
- **API calls:** 62.5% reduction in suggest-pairing flow
- **Code size:** 55% reduction in openai.ts
- **I/O:** Async file operations with write coalescing

### 4. Security & Rate Limiting
- Centralized middleware for authentication
- Per-route rate limiting
- Health endpoint bypass for monitoring

## Getting Started

1. **Setup:** See root [README.md](../README.md) for installation
2. **Development:** Run `npm run dev` to start dev server
3. **API Testing:** Use endpoints documented in [API.md](./API.md)
4. **Understanding Code:** Start with [ARCHITECTURE.md](./ARCHITECTURE.md)

## Common Tasks

- **Add new feature?** → Check [STYLE_GUIDE.md](./implementation/STYLE_GUIDE.md) for patterns
- **Performance question?** → See [PERFORMANCE.md](./performance/PERFORMANCE.md)
- **API endpoints?** → Refer to [API.md](./API.md)
- **Design tokens?** → See [DESIGN_SYSTEM.md](./implementation/DESIGN_SYSTEM.md)
- **Need fit compatibility info?** → Check [FIT_COMPATIBILITY_IMPLEMENTATION.md](./implementation/FIT_COMPATIBILITY_IMPLEMENTATION.md)
