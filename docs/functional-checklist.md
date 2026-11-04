# Functional verification

Validated in headless system Chromium on 2026-11-03. Desktop viewport: 1440×1000; mobile viewport: 390×844. Mobile emulation is not a substitute for physical-device testing.

## Passed

- All eight pages load with a heading and no horizontal overflow at both viewport sizes.
- Category filter, room filter, text search, no-results recovery and six-to-eight-item Load More.
- Project link navigation, missing/invalid slug recovery, image dialog open/close, Escape and cyclic next/previous image navigation.
- Sticky/shared navigation, mobile disclosure menu and Escape dismissal.
- Required form validation, enquiry preview, safely escaped input, encoded configured WhatsApp link, and unconfigured-number sending safeguard.
- No automatic confirmation is presented; visitor must send the enquiry and receive manual studio confirmation.
- Comparison pointer, touch and keyboard interaction using a synthetic verified pair intercepted in the browser only.
- Verified testimonial carousel and statistics count-up using synthetic content only.
- Reduced-motion media preference disables slideshow autoplay.
- Simulated GitHub Pages repository-subpath fetches, assets and project navigation.
- Failed JSON request produces a friendly recovery state.
- Content validation: local HTML links/assets, metadata presence, JSON parsing, unique slugs and image references.
- ES module syntax check and clean whitespace checks.
- No uncaught JavaScript exceptions during the successful browser suites.
- Desktop hero and full mobile-page screenshots inspected; image proportions and control spacing corrected.

## Content intentionally withheld

No actual before/after pairs, testimonials, achievements, team credentials or statistical claims are published. Business contacts are empty. Verified fixture data is test-only. Public projects are marked illustrative concepts.

## Not verified / remaining

- Real WhatsApp app handoff, sending and studio response: requires approved business number and a real device.
- Actual studio services, address, time zone, pricing and legal/privacy wording: owner review required.
- Physical iOS/Android, Safari, Firefox and assistive-technology testing: not performed.
- Formal WCAG audit or automated axe/Lighthouse score: not claimed. Semantic controls, visible focus, labels, keyboard navigation and reduced motion are implemented.
- Public GitHub Pages deployment and live social previews: not performed; workflow prepared only.
- Live D'LIFE reference: HTTP 403; behavior could not be reviewed.

## Commands

Run `python3 tests/check_content.py` and `node --check js/app.js` from the checkout. With a local static HTTP server running, run `python3 tests/browser_smoke.py` and `python3 tests/edge_cases.py`. The latter uses intercepted synthetic fixtures and verifies repository-subpath requests without exposing other workspace directories.

## Animation update — 4 November 2026

White Soul Studio was inspected in Chromium as the new motion reference. Original word-mask headings, image reveals, hero image zoom/parallax, ticker, staggered cards, mobile navigation, image-dialog transitions and a persistent motion switch were added. Animation-state tests verify the running ticker, title slide changes, visible image masks, reading progress, filtered-card reveals, saved motion preference and live reduced motion. Desktop and mobile screenshots were inspected. No third-party animation code or images were copied.

## Multi-studio editor update — 4 November 2026

The browser-only editor supports structured content edits, array add/reorder/remove, optional comparison management, per-studio URL/file settings, image selection, draft previews, browser draft storage, JSON import/export and website-update ZIP export. Routing/content tests cover exact origins, complete path prefixes, nested route priority, unknown URL rejection, duplicate paths and malformed content. Browser editor tests verify isolated studio edits, draft previews and navigation, owner metadata, archive integrity, image byte preservation, atomic invalid-import rejection, valid JSON round-trips and mobile overflow. No authentication or remote write service is implemented. Deployment/DNS for additional domains and real-device testing remain outside the verified local workflow.
