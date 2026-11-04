/** Shared public-content model. These files contain no credentials. */
export const ROOT = new URL("../", import.meta.url);
export const TYPES = ["site", "services", "projects", "testimonials"];
export const safePath = (value) =>
  typeof value === "string" &&
  /^(?:data|assets)\/[A-Za-z0-9_./-]+$/.test(value) &&
  !value.split("/").includes("..") &&
  !value.includes("//");
let previewAssets = {};
export const contentAsset = (path) => previewAssets[path] || path;
const imagePath = (value) => safePath(value) && value.startsWith("assets/");
const object = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const string = (value) => typeof value === "string";
const fail = (message) => {
  throw new Error(message);
};
export function validateConfig(config) {
  if (
    !object(config) ||
    config.version !== 1 ||
    !Array.isArray(config.studios) ||
    !config.studios.length
  )
    fail("Configuration requires version 1 and at least one studio.");
  const ids = new Set(),
    routes = new Set(),
    files = new Set();
  for (const studio of config.studios) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(studio.id) || ids.has(studio.id))
      fail("Studio IDs must be unique lowercase slugs.");
    ids.add(studio.id);
    if (!string(studio.label) || !studio.label.trim())
      fail(`${studio.id}: provide a studio label.`);
    if (!Array.isArray(studio.urls) || !studio.urls.length)
      fail(`${studio.id}: provide a published URL.`);
    for (const value of studio.urls) {
      let url;
      try {
        url = new URL(value);
      } catch {
        fail(`${studio.id}: invalid published URL.`);
      }
      if (
        !["http:", "https:"].includes(url.protocol) ||
        url.username ||
        url.password ||
        url.search ||
        url.hash ||
        !url.pathname.endsWith("/")
      )
        fail(
          "Studio URLs must use HTTP(S), end with /, and contain no credentials, query or fragment.",
        );
      const key = url.origin + url.pathname;
      if (routes.has(key))
        fail("Two studios cannot use the same published URL.");
      routes.add(key);
    }
    for (const type of TYPES) {
      const path = studio.content?.[type];
      if (
        !safePath(path) ||
        !path.startsWith("data/") ||
        !path.endsWith(".json") ||
        path === "data/config.json" ||
        files.has(path)
      )
        fail(`${studio.id}: ${type} must use a unique safe data/*.json path.`);
      files.add(path);
    }
    if (!object(studio.admin) || !string(studio.admin.contactEmail))
      fail("Provide admin.contactEmail (contact metadata only).");
    if (
      studio.admin.contactEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(studio.admin.contactEmail)
    )
      fail("Owner contact email is invalid.");
    if (
      Object.keys(studio.admin).some((key) => key !== "contactEmail") ||
      "password" in studio
    )
      fail(
        "Passwords do not belong in public configuration. This editor has no login.",
      );
  }
  if (!ids.has(config.defaultStudio))
    fail("Default studio must reference a configured studio ID.");
  return config;
}
export function resolveStudio(config, href = location.href) {
  validateConfig(config);
  const current = new URL(href);
  if (["localhost", "127.0.0.1", "[::1]"].includes(current.hostname)) {
    const id = current.searchParams.get("studio") || config.defaultStudio;
    return (
      config.studios.find((s) => s.id === id) ||
      fail("The requested local studio does not exist.")
    );
  }
  const matches = config.studios
    .flatMap((studio) =>
      studio.urls.map((value) => ({ studio, url: new URL(value) })),
    )
    .filter(
      ({ url }) =>
        url.origin === current.origin &&
        (current.pathname.startsWith(url.pathname) ||
          current.pathname + "/" === url.pathname),
    )
    .sort((a, b) => b.url.pathname.length - a.url.pathname.length);
  if (!matches.length)
    fail("No studio is configured for this URL. Check data/config.json.");
  return matches[0].studio;
}
export function validateContent(type, value) {
  if (type === "site") {
    if (
      !object(value) ||
      !string(value.name) ||
      !value.name.trim() ||
      !Array.isArray(value.hero) ||
      !value.hero.length
    )
      fail("Site requires a name and at least one hero slide.");
    for (const key of [
      "descriptor",
      "description",
      "phone",
      "whatsapp",
      "email",
      "address",
      "hours",
    ])
      if (!string(value[key])) fail(`Site ${key} must be text.`);
    for (const key of [
      "locations",
      "socials",
      "stats",
      "team",
      "achievements",
      "timeSlots",
    ])
      if (!Array.isArray(value[key])) fail(`Site ${key} must be a list.`);
    for (const slide of value.hero)
      if (
        !string(slide.title) ||
        !slide.title.trim() ||
        !imagePath(slide.image) ||
        !string(slide.alt) ||
        !slide.alt.trim() ||
        !string(slide.label)
      )
        fail("Each hero slide needs a title, image path, alt text and label.");
    for (const time of value.timeSlots)
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time))
        fail("Time slots must use HH:MM.");
    for (const stat of value.stats)
      if (
        !object(stat) ||
        !Number.isFinite(stat.value) ||
        !string(stat.label) ||
        typeof stat.verified !== "boolean"
      )
        fail("Statistics require a numeric value, label and verified flag.");
    for (const person of value.team)
      if (!object(person) || !string(person.name) || !string(person.role))
        fail("Team members require name and role.");
    for (const social of value.socials) {
      try {
        if (!string(social.label) || new URL(social.url).protocol !== "https:")
          throw new Error();
      } catch {
        fail("Social links require a label and an HTTPS URL.");
      }
    }
    if (value.logo && !imagePath(value.logo))
      fail("Logo must use a safe asset path.");
    if (value.whatsapp && !/^\d{10,15}$/.test(value.whatsapp))
      fail(
        "WhatsApp number must use 10–15 country-code digits without spaces or +.",
      );
    if (value.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email))
      fail("Studio email address is invalid.");
    for (const key of ["locations", "achievements"])
      if (value[key].some((item) => !string(item)))
        fail(`${key} must contain text only.`);
    for (const key of ["process", "principles"])
      if (
        value[key] !== undefined &&
        (!Array.isArray(value[key]) ||
          value[key].some(
            (item) =>
              !object(item) || !string(item.title) || !string(item.description),
          ))
      )
        fail(`${key} requires a list of title/description objects.`);
    for (const key of ["home", "about", "cta"])
      if (value[key] !== undefined) {
        if (
          !object(value[key]) ||
          Object.values(value[key]).some((item) => !string(item))
        )
          fail(`${key} copy must contain text fields.`);
        if (value[key].image && !imagePath(value[key].image))
          fail(`${key} image path is invalid.`);
      }
    if (value.pages !== undefined) {
      if (!object(value.pages)) fail("Page copy must be an object.");
      for (const entry of Object.values(value.pages))
        if (
          !object(entry) ||
          !string(entry.title) ||
          !string(entry.description)
        )
          fail("Each page requires a title and description.");
    }

    return value;
  }
  if (!Array.isArray(value)) fail(`${type} must be a JSON array.`);
  const ids = new Set();
  for (const row of value) {
    if (!object(row)) fail(`${type} entries must be objects.`);
    if (type === "services") {
      if (
        !string(row.id) ||
        !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(row.id) ||
        ids.has(row.id) ||
        !string(row.title) ||
        !row.title.trim() ||
        !string(row.description) ||
        !imagePath(row.image) ||
        !Array.isArray(row.items) ||
        row.items.some((x) => !string(x))
      )
        fail(
          "Services need unique IDs, title, description, image and a text list of subservices.",
        );
      ids.add(row.id);
    }
    if (type === "projects") {
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(row.slug) || ids.has(row.slug))
        fail("Project slugs must be unique lowercase URL slugs.");
      ids.add(row.slug);
      for (const field of [
        "title",
        "category",
        "room",
        "location",
        "description",
      ])
        if (!string(row[field]) || !row[field].trim())
          fail(`Project ${row.slug} needs ${field}.`);
      if (
        !imagePath(row.cover) ||
        !Array.isArray(row.scope) ||
        row.scope.some((x) => !string(x)) ||
        !Array.isArray(row.images) ||
        !row.images.length
      )
        fail("Project requires a cover, design scope and at least one image.");
      for (const image of row.images)
        if (!imagePath(image.src) || !string(image.alt) || !image.alt.trim())
          fail("Project images need safe paths and meaningful alt text.");
      if (typeof row.demo !== "boolean" || (!row.demo && row.verified !== true))
        fail("Actual projects must be verified; otherwise mark them as demo.");
      if (row.comparison) {
        for (const k of ["before", "after"])
          if (!imagePath(row.comparison[k]))
            fail("Comparison pairs need both image paths.");
        for (const k of ["beforeAlt", "afterAlt"])
          if (!string(row.comparison[k]) || !row.comparison[k].trim())
            fail("Comparison pairs need alt text.");
        if (
          row.comparison.before === row.comparison.after ||
          typeof row.comparison.verified !== "boolean"
        )
          fail("Comparison images must differ and have a verified flag.");
      }
    }
    if (
      type === "testimonials" &&
      (!string(row.name) ||
        !row.name.trim() ||
        !string(row.quote) ||
        !row.quote.trim() ||
        typeof row.verified !== "boolean")
    )
      fail("Testimonials require a name, quote and verified flag.");
  }
  return value;
}
export async function readJSON(path) {
  if (!safePath(path)) fail("Unsafe JSON content path.");
  const response = await fetch(new URL(path, ROOT), { cache: "no-cache" });
  if (!response.ok) fail(`Could not load ${path} (HTTP ${response.status}).`);
  return response.json();
}
export async function loadPublicContent() {
  if (
    new URLSearchParams(location.search).get("editorPreview") === "1" &&
    parent !== window
  ) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        removeEventListener("message", receive);
        reject(
          new Error("Editor preview timed out. Refresh it from the workspace."),
        );
      }, 10000);
      function receive(event) {
        if (
          event.origin !== location.origin ||
          event.source !== parent ||
          event.data?.type !== "forme:preview-content"
        )
          return;
        try {
          if (
            !Array.isArray(event.data.values) ||
            event.data.values.length !== TYPES.length
          )
            fail("Preview content is incomplete.");
          event.data.values.forEach((value, index) =>
            validateContent(TYPES[index], value),
          );
          const assets = event.data.assets || {};
          for (const [path, url] of Object.entries(assets))
            if (
              !imagePath(path) ||
              typeof url !== "string" ||
              !url.startsWith("blob:" + location.origin + "/")
            )
              fail("Unsafe preview asset.");
          previewAssets = assets;
          clearTimeout(timer);
          removeEventListener("message", receive);
          resolve({
            studio: { id: String(event.data.studioId) },
            values: event.data.values,
          });
        } catch (error) {
          clearTimeout(timer);
          removeEventListener("message", receive);
          reject(error);
        }
      }
      addEventListener("message", receive);
      parent.postMessage({ type: "forme:preview-ready" }, location.origin);
    });
  }

  const config = validateConfig(await readJSON("data/config.json"));
  const studio = resolveStudio(config);
  const values = await Promise.all(
    TYPES.map((type) =>
      readJSON(studio.content[type]).then((value) =>
        validateContent(type, value),
      ),
    ),
  );
  return { config, studio, values };
}
