# FORME — interior & architecture portfolio

A framework-free, static HTML/CSS/ES6 portfolio for `eramit70/designer-portfolio`. FORME is an explicitly fictional placeholder identity. The content is a demonstration, not a claim of completed client work.

## Run locally

No build, package installation, backend, or database is required. From this checkout:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Open the served `index.html` in your browser. Use HTTP rather than opening HTML with `file://`, because pages fetch JSON. Python is only a local development file server; production is entirely static.

## Structure

Eight HTML entry pages share `css/styles.css` and `js/app.js`. Site identity/contact/hero/time slots live in `data/site.json`; services, projects and verified testimonials have separate JSON files. Project URLs use `project.html?slug=...`, requiring no server rewrite. Every asset and internal page link is relative for GitHub Pages subpath support.

See [implementation plan](docs/implementation-plan.md), [content guide](docs/content-guide.md), and [functional checklist](docs/functional-checklist.md).

## Validation

```sh
python3 tests/check_content.py
node --check js/app.js
# Optional development tooling: Python Playwright and a Chromium browser.
# With the local server running:
python3 tests/browser_smoke.py
python3 tests/edge_cases.py
```

Browser tests default to `/usr/bin/chromium`; override `CHROMIUM_PATH` or `TEST_BASE_URL` if needed. Node is used only for an optional syntax check, never for serving the site. Browser tests use synthetic data through request interception; no fixture is written into public JSON.

## Publish with GitHub Pages

1. Review the pull request and replace the placeholder brand, contact details, design studies and metadata with approved content before public launch.
2. In repository **Settings → Pages → Build and deployment**, select **GitHub Actions**.
3. Merge the reviewed branch into `main`. The Pages workflow validates content and deploys only the public HTML, CSS, JS, JSON, image assets, sitemap and robots file.
4. Inspect the Actions deployment result. Expected URL after successful publication: `https://eramit70.github.io/designer-portfolio/`. This URL is not evidence of a current deployment.
5. If changing the repository name or custom domain, update the sitemap URLs and `robots.txt`. Supply absolute production social-image URLs and canonical metadata before launch. Query-slug project metadata is updated client-side; reliable per-project social previews require pre-rendered HTML in a future enhancement.

## Current content limitations

Business phone, WhatsApp number, address, hours, team, service locations, achievements and verified statistics remain unconfigured. No real testimonials or before/after pairs were provided. The hero is an AI-generated concept render, other images are original SVG illustrations; none is presented as real project photography. WhatsApp sending remains unavailable until a valid business number is configured. An enquiry is never an automatic appointment confirmation.

## Animation and motion controls

The site includes cinematic hero text/image motion, scroll-driven entrances, image reveals, an animated service ribbon, gallery transitions and responsive navigation animations. Use the persistent **Motion on / Motion off** button to pause decorative effects. Reduced-motion device settings are respected automatically. No animation library or runtime package is required. See [motion guide](docs/motion-guide.md); run `python3 tests/motion_smoke.py` for animation-specific checks.
