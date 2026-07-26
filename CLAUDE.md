# Portfolio — Mehrun-Nisa Raja

UX research & interaction design portfolio. Static site: a Pentagram-style work
index on the home page, Cartelle-style cinematic case studies underneath.

## Commands

```bash
npm run dev        # dev server on :4321
npm run build      # static build to dist/
npm run preview    # serve the build
npm run check      # astro type/content check

# Full-page or scrolled screenshots (CDP driver, no extra deps)
node scripts/shot.mjs <outDir> home=http://localhost:4321/
node scripts/shot.mjs <outDir> 'cs=http://localhost:4321/work/d-gam@2000'   # @<px> = scroll offset
CLICK='[data-zoom]' node scripts/shot.mjs <outDir> lb=http://localhost:4321/    # click before capture

# Regenerate the resume PDF after editing the HTML
node scripts/pdf.mjs resume/Mehrun-Nisa-Raja-Resume-EA-UX.html public/Mehrun-Nisa-Raja-Resume-EA-UX.pdf
```

## Stack

| Piece | Choice | Why |
|---|---|---|
| Framework | Astro 5, static output | Zero JS by default; content collections for case studies |
| Styling | Tailwind 4 via `@tailwindcss/vite` | CSS-first `@theme` tokens in `src/styles/global.css` — no `tailwind.config.js` |
| Content | MDX + content collections | Case studies are prose + components, not inline HTML |
| Images | `astro:assets` (sharp) | Auto AVIF/WebP, `srcset`, lazy |
| Motion | CSS `sticky` + `IntersectionObserver` | No GSAP, no scroll library |
| Deploy | Vercel (static) | No env vars or secrets needed |

`.npmrc` pins the public npm registry. Without it, the global `~/.npmrc`


## Layout

```
src/
  assets/
    dgam/      13 images   — D-GAM case study
    lineup/    19 images   — Line Up case study
    venues/     4 logos    — caadfutures, hci, caadria, ahfe
  components/
    Nav, Footer                    — Nav inverts over any [data-dark-stage]
    WorkIndexRow, PaperRow         — home index
    CaseHero, MetricPanel, NextProject, StepTracker, StickyStage
    Figure, Quote, StatGrid, NoteBoard, CardGrid, ScreenGallery
    DataTable, ComparisonTable, Lightbox
  content/projects/  d-gam.mdx, line-up.mdx
  data/papers.json
  layouts/Base.astro               — head, fonts, inline reveal script
  pages/
    index.astro                    — home; CSS-only filter lives in its <style>
    work/[...slug].astro           — case study route
  styles/global.css                — tokens + base + utilities
public/media/                      — 3 videos
public/*.pdf                       — resumes; the footer links the EA one
resume/                            — resume source (HTML, print-first)
scripts/shot.mjs                   — CDP screenshot driver
scripts/pdf.mjs                    — HTML -> PDF via CDP printToPDF
```

## Design tokens

Defined in `@theme` in `src/styles/global.css`. Use the Tailwind classes
(`text-ink`, `bg-void`, `font-display`), not raw hex.

```
ink   #16150F   paper #FAF9F7   graphite #1C1C1C   void #0B0B0C
blush #F4D9DC   rose  #E8B4B8   mute    #8A8785    rule #E6E3DD   bone #F2F0EE
```

Four type voices:
- `font-display` — **Instrument Serif**. All large display type: hero, `h2`,
  project titles, metric numerals. Ships **one weight (400)** plus italic, so
  `font-light` on display text resolves to 400 — weight is not a lever here.
- `font-serif-text` — **Newsreader**. Serif at *text* sizes only: paper titles,
  pull quotes, the about lede, the credentials name. Instrument Serif is a display
  face and goes spindly below ~28px, so do not use `font-display` there.
- `font-body` — Mulish
- `font-mono` — IBM Plex Mono, used for **every** label via the `label` utility

Blush is punctuation, not personality — a highlighter swipe via `mark-swipe`.

## Conventions

- **No comments in markup** unless they explain a non-obvious constraint.
- Inline styles only where a value is genuinely dynamic (e.g. monogram offsets).
- `label` / `mark-blush` / `rule-y` / `reveal` are custom utilities in `global.css`.
- Case study prose stays capped at **1000px**. This is the guardrail that keeps
  the cinematic treatment from swallowing research findings.
- Images use `object-contain` on a tinted panel, not `object-cover`. The two hero
  assets are 1600×963 and 2760×2800 — cropping to a shared aspect cuts artwork.

### Research content is markup, not screenshots

The audit tables and finding sets were raster captures. They are now `DataTable`,
`ComparisonTable`, `NoteBoard` and `CardGrid` fed from `src/data/*.json`. Do not
reintroduce screenshots of tables or text: the originals carried baked-in
spellcheck squiggles, inverted column proportions, run-together labels and no
text selection, and none of that is fixable in CSS.

`s2-phases.png` was an image of the four **gap boxes** mislabelled as the phase
process — it is now unreferenced. Check what an asset actually depicts before
captioning it from its filename.

Sets of parallel findings use `CardGrid`, never full-width bold-lead paragraphs:
at the 1000px measure those run too wide to scan and hide the parallel structure.
The gaps use `tinted`, which carries over the original coloured-box language;
tints are decorative, with the eyebrow label carrying identity.

### Two settled design decisions

**Home hero** keeps the original sentence verbatim — "I'm Mehrun-Nisa, a UX
researcher & interaction designer who studies why people engage — then designs so
they do." Do not shorten or rewrite it; that was tried and rejected. What changed
is the setting: Instrument Serif at `text-display`, the name marked with
`mark-swipe`, and `engage` in italic. Two emphases, two *different* devices — the
original used the same blush block twice, which flattened the hierarchy. Below it,
one hairline rule carries the name plus credentials.

`mark-swipe` positions its band with `--swipe-top` (measured from the top of the
line box) and `--swipe-h`. **Both are font-specific.** The defaults are tuned for
Instrument Serif; with Newsreader the band needs roughly `--swipe-top: 0.5em`, and
an untuned value lands under the glyphs rather than through them.

**Section index** (`StepTracker`) is a hairline spine in the left gutter with
always-visible mono labels and past / active / upcoming states. Labels are *not*
revealed on hover — a pill appearing over the prose was the problem with the
first version. It renders in **two stages**, because the gutter is only
`(viewport − 1000) / 2`: from **1180px** the dots alone appear (section names come
through `title`/`aria-label`), and from **1440px** the labels fit. It was briefly
gated at 1440px only, which hid the table of contents entirely on any narrower
window — i.e. most of them. It also fades out when no prose is beside it.

## Gotchas that already cost time

- **Don't set `image.layout` or `image.responsiveStyles` in `astro.config.mjs`.**
  Astro injects `object-fit: cover`, which silently overrides `object-contain`.
- **Reveal animations must never gate content.** The hidden state is scoped to
  `.js` (set by an inline script in `Base.astro` before first paint). Without JS,
  content is simply visible. Do not move `opacity: 0` onto `.reveal` directly.
- **The reveal script is deliberately `is:inline`.** As a bundled module it did
  not run reliably, and it needs to execute before paint.
- **Venue logos are colour, on a light background.** `grayscale` + low opacity
  turns CAADRIA's orange into near-white. Keep them legible.
- **Headers/heroes are not stretched full-bleed.** The hero videos are 830×720
  and 500×500. Media sits at native aspect inside a dark stage.
- **Never build a Tailwind class name by runtime interpolation.** The scanner
  reads files as text, so `` `!${'text-[#8f3c41]'}` `` emits nothing — the literal
  `!text-[#8f3c41]` never appears in the source. A static string in a JS array *is*
  found (it appears verbatim); a concatenated one is not. Use an inline `style` for
  dynamic colour.
- **Tailwind does not pick up a brand-new directory under `src/` until the dev
  server restarts.** Symptom: none of that file's utilities exist, so layout
  collapses and flex gaps vanish. Restart rather than debugging the markup.
- **The committed old HTML is the authority on which asset is current — not the
  `uploads/` filenames and not the `.state.json` slots.** The three user flows are
  plain `<img src="./uploads/…">` in `Line Up.dc.html`; the `lu-flow*` slots in
  `.image-slots.state.json` were editor *downscales* (177px and 255px wide, hence
  blurry), and `lu-flow3` at 1200×736 is a stale slot that was never shipped.
  `uploads/UF1.png` looks like an ideal 9896px Flow 1 and matches the caption
  wording, but it is referenced nowhere — every apparent "UF1" hit is base64 noise.
  Check `git show main:<file>` before swapping an asset.
- **Check media counts per section against the old HTML, not just the prose.** The
  sentence-level audit passed at 93.9% while section 03 of D-GAM was still missing
  **18 screens** — 10 V1 prototype frames and 8 redesign mockups — because a text
  diff cannot see a dropped image. `git show main:"Engagement Study.dc.html"` and
  count the `<img>`/`<image-slot>` per heading.
- **Check corner alpha before styling an image.** `ScreenGallery` takes
  `shape="alpha" | "rect"` because the two D-GAM sets differ: the V1 screens have
  **transparent rounded corners**, so a background fills them with a white square, a
  ring traces a rectangle around nothing, and a clip radius fights the baked one —
  they need `filter: drop-shadow` only. The redesign mockups are **opaque with black
  corners** and need the clip to look like devices. Sample the top-left pixel rather
  than guessing.
- **Proportional corner radius uses the elliptical form.** `rounded-[7.5%/3.6%]`
  keeps a circular corner at any render width, because the x and y percentages are
  set inversely to the aspect ratio. A fixed px radius mismatches once the grid
  reflows.
- **`ScreenGallery` is not bled and not staggered.** Bleeding it ran the caption
  under the section-index rail; staggering alternate items made the rows ragged.
  Pick a column count that divides the item count (10 → 5, 8 → 4) so rows are even.
- **Never render a diagram above its native width.** Low-resolution drawio exports
  go unreadable when stretched to the 1000px column. `Figure` takes `maxWidth`;
  the three flows are capped at 459 / 377 / 460px.
- `sips --cropOffset` is silently ignored on this machine — it crops centred.
  Use `scripts/shot.mjs` with an `@<px>` scroll offset instead.
- Headless Chrome does not fire `IntersectionObserver` under
  `--virtual-time-budget`; `shot.mjs` force-adds `.is-visible` before capturing.

## Content facts worth surfacing

The whole point of the redesign is that these were buried inside the case
studies. Keep them visible.

- 4 peer-reviewed papers: **CAAD Futures 2025, HCII 2025, CAADRIA 2025, AHFE 2026**
  (CAADRIA appears on the site but not on the resume — unreconciled)
- **SUS 87.14**, Grade B, against a 68 industry benchmark (Line Up)
- 37 tools audited → 17 analysed in depth (D-GAM)
- 76 data points affinity-mapped; 4 clusters (Line Up)
- 4 schemas, 4 scenarios (D-GAM); 12 wireframes, 3 flows, 8 components (Line Up)
- Two n=7 studies: a D-GAM focus group and a Line Up unmoderated usability test

## Privacy rules — non-negotiable

This repo is public. Research participants must stay anonymous.

- Refer to participants as **P1–P7 only**. Never real names.
- `uploads/Surveyresponses.png` and `uploads/redditFindig.png` are the **old**
  raster boards and leak 5 real first names and ~18 Reddit usernames. They are
  being replaced by data-driven components. Do not re-introduce them.
- Reddit findings keep `r/SurreyBC` provenance but drop usernames.
- `focus-group-blurred.png` is correctly blurred and consented — safe to use.

## Migration state

Old site: `index.html`, `Engagement Study.dc.html`, `Line Up.dc.html`, plus
`support.js` (the `x-dc` runtime) and `image-slot.js` / `video-slot.js`. These are
the **content source** for the migration and are still present. Nothing has been
deleted.

Recovery point: `git tag pre-redesign` (`54ba003`).

| Phase | State |
|---|---|
| 0 — asset rescue + scaffold | Done. Media extracted to `src/assets` + `public/media`, verified by decode |
| 1 — Pentagram home index | Done |
| 2 — Cartelle case study spine | Done |
| 3 — migrate case study bodies | **D-GAM complete** (all 5 sections). Line Up: problem + section 01 done, **02–04 remaining** |
| 4 — motion / responsive / a11y | Not started |
| 5 — deploy to Vercel | Not started |

### Still to do beyond the phases

- Repo triage (**only after** extractions are wired in and verified): drop the
  five `.state.json` files, the two 0-byte videos, and the duplicate PNG/video
  pairs. ~57 MB before transcoding. `ffmpeg` is not installed.
- Paper titles and DOI links are missing everywhere — rows render venue-only
  until supplied.
- `Video Project.mp4` (14.5 MB) is an orphan, referenced nowhere.
- **`dgam-redesign.mp4` needs trimming.** It runs 5m26s and its opening frames
  catch an iOS Control Centre swipe, so it is served with `controls` + a poster
  rather than autoplay. Trim the head and shorten it, then drop `controls` from
  the `StickyStage` call in `d-gam.mdx` to restore the autoplay loop.
- `src/assets/lineup/hifi-screens.webp` is byte-identical to the old `lu-hifi2`
  slot — the original showed the same image twice. Likely a content slip.

### Publishing as a new repo

Intended to live as a **separate** GitHub repo so the old site stays intact.
Not yet done, and the old history carries ~113 MB of blobs, so a fresh history is
preferable to pushing this one:

```bash
# after creating an empty repo on GitHub
git remote add new <new-repo-url>
git push new main        # carries the old 113 MB history
```

`origin` still points at `Mehrunnisa3/portfolio` (the old site). Don't force-push
to it.
