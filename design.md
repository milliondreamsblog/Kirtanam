# Kritaman — Design System

> A spiritual YouTube platform initiative inspired by ISKCON.
> The design language is **grounded, gentle, restorative** — a quiet studio with soft light and slow breathing.

---

## 1. Tone & Voice

- Sentence case for UI copy. No SHOUTY UPPERCASE TRACKING.
- Devotee voice for spiritual surfaces (welcome banner, footer, error empty states): humble, grateful, "seva", "by the mercy of…", obeisances.
- Operator voice for admin/dashboard surfaces: short, declarative, dense.
- Never marketing-fluffy. Never decorative for the sake of decoration.

---

## 2. Color palette

Five primary tones plus one destructive accent. Use them by **role**, not vibe.

| Hex       | Name      | Role                                                                     |
| --------- | --------- | ------------------------------------------------------------------------ |
| `#3E4A45` | Pine      | Primary text, primary CTA buttons, headings, the *one* loud action      |
| `#7A8F78` | Sage      | Brand accent — links, active nav, focus rings, selected items           |
| `#B9C7B1` | Mist      | Soft accents — hover backgrounds, subtle pills, dividers, success-like  |
| `#C9B59A` | Sand      | Warm accent — highlights, badges, secondary CTA, scroll-banner gilding  |
| `#EEE6DA` | Linen     | Canvas — page background, card surfaces                                  |
| `#C97064` | Terracotta| **Destructive only** — delete buttons, error states. Never decorative.   |

### Tints & shades (Tailwind devo-* scale, rebound)

The legacy `devo-*` tokens (originally orange) are rebound to the sage family so existing UI calms automatically:

```
devo-50  = #f4f6f3   (almost-white sage)
devo-100 = #e6ebe2   (mist tint)
devo-200 = #B9C7B1   (Mist)
devo-300 = #9bae97
devo-400 = #7A8F78   (Sage — brand accent)
devo-500 = #647a63
devo-600 = #50654f
devo-700 = #3E4A45   (Pine — primary)
devo-800 = #2f3a35
devo-900 = #232b27
devo-950 = #161b18
```

### Don'ts

- Don't use red, fiery orange, or saturated yellow. The brand is calming, not energetic.
- Don't put Pine on Pine — always pair the dark with Linen or Mist for breathing room.
- Don't use Sand as a primary CTA — Sand is a warm whisper, not a shout.
- Don't introduce a new color "just this once". If a state needs a color, ask if Pine/Sage/Mist/Sand/Linen can do the job first.

---

## 3. Typography

- **Display**: Cormorant Garamond (`--font-display`) — used for spiritual surfaces, brand wordmark, royal-scroll banner, hero text.
- **Body**: Inter (`--font-inter`) — everything else.
- **Mono**: system mono — code, IDs, tokens.

### Scale (Tailwind defaults are fine — these are the conventions)

| Use                | Size              | Weight    | Notes                                    |
| ------------------ | ----------------- | --------- | ---------------------------------------- |
| Page heading       | `text-2xl/3xl`    | 600       | Display font on spiritual screens only   |
| Section heading    | `text-[14px]`     | 600       | Sentence case                            |
| Body               | `text-[13px]`     | 400/500   | Inter                                    |
| Metadata / hint    | `text-[11–12px]`  | 400       | `text-neutral-500`                       |
| Number / counts    | `tabular-nums`    | 500       | Right-aligned in tables                  |

### Line height

- Body: `leading-6` to `leading-7`.
- Spiritual long-form: `leading-[1.85]` (royal scroll, policy manual).

---

## 4. Spacing & density

Production-tool density (Linear / Stripe / Vercel), not marketing-page sprawl.

- **Card padding**: 16px (`p-4`) — never 28–32px ("rounded-[1.75rem]" was an antipattern).
- **Row height (lists/tables)**: 36–44px. Each row should feel like a row, not a card.
- **Border radius**: 6–8px (`rounded-md` / `rounded-lg`). Avoid `rounded-2xl` and above except for soft "pill" surfaces (chip badges, primary buttons).
- **Section gap**: `gap-3` to `gap-4` between siblings; `gap-px` with a divider line for table-like sections.
- **No nested cards.** A card on a card is a smell — use a divider instead.

### Toolbar / header heights

| Surface              | Height     |
| -------------------- | ---------- |
| Admin top toolbar    | `h-12`     |
| Admin sub-header     | `h-10`     |
| Modal title bar      | `h-11`     |
| Modal footer         | `h-12`     |
| List row (default)   | `h-11`     |
| List row (compact)   | `h-9`      |

---

## 5. Components

### Buttons

- **Primary**: `bg-pine text-linen` — one per screen.
- **Secondary**: `border border-neutral-200 bg-white text-neutral-700`.
- **Ghost**: text-only, `hover:bg-neutral-100`.
- **Destructive**: `bg-terracotta text-white` or border-only with hover-fill.
- **Icon button**: 28–32px square, `rounded-md`, ghost by default.

### Inputs

- Height `h-8` (32px) for inline; `h-9` (36px) for primary forms.
- `border border-neutral-200`, focus `border-neutral-400` (no glow ring — too loud).
- Background `bg-white` (never gray fill).

### Modals

- Width `max-w-md` for forms, `max-w-2xl` for content.
- Title bar `h-11` with title only — no eyebrow label.
- Footer `h-12` with right-aligned button group.
- Backdrop `bg-black/40` (not `bg-black/20`, not glassy blur).

### Lists / tables

- `divide-y divide-neutral-100` — single hairline between rows.
- Sticky header on scrolling tables — `bg-neutral-50/60` background, `text-[11px] font-medium text-neutral-500`.
- Hover state: `hover:bg-neutral-50`. Active row: 2px left accent border in Sage.

### Navbar (top, app-shell)

- Sticky, glass-panel background, `top-3` offset.
- Shrinks to compact icon-only state on scroll. Expands on hover.
- Brand mark uses Pine→Sage gradient (not orange).

### Royal scroll banner

- Wooden dowels in deep Pine (`#3E4A45`).
- Parchment in Linen with subtle Sand tint.
- Ornaments in Sand, not amber gold.
- Cormorant for body copy. Devotee voice (see Tone).

---

## 6. Patterns

### Empty states

Single line of body copy, neutral-500. No oversized illustrations, no exclamation marks. Example:

> "No accounts yet."
> "Select an account from the list."

### Loading

- Spinner only when blocking. Use `Loader2` from lucide, `text-neutral-400`, `h-4 w-4 animate-spin`.
- Skeletons preferred for list reloads; never spin a whole panel.

### Toasts / errors

- Inline first (close to the action). Toast only for cross-screen events.
- Errors surface the actual server message — never "Something went wrong".

---

## 7. Iconography

- Lucide React. No mixed icon families.
- Sizes: `h-3.5 w-3.5` (12px) inline, `h-4 w-4` (16px) buttons, `h-5 w-5` (20px) headers.
- Stroke width 2 (default). Don't override.

---

## 8. Animation

Slow, calming. Long durations beat snappy.

- Default transition: `duration-300 ease-out`.
- Hover micro-feedback: `duration-180`.
- Sticky-shrink / hover-expand: `duration-500 cubic-bezier(0.22, 1, 0.36, 1)` (ease-out-expo — peaceful, not bouncy).
- Royal scroll unfurl: 1100ms (cinematic, runs once per session).
- No `bounce`, no spring overshoots. The brand never wiggles.

---

## 9. Reserved for later

- Dark mode: Linen → very dark pine `#1c211f`, Pine text → Mist. Defer until light mode is solid.
- Illustration / iconography for empty states beyond Lucide. Defer.
- Sound. Defer (and probably never).
