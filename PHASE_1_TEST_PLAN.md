# Phase 1 Test Plan

## Objective

Validate that the system generates styling recommendations users understand and trust.

**Core Question:** Can the system produce recommendations with clear, non-contradictory reasoning?

---

## Testing Approach

### User Group
- **5 people** from your network (friends/coworkers)
- Target: ICP males (25–40, care about appearance, moderate shopping confidence)
- Diverse body types and skin tones (to test reasoning across different body profiles)

### Evaluation Structure
- **25 total evaluations** (5 per person)
- **Manual conversations** — You observe and take notes on reactions
- No surveys or forms; focus on natural feedback

---

## Pre-Testing Setup

### Sample Wardrobe (Fixed for All Testers)
10-item capsule wardrobe:
- 3 shirts (colors: navy, white, gray)
- 2 pants (navy chinos, dark jeans)
- 2 shoes (white sneakers, brown loafers)
- 2 jackets (navy blazer, gray cardigan)
- 1 accessory (leather belt)

**Why fixed:** Ensures controlled test data; removes friction of asking testers to upload wardrobe.

### Test Images (Pre-prepared)
Prepare 25–30 item screenshots/photos to evaluate:
- Mix of good matches (should pair well with sample wardrobe)
- Mix of questionable items (should generate "Maybe" verdicts)
- Mix of poor matches (should generate "Don't Buy" verdicts)
- Vary clothing types, colors, materials

---

## Testing Protocol

### Before Testing Starts

1. **Brief tester** (5 min conversation)
   - "I'm testing an AI styling advisor. It'll evaluate clothing items and recommend what from your wardrobe pairs well."
   - "I want your honest feedback on whether the reasoning makes sense."
   - Set expectations: "This is rough, don't expect polish. Focus on: Do you understand why it recommended this?"

2. **Show the sample wardrobe** 
   - Quick visual walk-through of the 10 items
   - Tester gets context for what the system will reference

### During Testing (Per Evaluation)

1. **Upload item screenshot/photo**
2. **AI extracts metadata** (color, material, formality, fit)
3. **Tester reviews extracted metadata**
   - If wrong: Tester corrects it before evaluation
   - If right: Proceed
4. **System generates verdict + reasoning + pairings**
5. **Ask tester 3 questions:**
   - "Does this reasoning make sense to you?"
   - "Do you understand why it chose those items from your wardrobe?"
   - "Do you agree or disagree? Why?"

### Note-Taking During Conversation

Capture:
- ✅ "Understood it" — Tester grasped the reasoning
- ✅ "Makes sense" — Tester agrees (even if they'd choose differently)
- ❌ "Confused" — Tester didn't follow the logic
- ❌ "Contradictory" — Reasoning contradicted itself ("said color matters, then ignored color")
- 💭 "Disagree, but understand why" — Tester understands reasoning but thinks verdict is wrong

**Don't write full transcripts.** Just capture sentiment + key phrases.

---

## Success Criteria

### Phase 1 Succeeds If:

1. **No recurring logic failures** — Last 5 evaluations don't mention confusion or contradiction (saturation reached)
2. **Reasoning is clear** — Testers understand *why*, even if they disagree with verdicts
3. **No contradictions** — System doesn't say "color matters" then ignore color clashes
4. **Testers trust the process** — Feedback like "I understand how it works" or "The reasoning makes sense"

### Phase 1 Fails If:

- 30%+ of evaluations generate "Confused" feedback
- Recurring contradiction patterns (e.g., "It values fit, but didn't mention fit in the verdict")
- Testers explicitly say "This feels arbitrary"

---

## Iteration During Phase 1

### When You See Failures

**Example:** Tester says "Why did it recommend this? The colors clash."

**Action:**
1. Note the failure (logic issue? prompt issue? metadata issue?)
2. Review the reasoning from the system
3. Tweak the prompt or logic
4. Test the next evaluation with the fix

### Iteration is Ad-Hoc
- No formal A/B testing
- Just observe failures, adjust, continue
- Goal: Eliminate repeated failure patterns

---

## When to Stop Testing (Saturation)

**Stop Phase 1 when:** The last 5 evaluations contain no new failure patterns or feedback.

**Example:**
- Evaluations 1–10: Various feedback (unclear reasoning, color clashes not explained, etc.)
- Evaluations 11–20: Same issues repeating
- Evaluations 21–25: Same issues still repeating → **Saturation reached**

At saturation, you've learned what you can. Proceed to Phase 2 refinement.

---

## Data to Collect

### Minimal Logging (Per Evaluation)

| Field | Example |
|-------|---------|
| **Verdict** | Buy / Maybe / Don't Buy |
| **Tester Sentiment** | Understood it / Confused / Disagreed but understood |
| **Key Feedback** | "Color clashes weren't mentioned" |
| **Metadata Issues** | None / Color misidentified / Material unclear |

---

## Post-Testing Review

### After All 25 Evaluations

Schedule a review session (1–2 hours):
- List all feedback themes
- Identify patterns (what came up repeatedly?)
- Determine what needs prompt/logic fixes
- Decide: Ready for Phase 2? Or iterate more?

---

## Success Outcome

**You're ready for Phase 2 when:**
- Testers consistently understand the reasoning
- No major contradictions or logic gaps
- You feel confident in the recommendation process
- Team agrees the reasoning is sound

**You iterate more when:**
- Consistent confusion patterns
- Logic contradictions repeating
- Verdicts feel arbitrary

---

## Timeline

- **Day 1–2:** Prepare test images, reach out to testers
- **Day 3–7:** Test with 5 people (1–2 people per day)
- **Day 8:** Review feedback, identify patterns
- **Day 9–10:** Iterate on prompts/logic based on feedback
- **Day 11:** Final decision: Phase 2 or iterate more?

**Total Phase 1 duration: ~2 weeks**
