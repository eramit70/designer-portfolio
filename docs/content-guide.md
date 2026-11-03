# Content guide

All JSON files must remain valid JSON without trailing commas or comments. All content is public: never place secrets, private customer information or enquiry records here.

## site.json

Replace `name`, `descriptor`, `description` and the temporary brand presentation. Set `placeholder` false only after editorial review. `phone` is a display number; `whatsapp` must contain 10–15 digits including the country code, without `+`, spaces or punctuation. An empty or invalid WhatsApp number disables sending. Set `email`, `address`, `hours`, `locations` and `socials` (`label`, HTTPS `url`). The address creates an encoded Google Maps search link. Time slots are `HH:MM` strings in studio-local time; disclose the actual studio timezone in content before launch.

Hero items require `image`, meaningful `alt`, `title` (a newline is supported), and `label`. Add images under `assets/images/`; update metadata images in the HTML entry files for sharing. Shared logo markup is in `brand()` in `js/app.js`; replace the fictional wordmark there when approved branding exists.

`stats`: `{ "verified": true, "value": 12, "label": "Approved statistic" }`. Only verified finite numeric values appear. `team`: `{ "name": "Approved name", "role": "Approved role" }`. `achievements` and `locations` are arrays of approved text strings. Leave unsupported claims empty.

## services.json

An array of `{id, title, description, image, items}`. `items` lists the subservices. Maintain stable IDs for anchored service URLs. Use original or licensed imagery and meaningful descriptions. Confirm actual studio scope before launch.

## projects.json

Each entry requires a unique stable URL-safe `slug`, `title`, `category`, `room`, `location`, `description`, `scope` array, `cover`, and `images` array of `{src, alt}`. `area` and `year` may be null. `demo: true` marks concept studies. For authorized actual projects use `demo: false`, `verified: true`, approved photography and accurate details.

To add a project: upload authorized assets to `assets/images/`, add one JSON entry, and run content validation. Gallery, filters, details and related links update automatically; no new HTML page is needed. Add its query-slug URL to the sitemap for discovery.

Image paths must begin `assets/` and contain no parent traversal. Use local optimized WebP/JPEG assets, descriptive filenames and useful alt text. The generated living-room concept includes 768px and 1536px WebP sources with srcset. When adding other photographic assets, extend the image renderer with corresponding responsive sources; illustrations scale as resolution-independent SVGs.

Optional `comparison`: `{ "verified": true, "before": "assets/images/before.webp", "after": "assets/images/after.webp", "beforeAlt": "Same room before renovation", "afterAlt": "Same room after renovation" }`. Supply a genuine matching pair from the same project, with compatible framing and documented permission. Leave null when unavailable. Synthetic pairs used by tests never enter this file.

## testimonials.json

An array of `{verified, quote, name}`. Publish only verified permission-backed testimonials; otherwise keep `[]`. Do not fabricate names, quotes, scores or client photos.

## Image provenance

`living-concept.webp` was generated for this demonstration using OpenAI image generation and is explicitly labelled a concept render. The living, kitchen and bedroom SVG files are original simple illustrations created for the project. They are not photographs of client work. No images were taken from either reference website.
