# PRD: AI Wardrobe Intelligence Assistant

## 1. Product Summary

An AI-powered wardrobe intelligence system that helps users make better clothing decisions by evaluating whether a clothing item will actually work for:

* their body type
* skin tone
* existing wardrobe
* personal style
* real-life contexts

The product focuses on reducing style uncertainty and preventing bad purchases rather than maximizing trendiness or generating unrealistic fashion inspiration.

The system combines:

* wardrobe memory
* outfit compatibility reasoning
* visual style analysis
* contextual styling intelligence
* real-world purchase decision support

---

# 2. Problem Statement

Users struggle to accurately predict whether clothing seen online or in-store will actually work for them in real life.

Current shopping flows are optimized around aspirational imagery:

* professionally styled models
* idealized body types
* unrealistic outfit combinations
* disconnected wardrobe contexts

This creates several user problems:

* uncertainty in purchase decisions
* inability to mentally simulate outfits
* repeated bad purchases
* low wardrobe utilization
* dependence on external validators (partners/friends)
* lack of confidence in personal styling judgment

Users are not trying to become fashion experts.

They are trying to:

* avoid looking bad
* avoid wasting money
* improve confidence
* make smarter wardrobe decisions

---

# 3. Competitive Positioning

## Current Market

The wardrobe app market has several established players, each with distinct focus areas:

| Competitor | Strength | Limitation |
|-----------|----------|-----------|
| Indyx | Wardrobe digitization + human stylists | Requires wardrobe upload first; premium pricing; women-focused |
| Whering | Social + sustainability focus | Trendy, not practical; doesn't prevent bad purchases |
| Stylebook | Detailed inventory tracking, cost-per-wear | iOS only; doesn't evaluate new items |
| Alice | Men-focused outfit recommendations | Only works with existing wardrobe; no purchase validation |
| Dressly | Color tone + body shape analysis | Generic recommendations; not wardrobe-aware |

## Your Differentiation: 5 Critical Gaps You Own

### 1. **Evaluate Before Purchase**
All competitors assume you upload your wardrobe first, then plan outfits. None evaluate items you're *considering* buying from external sources (Instagram, e-commerce, in-store).

**Your advantage:** Screenshot → instant verdict. No wardrobe required to start.

### 2. **Honest Critique, Not Encouragement**
Most apps optimize for positive feedback and outfit combinations. None position "Do not buy this" as a core feature.

**Your advantage:** Users trust your verdicts because you comfortably say "skip it."

### 3. **Body Type + Skin Tone as Primary Engine**
A few apps mention color analysis, but it's secondary. None make personalized body/tone compatibility the core reasoning system.

**Your advantage:** Structured reasoning about "Does THIS work for YOUR specific body and skin?"

### 4. **Men as Primary Market**
Only Alice targets men. The broader market is women-focused.

**Your advantage:** Men-first product, solving men's specific problem: "I don't know if this will look good on me."

### 5. **Purchase Regret Prevention**
No competitor's core mission is preventing bad purchases. Most optimize for maximizing outfit combinations or wardrobe size.

**Your advantage:** Reduce regret, not maximize consumption.

## Why You Win

You're not building a wardrobe organizer.  
You're not building an outfit generator.  
You're building a **purchase decision validator** for practical men who hate wasting money.

This is a gap no one is serving.

---

# 4. Product Vision

Build a practical, honest, wardrobe-aware AI stylist that:

* reduces style uncertainty
* prevents bad purchases
* improves wardrobe utilization
* acts as a trusted second opinion
* understands the user specifically, not generic fashion aesthetics

The system should feel:

* practical
* intelligent
* grounded
* visually aware
* critical when needed
* trustworthy

NOT:

* overly positive
* trend-obsessed
* influencer-like
* generic fashion AI

---

# 5. Core User Jobs-To-Be-Done

## Primary JTBD

"When I see a clothing item online or in-store, help me determine whether it will actually work for me and my existing wardrobe."

---

## Secondary JTBDs

### Outfit compatibility

"What in my wardrobe works best with this?"

### Purchase validation

"Should I actually buy this?"

### Try-on confidence

"Is this worth trying on?"

### Style improvement

"What would make this outfit look better?"

### Wardrobe utilization

"What clothes do I already own that I am underusing?"

---

# 6. Target Users

## Primary ICP

### Functionally Stylish Men

Characteristics:

* 25–40 years old
* urban professionals
* disposable income
* care about appearance
* not fashion experts
* moderate shopping frequency
* low-to-medium styling confidence

Common behaviors:

* sends screenshots to partner/friends
* overbuys safe basics
* hesitates during purchases
* struggles to imagine outfit combinations

## Secondary Segments

### Identity Transition Users

Examples:

* promotions
* dating again
* post-weight-loss
* entering workforce
* lifestyle changes

### High Online Shoppers

Frequent browsing and impulse purchase tendencies.

### Low-Confidence Stylers

Want to improve appearance but lack confidence.

### Wardrobe Optimizers

Prefer fewer versatile pieces over trend-heavy wardrobes.

---

# 7. Core Product Principles

## 1. Optimize for honesty, not encouragement

The system should comfortably say:

* "Do not buy this."
* "This does not suit you."
* "You already own better alternatives."

Trust comes from restraint.

---

## 2. Optimize for wardrobe integration

The value of a clothing item is:

Compatibility × frequency of use

Not trendiness.

---

## 3. Separate item quality from outfit quality

The system must independently evaluate:

* item suitability
* outfit compatibility
* purchase worthiness

Example:

* good shirt
* bad pairing
* not worth buying

---

## 4. Use structured reasoning, not generic fashion chat

The system should reason using:

* color theory
* silhouette balance
* formality alignment
* texture compatibility
* skin tone compatibility
* contextual appropriateness

---

# 8. User Flows

## Flow 1: Screenshot Evaluation (No Wardrobe)

### Step 1
User uploads:

* Instagram screenshot
* e-commerce screenshot
* Pinterest image
* advertisement

### Step 2
AI detects visible clothing items:

* shirt
* trousers
* shoes
* jacket

### Step 3
User selects target item:

* Evaluate shirt
* Evaluate trousers
* Evaluate full outfit

### Step 4
System evaluates (without wardrobe data):

* general suitability for user's body type
* skin tone compatibility
* silhouette impact
* style alignment

**Output:** Buy / Maybe / Do Not Buy + reasoning

### Step 5 (Optional)
User can add body type & skin tone for personalized verdict:

* "How does this work for YOUR body type specifically?"
* "How does this work for YOUR skin tone specifically?"

### Step 6 (Optional)
System recommends wardrobe pairings (generic if no wardrobe uploaded):

* types of items that would pair well
* style contexts where this works
* what to look for

### Step 7 (Optional)
Generate AI preview (future feature).

---

## Flow 2: Screenshot Evaluation (With Wardrobe)

Same as Flow 1, but:

**Step 6 Enhanced:** System recommends actual pieces from user's wardrobe that pair well with compatibility scores and explanations.

---

## Flow 3: In-Store Decision Support

### Step 1
User photographs clothing item.

### Step 2
AI identifies item (color, material, fit, formality, silhouette).

### Step 3
System evaluates suitability (with or without body type/skin tone data).

### Step 4
If wardrobe exists, system checks:

* existing wardrobe compatibility
* styling potential
* redundancy
* versatility

### Step 5
System outputs:

* Buy / Maybe / Do Not Buy
* best wardrobe pairings (if wardrobe exists) or style recommendations
* confidence level

---

## Flow 4: Wardrobe Upload (Progressive)

### Step 1
User chooses to add items to wardrobe.

### Step 2
User uploads:

* Single photo: one item at a time
* Batch: up to 5 items at once

### Step 3
AI automatically extracts metadata:

* color
* material
* formality
* silhouette
* fit

### Step 4
Items are saved with AI-extracted metadata.

### Step 5 (Optional, Later)
User can refine/correct metadata if desired.

---

# 9. Cold Start & Wardrobe Optional

### Without Wardrobe Uploaded

* User can evaluate any item (screenshot or in-store photo)
* System gives general verdict: "Does this work for you?"
* Pairing recommendations are **generic** (types of items, style contexts)
* Body type & skin tone are optional for personalization

### With Wardrobe Uploaded

* User evaluates new item
* System gives personalized verdict
* Pairing recommendations show **actual pieces** from wardrobe
* Body type & skin tone personalization is available

### Key Insight

**Wardrobe is not a blocker for activation.** It's a feature enhancement that improves recommendations.

---

# 10. Body Type & Skin Tone Capture

### How Users Provide This Information

**Approach: Both AI Inference + User Override**

#### Body Type
* **AI infers** from wardrobe photos user uploads
* **User can override** if AI gets it wrong
* **Lazy loaded** — captured when first evaluating an item (optional)

#### Skin Tone
* **AI infers** from wardrobe/photo data
* **User can override** if AI gets it wrong
* **Lazy loaded** — captured when first evaluating an item (optional)

### User Experience

**Without body type/skin tone:**
* System gives verdict + pairing recommendations (generic)

**User opts into personalization:**
* User adds body type & skin tone (or uploads photos for AI inference)
* System re-evaluates: "Does this work for YOUR body type and skin tone specifically?"
* Recommendations become personalized

---

# 11. Core Output Structure

## Section 1: Quick Verdict

Example:

* Buy
* Maybe
* Do Not Buy

---

## Section 2: Item Suitability

Evaluate:

* body compatibility
* skin tone compatibility
* fit risk
* silhouette impact

---

## Section 3: Screenshot Outfit Evaluation (if applicable)

Evaluate:

* does the shown outfit work?
* what specifically fails?
* what specifically works?

---

## Section 4: Best Wardrobe Pairings

Display:

* wardrobe thumbnails (if wardrobe exists)
* compatibility scores
* explanations

OR

* suggested item types to pair with
* style contexts where this works

---

## Section 5: Purchase Worthiness

Evaluate:

* versatility
* redundancy
* usage likelihood
* wardrobe integration

---

# 12. Styling Evaluation Dimensions

The system should evaluate:

| Dimension                      | Weight |
| ------------------------------ | -----: |
| Color Harmony                  |    20% |
| Silhouette Balance             |    20% |
| Formality Alignment            |    15% |
| Texture/Material Compatibility |    15% |
| Skin Tone Compatibility        |    15% |
| Versatility                    |    10% |
| Trend Relevance                |     5% |

---

# 13. Styling Frameworks

The AI should reason using:

## Color Theory

* complementary colors
* tonal dressing
* saturation balance
* temperature harmony
* contrast levels

## Silhouette Theory

* volume balance
* body proportions
* shape harmony

## Material Theory

* linen vs denim
* suede vs leather
* formal vs casual materials

## Formality Theory

* occasion alignment
* dressiness compatibility

## Skin Tone Theory

* undertones
* contrast harmony
* saturation suitability

## Contextual Theory

* climate
* occasion
* season
* city/lifestyle

---

# 14. Technical Architecture

## Frontend

* Next.js
* Tailwind
* shadcn/ui

## Backend

* Next.js API routes

## Database

* Supabase Postgres

## Storage

* Supabase Storage

## Vector Search

* pgvector

## AI Layer

* OpenAI Vision API
* OpenAI text models
* image generation APIs (future)

---

# 15. AI Architecture

## System 1: Structured Metadata

Every clothing item becomes structured data:

* color
* fit
* material
* texture
* formality
* silhouette
* visual weight

---

## System 2: Candidate Retrieval

Use:

* metadata filters
* vectors
* color rules
* formality rules
* compatibility retrieval

NOT pure vector similarity.

---

## System 3: LLM Reasoning

The LLM evaluates:

* compatibility
* balance
* visual coherence
* body impact
* wearability

---

# 16. Key Product Insight

The moat is NOT virtual try-on.

The moat is:

* practical styling intelligence
* wardrobe-aware reasoning
* trustworthy critique
* reducing purchase regret

---

# 17. MVP Scope

## Included

* wardrobe upload (optional, progressive)
* screenshot upload
* in-store photo upload
* clothing detection
* target item selection
* compatibility scoring
* wardrobe recommendations (generic or wardrobe-aware)
* buy/no-buy verdicts
* body type & skin tone capture (lazy loaded, optional)

## Excluded

* perfect virtual try-on
* custom training
* social feeds
* influencer integrations
* advanced body measurements
* mobile app
* AI image generation/preview

---

# 18. Success Metrics

## Primary Metrics

### Purchase Confidence
"How confident do users feel after evaluation?"

**Measurement:** Context-dependent post-evaluation surveys

#### "Buy" Verdict Survey:
1. Is this suggestion helpful?
2. Did it help you make your decision?
3. Did it save you time and effort?

#### "Don't Buy" Verdict Survey:
1. Do you agree?
2. Did this output change your mind?
3. Did it save you time and effort?

#### "Maybe" Verdict Survey:
1. Did this help you think through the trade-offs?
2. Did the pairing suggestions help you decide?
3. Did it save you time and effort?

### Wardrobe Utilization
Measured via engagement with wardrobe feature.

**Activation Target:** X% of users add ≥10 items in first week  
**Engagement Target:** Users add 2+ items per week on average  
**Retention Target:** Users active in week 1 remain active in week 4+

---

## Secondary Metrics

* evaluation frequency
* repeat usage
* wardrobe upload completion
* pairing engagement
* saved outfit usage
* time to first verdict

---

## Notes on Metrics

**Purchase Regret Measurement:** Deferred to post-MVP. Too hard to measure in MVP phase. Will measure after understanding user behavior patterns.

**Business Model:** TBD post-MVP validation. All features free during MVP to gather unbiased feedback.

---

# 19. User Research Plan

## Pre-MVP Validation

### Reddit/Twitter Research
* Post in r/mensfashion, r/malefashion, relevant Twitter communities
* Ask: "How are you solving clothing purchase decisions now? What tech are you using?"
* **Goal:** Validate ICP and problem before building

### Success Signals
* Users actively trying to solve this problem
* Current friction with manual workarounds (asking friends, trial & error)
* Willingness to try a new tool
* Existing use of competitor apps (shows problem engagement)

### Invalidation Signals
* Radio silence (problem doesn't resonate)
* "Fashion apps feel pointless"
* Users happy with current approach

---

## MVP Validation (Post-Launch)

### Recruitment
* Manual outreach: friends, coworkers, LinkedIn, Reddit
* Target: 5–10 initial users in ICP segment

### What You're Testing
* **Core hypothesis:** Does the product actually help users make better purchase decisions?
* **User behavior:** Do they upload wardrobe? How much? Do they return?
* **Problem validation:** Is this a real problem people want solved?

### Success Criteria
* Users find the verdict helpful (survey feedback)
* Users upload wardrobe (indicates trust in system)
* Users return for repeat evaluations
* Users express confidence in their purchase decisions

---

# 20. Business Model

### MVP Phase
**All features free.** Focus on product-market fit and user feedback, not monetization.

### Post-MVP
**Monetization strategy: TBD.** Will determine based on:
* User willingness to pay
* Feature adoption patterns
* Competitor positioning
* Market demand

**Options to evaluate:**
* Freemium (free basic verdict, paid wardrobe recommendations)
* Subscription (monthly/yearly all-access)
* Affiliate (commission on purchases users make after evaluation)
* B2B (licensing to retailers)

---

# 21. Long-Term Vision

Become a personalized wardrobe intelligence layer that:

* understands the user visually
* remembers wardrobe context
* improves style decisions over time
* acts as a practical personal stylist

The long-term value is not generating attractive outfits.

The long-term value is:

* reducing uncertainty
* improving confidence
* helping users build coherent wardrobes
* making personal style easier and more intentional

---

# 22. Implementation Roadmap

## Phase 1: MVP (Weeks 1–8)
* Wardrobe upload (single + batch)
* Screenshot/in-store photo evaluation
* Clothing detection + metadata extraction
* Verdict generation (Buy/Maybe/Don't Buy)
* Generic pairing recommendations
* Post-evaluation surveys

## Phase 2: Personalization (Weeks 9–14)
* Body type & skin tone capture
* Personalized suitability evaluation
* Wardrobe-aware recommendations (if wardrobe exists)
* User feedback loop

## Phase 3: Intelligence (Weeks 15+)
* Advanced styling reasoning
* Wardrobe analytics
* Outfit planning from existing wardrobe
* Purchase regret tracking (post-MVP)
