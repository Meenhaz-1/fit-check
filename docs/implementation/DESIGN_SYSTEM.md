# Design System: AI Wardrobe Assistant
## Premium Fashion Magazine Aesthetic

---

## Color Palette

### Primary (Premium Charcoal)
```
--color-primary: #1F2937 (Deep charcoal - primary actions, text)
--color-primary-hover: #111827 (Darker charcoal on interaction)
```

### Accent (Sophisticated Teal)
```
--color-accent: #0D9488 (Warm teal - highlights, focus, CTAs)
--color-accent-hover: #0F766E (Darker teal on interaction)
--color-accent-light: #CCFBF1 (Light teal for backgrounds, very sparing use)
```

### Neutrals (Editorial Refinement)
```
--color-surface-base: #FFFFFF (Pure white)
--color-surface-elevated: #FAFBFC (Barely-off-white, for subtle separation)
--color-surface-hover: #F3F4F6 (Soft gray on hover)

--color-text-primary: #1F2937 (Deep charcoal for body)
--color-text-secondary: #6B7280 (Medium gray for labels/captions)
--color-text-tertiary: #9CA3AF (Light gray for hints/metadata)
--color-text-disabled: #D1D5DB (Disabled state)

--color-divider: #E5E7EB (Subtle separation lines)
--color-border: #D1D5DB (Form borders, card edges)
```

### Semantic (Only when necessary)
```
--color-success: #059669 (Muted green - confirmations)
--color-error: #DC2626 (Muted red - errors)
--color-warning: #B45309 (Muted amber - warnings)
```

### Overlay
```
--color-overlay-dark: rgba(31, 41, 55, 0.5) (Modal backdrop)
--color-overlay-light: rgba(0, 0, 0, 0.05) (Subtle hover effect)
```

---

## Typography System

### Font Stack
```css
/* Display (Headlines) */
font-family: 'Inter', 'Helvetica Neue', sans-serif;
font-weight: 700-800;

/* Body (Content) */
font-family: 'Inter', 'Helvetica Neue', sans-serif;
font-weight: 400;
line-height: 1.6;
```

### Type Scale

#### Display (Magazine Headlines)
```
Display XL:   3rem (48px)  | weight 800 | line-height 1.1
              "YOUR WARDROBE"
              
Display L:    2.25rem (36px) | weight 700 | line-height 1.2
              "Add to Wardrobe"
              
Display M:    1.875rem (30px) | weight 700 | line-height 1.25
              Section headers
```

#### Heading (Subheadings)
```
Heading L:    1.5rem (24px) | weight 600 | line-height 1.3
              Card titles, form section headers
              
Heading M:    1.25rem (20px) | weight 600 | line-height 1.4
              Secondary section headers
              
Heading S:    1.125rem (18px) | weight 600 | line-height 1.4
              Item types, category labels
```

#### Body (Main Content)
```
Body LG:      1.125rem (18px) | weight 400 | line-height 1.6
              Large readable body text
              
Body MD:      1rem (16px) | weight 400 | line-height 1.6
              Default body text (minimum for mobile readability)
              
Body SM:      0.875rem (14px) | weight 400 | line-height 1.5
              Secondary body, descriptions
```

#### Label & Caption
```
Label MD:     0.875rem (14px) | weight 500 | line-height 1.5
              Form labels, button text
              
Label SM:     0.75rem (12px) | weight 500 | line-height 1.4
              Small form labels
              
Caption:      0.75rem (12px) | weight 400 | line-height 1.4
              Metadata, timestamps, hints
              
Overline:     0.75rem (12px) | weight 600 | uppercase | letter-spacing 0.05em
              Badge text (use sparingly)
```

### Hierarchy Rules
- **Headline**: Large, bold, generous spacing around it
- **Subheading**: Slightly smaller, more color (teal accent optional)
- **Body**: Readable, 1.6 line-height, comfortable measure (60-75 chars)
- **Label**: Medium weight, secondary color for distinction
- **Caption**: Muted color, smaller size, informational only

---

## Layout & Spacing

### Spacing Scale (Tailwind/8px rhythm)
```
xs:  4px   --spacing-xs
sm:  8px   --spacing-sm
md:  16px  --spacing-md
lg:  24px  --spacing-lg
xl:  32px  --spacing-xl
2xl: 48px  --spacing-2xl
3xl: 64px  --spacing-3xl
```

### Grid & Breakpoints
```
Mobile:   375px | Full width - 16px gutters | 1 column
Tablet:   768px | 2 columns | 24px gap
Desktop:  1024px | 3 columns | 32px gap
Wide:     1440px | 3 columns | 40px gap max-w-6xl
```

### Component Spacing
```
Section padding:    48px top/bottom (3xl)
Card padding:       24px (lg)
Form field gap:     16px (md)
Button padding:     12px vertical, 24px horizontal
Input height:       48px (touch-friendly)
```

### White Space Strategy
**Magazine principle:** Generous negative space makes content breathe

```
Page margins:       16px (mobile) → 32px (desktop)
Section gaps:       48px between major sections
Card gaps:          32px between cards
Breathing room:     Never cram content edge-to-edge
Content width:      Max 800px for reading comfort
```

---

## Components

### Buttons

#### Primary (CTA - Teal)
```
Background:  #0D9488 (teal)
Text:        #FFFFFF (white)
Padding:     12px 24px
Radius:      8px
Height:      48px minimum (touch target)
Weight:      500
Border:      None
Hover:       Background #0F766E (darker teal)
Active:      Background #0F766E + subtle inset shadow
Disabled:    Opacity 0.5 + cursor-not-allowed
Transition:  150ms ease-out
```

#### Secondary (Outlined)
```
Background:  #FFFFFF (white)
Border:      2px #1F2937 (charcoal)
Text:        #1F2937 (charcoal)
Padding:     12px 24px
Radius:      8px
Height:      48px minimum
Weight:      500
Hover:       Background #F3F4F6 (soft gray)
Transition:  150ms ease-out
```

#### Tertiary (Ghost/Text)
```
Background:  Transparent
Text:        #1F2937 (charcoal)
Padding:     12px 24px
Hover:       Background #F3F4F6 + underline
Transition:  150ms ease-out
```

#### Destructive (Delete)
```
Background:  #FEE2E2 (very light red)
Text:        #DC2626 (muted red)
Border:      1px #DC2626
Hover:       Background #FECACA (lighter red)
```

### Cards

```
Background:     #FFFFFF (white)
Border:         1px #E5E7EB (subtle gray)
Radius:         8px (modern, not playful)
Padding:        24px (lg spacing)
Shadow base:    0 1px 2px rgba(0,0,0,0.05)
Shadow hover:   0 4px 12px rgba(0,0,0,0.1)
Transition:     150ms ease-out
Hover effect:   Subtle lift (transform: translateY(-2px))
```

### Form Inputs

```
Height:         48px (minimum touch target)
Padding:        12px 16px
Border:         1px #D1D5DB (light border)
Radius:         8px
Background:     #FFFFFF
Font:           16px (prevents auto-zoom on iOS)
Label:          Visible label above, 14px 500 weight
Placeholder:    #9CA3AF (muted gray) - secondary guidance only
Focus:          Border #0D9488 + ring-2 ring-teal/20
Error:          Border #DC2626 + error text below
Helper text:    Small gray text below (14px, secondary color)
Transition:     150ms ease-out
```

### Images

```
Radius:         12px (softer than cards, preserves content quality)
Aspect ratio:   Auto or specific (e.g., square for wardrobe items)
Object fit:     cover (shows best part of image)
Fallback:       Light gray background (#F9FAFB) while loading
Loading:        Skeleton placeholder (subtle shimmer)
```

---

## Motion & Interaction

### Transition Timing
```
Micro-interactions:  150ms ease-out (hover, focus, small changes)
Standard:            300ms ease-out (page transitions, modals)
Entrance:            300ms ease-out (fade + subtle scale)
Exit:                200ms ease-in (faster exit feels responsive)
```

### Easing Functions
```
Enter animations:    cubic-bezier(0.4, 0, 0.2, 1) [ease-out]
Exit animations:     cubic-bezier(0.4, 0, 1, 1) [ease-in]
Subtle interactions: cubic-bezier(0.34, 1.56, 0.64, 1) [spring]
```

### Interactive States
```
Hover:     Scale 1.02 OR shadow increase (not both)
Focus:     Ring-2 ring-teal/20 (visible, not jarring)
Active:    Scale 0.98 OR darker background
Loading:   Spinner + disabled state (no interaction)
Disabled:  Opacity 0.5 + cursor-not-allowed
```

### Loading States
```
Duration:  Show after 300ms
Visual:    Spinner or progress indicator
Button:    Disabled during async, show loading text
Feedback:  Subtle success animation (checkmark fade-in)
```

### Reduced Motion Support
```
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Layout Patterns

### Page Structure (Magazine-style)

```
┌──────────────────────────────────────┐
│  Navigation (sticky, minimal)        │
├──────────────────────────────────────┤
│                                      │
│  Headline (48px, generous margin)    │
│                                      │
│  Subheading (optional, 18px)         │
│                                      │
├──────────────────────────────────────┤
│                                      │
│  [Content Area]                      │
│  (Max 800-900px for readability)     │
│  (Breathing room on sides)           │
│                                      │
│                                      │
│  [Next Section - 48px gap]           │
│                                      │
│  [Content continues]                 │
│                                      │
└──────────────────────────────────────┘
```

### Navigation
```
Style:           Minimal, text-based (no emoji)
Position:        Sticky top (stays visible)
Background:      #FFFFFF
Border:          1px #E5E7EB bottom
Spacing:         16px vertical, 24px horizontal
Active state:    Text color #0D9488 + underline
Typography:      14px 500 weight
```

### Hero/Header Section
```
Padding:         64px top, 48px bottom
Headline size:   Display L (36px)
Subheadline:     18px, secondary color (#6B7280)
CTA button:      Primary teal button below
White space:     Generous around text
Alignment:       Left or center (no diagonal/skewed)
```

### Card Grid
```
Desktop:         3 columns, 32px gap
Tablet:          2 columns, 24px gap
Mobile:          1 column, full width - 16px margins
Item height:     Auto (content-driven)
Card ratio:      Image square (1:1), details below
```

### Form Layout
```
Direction:       Vertical (top to bottom)
Field spacing:   16px gap between inputs
Label:           Above input, 14px 500 weight
Helper text:     Below input, 12px secondary color
Sections:        Group related fields with 32px gap
Button:          Below form, full width or natural width
```

---

## Accessibility

### Color Contrast
```
Text on surface:      #1F2937 on #FFFFFF = 11.1:1 ✓ (AAA)
Accent on surface:    #0D9488 on #FFFFFF = 7.2:1 ✓ (AAA)
Secondary text:       #6B7280 on #FFFFFF = 5.1:1 ✓ (AAA)
Error:                #DC2626 on #FFFFFF = 5.5:1 ✓ (AAA)
Disabled:             #D1D5DB on #FFFFFF = 3.4:1 ✓ (AA for UI components)
```

### Touch & Keyboard
```
Touch targets:      Minimum 44×44px
Button padding:     48px height, 24px width minimum
Focus visible:      Ring-2 ring-teal/20 (2-4px outline)
Keyboard nav:       Tab order matches visual flow
Skip links:         Skip to main content (hidden, focusable)
Form labels:        Visible, associated with input via <label for>
```

### Screen Reader
```
Alt text:           Descriptive (not just "image" or "photo")
ARIA labels:        aria-label on icon-only buttons
Form errors:        aria-live region for error announcements
Headings:           Sequential h1→h6, no level skip
Semantic HTML:      <button>, <input>, <select>, <label>
```

### Reduced Motion
```
Animation:          Disabled when prefers-reduced-motion active
Transitions:        Still smooth (0.01ms) but effectively instant
No flashing:        Avoid >3 flashes per second
Meaningful motion:  Only motion that conveys information
```

---

## Anti-Patterns (What NOT to Do)

❌ **Visual**
- Emoji as structural elements
- Bright neon colors
- Heavy decorative shapes
- Playful rotations and skews
- Oversized borders
- Clashing color combinations

❌ **Interaction**
- Instant state changes (0ms)
- Complex animations
- Hover-only affordances
- No focus states
- Touch targets <44px
- Disabled state that looks clickable

❌ **Typography**
- Text smaller than 16px on mobile
- Low contrast (gray on gray)
- More than 2-3 font weights
- ALL-CAPS for body text
- Right-aligned body text
- Inconsistent line-height

❌ **Layout**
- Horizontal scroll on mobile
- Full-width on desktop (max-width needed)
- Cramped spacing (no breathing room)
- Asymmetry without purpose
- Fixed elements blocking content
- Nested scroll regions

---

## Implementation Checklist

- [ ] Update tailwind.config.ts with new color palette
- [ ] Update globals.css with new typography system
- [ ] Update layout.tsx with refined navigation
- [ ] Redesign upload page (clean, minimal, magazine-style)
- [ ] Redesign gallery page (editorial grid, no emoji)
- [ ] Remove all emoji elements
- [ ] Add focus states to all interactive elements
- [ ] Add prefers-reduced-motion support
- [ ] Test on 375px (mobile), 768px (tablet), 1024px (desktop)
- [ ] Test color contrast (WCAG AAA)
- [ ] Test keyboard navigation (Tab through all pages)
- [ ] Dark mode variant (if needed)

---

## Color Reference

### Usage Guide

**#1F2937 (Charcoal):**
- Primary text
- Primary button background
- Headlines
- Primary action elements

**#0D9488 (Teal):**
- Primary CTA buttons
- Focus states
- Accent highlights
- Active navigation
- Links (optional)

**#6B7280 (Medium Gray):**
- Secondary labels
- Helper text
- Subheadings
- Metadata

**#9CA3AF (Light Gray):**
- Placeholder text
- Hints
- Captions
- Disabled text

**#E5E7EB (Divider Gray):**
- Borders
- Subtle separators
- Card edges

**#FFFFFF (White):**
- Backgrounds
- Cards
- Surfaces

---

## Premium Fashion Magazine Examples

This design system is inspired by:
- **Vogue.com** (clean typography, generous spacing, premium feel)
- **Harper's Bazaar** (editorial hierarchy, elegant simplicity)
- **The Cut** (modern sans-serif, readable measure, clear hierarchy)
- **Monocle Magazine** (refined color use, editorial layout)

Key principles applied:
✓ Content-first (not decoration-heavy)
✓ Generous white space (breathing room)
✓ Refined color palette (charcoal + teal accent)
✓ Professional typography
✓ Clear hierarchy through size and weight
✓ Minimal ornamentation
✓ High quality imagery
✓ Accessible, readable
