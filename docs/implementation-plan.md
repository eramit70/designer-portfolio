# Implementation plan and architecture

## Scope delivered

The request's foundation is implemented together with working static page flows from the subsequent phases, so the shared architecture is exercised end to end. No framework, database, server-side application, admin area or authentication is included.

- Foundation: design tokens, shared shell, sticky responsive navigation, nested expertise menu, eight semantic page entry points, JSON content and relative URLs.
- Core: home hero, about, all eight service families with subcategories, and contact with safe unconfigured states.
- Portfolio: category and room filters, text search, incremental loading, query-slug details, related studies and modal image gallery.
- Comparisons: accessible native range input with mouse, touch and keyboard support; only verified pairs render.
- Consultation: native and custom validation, preferred date/time, message preview, encoded WhatsApp deep link when configured, manual-confirmation disclosure.
- Finalization: motion preference handling, progressive reveal, verified-only statistics/testimonials, local image assets, SEO basics, sitemap, robots, Pages workflow and browser checks.

## Architecture

Each entry point supplies static title/description metadata and a `data-page` routing key. One ES module fetches the four JSON files and renders the corresponding view using shared functions. Text from configuration is escaped; image paths and external contact/social URLs are constrained. A failed fetch or invalid top-level configuration produces a friendly recovery state. Use the static validation script before publishing JSON edits; nested schema completeness is an editorial requirement.

There are no runtime dependencies. Native `dialog`, `range`, `details`, form constraint validation, IntersectionObserver and CSS scroll snapping provide the interactions. The carousel can be paused; autoplay pauses on hover/focus or a hidden page and is disabled for reduced motion. Form values stay in the browser until the visitor chooses to send the message in WhatsApp.

## Reference inspection

The wedding repository was inspected through GitHub. Its useful patterns include configurable hero image arrays, fade transitions, horizontal image galleries and IntersectionObserver reveals. Its backend, database connections, credentials, personal images, branding, music and admin UI were not reused. No reference source code was copied.

D'LIFE returned HTTP 403 from this environment, so its live layout and behavior could not be inspected. The new visual direction follows the user's written brief and uses original composition and assets.

## Remaining production work

Replace the placeholder identity and image content with authorized studio material. Confirm service availability, business contacts, location/timezone and all factual claims. Add permission-backed real testimonials and matched comparison pairs. Add production canonical/social metadata and conduct a real-device screen-reader review. Deployment and external WhatsApp sending require owner-side configuration and a real device; no public launch has been performed.
