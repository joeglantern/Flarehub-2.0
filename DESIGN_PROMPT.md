# Flarehub — Design Prompt for Claude / AI Design Tools

> Copy everything below this line and paste it as your design prompt.

---

## THE BRIEF

Design a **multi-page marketing website** for **Flarehub** — a youth entrepreneurship platform built for young Kenyan founders. Think: Notion meets Notion's creative agency cousins, but with an African handcrafted soul. The site should feel like someone printed it, cut it out, layered it on a corkboard, added stickers and annotations, then somehow made it move.

**Vibe keywords:** editorial, textured, hand-drawn energy, zine culture, protest poster, African craft market, startup confidence, Gen Z but make it intentional — not TikTok-loud, more Behance-cool.

---

## BRAND COLORS

Use these exact hex values. Do not substitute.

### Backgrounds (warm, papery, never cold white)
| Token | Hex | Use |
|---|---|---|
| Base | `#f7f6f3` | Page background — warm off-white like aged paper |
| Surface | `#ffffff` | Cards, modals |
| Elevated | `#f0ede8` | Slightly raised areas, nav |
| Inset | `#e8e4de` | Inputs, subtle wells |

### Primary — Forest Green
| Token | Hex | Use |
|---|---|---|
| Green-50 | `#edf7f1` | Tints, backgrounds |
| Green-100 | `#d0ecdb` | Subtle fills |
| Green-500 | `#1d6f42` | **Primary brand color** — CTAs, headlines, badges |
| Green-600 | `#185e38` | Hover states |
| Green-700 | `#12472b` | Dark accents |
| Green-900 | `#0a2e1c` | Very dark, use sparingly |

### Accent — Terracotta / Burnt Orange
| Token | Hex | Use |
|---|---|---|
| Terra-50 | `#fdf2ed` | Warm tints |
| Terra-100 | `#f9ddd1` | Soft fills |
| Terra-500 | `#c4522a` | **Accent color** — highlights, underlines, sticker pops |
| Terra-600 | `#a8441f` | Deeper accent |

### Text
| Token | Hex | Use |
|---|---|---|
| Primary | `#1a1916` | Body, headlines — warm near-black |
| Secondary | `#6b6560` | Subtext |
| Muted | `#a39e98` | Placeholders, captions |

### Borders & States
| Use | Hex |
|---|---|
| Default border | `#e2ddd7` |
| Strong border | `#c8c2ba` |
| Success | `#1d6f42` |
| Warning | `#b5720e` |
| Error | `#b91c1c` |

---

## TYPOGRAPHY

- **Display / Headlines:** `Bricolage Grotesque` — variable weight, tight tracking (-0.02em), use at 600–800 weight
- **Body:** `Inter` — clean, 14–16px, 1.6 line height
- **Mono / Labels:** `JetBrains Mono` — for code snippets, stat counters, badge labels

**Type rules:**
- Big headlines should feel slightly compressed and bold — not spaced out
- Mix weights aggressively: one word in 800, the next in 300
- Use `Bricolage Grotesque` italics for emphasis — like a handwritten lean
- Annotate important words with terracotta underlines drawn as squiggly SVG lines, not CSS underline

---

## PAGES TO DESIGN

### 1. Hero / Landing Page
The first thing users see. Should be **arresting** in the first 2 seconds.

**Layout concept:**
- Full-viewport hero. Background is the warm `#f7f6f3` with a **subtle dot-grid texture** (24px tile, 1px dots at 4.5% opacity)
- Large editorial headline in Bricolage Grotesque — think magazine cover size. Example: *"Build something real."* — the word "real" has a hand-drawn underline in terracotta `#c4522a`
- A **cut-out style illustration** of a young African entrepreneur — not a photo, an illustration that looks like it was drawn with a thick marker on paper, with visible grain and imperfection. Placed at an angle (rotated 2–3°), with a drop shadow as if it's a physical cutout on the page
- A floating sticky-note style badge in green `#1d6f42` that says "For Young Kenyan Founders" — slightly rotated, with a paper texture and a thin drop shadow
- Navigation bar: transparent on hero, becomes `#f0ede8` on scroll. Logo is "Flarehub" in Bricolage Grotesque 700 weight. Nav links are small, Inter 500. One CTA button: filled green `#1d6f42` with rounded corners (8px), white text
- Below the fold: a **marquee ticker** of supporter logos or stats like `"420+ Founders · 38 Mentors · 12 Active Programs · Since 2023"` — runs left to right, warm background strip, terracotta dots as separators

---

### 2. How It Works Page (or Section)

**Layout concept:**
- Section title in huge faded green text behind the content (like a watermark) — "The Process" at ~20% opacity
- Three steps displayed as **index cards** (the physical kind) pinned to a corkboard — rendered with card texture, slightly different angles, connected by a dashed hand-drawn line path
- Each card: number in Bricolage Grotesque 800 (like "01"), step name bold, short description in Inter regular, a small sketch icon (e.g., pencil for "Apply", handshake for "Get Matched", rocket for "Launch")
- Cards slide in from slightly off-screen on scroll with a spring easing — not linear

**Steps:**
1. **Apply** — Fill out your program application and tell us your idea
2. **Get Matched** — Get paired with a mentor who's done what you're trying to do
3. **Build & Launch** — Track milestones, get funding, and take your business to market

---

### 3. Programs Page

**Layout concept:**
- Header: "Active Programs" in large type, with a handwritten-style annotation arrow pointing to a counter badge showing the live number
- Program cards look like **folded brochures** — slightly 3D, paper texture, headline in green, deadline in terracotta, a "spots left" indicator as a hand-drawn progress bar (not a component bar, literally a rough rectangle fill)
- Cards use a **masonry/staggered** grid, not uniform rows — feels curated, not templated
- Hover state: card lifts (translate Y -4px, stronger shadow) and a terracotta corner fold appears (like a dog-ear on a physical page)
- Filter tabs at top: pill buttons with rough ink-stamp look — active state filled green with white text, inactive is just outlined

---

### 4. About / Mission Page

**Layout concept:**
- Full-bleed section with a **collage background** — overlapping textures: graph paper, dotted paper, torn paper edges — all in warm neutral tones
- Big stat callouts in the center: `"420"` in massive Bricolage Grotesque, label in small Inter. Each stat is on its own torn-paper scrap, rotated slightly, layered
- A "letter from the founder" section — styled literally like a typed letter. Courier/mono font, slightly off-center, with a signature image at the bottom
- Team section: portraits in **circle crops with a rough edge** (SVG clip-path that looks torn, not smooth), each on a card pinned with a thumbtack illustration
- Mission statement: one large quote in green `#1d6f42`, left-aligned, with a thick 4px terracotta left border and faint quotation marks behind the text at 6% opacity

---

### 5. Mentors Page

**Layout concept:**
- Header section with hand-lettered-style title: "The People in Your Corner"
- Mentor cards look like **ID badge lanyards** — portrait photo/illustration at top in a rounded rectangle, name and expertise below, small "Available" / "Busy" tag like a status sticky note
- Background: warm `#f0ede8`, cards arranged in a horizontal scroll on mobile, 3-column grid on desktop
- Each card has a subtle grain texture overlay
- On hover: card slightly tilts and reveals a back-of-card (CSS 3D flip) with the mentor's bio and a "Send Message" CTA

---

### 6. CTA / Footer Page

**Layout concept:**
- Full-bleed section, background `#1d6f42` (deep forest green)
- Large white headline in Bricolage Grotesque: "Your idea deserves a shot." — the word "shot" underlined with a rough terracotta SVG squiggle
- Big single CTA button: `#c4522a` terracotta fill, white text "Apply Now →", large (18px text, 56px height), rounded corners
- Below the CTA: small text in `#d0ecdb` (green-100): "Applications open. No cost to apply."
- Footer itself: dark `#0a2e1c` strip at very bottom. Logo left, nav links center (small Inter, muted), social icons right. Very minimal. One-liner copyright in `#6b6560`

---

## ILLUSTRATION STYLE GUIDE

All illustrations should feel like this:

- **Medium:** thick felt-tip marker on textured paper, scanned with slight grain
- **Palette:** Only use brand colors — green, terracotta, warm black `#1a1916`, and the warm off-white `#f7f6f3` as paper base
- **Imperfection:** Slightly rough edges, visible stroke variation (thick to thin), no perfect circles or straight lines
- **No gradients** in illustrations — flat color fills only, but with a hatching or crosshatch texture for depth
- **Subjects:** Young African people (diverse representation), lightbulbs, arrows, plants growing from coins, laptops, handshakes, maps of Kenya, megaphones, notebooks
- **Placement:** Always at an angle (2–5° rotation), never perfectly upright. Drop a subtle paper shadow behind them

---

## ANIMATION GUIDE

All animations should feel **physical and springy**, not robotic.

| Element | Animation |
|---|---|
| Page load | Staggered fade-up with spring easing — each section slides up 24px and fades in, 60ms delay between |
| Scroll reveal | Elements enter from slightly below with spring, not linear easing |
| Cards hover | `transform: translateY(-4px) rotate(-0.5deg)` + shadow deepens |
| CTA button | On hover: slight scale-up (1.03), on click: quick squish (scaleY 0.96) then bounce back |
| Marquee ticker | Constant smooth scroll, pauses on hover |
| Stats counter | On scroll-enter: numbers count up from 0 with easing |
| Page transitions | Horizontal slide between pages, like turning a magazine page — 300ms |
| Nav on scroll | Smooth background fade-in over 200ms |
| Mentor card flip | CSS 3D perspective flip, 400ms ease-in-out |

**Never use:** linear easing, opacity-only fades with no movement, instant transitions, animations over 600ms

---

## LAYOUT RULES

- **Grid:** 12-column, 24px gutter, max-width 1280px, centered
- **Sections:** Alternate background — `#f7f6f3` → `#f0ede8` → `#f7f6f3` — gives a layered page-on-page feel
- **Section dividers:** NOT horizontal rules. Instead, use a torn-paper SVG edge (irregular, wavy) between sections
- **Spacing:** Generous vertical rhythm — sections have 120–160px vertical padding on desktop, 64px on mobile
- **Mobile:** Single column, cards stack, hero image moves below headline, sticky nav collapses to hamburger (which opens a full-screen overlay, not a side drawer)

---

## WHAT TO AVOID

- ❌ Blue or purple anywhere — this isn't a SaaS template
- ❌ Perfect geometric shapes — no exact circles, no flawless rectangles
- ❌ Stock photo style illustrations — no clipart, no Getty-style people
- ❌ Dark mode — the whole palette is warm light mode
- ❌ Glassmorphism, neumorphism, or heavy gradients
- ❌ Generic startup clichés — no rockets-to-the-moon metaphors, no "We're disrupting…" energy
- ❌ Animations that are just opacity fades — everything must also move in space
- ❌ Too many fonts — only Bricolage Grotesque + Inter + JetBrains Mono

---

## ONE-LINE MOOD REFERENCE

> "A zine made by a RISD student who grew up in Nairobi, printed at a local shop, then digitized — but it loads in 200ms and has spring animations."
