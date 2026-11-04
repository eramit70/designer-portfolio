import {
  ROOT,
  TYPES,
  safePath,
  validateConfig,
  validateContent,
  readJSON,
} from "../js/content-store.js";
import { zip, download } from "./archive.js";
const $ = (selector) => document.querySelector(selector);
const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const clone = (value) => structuredClone(value);
const LABELS = {
  overview: "Overview",
  site: "Studio & website",
  services: "Services",
  projects: "Projects & galleries",
  testimonials: "Testimonials",
  routing: "URLs & file paths",
  publish: "Preview & export",
};
const imageKeys = new Set(["image", "cover", "src", "logo", "before", "after"]);
let state,
  active,
  tab = "overview",
  dirty = false,
  uploadTarget,
  importMode = "bundle";
const objectURLs = new Map();
const templates = {
  process: { title: "New process step", description: "Describe this stage." },
  principles: {
    title: "Design principle",
    description: "Describe the approach.",
  },
  hero: {
    image: "assets/images/living.svg",
    alt: "Describe this concept image",
    title: "A new perspective.",
    label: "Concept study",
  },
  services: {
    id: "new-service",
    title: "New service",
    description: "Describe this service.",
    image: "assets/images/living.svg",
    items: ["New subservice"],
  },
  projects: {
    slug: "new-project",
    title: "New project",
    category: "Residential",
    room: "Living room",
    location: "Concept location",
    area: null,
    year: null,
    demo: true,
    verified: false,
    description:
      "Describe this illustrative concept; do not present it as real work.",
    scope: ["Space planning"],
    cover: "assets/images/living.svg",
    images: [{ src: "assets/images/living.svg", alt: "Illustrative concept" }],
    comparison: null,
  },
  testimonials: {
    name: "Permission-backed name",
    quote: "Replace with a verified quote before publication.",
    verified: false,
  },
  images: { src: "assets/images/living.svg", alt: "Describe this image" },
  stats: { value: 0, label: "Replace with verified metric", verified: false },
  team: {
    name: "Name awaiting confirmation",
    role: "Role awaiting confirmation",
  },
  socials: { label: "Social profile", url: "https://example.com/" },
  comparison: {
    verified: false,
    before: "assets/images/living.svg",
    after: "assets/images/bedroom.svg",
    beforeAlt: "Describe genuine before image",
    afterAlt: "Describe genuine after image",
  },
};
function notice(text, error = false) {
  $("#notice").textContent = text;
  $("#notice").classList.toggle("error", error);
}
function mark() {
  dirty = true;
  $("#dirty-status").textContent = "Unexported edits in this browser";
}
function studio() {
  return state.config.studios.find((s) => s.id === active);
}
function doc() {
  return tab === "routing" ? studio() : state.studios[active][tab];
}
function get(path) {
  return path.reduce((value, key) => value[key], doc());
}
function set(path, value) {
  if (!path.length) state.studios[active][tab] = value;
  else {
    const target = get(path.slice(0, -1));
    target[path.at(-1)] = value;
  }
  mark();
}
const label = (key) =>
  String(key)
    .replace(/([A-Z])/g, " $1")
    .replace(/[-_]/g, " ")
    .replace(/^./, (c) => c.toUpperCase());
function previewAsset(path) {
  if (!path || !safePath(path)) return "";
  if (state.assets[path]) {
    if (!objectURLs.has(path)) {
      const asset = state.assets[path];
      objectURLs.set(
        path,
        URL.createObjectURL(
          new Blob([decode(asset.base64)], { type: asset.mime }),
        ),
      );
    }
    return objectURLs.get(path);
  }
  return new URL(path, ROOT).href;
}
function field(value, path, key) {
  const encoded = esc(JSON.stringify(path));
  if (Array.isArray(value))
    return `<details class="group" open><summary>${esc(label(key))} <span class="badge">${value.length} items</span></summary><div class="fields"><div class="field wide">${value.length ? value.map((row, index) => `<div class="entry"><div class="entry-header"><span class="entry-title">${esc(row?.title || row?.name || row?.label || label(key) + " " + (index + 1))}</span><div class="toolbar"><button type="button" class="secondary" data-move="-1" data-path="${encoded}" data-index="${index}" ${index === 0 ? "disabled" : ""} aria-label="Move ${esc(label(key))} item ${index + 1} up">↑</button><button type="button" class="secondary" data-move="1" data-path="${encoded}" data-index="${index}" ${index === value.length - 1 ? "disabled" : ""} aria-label="Move ${esc(label(key))} item ${index + 1} down">↓</button><button type="button" class="danger" data-remove="${index}" data-path="${encoded}" aria-label="Remove ${esc(label(key))} item ${index + 1}">Remove</button></div></div><div class="fields">${field(row, [...path, index], key === "urls" ? "Published URL" : key === "timeSlots" ? "Consultation time" : `Item ${index + 1}`)}</div></div>`).join("") : '<p class="empty">No entries yet. Empty lists are valid when verified content is unavailable.</p>'}<button type="button" class="secondary" data-add data-path="${encoded}" data-key="${esc(key)}">+ Add ${esc(label(key))} item</button></div></div></details>`;
  if (value !== null && typeof value === "object")
    return `<details class="group" ${path.length < 2 ? "open" : ""}><summary>${esc(label(key))}</summary><div class="fields">${key === "comparison" ? `<div class="field wide"><button type="button" class="secondary" data-clear-optional data-path="${encoded}">Remove comparison pair</button></div>` : ""}${Object.entries(
      value,
    )
      .map(([k, v]) => field(v, [...path, k], k))
      .join("")}</div></details>`;
  if (value === null)
    return `<div class="field"><label>${esc(label(key))} (not set)</label><button type="button" class="secondary" data-optional data-path="${encoded}" data-key="${esc(key)}">Set ${esc(label(key))}</button></div>`;
  const id = "field-" + tab + "-" + path.map(String).join("-");
  if (typeof value === "boolean")
    return `<div class="field"><label class="checkbox-label" for="${esc(id)}"><input id="${esc(id)}" type="checkbox" data-value data-kind="boolean" data-path="${encoded}" ${value ? "checked" : ""}>${esc(label(key))}</label>${key === "verified" ? '<p class="hint">Only enable for accurate, permission-backed content.</p>' : ""}</div>`;
  const readonly = tab === "routing" && key === "id";
  const large =
    typeof value === "string" &&
    (value.length > 95 ||
      /description|quote|alt|tagline/i.test(key) ||
      value.includes("\n"));
  const input = large
    ? `<textarea id="${esc(id)}" data-value data-path="${encoded}" maxlength="10000">${esc(value)}</textarea>`
    : `<input id="${esc(id)}" type="${typeof value === "number" ? "number" : "text"}" data-value data-kind="${typeof value}" data-path="${encoded}" value="${esc(value)}" ${readonly ? "readonly" : ""} maxlength="2000" ${typeof value === "number" ? 'step="any"' : ""}>`;
  if (imageKeys.has(key) && typeof value === "string")
    return `<div class="field wide"><label for="${esc(id)}">${esc(label(key))} · image path</label><div class="image-field">${previewAsset(value) ? `<img src="${esc(previewAsset(value))}" alt="Current image preview" loading="lazy">` : ""}<div>${input}<button type="button" class="secondary" data-upload data-path="${encoded}">Choose image…</button><p class="hint">PNG, JPEG or WebP, up to 4 MB. Images are bundled on export; use alt text for meaningful content.</p></div></div></div>`;
  return `<div class="field ${large ? "wide" : ""}"><label for="${esc(id)}">${esc(label(key))}</label>${input}</div>`;
}
function render() {
  $("#studio-select").innerHTML = state.config.studios
    .map(
      (s) =>
        `<option value="${esc(s.id)}" ${s.id === active ? "selected" : ""}>${esc(s.label)}</option>`,
    )
    .join("");
  $("#tabs").innerHTML = Object.entries(LABELS)
    .map(
      ([key, title]) =>
        `<button class="tab" data-tab="${key}" ${tab === key ? 'aria-current="page"' : ""}>${title}</button>`,
    )
    .join("");
  $("#workspace-title").textContent = LABELS[tab];
  if (tab === "overview") overview();
  else if (tab === "publish") publish();
  else {
    const explanation =
      tab === "routing"
        ? "These settings map each published URL to this studio’s public content. Owner email is contact metadata, not login. Studio IDs stay stable. No passwords or tokens belong here."
        : "Edit public content below. Changes remain local until export. Use only approved photography and verified claims.";
    $("#workspace").innerHTML =
      `<section class="panel"><h2>${esc(studio().label)}</h2><p class="muted">${explanation}</p>${["services", "projects", "testimonials"].includes(tab) ? `<div class="toolbar"><button class="secondary" id="import-section">Import ${esc(tab)} JSON</button><button class="secondary" id="export-section">Export ${esc(tab)} JSON</button></div>` : ""}<div class="fields" style="margin-top:1.5rem">${field(doc(), [], tab === "routing" ? "Studio routing" : tab)}</div></section>`;
    wireFields();
    if ($("#import-section"))
      $("#import-section").onclick = () => {
        importMode = tab;
        $("#import-file").click();
      };
    if ($("#export-section"))
      $("#export-section").onclick = () => {
        try {
          validateContent(tab, doc());
          download(
            new Blob([JSON.stringify(doc(), null, 2) + "\n"], {
              type: "application/json",
            }),
            `${active}-${tab}.json`,
          );
          notice("Content JSON exported. This does not publish your changes.");
        } catch (e) {
          notice(e.message, true);
        }
      };
  }
}
function overview() {
  const values = state.studios[active];
  $("#workspace").innerHTML =
    `<section class="panel"><span class="eyebrow">${esc(studio().id)} / workspace</span><h2>A clear view of your content.</h2><p>Manage independent studios from one browser workspace. Each published URL selects its own JSON files. Everything in these files is public.</p><div class="summary-grid">${[
      ["Services", values.services.length],
      ["Projects", values.projects.length],
      ["Testimonials", values.testimonials.length],
      ["Hero slides", values.site.hero.length],
      ["Studio profiles", state.config.studios.length],
      ["New image files", Object.keys(state.assets).length],
    ]
      .map(
        ([title, n]) =>
          `<div class="summary-card"><strong>${n}</strong>${title}</div>`,
      )
      .join(
        "",
      )}</div></section><section class="panel"><h2>Local editing. Deliberate publishing.</h2><ol><li>Edit a studio’s content and URL settings.</li><li>Preview the changes; validate before exporting.</li><li>Export a website update ZIP and extract it into your repository.</li><li>Commit the changed JSON/images and deploy through GitHub Pages.</li></ol><p class="hint">This workspace is not an authentication system. It cannot change files on GitHub or accept private credentials.</p><div class="toolbar"><button id="validate-all">Validate workspace</button><button id="import-bundle" class="secondary">Import workspace JSON</button><button id="restore-draft" class="secondary">Restore browser draft</button><button id="remove-studio" class="danger" ${state.config.studios.length === 1 ? "disabled" : ""}>Remove selected studio</button></div></section><section class="panel"><h3>Local preview default</h3><p class="hint">Only used on localhost. Unknown production domains show an error instead of silently displaying another studio.</p><label for="default-studio">Default studio</label><select id="default-studio">${state.config.studios.map((s) => `<option value="${esc(s.id)}" ${s.id === state.config.defaultStudio ? "selected" : ""}>${esc(s.label)}</option>`).join("")}</select></section>`;
  $("#validate-all").onclick = async () => {
    try {
      validateWorkspace(state);
      await validateAssets();
      notice(
        "All studio configuration, content and image paths passed validation.",
      );
    } catch (e) {
      notice(e.message, true);
    }
  };
  $("#import-bundle").onclick = () => {
    importMode = "bundle";
    $("#import-file").click();
  };
  $("#restore-draft").onclick = () => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("forme-editor-draft") || "null",
      );
      validateWorkspace(saved);
      if (!confirm("Replace this workspace with the saved browser draft?"))
        return;
      replace(saved);
      notice("Browser draft restored. Nothing has been published.");
    } catch (e) {
      notice("No valid browser draft could be restored: " + e.message, true);
    }
  };
  $("#remove-studio").onclick = () => {
    if (state.config.studios.length < 2) return;
    if (
      !confirm(
        "Remove this studio from the exported configuration? Existing deployed files are not deleted automatically.",
      )
    )
      return;
    const id = active;
    state.config.studios = state.config.studios.filter((s) => s.id !== id);
    delete state.studios[id];
    if (state.config.defaultStudio === id)
      state.config.defaultStudio = state.config.studios[0].id;
    active = state.config.defaultStudio;
    mark();
    render();
    notice(
      "Studio mapping removed locally. Delete any retired JSON/image files from the repository separately if appropriate.",
    );
  };
  $("#default-studio").onchange = (e) => {
    state.config.defaultStudio = e.target.value;
    mark();
  };
}
function wireFields() {
  document.querySelectorAll("[data-clear-optional]").forEach(
    (button) =>
      (button.onclick = () => {
        set(JSON.parse(button.dataset.path), null);
        render();
      }),
  );
  document.querySelectorAll("[data-value]").forEach((input) =>
    input.addEventListener("input", () => {
      const path = JSON.parse(input.dataset.path);
      set(
        path,
        input.dataset.kind === "boolean"
          ? input.checked
          : input.dataset.kind === "number"
            ? input.value === ""
              ? null
              : Number(input.value)
            : input.value,
      );
    }),
  );
  document.querySelectorAll("[data-add]").forEach(
    (button) =>
      (button.onclick = () => {
        const path = JSON.parse(button.dataset.path),
          array = get(path),
          key = button.dataset.key;
        array.push(
          clone(
            templates[key] ??
              (array.length && typeof array[0] === "object" ? array[0] : ""),
          ),
        );
        mark();
        render();
      }),
  );
  document.querySelectorAll("[data-remove]").forEach(
    (button) =>
      (button.onclick = () => {
        if (!confirm("Remove this item from your local draft?")) return;
        get(JSON.parse(button.dataset.path)).splice(
          Number(button.dataset.remove),
          1,
        );
        mark();
        render();
      }),
  );
  document.querySelectorAll("[data-move]").forEach(
    (button) =>
      (button.onclick = () => {
        const array = get(JSON.parse(button.dataset.path)),
          a = Number(button.dataset.index),
          b = a + Number(button.dataset.move);
        [array[a], array[b]] = [array[b], array[a]];
        mark();
        render();
      }),
  );
  document.querySelectorAll("[data-optional]").forEach(
    (button) =>
      (button.onclick = () => {
        const path = JSON.parse(button.dataset.path);
        set(path, clone(templates[button.dataset.key] ?? ""));
        render();
      }),
  );
  document.querySelectorAll("[data-upload]").forEach(
    (button) =>
      (button.onclick = () => {
        uploadTarget = {
          studio: active,
          tab,
          path: JSON.parse(button.dataset.path),
        };
        $("#image-file").click();
      }),
  );
}
function validateWorkspace(bundle) {
  if (!bundle || bundle.format !== "forme-workspace-v1")
    throw new Error(
      "Choose a FORME workspace export, not an arbitrary JSON file.",
    );
  validateConfig(bundle.config);
  if (
    !bundle.studios ||
    typeof bundle.studios !== "object" ||
    Array.isArray(bundle.studios)
  )
    throw new Error("Workspace studio content is missing.");
  if (
    !bundle.assets ||
    typeof bundle.assets !== "object" ||
    Array.isArray(bundle.assets)
  )
    throw new Error("Workspace assets must be an object.");
  for (const s of bundle.config.studios) {
    if (!bundle.studios[s.id])
      throw new Error(`${s.id}: studio content is missing.`);
    for (const type of TYPES) validateContent(type, bundle.studios[s.id][type]);
  }
  let total = 0;
  for (const [path, asset] of Object.entries(bundle.assets)) {
    if (
      !safePath(path) ||
      !path.startsWith("assets/images/uploads/") ||
      !asset ||
      !["image/png", "image/jpeg", "image/webp"].includes(asset.mime) ||
      typeof asset.base64 !== "string" ||
      !/^[A-Za-z0-9+/]*={0,2}$/.test(asset.base64)
    )
      throw new Error("Workspace contains an invalid image asset.");
    const bytes = decode(asset.base64);
    total += bytes.length;
    const extension = path.split(".").at(-1);
    if (
      !(
        {
          png: "image/png",
          jpg: "image/jpeg",
          jpeg: "image/jpeg",
          webp: "image/webp",
        }[extension] === asset.mime
      )
    )
      throw new Error(
        "Uploaded asset extension does not match its image type.",
      );
    if (
      bytes.length > 4 * 1024 * 1024 ||
      total > 20 * 1024 * 1024 ||
      imageType(bytes) !== asset.mime
    )
      throw new Error("Invalid image signature or image size limit exceeded.");
  }
  return bundle;
}
function decode(base64) {
  const binary = atob(base64),
    bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
function encode(bytes) {
  let result = "";
  for (let i = 0; i < bytes.length; i += 8192)
    result += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(result);
}
function imageType(bytes) {
  if (
    bytes[0] === 0x89 &&
    String.fromCharCode(...bytes.subarray(1, 4)) === "PNG"
  )
    return "image/png";
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255)
    return "image/jpeg";
  if (
    String.fromCharCode(...bytes.subarray(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.subarray(8, 12)) === "WEBP"
  )
    return "image/webp";
  return "";
}
function replace(bundle) {
  for (const url of objectURLs.values()) URL.revokeObjectURL(url);
  objectURLs.clear();
  state = clone(bundle);
  active = state.config.defaultStudio;
  mark();
  render();
}
function publish() {
  const isLocal = ["localhost", "127.0.0.1", "[::1]"].includes(
    location.hostname,
  );
  $("#workspace").innerHTML =
    `<section class="panel"><h2>Preview before publishing.</h2><p>Preview uses your in-memory draft, including new images. Nothing is sent to a server. Preview remains separate from the public website.</p><div class="toolbar"><button id="refresh-preview">Refresh preview</button><button class="secondary" id="mobile-preview">Toggle mobile width</button></div><iframe class="preview-frame" id="preview-frame" title="Studio draft preview" src="${esc(new URL("index.html?editorPreview=1&studio=" + encodeURIComponent(active), ROOT).href)}"></iframe><p class="hint">${isLocal ? "The local studio query stays attached while navigating the preview." : "Draft preview is limited to the initial page. Publish a studio at its configured URL to test independent routing."}</p></section><section class="panel"><h2>Your export options.</h2><div class="toolbar"><button id="download-workspace">Download workspace JSON</button><button id="download-zip" class="secondary">Download website update ZIP</button></div><p class="hint">Workspace JSON is a portable editing backup. The ZIP contains data/config.json, every studio’s content JSON and newly chosen images. It does not contain the application source or overwrite your repository automatically.</p><h3>Files included</h3><ul class="path-list"><li>data/config.json</li>${state.config.studios.flatMap((s) => TYPES.map((type) => `<li>${esc(s.content[type])}</li>`)).join("")}${Object.keys(
      state.assets,
    )
      .map((path) => `<li>${esc(path)}</li>`)
      .join(
        "",
      )}</ul><details><summary>View central URL configuration</summary><pre class="json-preview">${esc(JSON.stringify(state.config, null, 2))}</pre></details></section>`;
  $("#refresh-preview").onclick = () => {
    $("#preview-frame").src = new URL(
      "index.html?editorPreview=1&studio=" + encodeURIComponent(active),
      ROOT,
    ).href;
  };
  $("#mobile-preview").onclick = () =>
    $("#preview-frame").classList.toggle("mobile-frame");
  $("#download-workspace").onclick = () => {
    try {
      validateWorkspace(state);
      download(
        new Blob([JSON.stringify(state, null, 2) + "\n"], {
          type: "application/json",
        }),
        "studio-workspace.json",
      );
      dirty = false;
      $("#dirty-status").textContent =
        "Workspace backup exported · not published";
      notice(
        "Workspace backup exported. Use the website update ZIP to apply these edits to the repository.",
      );
    } catch (e) {
      notice(e.message, true);
    }
  };
  $("#download-zip").onclick = exportZIP;
}
async function validateAssets() {
  const paths = new Set();
  function visit(value) {
    if (!value || typeof value !== "object") return;
    for (const [key, item] of Object.entries(value)) {
      if (imageKeys.has(key) && typeof item === "string" && item)
        paths.add(item);
      else if (typeof item === "object") visit(item);
    }
  }
  for (const values of Object.values(state.studios)) visit(values);
  for (const path of paths) {
    if (state.assets[path]) continue;
    const response = await fetch(new URL(path, ROOT), {
      method: "HEAD",
      cache: "no-cache",
    });
    if (
      !response.ok ||
      !response.headers.get("content-type")?.startsWith("image/")
    )
      throw new Error("Image asset is missing or is not an image: " + path);
  }
}
async function exportZIP() {
  try {
    validateWorkspace(state);
    await validateAssets();
    const files = [
      ["data/config.json", JSON.stringify(state.config, null, 2) + "\n"],
    ];
    for (const s of state.config.studios)
      for (const type of TYPES)
        files.push([
          s.content[type],
          JSON.stringify(state.studios[s.id][type], null, 2) + "\n",
        ]);
    for (const [path, asset] of Object.entries(state.assets))
      files.push([path, decode(asset.base64)]);
    download(zip(files), "studio-website-update.zip");
    dirty = false;
    $("#dirty-status").textContent = "Website update exported · not published";
    notice(
      "Update ZIP exported. Extract it into the repository root, review the diff, commit and deploy. No website has been changed automatically.",
    );
  } catch (e) {
    notice(e.message, true);
  }
}
window.addEventListener("message", (event) => {
  const frame = $("#preview-frame");
  if (
    event.origin !== location.origin ||
    !frame ||
    event.source !== frame.contentWindow ||
    event.data?.type !== "forme:preview-ready"
  )
    return;
  try {
    for (const type of TYPES)
      validateContent(type, state.studios[active][type]);
    const assets = {};
    for (const path of Object.keys(state.assets))
      assets[path] = previewAsset(path);
    frame.contentWindow.postMessage(
      {
        type: "forme:preview-content",
        studioId: active,
        values: TYPES.map((type) => state.studios[active][type]),
        assets,
      },
      location.origin,
    );
  } catch (e) {
    notice("Preview blocked: " + e.message, true);
  }
});
$("#studio-select").onchange = (e) => {
  active = e.target.value;
  render();
};
$("#tabs").onclick = (e) => {
  const button = e.target.closest("[data-tab]");
  if (button) {
    tab = button.dataset.tab;
    notice("");
    render();
  }
};
$("#export-zip").onclick = exportZIP;
$("#save-draft").onclick = () => {
  try {
    validateWorkspace(state);
    localStorage.setItem("forme-editor-draft", JSON.stringify(state));
    notice(
      "Draft saved in this browser only. It is not published and is not a password-protected backup.",
    );
  } catch (e) {
    notice("Draft not saved: " + e.message, true);
  }
};
$("#import-file").onchange = async (event) => {
  const file = event.target.files[0];
  event.target.value = "";
  if (!file) return;
  try {
    if (file.size > 30 * 1024 * 1024)
      throw new Error("JSON imports must be under 30 MB.");
    const value = JSON.parse(await file.text());
    if (importMode === "bundle") {
      validateWorkspace(value);
      if (!confirm("Replace the current browser workspace with this import?"))
        return;
      replace(value);
    } else {
      validateContent(importMode, value);
      if (!confirm("Replace this section in your local draft?")) return;
      state.studios[active][importMode] = clone(value);
      mark();
      render();
    }
    notice("Import complete. No files have been published.");
  } catch (e) {
    notice("Import rejected: " + e.message, true);
  }
};
$("#image-file").onchange = async (event) => {
  const file = event.target.files[0];
  event.target.value = "";
  if (!file) return;
  try {
    if (file.size > 4 * 1024 * 1024)
      throw new Error("Choose an image under 4 MB.");
    if (
      !uploadTarget ||
      uploadTarget.studio !== active ||
      uploadTarget.tab !== tab
    )
      throw new Error("Studio changed; choose the target image again.");
    const bytes = new Uint8Array(await file.arrayBuffer()),
      mime = imageType(bytes);
    if (!mime)
      throw new Error(
        "Only PNG, JPEG and WebP images are supported. SVG uploads are not accepted.",
      );
    const bitmap = await createImageBitmap(file);
    const pixels = bitmap.width * bitmap.height;
    bitmap.close();
    if (pixels > 40000000)
      throw new Error(
        "Image dimensions are too large; resize before importing.",
      );
    const ext = {
        "image/png": "png",
        "image/jpeg": "jpg",
        "image/webp": "webp",
      }[mime],
      path = `assets/images/uploads/${active}/${crypto.randomUUID()}.${ext}`;
    const next = clone(state);
    next.assets[path] = { mime, base64: encode(bytes) };
    validateWorkspace(next);
    state.assets[path] = next.assets[path];
    set(uploadTarget.path, path);
    render();
    notice("Image added to this draft. It will be included in your export.");
  } catch (e) {
    notice(e.message, true);
  }
};
$("#add-studio").onclick = () => {
  $("#new-studio-form").reset();
  $("#new-error").textContent = "";
  $("#new-studio").showModal();
};
$("#cancel-new").onclick = () => $("#new-studio").close();
$("#new-studio-form").onsubmit = (event) => {
  event.preventDefault();
  try {
    const id = $("#new-id").value.trim(),
      name = $("#new-label").value.trim(),
      url = $("#new-url").value.trim(),
      next = clone(state);
    const entry = {
      id,
      label: name,
      urls: [url],
      admin: { contactEmail: "" },
      content: Object.fromEntries(
        TYPES.map((type) => [type, `data/studios/${id}/${type}.json`]),
      ),
    };
    next.config.studios.push(entry);
    next.studios[id] = clone(state.studios[active]);
    next.studios[id].site.name = name;
    next.studios[id].site.placeholder = true;
    for (const project of next.studios[id].projects) {
      project.demo = true;
      project.verified = false;
      project.comparison = null;
    }
    next.studios[id].testimonials = [];
    next.studios[id].site.stats = [];
    next.studios[id].site.team = [];
    next.studios[id].site.achievements = [];
    for (const key of ["phone", "whatsapp", "email", "address", "hours"])
      next.studios[id].site[key] = "";
    validateWorkspace(next);
    state = next;
    active = id;
    $("#new-studio").close();
    tab = "site";
    mark();
    render();
    notice(
      "New studio created with separate JSON paths and concept content. Confirm all content before publishing.",
    );
  } catch (e) {
    $("#new-error").textContent = e.message;
  }
};
addEventListener("beforeunload", (event) => {
  if (dirty) {
    event.preventDefault();
    event.returnValue = "";
  }
});
try {
  const config = validateConfig(await readJSON("data/config.json"));
  state = { format: "forme-workspace-v1", config, studios: {}, assets: {} };
  for (const s of config.studios) {
    const values = await Promise.all(
      TYPES.map((type) =>
        readJSON(s.content[type]).then((value) => validateContent(type, value)),
      ),
    );
    state.studios[s.id] = Object.fromEntries(
      TYPES.map((type, i) => [type, values[i]]),
    );
  }
  active = config.defaultStudio;
  render();
} catch (e) {
  $("#workspace").innerHTML =
    '<section class="panel"><h2>Content could not be loaded.</h2><p>Serve the repository using a local HTTP server, check JSON files and refresh.</p></section>';
  notice(e.message, true);
}
