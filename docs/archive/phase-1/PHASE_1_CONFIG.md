# Phase 1 Configuration & Decisions

All decisions made during planning. Reference this while building Phase 1.

---

## Testing & Validation

| Decision | Choice |
|----------|--------|
| **Testers** | 5 people (need to recruit from friends/coworkers) |
| **Recruitment Pitch** | "I'm building an AI styling app. Want to test it with me and give feedback?" |
| **Evaluations per Tester** | 5 evaluations each (25 total) |
| **Feedback Method** | Manual conversations, audio recorded (with permission) |
| **Stopping Criteria** | Stop when last 5 evaluations repeat previous feedback (saturation) |
| **Early Stop Signal** | If outputs are obviously wrong (fundamental logic failure) |
| **Testing Method** | Remote video call, screen share (you control app, they watch) |
| **Testing Duration** | ~2 weeks (recruit, test, iterate) |

---

## Sample Wardrobe

| Decision | Choice |
|----------|--------|
| **Fixed Wardrobe** | Yes, pre-loaded 10-item sample wardrobe (all testers see same items) |
| **Item Source** | Your own closet (photograph real items you own) |
| **Items** | 3 shirts (navy, white, gray), 2 pants (navy chinos, dark jeans), 2 shoes (white sneakers, brown loafers), 2 jackets (navy blazer, gray cardigan), 1 belt (brown leather) |
| **Metadata Creation** | AI extracts from photos, you verify/correct, then save |
| **Account Setup** | One shared account/session (all 5 testers use same wardrobe) |
| **Evaluation History** | Keep all evaluations (don't clear between testers) |

---

## Test Images

| Decision | Choice |
|----------|--------|
| **Test Images Needed** | 25–30 items |
| **Source** | Real e-commerce items (Amazon, Target, fashion sites) |
| **Diversity** | Balanced difficulty (mix of obvious Buy, obvious Don't Buy, ambiguous Maybe) |
| **Collection Timing** | Prepare before testing starts (Day 1–2 of Phase 1e) |

---

## Personalization

| Decision | Choice |
|----------|--------|
| **Body Type/Skin Tone in Phase 1** | Skip (defer to Phase 2) |
| **Body Type/Tone Data Collection** | Informal (ask casually for context, don't use in recommendations) |
| **Generic Recommendations** | Yes, all Phase 1 verdicts are generic (not personalized) |

---

## Error Handling

| Decision | Choice |
|----------|--------|
| **System Errors During Testing** | Graceful degradation (show error, ask for manual input, continue) |
| **Metadata Extraction Failures** | Ask user for manual input (e.g., "Tell me the color") |
| **Clothing Detection Failures** | Ask user to clarify or provide manual description |

---

## Development Setup

| Decision | Choice |
|----------|--------|
| **IDE** | VS Code |
| **Frontend Framework** | Next.js (TypeScript) |
| **UI Library** | Tailwind + shadcn/ui |
| **Database** | SQLite (local file-based) |
| **AI API** | OpenAI (Vision for detection, GPT for verdict generation) |
| **File Storage** | Local filesystem |
| **Package Manager** | npm (recommended) |
| **Node Version** | 20 LTS (recommended, latest stable) |
| **Version Control** | Git (initialize from Phase 1a) |
| **Testing** | Unit tests as you build (Jest recommended) |
| **Environment Variables** | .env.local for OpenAI API key |
| **Cost Tracking** | Track OpenAI API costs during Phase 1 |

---

## Deployment & Access

| Decision | Choice |
|----------|--------|
| **Phase 1 Deployment** | None (local only) |
| **Tester Access** | Remote video call + screen share (you control) |
| **Multi-User Support** | Not needed for Phase 1 |

---

## Data Collection

| Decision | Choice |
|----------|--------|
| **Logging During Testing** | Minimal (verdict, tester sentiment, key feedback, metadata issues) |
| **Recording** | Audio record conversations (with permission) |
| **Transcripts** | Optional (review audio for nuance) |

---

## Phase Progression

| Decision | Choice |
|----------|--------|
| **Phase 1 Focus** | Intelligence validation only (no Phase 2 planning during Phase 1e) |
| **Sub-Phase Dependencies** | Sequential (1a → 1b → 1c → 1d → 1e, each blocks the next) |
| **Phase 1 → Phase 2 Gate** | Saturation reached + team agrees reasoning is sound + no obvious logic failures |

---

## Success Criteria (Phase 1e)

### Phase 1 Succeeds If:
- ✅ Last 5 evaluations show no new failure patterns
- ✅ Testers understand reasoning (even if they disagree with verdicts)
- ✅ No recurring contradictions (e.g., "said color matters, then ignored it")
- ✅ Testers explicitly say "I understand how it works"

### Phase 1 Fails If:
- ❌ 30%+ of evaluations generate "Confused" feedback
- ❌ Recurring contradiction patterns
- ❌ Testers say "This feels arbitrary"
- ❌ Outputs are obviously wrong

---

## Timeline

| Phase | Duration | Key Dates |
|-------|----------|-----------|
| Sub-Phase 1a: Setup | 2–3 days | Start: [fill in] |
| Sub-Phase 1b: Wardrobe Upload | 3–4 days | |
| Sub-Phase 1c: Screenshot Upload | 2–3 days | |
| Sub-Phase 1d: Recommendation Engine | 3–4 days | |
| Sub-Phase 1e: Testing & Iteration | 2 weeks | |
| **Total Phase 1** | **3–4 weeks** | End: [fill in] |

---

## Notes

- All decisions made based on Phase 1 goal: **Validate reasoning quality, not infrastructure**
- If new uncertainties arise during building, check this document and add clarifications
- Each sub-phase has specific deliverables in PHASE_1_BUILD_PLAN.md
