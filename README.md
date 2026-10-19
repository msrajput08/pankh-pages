# PankhPages — Free Printable Worksheets

A complete, responsive, **static website** with **27 working, customizable worksheet tools** and 29 indexable pages (27 tools + home + privacy). No paid services, API keys, login, database, or `npm install` required.

## What works

- Marathi swar, vyanjan, mulakshare, barakhadi (13 combinations) and custom word handwriting sheets
- Hindi varnamala, swar, vyanjan and custom words
- English A–Z, uppercase, lowercase, personal name and custom word tracing
- Four-line, ruled and graph paper with adjustable spacing
- Addition, subtraction (nonnegative answers), multiplication, division (exact answers) and mixed maths
- Number tracing 1–100 and missing-number sequences
- Adjustable difficulty, question count and optional answer keys
- Real-time A4 canvas previews, pagination, **direct PDF download**, and Print
- All PDF generation runs in the visitor's browser; custom worksheet text is not uploaded to a server
- Responsive UI, editable preview settings, local Devanagari font, descriptive pages, FAQ/breadcrumb structured data, robots and optional sitemap/canonical links
- Optimized static output in `dist/`

PDF pages are 210 × 297 mm (A4 portrait). To preserve accurate Devanagari shapes and make browser-only downloads work without dependencies, PDF pages are raster-image based, not editable/searchable PDFs. Each page is approximately 150 dpi, suitable for ordinary classroom printing.

## Easiest way to publish — Netlify drag-and-drop

1. Open https://app.netlify.com/drop and sign in.
2. Unzip this project.
3. Drag the **`dist` folder** (not the outer ZIP) onto Netlify Drop.
4. Netlify will give you a live `.netlify.app` URL. Open it and test a PDF.
5. For complete SEO setup, rebuild with that URL (see below), then redeploy the new `dist` folder.
6. Submit `https://your-site.netlify.app/sitemap.xml` in Google Search Console and request indexing of your key landing pages.

For Cloudflare Pages or Vercel: deploy the contents of `dist/` as a **static site**. The project does not need a server runtime.

## Make SEO deployment-ready once you know your domain

Install Node.js 20+ if needed. From inside the project folder:

**macOS / Linux:**

```bash
SITE_URL=https://your-site.netlify.app npm run build
```

**Windows PowerShell:**

```powershell
$env:SITE_URL="https://your-site.netlify.app"
npm run build
```

**Windows Command Prompt:**

```cmd
set SITE_URL=https://your-site.netlify.app
npm run build
```

This regenerates all static pages inside `dist/`, adds absolute canonical links and Open Graph URLs, and produces `dist/sitemap.xml` referenced by `dist/robots.txt`. Use your **final preferred domain** (`https://example.com`, no slash at the end). Rebuild/redeploy if the domain changes. Without `SITE_URL`, canonical links and sitemap are intentionally omitted to avoid indexing an incorrect domain.

You can host from a Git repo with build command `npm run build`, publish directory `dist`, and environment variable `SITE_URL=https://your-domain.com`.

## Edit / add pages

- `src/catalog.mjs` — every tool route, meta title, description, guide, tips, FAQs
- `assets/app.js` — PDF engine, worksheet drawing and form behavior
- `assets/styles.css` — design system and responsive UI
- `scripts/build.mjs` — static HTML pages and sitemap generation
- `assets/NotoSansDevanagari-Regular.ttf` — bundled open-source Devanagari font

After editing, run `npm run build` and upload the refreshed `dist/`.

## SEO reality check

Google indexing and traffic are **not guaranteed**. Unique and genuinely useful worksheet pages perform better than thin/generated doorway pages. Start with a few priority URLs, set up Search Console, improve pages based on real query impressions, and add quality educational content based on user needs. No fake page views, manufactured search-volume claims, or link schemes are included.

## Launch checklist

- [ ] Publish `dist/` and verify both desktop and mobile
- [ ] Set your final site URL, rebuild, redeploy
- [ ] Verify Google Search Console ownership; submit sitemap.xml
- [ ] Test Marathi/Hindi glyphs and PDF downloads in Chrome/Edge and on mobile
- [ ] Check grammar/curriculum suitability of worksheets before distributing to learners
- [ ] Add business/contact details to privacy page if adding ads, analytics, email capture or accounts
- [ ] Check indexing reports and fix any crawling or content-quality issues

## License note

Includes Noto Sans Devanagari Regular, licensed under the SIL Open Font License. Keep its licensing notice when redistributing the bundled font. The rest of the PankhPages project is delivered for the recipient’s use and modification; it does not include any guarantee of exclusivity for the PankhPages name. Check brand/domain availability before commercial launch.

## GitHub and continuous deployment

This repository is ready to connect to the **existing PankhPages Netlify site**, using `netlify.toml`: build `npm run build`, publish `dist/`, `SITE_URL=https://pankhpages.netlify.app`. GitHub changes will auto-deploy **only after** you link that repository in Netlify > Project configuration > Build & deploy > Continuous deployment.

The Google Search Console verification file `google3d4d24a07fe849ba.html` is included at the repository root; the build script copies it into `dist/` on every build. Never rename the file. If your website domain changes, update `SITE_URL` in `netlify.toml` and rebuild.
