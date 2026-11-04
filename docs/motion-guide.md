# Motion and interaction design

## Reference review

White Soul Studio was reviewed in Chromium on 4 November 2026 at desktop width, including the opening screen and scrolled content. Its moving service ticker, large photographic presentation, staggered text, parallax and scroll reveals informed the desired level of motion. The implementation here is original and uses no reference source code, photography, branding or third-party animation libraries.

## What moves

- Hero: masked word-by-word title entrance on each slide, staggered copy and buttons, slow image zoom, desktop scroll parallax, fading slides and an animated scroll invitation.
- Every page: page entrance, headline reveals, staggered cards/content, form-field entrances and image-mask reveals.
- Service ribbon: seamless duplicated track, with the decorative copy hidden from assistive technology; hover pauses it.
- Navigation: animated mobile opening, staggered menu items, dropdown entrances and desktop link underlines.
- Galleries: newly filtered and loaded cards receive scroll reveals; cards zoom on hover and show an affordance. The image dialog and next/previous photo updates animate.
- Controls: button lift, moving arrow icons, input focus states, testimonial changes and a document reading-progress line.

## Accessibility and performance

A persistent **Motion on / Motion off** button pauses decorative motion and saves the choice locally. System `prefers-reduced-motion` takes precedence; changing the system preference while the page is open immediately removes motion. The separate hero slideshow play/pause control remains available; global pause prevents its timer from running. No scroll hijacking, custom cursor, blocking splash screen or new runtime dependency is used.

IntersectionObserver runs entrances once; only filtered gallery nodes need re-registration. Passive scroll handling coalesces updates with requestAnimationFrame. Parallax is restricted to desktop and the visible hero. The implementation favors opacity and transform; image clipping is used only for one-time entrances. Images are observed through their unclipped parent so a hidden mask cannot prevent its own reveal. Text remains a single accessible heading name despite decorative word wrappers.

## Maintenance and tests

`js/motion.js` owns the motion controller; the editorial motion section at the end of `css/styles.css` owns timings and easing. `animateHeading()` is called on hero slide changes. New headings and standard card/section classes participate automatically at page initialization. Portfolio replacements are registered through a narrowly scoped MutationObserver.

With the local static server running, execute `python3 tests/motion_smoke.py`. It checks actual running ticker animation, hero title changes, parallax, reveal activation, reading progress, persisted pause state, re-filtered cards, mobile menu, live reduced-motion changes, layout overflow and JavaScript errors. Existing browser and synthetic-fixture suites still cover functional flows. Real-device Safari/Firefox and formal accessibility/performance audits remain unverified.
