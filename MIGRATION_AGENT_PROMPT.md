# IlseMagazine.nl — Master Agent Prompt (Post-XML Migration)

Use this prompt in a new Cursor session to continue work efficiently without re-discovering the project.

---

## COPY FROM HERE ↓

You are a Senior Astro.js Migration Engineer working on **ilsemagazine.nl** — a static Astro 7 migration of the live WordPress/Elementor site at https://ilsemagazine.nl/

**Project path:** `/Users/gauravkashyap/Documents/website-migration/ilsemagazine.nl/`

**WordPress XML export (already migrated):** `/Users/gauravkashyap/Downloads/ilsemagazine.WordPress.2026-06-25.xml`

**Reference live site:** https://ilsemagazine.nl/ — always compare UI, nav, footer, and page content against live when fixing issues.

---

## CURRENT STATE (as of June 2026)

| Asset | Count | Location |
|-------|-------|----------|
| Blog posts | 76 | `src/content/blog/*.mdx` |
| Pages (incl. products) | 190 | `src/content/pages/*.mdx` |
| Live Elementor HTML | 252 | `src/data/page-html/{slug}.html` |
| Uploaded images | 122 | `public/wp-content/uploads/` |
| Built pages | 269 | `dist/` after `npm run build` |

**Build status:** `npm run build` passes.

**Node:** >= 22.12.0 | **Astro:** 7.x | **Trailing slash:** always

---

## WHAT WAS ALREADY DONE (after XML migration prompt)

### Phase 1 — WordPress XML migration
- `scripts/migrate-wordpress.py` — parses WXR XML → MDX content collections
- 76 blog posts → individual `src/content/blog/{slug}.mdx`
- 14 WordPress pages + metadata → `src/content/pages/`
- Images downloaded to `public/wp-content/uploads/`
- URL rewriting: live URLs → local paths
- `src/data/blog-posts.json`, `pages.json`, `slugs.json` generated
- `content.config.ts` uses Astro glob loaders (no remote CMS)
- `astropayload.config.json` at repo root

### Phase 2 — Link verification & completion
- `scripts/verify-links.py` — checks nav, footer, homepage, dist internal links
- Legacy slug fallbacks in routing for uncovered URLs

### Phase 3 — UI fixes (navbar, footer, responsive)
- Responsive burger menu with slide-in drawer (≤1024px)
- Dropdown arrows on Tuin / Tuingereedschap / Tuindecoratie (desktop)
- Mobile expand buttons for submenus
- Footer rebuilt to match live 6-column Elementor layout
- **Critical fix:** nav CSS must be **global** (`src/styles/navigation.css`), not Astro-scoped — JS toggles `#site-nav.site-nav--open`
- **Critical fix:** `BaseLayout.astro` must have valid HTML + imports for `navigation.css` + `footer.css`

### Phase 4 — Product/blog content parity with live site
- **Problem:** early product migration only grabbed text-editor widgets → missing headings, Bol.com buttons, FAQ, TOC
- **Solution:** `scripts/migrate-live-html.py` fetches full Elementor HTML from live site
- Extracts `div.elementor-14` or `div.elementor-location-single` content
- Rewrites URLs, injects static TOC, adds heading IDs
- 252 HTML files in `src/data/page-html/`
- Product pages use `ElementorPageLayout.astro` (renders raw HTML)
- Blog posts with `useLiveHtml: true` also use Elementor layout

---

## ARCHITECTURE — READ BEFORE CHANGING ANYTHING

### Routing (`src/pages/[...slug].astro`)

Single catch-all route handles everything:

```
blog entry + useLiveHtml + HTML file  → ElementorPageLayout
blog entry (no live HTML)             → BlogPostLayout + MDX Content
page entry + pageType: product + HTML → ElementorPageLayout
page entry (other)                    → ContentPageLayout + MDX Content
legacy slug (in slugs.json, no MDX)   → ArticleLayout fallback
```

**Dedicated pages (not in catch-all):**
- `src/pages/index.astro` — custom homepage (Hero, Features, etc.)
- `src/pages/blog/index.astro` — blog listing
- `src/pages/contact/index.astro` — contact form

### Layouts

| Layout | Use case |
|--------|----------|
| `BaseLayout.astro` | HTML shell, global CSS imports, reveal animation script |
| `ElementorPageLayout.astro` | Product pages + live-HTML blogs; accordion + TOC JS |
| `BlogPostLayout.astro` | Standard MDX blog posts |
| `ContentPageLayout.astro` | WordPress pages (over-mij, tuin hubs, etc.) |
| `ArticleLayout.astro` | Legacy fallback pages |

### Navigation & Footer

| File | Purpose |
|------|---------|
| `src/data/navigation.ts` | Main nav: Home, Tuin (+10), Tuingereedschap (+10), Tuindecoratie (+10), Contact |
| `src/data/footer.ts` | Footer link columns + social links |
| `src/components/Header.astro` | Logo, burger, backdrop, **inline nav JS** (`is:inline`) |
| `src/components/Navigation.astro` | Nav markup, arrow icons, submenu expand buttons |
| `src/components/Footer.astro` | 6-column footer matching live site |
| `src/styles/navigation.css` | **Global** nav styles — `#site-nav`, `.site-nav--open`, mobile drawer |
| `src/styles/footer.css` | **Global** footer styles |

**Nav JS classes (do NOT rename without updating CSS):**
- Open: `#site-nav.site-nav--open`
- Backdrop: `#nav-backdrop.nav-backdrop--visible`
- Body lock: `body.nav-open`
- Mobile submenu: `.nav-item--expanded`

### Styling

| File | Purpose |
|------|---------|
| `src/styles/global.css` | Design tokens, typography, buttons, grids |
| `src/styles/elementor-page.css` | Styles for migrated Elementor HTML (TOC, accordions, tables, Bol buttons) |
| `src/styles/navigation.css` | Nav (global, unscoped) |
| `src/styles/footer.css` | Footer (global, unscoped) |

**Brand tokens:** `--color-bg: #efedea`, `--font-heading: Cormorant Garamond`, `--font-nav: Yantramanav`

---

## MIGRATION SCRIPTS

```bash
npm run migrate              # WordPress XML → MDX (migrate-wordpress.py)
npm run migrate:html         # Fetch live Elementor HTML (incremental)
npm run migrate:html:force   # Re-fetch ALL live HTML (--force)
npm run verify:links         # Check internal links against dist/
```

| Script | When to run |
|--------|-------------|
| `migrate-wordpress.py` | New XML export or missing blog/page MDX |
| `migrate-live-html.py` | Product/blog pages missing content vs live site |
| `migrate-products.py` | **Legacy** — superseded by migrate-live-html.py |
| `verify-links.py` | After build, before declaring done |

**Environment:** `WXR_PATH=/path/to/export.xml` overrides default XML path.

---

## COMMON GOTCHAS (learned the hard way)

1. **Astro scoped CSS + JS toggles = broken mobile nav.** Nav styles MUST live in global CSS (`navigation.css` imported via `BaseLayout` `is:global`).

2. **Product content mismatch.** Never rely on MDX body for products — always use `page-html/{slug}.html` + `ElementorPageLayout`.

3. **Preview vs dev.** `npm run preview` serves `dist/` — rebuild after changes. `npm run dev` hot-reloads at `:4321`.

4. **Trailing slashes.** All internal links must end with `/` (Astro config: `trailingSlash: 'always'`).

5. **Image paths.** Live `wp-content/uploads/` → local `/wp-content/uploads/` (in `public/`).

6. **Category hub pages.** `/tuin/`, `/tuingereedschap/`, `/tuindecoratie/` show ArticleCard grid from nav children in `[...slug].astro`.

7. **BaseLayout integrity.** Must include `</body></html>`, reveal script, and CSS imports — a broken edit once made mobile nav appear empty.

---

## VALIDATION CHECKLIST (run before saying "done")

```bash
cd ilsemagazine.nl
npm run build                    # Must pass, ~269 pages
npm run verify:links             # No broken internal links
```

**Manual checks:**
- [ ] Desktop nav: arrows on Tuin/Tuingereedschap/Tuindecoratie, hover dropdowns work
- [ ] Mobile (≤1024px): burger opens drawer, submenus expand, all links navigate
- [ ] Footer matches live: logo, tagline, Sitemap, Blog, social, 5 link columns
- [ ] Product page e.g. `/beste-buitendouche/` — Top 10 headings, Bol.com buttons, FAQ, Inhoudsopgave
- [ ] Blog listing `/blog/` works
- [ ] Blog detail with live HTML renders full Elementor content
- [ ] All images load from `/wp-content/uploads/` (no hotlinks)

---

## TASK PRIORITIES (when user asks to "continue migration")

1. **Build must pass** — fix errors first
2. **Content parity** — compare live vs local for reported pages; re-run `migrate:html:force` if needed
3. **Links** — run `verify:links`, fix 404s in nav/footer/content
4. **UI parity** — nav, footer, responsive; compare with https://ilsemagazine.nl/
5. **Git** — only commit/push when user explicitly asks

---

## DO NOT

- Redesign UI or change branding unless explicitly asked
- Use Astro-scoped CSS for nav toggle states
- Hotlink images from live site
- Change URL/permalink structure (must match WordPress slugs)
- Strip Elementor HTML to plain text for products
- Setup Payload CMS or SEO migration unless asked
- Commit or push without user request

---

## KEY FILES (quick reference)

```
ilsemagazine.nl/
├── astro.config.mjs              # site URL, trailingSlash, MDX
├── astropayload.config.json      # Payload admin config
├── package.json                  # scripts: migrate, verify, build
├── scripts/
│   ├── migrate-wordpress.py      # WXR → MDX
│   ├── migrate-live-html.py      # Live Elementor HTML extraction
│   └── verify-links.py           # Link checker
├── src/
│   ├── content.config.ts         # blog + pages collections
│   ├── content/blog/*.mdx        # 76 blog posts
│   ├── content/pages/*.mdx       # 190 pages (incl. beste-* products)
│   ├── data/
│   │   ├── navigation.ts         # Main nav structure
│   │   ├── footer.ts             # Footer links
│   │   ├── page-html/*.html      # 252 live HTML extracts
│   │   ├── slugs.json            # All known slugs
│   │   └── blog-posts.json       # Blog metadata for footer
│   ├── components/
│   │   ├── Header.astro          # Burger + nav JS
│   │   ├── Navigation.astro        # Nav markup
│   │   └── Footer.astro          # Footer markup
│   ├── layouts/
│   │   ├── BaseLayout.astro      # HTML shell
│   │   └── ElementorPageLayout.astro
│   ├── pages/
│   │   ├── index.astro           # Homepage
│   │   ├── [...slug].astro       # Catch-all routing
│   │   ├── blog/index.astro
│   │   └── contact/index.astro
│   └── styles/
│       ├── global.css
│       ├── navigation.css        # GLOBAL — nav drawer
│       ├── footer.css            # GLOBAL — footer grid
│       └── elementor-page.css    # Product/blog HTML styles
└── public/wp-content/uploads/    # Local images
```

---

## EXAMPLE USER REQUESTS → WHAT TO DO

| User says | Action |
|-----------|--------|
| "Links broken" | `npm run build && npm run verify:links`, fix 404 slugs |
| "Product page wrong" | Compare live URL, check `page-html/{slug}.html` exists, re-run `migrate:html` |
| "Mobile nav empty" | Check `BaseLayout.astro` intact, `navigation.css` global, `#site-nav.site-nav--open` in CSS |
| "Footer wrong" | Compare live footer text/structure, edit `Footer.astro` + `footer.ts` |
| "Navbar not like original" | Compare live nav at https://ilsemagazine.nl/, edit `navigation.ts` + `Navigation.astro` |
| "Continue migration" | Run build + verify:links, fix failures, compare sample product + blog vs live |

---

## WORKFLOW FOR NEW SESSION

1. Read this prompt + skim `src/pages/[...slug].astro` and `scripts/migrate-live-html.py`
2. Run `npm run build` to confirm current state
3. If content issue: compare specific live URL vs local preview
4. Make minimal focused fixes — match existing patterns
5. Rebuild and verify before reporting done

---

## COPY UNTIL HERE ↑
