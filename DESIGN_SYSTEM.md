# SentinelEval Design System

**Concept:** a cinematic control room for AI judgment. SentinelEval borrows the
dark, immersive, content-forward UI language of premium streaming interfaces and
repurposes it for LLM evaluation. Where a streaming app surfaces titles, SentinelEval
surfaces eval runs, suites, and verdicts as "content" — the most important verdict
right now is a hero billboard; everything else is browsable in horizontal rails.

The fit: an eval platform's whole job is drawing attention to the one result that
matters (a regression, a fresh guardrail block, a promotion decision) out of many.
A hero-plus-rails grammar is built exactly for spotlighting one item above a
browsable library.

## Color tokens

Every accent is a functional verdict state — never decorative.

| Token | Hex | Meaning |
|---|---|---|
| `--canvas` | `#0B0E14` | App canvas — near-black base |
| `--canvas-deep` | `#07090E` | Deepest layer (behind hero, modal scrim base) |
| `--surface-card` | `#141926` | Content cards, rails, panels |
| `--surface-raised` | `#1B2130` | Hover-raised card, popovers, menus |
| `--signal-white` | `#F5F6F8` | Primary text |
| `--signal-muted` | `#9AA0AE` | Secondary text, metadata, captions |
| `--pass-green` | `#3DDC97` | Pass / significant / safe |
| `--watch-amber` | `#F5B841` | Flagged / needs review / borderline |
| `--block-coral` | `#FF5A5F` | Fail / regression / guardrail block — **also the brand accent** (primary CTAs, active nav, wordmark) |
| `--judge-indigo` | `#6C8CFF` | AI-judge / reasoning layer (rationales, judge decision surfaces) |

`--block-coral` doubles as the signature brand color *and* the alarm color — the
brand color being the alarm color is intentional for a safety product. The
green → amber → coral spectrum governs every score everywhere. Indigo is reserved
exclusively for judge-produced content (rationales, "why" panels).

Implemented as CSS custom properties + a Tailwind v4 `@theme` block in
`src/app/globals.css`, exposed as `bg-canvas`, `text-signal-muted`, `border-pass`,
etc. Never hardcode a hex value in a component — always use the token utility.

## Typography

- **Display / hero** — Space Grotesk, 500 weight, ~28–40px. Hero verdict headlines only.
- **Body / UI** — Inter. All interface text, rail labels, forms, tables.
- **Data / mono** — JetBrains Mono. Every score, p-value, confidence interval, and
  version string (`v11`, `v12`). Measurements always read as instrument readouts.
- Scale is high-contrast: one big hero headline, a clear drop to 15px card titles,
  11–12px muted metadata. Few sizes, decisive jumps — see `--text-hero`,
  `--text-title`, `--text-body`, `--text-caption` in globals.css.

## Layout grammar

1. **Persistent top nav** — transparent over the hero, solid `--canvas` on scroll.
   Wordmark in coral, left. Features / Suites / Runs / Guardrails / Governance
   center-left. Org switcher + avatar right.
2. **Hero billboard** — top of the dashboard and each feature page. Spotlights the
   single most important current item (freshest regression-gate decision or
   guardrail block). Left-weighted text over `linear-gradient(90deg, #141B2E, #0B0E14)`,
   one-line verdict headline, supporting sentence, a solid coral primary action and
   a translucent secondary action. Always auto-features the highest-severity
   unresolved item — never a generic welcome message.
3. **Horizontal rails** — the core browse pattern. Rows of cards scrolling
   horizontally, one row per category ("Recent eval runs," "Suites needing review,"
   "Regressions this week," "Guardrail blocks today," "Awaiting promotion approval").
4. **Card** — the atom of the UI. Top border-accent in verdict color, criterion/suite
   name, a big mono score, a verdict chip. Hover lifts + scales slightly, revealing
   quick actions.
5. **Detail view** — modal-over-scrim on desktop, full-screen route on mobile.
   Verdict spectrum, per-criterion breakdown, failing-case drilldown, indigo
   judge-rationale panel.
6. **Executive dashboard** — the "browse everything" grid: a wall of verdict-colored
   tiles, one per feature, forming a reliability scorecard.

## Signature element — the verdict spectrum

Carried two ways: (a) the per-score gauge (green → amber → coral fill), (b) the
hero's framing — the featured item is always the one furthest toward "block."
This is what unifies the cinematic hero with the functional color system.

## UX principles

- One hero, one job: always answers "what needs my attention right now?"
- Browse, don't hunt: rails let a user scan status without forms/filters up front.
- Color is the fastest signal: health should read from color before any number.
- Progressive depth: rail (glance) → card (summary) → detail (full evidence + rationale).
- Copy is plain, active, sentence case, no jargon in buttons ("Review run,"
  "Promote to production," "Blocked — regression on 2 criteria").

## Motion & transitions

All durations/easings are tokens — never hand-picked per component.

| Token | Value |
|---|---|
| `--dur-fast` | 150ms |
| `--dur-base` | 250ms |
| `--dur-slow` | 400ms |
| `--ease-out` | `cubic-bezier(.2,.7,.2,1)` |
| `--ease-inout` | `cubic-bezier(.4,0,.2,1)` |

- **Hero entrance** — text fades up + settles (opacity 0→1, translateY 12px→0,
  ~450ms `--ease-out`); CTAs stagger in ~80ms after. Rails fade in on scroll-into-view.
- **Rail card hover** — scale 1.0→1.04, soft lift shadow, slight brightness increase,
  ~180ms `--ease-out`. Quick actions fade in on hover.
- **Card → detail open** — shared-element expand (`view-transition` API, feature-detected),
  scrim fades to `--canvas-deep` over ~300–350ms `--ease-inout`. Mobile: full-screen slide-up.
- **Score settle** — on run completion, each gauge animates 0→value over ~600ms
  `--ease-out`; the mono number counts up. The product's most satisfying moment.
- **Fresh guardrail block** — new block card gets a single coral pulse ring, ~500ms.
  Never a continuous blink.
- **Regression-gate decision** — approved: a green sweep across the gate bar.
  Blocked: the bar hard-stops with a ~4px coral shake, once.
- **Nav on scroll** — transparent → solid crossfades over ~200ms.
- **Route/tab changes** — content crossfades ~150ms; no heavy slides between primary routes.
- **`prefers-reduced-motion`** — every animation above falls back to an instant
  state change. Implemented globally in `src/app/globals.css` via a single
  `@media (prefers-reduced-motion: reduce)` block that zeroes durations, so
  individual components never need their own reduced-motion branch.

## Quality floor

- Responsive to mobile: rails become swipeable (native scroll-snap), hero stacks
  vertically, detail view becomes a full-screen route instead of a modal.
- Visible keyboard focus rings, coral, on every interactive element.
- WCAG-AA contrast verified for green/amber/coral text and chips against both
  `#0B0E14` and `#141926` (see `src/lib/design/contrast-check.md` if a token changes —
  re-verify before shipping a new color).
- Spend the animation budget on the hero and the score-settle moment; keep rails,
  forms, and tables quiet and fast.

## Component inventory (`src/components/ui`)

- `TopNav` — scroll-aware transparency, active-route coral underline.
- `HeroBillboard` — takes the single highest-severity item, renders headline/CTA.
- `Rail` + `RailCard` — horizontal scroll-snap row; card variants per entity type.
- `VerdictGauge` — animated 0→value arc/bar, green→amber→coral.
- `VerdictChip` — small status pill (pass/watch/block/pending).
- `DetailSheet` — modal (desktop) / full-screen route (mobile) shared-element detail.
- `ScoreNumber` — mono, tabular-nums, count-up on mount.
- `StatTile` — executive-dashboard grid cell.
