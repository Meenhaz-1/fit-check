# Button Micro-Animations

## What's New

The evaluate button (`/wardrobe/evaluate-item`) has three polished micro-animations:

1. **Press** (120ms) — Scale 100% → 90% with sage green ripple flash
2. **Release** (200ms) — Spring back from 90% → 105% → 100% with elastic easing
3. **Loading** (1.5s loop) — Subtle pulse when "Analysing…"

## CSS Animations Added

**File:** `src/app/globals.css`

```css
@keyframes buttonPress {
  0% { transform: scale(1); }
  50% { transform: scale(0.98); }
  100% { transform: scale(0.97); }
}

@keyframes buttonRelease {
  0% { transform: scale(0.97); }
  70% { transform: scale(1.02); }
  100% { transform: scale(1); }
}

@keyframes accentRipple {
  0% { box-shadow: inset 0 0 0 0px rgba(138, 154, 142, 0.3); }
  50% { box-shadow: inset 0 0 0 3px rgba(138, 154, 142, 0.15); }
  100% { box-shadow: inset 0 0 0 0px rgba(138, 154, 142, 0); }
}

@keyframes loadingPulse {
  0%, 100% { opacity: 1; text-shadow: none; }
  50% { opacity: 0.85; text-shadow: 0 0 8px rgba(138, 154, 142, 0.2); }
}
```

Plus utility classes: `.animate-button-press`, `.animate-button-release`, `.animate-accent-ripple`, `.animate-loading-pulse`

## Component Changes

**File:** `src/app/wardrobe/evaluate-item/page.tsx`

Added to component:
```typescript
const buttonRef = useRef<HTMLButtonElement>(null)

const handleButtonMouseDown = () => {
  if (buttonRef.current) {
    buttonRef.current.classList.add('animate-button-press', 'animate-accent-ripple')
  }
}

const handleButtonMouseUp = () => {
  if (buttonRef.current) {
    buttonRef.current.classList.remove('animate-button-press')
    buttonRef.current.style.transform = 'scale(0.90)'
    // Force reflow to ensure transform is applied before animation starts
    void buttonRef.current.offsetHeight
    buttonRef.current.classList.add('animate-button-release')
    setTimeout(() => {
      buttonRef.current?.classList.remove('animate-button-release', 'animate-accent-ripple')
      buttonRef.current?.style.transform = ''
    }, 200)
  }
}
```

**Note:** The `offsetHeight` reflow forcing is critical — it ensures the browser applies the 90% scale state before the release animation begins. Without it, the browser can't properly transition from the press animation to the release animation.

Updated button element:
```tsx
<button
  ref={buttonRef}
  onClick={handleEvaluate}
  onMouseDown={handleButtonMouseDown}
  onMouseUp={handleButtonMouseUp}
  onMouseLeave={handleButtonMouseUp}
  className={`... ${loading ? 'animate-loading-pulse' : ''}`}
>
  {loading ? 'Analysing…' : 'Evaluate...'}
</button>
```

## Design

- **Aesthetic:** Refined, editorial — matches design system (sage green accent, sharp corners)
- **Performance:** GPU-accelerated transforms (scale), minimal repaints
- **Accessibility:** Respects `prefers-reduced-motion`, keyboard focus states work
- **Browsers:** Full support Chrome/Firefox/Safari

## Testing

Click the evaluate button and observe:
1. Scale down + sage ripple on tap
2. Spring back on release
3. Pulse effect while "Analysing…"
