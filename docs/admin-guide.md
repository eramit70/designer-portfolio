# Studio content workspace

This is a local, static JSON editor, as requested. It has no password login, backend, database, account system or GitHub write credentials. Anyone opening the editor can edit a private browser draft, but cannot change the published site through it. All deployed JSON, including studio URLs and owner contact email, is public.

## Open the editor

From the repository root on Windows PowerShell:

```powershell
py -m http.server 8000
```

Open `http://localhost:8000/admin/`. On macOS/Linux use `python3 -m http.server 8000 --bind 127.0.0.1`. Use HTTP rather than opening HTML files directly. Serve only the checkout, not a parent directory containing unrelated documents.

## Edit and preview

- Select a studio in the sidebar. **Studio & website** manages the brand name, optional logo and monogram, contact details, hero slides, time slots, team, verified statistics, page headings, home/about copy, process, principles and shared consultation text.
- **Services** manages category images, descriptions and subservice lists.
- **Projects & galleries** manages stable slugs, project metadata, cover images, image galleries, design scope and optional genuine comparison pairs.
- **Testimonials** manages permission-backed quotes. Leave unsupported statistics, claims and testimonials empty or unverified.
- Array items can be added, reordered and removed. Set optional area/year values when available. Use **Set comparison** to add a genuine pair and **Remove comparison pair** to remove it.
- Image fields accept existing asset paths or a PNG/JPEG/WebP file under 4 MB. Selected images stay in memory and are included in exports. SVG file uploads are intentionally unsupported; trusted existing repository SVG paths remain usable. Images over 40 megapixels are rejected; resize/optimize photographic files before importing.
- **Preview & export** displays an isolated same-origin iframe using in-memory content and temporary local image URLs. Navigation inside the preview retains the draft. Preview changes do not affect visitors.

The owner contact email under **URLs & file paths** is administrative contact metadata, not a login identity. Do not enter passwords, tokens or private customer information into any field. The configuration validator rejects password fields in admin settings.

## Central URL configuration

`data/config.json` selects the public studio and its content files:

```json
{
  "version": 1,
  "defaultStudio": "forme",
  "studios": [
    {
      "id": "forme",
      "label": "FORME studio",
      "urls": ["https://eramit70.github.io/designer-portfolio/"],
      "admin": { "contactEmail": "" },
      "content": {
        "site": "data/site.json",
        "services": "data/services.json",
        "projects": "data/projects.json",
        "testimonials": "data/testimonials.json"
      }
    }
  ]
}
```

Use fully qualified HTTP(S) base URLs ending with `/`, with no query, fragment or credentials. URL matching requires the exact origin (including scheme/port) and a complete path prefix. The longest matching configured base path wins. Unknown production origins/paths show a content configuration error; there is no silent fallback to another studio. Duplicate studio IDs, exact URLs and shared content file paths are rejected. Different studios use different JSON paths.

On `localhost`, `127.0.0.1` or `::1`, `defaultStudio` is used unless you open `index.html?studio=studio-id`. Local navigation preserves that selection. This development override is not accepted on production origins. Draft iframe previews use an explicit preview flag and accept validated data only from their same-origin parent editor.

**Add a studio** creates independent content paths under `data/studios/<id>/`, starting from labelled concept content. Studio IDs stay permanent; the display label, URL aliases and owner contact email are editable. No second real business is invented. Clear or replace sample content before launch. Removing a studio removes its mapping from exported configuration; retired files already in Git are not automatically deleted.

Multiple URL mappings do not create DNS records or deploy other websites. GitHub Pages supports one custom domain per Pages site; independent domains need their own deployments with this application/configuration. Each mapped base URL must actually serve the application and its asset/data folders. The router selects content; it does not provision server paths or rewrite URLs. All configured studios' published files can be read directly; this is content selection, not tenant access isolation.

## Save, export and publish

1. **Save browser draft** saves the workspace in this browser's local storage. It may fail if browser quota is exceeded. It is not a server backup. Restore it through **Overview → Restore browser draft**. Pending unexported edits trigger a close-page warning.
2. **Download workspace JSON** exports a portable editing backup containing configuration, content and newly selected image bytes. Import through **Overview → Import workspace JSON**. Invalid imports are rejected atomically.
3. **Export website update** creates one ZIP containing `data/config.json`, every configured studio's content JSON and newly selected image files. The ZIP is an update, not a complete standalone website.
4. Extract the ZIP into the root of your existing checkout, preserving folder structure. Inspect `git diff` and new asset paths. Existing content files at the configured paths will be replaced, so keep a Git commit/backup first. If paths were changed or studios retired, remove obsolete files explicitly when appropriate.
5. Run `python3 tests/check_content.py`, preview locally, then commit and push the reviewed content. Publishing still occurs through the GitHub Pages workflow after the relevant branch is merged into `main`.

Section-level JSON import/export is available for services, projects and testimonials. The complete workspace/ZIP includes every type, including studio settings. Exporting does not send enquiries, deploy a website or confirm an appointment.

## Verification

- `node tests/content-store.test.mjs`: exact-origin/path routing, localhost selection, invalid paths and public content validation.
- `python3 tests/editor_smoke.py`: structured edits, draft saving, independent studio data, URL metadata, preview navigation, image selection, valid ZIP integrity/byte preservation, JSON round-trip, invalid-import rejection and mobile overflow checks.
- Existing `tests/browser_smoke.py`, `tests/edge_cases.py` and `tests/motion_smoke.py`: public site behavior.

Node and Python are development tools only. The deployed editor and public website run entirely as static HTML/CSS/JavaScript. Real-device Safari/Firefox testing and manual screen-reader review remain outstanding.
