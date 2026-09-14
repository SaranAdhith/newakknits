# Sri Ashwath Knits

Static website for the knitwear and woven garment manufacturer in Tiruppur.

## Preview

From this directory, run:

```sh
node serve.cjs
```

Open http://localhost:8000. The dependency-free server includes video range
requests and only serves the public website files. Set PORT to use another port.
You can also open index.html directly.

## Website files

- `index.html`: content, structured data, original component styles and primary interactions.
- `refinement.css`: responsive visual system and section treatments.
- `refinement.js`: scroll-reactive brand statement, fallback reveals, keyboard controls, background-motion toggle, product enquiry links and back-to-top control.
- `textiles.css` and `textiles.js`: scroll-drawn thread ornaments, progressive knit loops and needle movement.
- `assets/`: original factory, people and garment photography; optimized WebP images and MP4 video, the Better Cotton Initiative logo (`bci.png`, transparent), plus the decorative AI yarn illustration. The company mark is an inline SVG traced from the official logo.

The visual direction uses deep indigo drawn from the company mark (#3C237A), warm ivory and terracotta, with Manrope
for headings and body copy, Fraunces for expressive accents, and IBM Plex Mono
for small labels. Hero and section introductions are centered; detailed copy,
forms and specifications retain readable alignment. Product photographs retain
their full frames, with permanently visible information and enquiry links.

## Motion and interactions

- Masked word reveals, image reveals, parallax and animated statistics use GSAP.
- The brand statement changes word by word with native scrolling.
- Thread curves draw through ten sections, with knitted stitch dividers beneath
  About, Products and Contact. Needles move gently in the brand-story section,
  alongside original AI-generated yarn artwork. Decorative elements do not
  intercept clicks or appear in the accessibility tree. Continuous motion
  pauses offscreen, when the tab is hidden, and with the background-motion
  control; reduced-motion mode renders completed, static stitches.
- Manufacturing uses a photo-led gallery with seven numbered tabs and previous/
  next controls. Original photo proportions are preserved at every screen size;
  captions sit below the image. A light details card sits alongside the photo
  on desktop and underneath on mobile. The full production notes are available
  under “A closer look”. On screens 960px and wider without a reduced-motion
  preference the stage pins while a runway supplies scroll distance, and
  scrolling through it walks the seven stages in order; each card swipes in
  from the direction of travel while a copy of the outgoing card swipes away.
  Tabs and arrows still work and scroll to that stage's band so the two never
  disagree; a wheel or touch takes control straight back. On shorter laptop
  screens the pinned stage compacts its spacing and fits the photo to the
  viewport, dropping the pull quote if needed; if it still cannot fit it
  releases to plain tabs. Narrower screens and reduced motion keep the plain
  tab behaviour with no pinning.
- The process card settles into place as it enters the viewport. Numbered tabs
  stagger in, the connector draws across them, and the image, caption, copy and
  figures reveal as they become visible. A separate connector tracks the chosen
  production stage. Directional transitions also work through tabs and arrows.
  This controller uses native JavaScript/Web Animations and works without GSAP;
  it preserves the complete image, cancels interrupted transitions, and respects
  reduced-motion changes without intercepting wheel or touch scrolling. Native
  scrolling is never hijacked; pinning uses CSS sticky positioning.
- Product filters and process tabs support arrows, Home and End. The mobile
  menu supports Escape and keeps keyboard focus within its controls.
- Product enquiry links prefill the chosen style and fabric while preserving
  the visitor's existing notes.
- Background motion has a pause button. Reduced-motion preferences disable
  decorative animations and prevent automatic video loading.
- Native IntersectionObserver reveals work if the animation CDN is unavailable.
  The intro never blocks scrolling.

The enquiry form opens the visitor's email app; it does not send to a backend.
The visitor must attach the selected tech pack to their email. WhatsApp is an
alternative contact route. Name and email are validated before opening email.

## Verification

The isolated development checks require Node.js and two small DOM/CSS packages:

```sh
npm install --prefix checks
node checks/check.cjs
```

On PowerShell installations that block npm.ps1, use npm.cmd instead of npm.
Checks cover JavaScript/CSS parsing, structured data, local assets, anchor IDs,
product filters, all stages, keyboard tabs, product-to-enquiry prefilling,
menu/Escape behaviour, background-motion controls and chart tables. They run
with the animation CDN absent, in normal and reduced-motion modes.

These are DOM checks, not a rendering engine. Desktop/mobile visual review and
GSAP scroll playback still need a browser; no browser session was available
during this update.

## Deployment

Deploy only `index.html`, `refinement.css`, `refinement.js`, `textiles.css`,
`textiles.js` and `assets/`, keeping
the relative paths together. No production build or npm dependencies are needed.
Do not publish `checks/`, `serve.cjs`, the original `New folder/` media, or
`index.backup.html` (the earlier version, retained as a rollback).

Fonts load from Google Fonts, animation libraries from cdnjs, and the contact
map from Google Maps. System font and animation fallbacks preserve the page
when those services are unavailable. Set an absolute hosted Open Graph image
in index.html once the final domain and share image are confirmed.

The original AI illustration is `assets/thread-knitting-ai.png`, a transparent
1536 × 1024 PNG created with the built-in image-generation tool. Its generation
prompt is recorded in `checks/thread-art-prompt.md`.
