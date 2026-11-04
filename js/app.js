import { loadPublicContent, contentAsset } from "./content-store.js";
import { initializeMotion, animateHeading } from "./motion.js";
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const asset = (value) =>
  /^(assets\/[\w./-]+)$/.test(value || "") && !value.includes("..")
    ? contentAsset(value)
    : "assets/images/living.svg";
const https = (value) => {
  try {
    const u = new URL(value);
    return u.protocol === "https:" ? u.href : "";
  } catch {
    return "";
  }
};
const image = (src, alt, eager = false) =>
  `<img src="${esc(asset(src))}" ${src === "assets/images/living-concept.webp" ? 'srcset="assets/images/living-concept-768.webp 768w, assets/images/living-concept.webp 1536w" sizes="(max-width: 760px) 100vw, 100vw"' : ""} alt="${esc(alt)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" width="1600" height="1000">`;
const link = (href, label, cls = "button") =>
  `<a class="${cls}" href="${esc(href)}">${label}<svg class="arrow-icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M5 19 19 5M5 5h14v14"/></svg></a>`;
const heading = (kicker, title, text = "") =>
  `<div class="container"><div class="page-heading"><p class="eyebrow">${esc(kicker)}</p><h1>${esc(title)}</h1>${text ? `<p class="intro muted">${esc(text)}</p>` : ""}</div></div>`;
let note =
  '<p class="notice">Demonstration portfolio. Studio identity and design studies are placeholders, not completed client work.</p>';
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
let site, services, projects, testimonials;
const page = document.body.dataset.page;
const main = $("#main");
function brand() {
  return `<a class="brand" href="index.html" aria-label="${esc(site.name)} home">${site.logo ? `<img class="brand-logo" src="${esc(asset(site.logo))}" alt="">` : `<span class="brand-mark" aria-hidden="true">${esc(site.monogram || "f.")}</span>`}<span class="brand-name">${esc(site.name)}<small>${esc(site.descriptor)}</small></span></a>`;
}
function shell() {
  const nav = [
    ["index", "Home"],
    ["about", "Our studio"],
    ["portfolio", "Portfolio"],
    ["contact", "Contact"],
  ];
  $("#header").innerHTML =
    `<div class="container header-inner">${brand()}<button class="menu-button" aria-controls="navigation" aria-expanded="false">Menu ☰</button><nav class="nav" id="navigation" aria-label="Main navigation">${nav
      .slice(0, 2)
      .map(
        ([p, t]) =>
          `<a href="${p}.html" ${p === page ? 'aria-current="page"' : ""}>${t}</a>`,
      )
      .join(
        "",
      )}<details><summary>Expertise</summary><div class="submenu"><a href="services.html">All services</a><a href="services.html#service-1">Architecture</a><a href="services.html#service-2">Interiors</a><a href="before-after.html">Before & after</a></div></details>${nav
      .slice(2)
      .map(
        ([p, t]) =>
          `<a href="${p}.html" ${p === page ? 'aria-current="page"' : ""}>${t}</a>`,
      )
      .join("")}${link("appointment.html", "Let’s talk")}</nav></div>`;
  const menu = $(".menu-button"),
    navigation = $(".nav");
  menu.onclick = () => {
    const open = menu.getAttribute("aria-expanded") !== "true";
    menu.setAttribute("aria-expanded", String(open));
    navigation.classList.toggle("open", open);
  };
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      menu.setAttribute("aria-expanded", "false");
      navigation.classList.remove("open");
      $$("details[open]").forEach((d) => (d.open = false));
    }
  });
  document.addEventListener("click", (e) => {
    $$("details[open]").forEach((d) => {
      if (!d.contains(e.target)) d.open = false;
    });
  });
  addEventListener(
    "scroll",
    () => $("#header").classList.toggle("scrolled", scrollY > 30),
    { passive: true },
  );
  $("#footer").innerHTML =
    `<div class="container footer-main"><div>${brand()}<p class="muted" style="margin-top:1.5rem">${esc(site.footerDescription || site.description)}</p></div><div><p class="eyebrow">Explore</p><a href="about.html">Our studio</a><a href="services.html">Our expertise</a><a href="portfolio.html">Design studies</a><a href="before-after.html">Before & after</a></div><div><p class="eyebrow">Start something</p><a href="appointment.html">Book a consultation</a><a href="contact.html">Get in touch</a><p class="muted">${esc(site.email || "Studio contact details coming soon.")}</p></div></div><div class="container footer-bottom"><span>© ${new Date().getFullYear()} ${esc(site.name)}${site.placeholder ? " · Studio concept" : ""}</span><span>Architecture & interiors, thoughtfully together.</span></div>`;
  document.body.insertAdjacentHTML(
    "beforeend",
    link(
      businessNumber()
        ? "https://wa.me/" + businessNumber()
        : "appointment.html",
      businessNumber() ? "Consult on WhatsApp" : "Let’s talk about your space",
      "floating",
    ),
  );
}
function card(p) {
  return `<a class="card" href="project.html?slug=${encodeURIComponent(p.slug)}"><div class="card-image">${image(p.cover, p.images?.[0]?.alt || p.title)}${p.demo ? '<span class="pill">CONCEPT STUDY</span>' : ""}</div><h3>${esc(p.title)}</h3><div class="card-meta"><span>${esc(p.category)} / ${esc(p.room)}</span><svg class="arrow-icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M5 19 19 5M5 5h14v14"/></svg></div></a>`;
}
function cta() {
  return `<section class="cta dark"><p class="eyebrow">${esc(site.cta?.eyebrow || "Let’s talk")}</p><h2>${esc(site.cta?.title || "Your next space starts here.")}</h2><p class="muted">${esc(site.cta?.description || site.description)}</p>${link("appointment.html", esc(site.cta?.buttonLabel || "Book consultation"), "button light")}</section>`;
}
const process = () =>
  `<div class="steps">${(site.process || []).map((item, i) => `<div class="step reveal"><span class="number">0${i + 1}</span><h3>${esc(item.title)}</h3><p>${esc(item.description)}</p></div>`).join("")}</div>`;
function home() {
  main.innerHTML = `<section class="hero" aria-label="Featured design concepts" aria-roledescription="carousel"><div class="hero-slides">${site.hero.map((s, i) => `<div class="hero-slide ${i === 0 ? "active" : ""}" aria-hidden="${i !== 0}">${image(s.image, s.alt, i === 0)}</div>`).join("")}</div><div class="hero-shade"></div><span class="hero-tag">${site.placeholder ? "ILLUSTRATIVE CONCEPT · NOT CLIENT WORK" : esc(site.descriptor)}</span><div class="container"><p class="eyebrow" id="hero-label"></p><h1 id="hero-title"></h1><p>${esc(site.home?.heroDescription || site.description)}</p><div class="hero-actions">${link("portfolio.html", "Explore our spaces", "button light")}${link("appointment.html", "Let’s create something", "text-link")}</div></div><div class="hero-bottom"><span>SCROLL TO DISCOVER ↓</span><div class="slider-controls"><span id="slide-count"></span><button class="icon-button" id="hero-prev" aria-label="Previous hero slide">←</button><button class="icon-button" id="hero-next" aria-label="Next hero slide">→</button><button class="icon-button" id="hero-pause" aria-label="Pause slideshow">Ⅱ</button></div></div></section><div class="ribbon"><span>Architecture</span><span aria-hidden="true">✦</span><span>Interiors</span><span aria-hidden="true">✦</span><span>Thoughtful details</span><span aria-hidden="true">✦</span><span>Timeless living</span></div><section class="container section split"><div class="reveal"><p class="eyebrow">${esc(site.home?.introEyebrow || "Our approach")}</p><h2>${esc(site.home?.introTitle || site.tagline)}</h2><p class="muted intro">${esc(site.home?.introText || site.description)}</p><p class="muted">${esc(site.home?.introSecondary || "")}</p>${link("about.html", "Discover our philosophy", "text-link")}</div><div><div class="editorial-image">${image(site.home?.image || "assets/images/bedroom.svg", site.home?.imageAlt || "Interior concept")}</div><p class="image-note">Material & mood study · illustrative concept</p></div></section><section class="surface section"><div class="container"><div class="section-top"><div><p class="eyebrow">What we do</p><h2>One vision.<br>Every considered detail.</h2></div>${link("services.html", "Explore our expertise", "text-link")}</div><div class="grid">${services
    .slice(0, 3)
    .map(
      (s, i) =>
        `<a class="card" href="services.html#service-${s.id}"><div class="card-image">${image(s.image, s.title + " illustrative design concept")}</div><p class="eyebrow" style="margin-top:1.5rem">0${i + 1} / Our expertise</p><h3>${esc(s.title)}</h3><p class="muted">${esc(s.description)}</p><span class="text-link">Discover more ↗</span></a>`,
    )
    .join(
      "",
    )}</div></div></section><section class="container section"><div class="section-top"><div><p class="eyebrow">Selected design studies</p><h2>A little inspiration.<br>A world of possibilities.</h2></div><div class="slider-controls"><button class="icon-button" id="projects-prev" aria-label="Scroll projects backward">←</button><button class="icon-button" id="projects-next" aria-label="Scroll projects forward">→</button></div></div><div class="carousel-track" id="featured-projects">${projects.slice(0, 5).map(card).join("")}</div><p class="image-note">Original sample concepts. Real project photography and credits will be added after studio approval.</p></section><section class="surface section"><div class="container"><p class="eyebrow">The difference is in the details</p><h2>Good design goes<br>beyond the beautiful.</h2><div class="principles">${(
    site.principles || []
  )
    .map(
      (item, i) =>
        `<div class="reveal"><span class="number">0${i + 1}</span><h3>${esc(item.title)}</h3><p>${esc(item.description)}</p></div>`,
    )
    .join(
      "",
    )}</div><div id="statistics"></div></div></section><section class="container section"><p class="eyebrow">From first thought to final detail</p><h2>A thoughtful journey,<br>together.</h2>${process()}</section><section class="surface section"><div class="container split"><div><p class="eyebrow">A fresh perspective</p><h2>The potential<br>in every space.</h2><p class="muted">Explore how considered design can transform the way a space feels and functions.</p>${link("before-after.html", "Explore before & after", "text-link")}</div><div class="empty"><h3>Real transformations, coming soon.</h3><p>Verified before and after photographs will appear here when matching project pairs are available.</p></div></div></section><section class="container section" id="testimonials"></section>${cta()}`;
  let active = 0,
    paused = reduced.matches,
    timer;
  function show(n) {
    active = (n + site.hero.length) % site.hero.length;
    $$(".hero-slide").forEach((el, i) => {
      el.classList.toggle("active", i === active);
      el.setAttribute("aria-hidden", String(i !== active));
    });
    $("#hero-title").textContent = site.hero[active].title;
    animateHeading($("#hero-title"));
    $("#hero-label").textContent = site.hero[active].label;
    $("#slide-count").textContent = `0${active + 1} / 0${site.hero.length}`;
  }
  function schedule() {
    clearInterval(timer);
    if (
      !paused &&
      !document.documentElement.classList.contains("motion-paused")
    )
      timer = setInterval(() => {
        if (
          !document.hidden &&
          !$(".hero").matches(":hover") &&
          !$(".hero").contains(document.activeElement)
        )
          show(active + 1);
      }, 6500);
    $("#hero-pause").innerHTML = paused
      ? '<svg class="control-icon" aria-hidden="true" viewBox="0 0 24 24"><path d="m8 5 11 7-11 7Z" fill="currentColor"/></svg>'
      : '<svg class="control-icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M8 5v14M16 5v14" stroke="currentColor" stroke-width="3"/></svg>';
    $("#hero-pause").setAttribute(
      "aria-label",
      paused ? "Play slideshow" : "Pause slideshow",
    );
  }
  $("#hero-prev").onclick = () => show(active - 1);
  $("#hero-next").onclick = () => show(active + 1);
  $("#hero-pause").onclick = () => {
    paused = !paused;
    schedule();
  };
  reduced.addEventListener("change", () => {
    paused = reduced.matches;
    schedule();
  });
  document.addEventListener("site:motion", (event) => {
    if (event.detail.paused) {
      paused = true;
      schedule();
    }
  });
  show(0);
  schedule();
  for (const [id, direction] of [
    ["projects-prev", -1],
    ["projects-next", 1],
  ])
    $("#" + id).onclick = () =>
      $("#featured-projects").scrollBy({
        left: direction * $("#featured-projects").clientWidth * 0.8,
        behavior: reduced.matches ? "instant" : "smooth",
      });
  renderTestimonials();
  renderStats();
}
function renderStats() {
  const root = $("#statistics");
  if (!root || !site.stats.length) return;
  root.innerHTML = `<div class="stat-grid">${site.stats
    .filter((s) => s.verified && Number.isFinite(s.value))
    .map(
      (s) =>
        `<div class="stat"><strong data-count="${s.value}">0</strong><span>${esc(s.label)}</span></div>`,
    )
    .join("")}</div>`;
  const o = new IntersectionObserver((es) =>
    es.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target,
        end = Number(el.dataset.count),
        start = performance.now();
      function tick(t) {
        const progress = reduced.matches ? 1 : Math.min((t - start) / 1400, 1);
        el.textContent = Math.round(end * progress);
        if (progress < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
      o.unobserve(el);
    }),
  );
  $$("[data-count]").forEach((el) => o.observe(el));
}
function renderTestimonials() {
  const root = $("#testimonials");
  const entries = testimonials.filter((t) => t.verified);
  if (!entries.length) {
    root.innerHTML =
      '<p class="eyebrow">Client perspectives</p><h2>Trust is earned.<br>Stories will follow.</h2><p class="muted">Verified client testimonials will be shared here with permission.</p>';
    return;
  }
  let i = 0;
  root.innerHTML =
    '<p class="eyebrow">Client perspectives</p><div id="quote" aria-live="polite"></div><div class="slider-controls"><button class="icon-button" id="quote-prev" aria-label="Previous testimonial">←</button><button class="icon-button" id="quote-next" aria-label="Next testimonial">→</button></div>';
  const show = () => {
    $("#quote").innerHTML =
      `<blockquote>“${esc(entries[i].quote)}”</blockquote><p>${esc(entries[i].name)}</p>`;
  };
  $("#quote-prev").onclick = () => {
    i = (i + entries.length - 1) % entries.length;
    show();
  };
  $("#quote-next").onclick = () => {
    i = (i + 1) % entries.length;
    show();
  };
  show();
}
function about() {
  main.innerHTML =
    heading(
      "Our studio",
      "Spaces with purpose.\nDesign with soul.",
      "A portfolio concept built on a simple belief: good design makes everyday living better.",
    ) +
    `<section class="container section split"><div class="editorial-image">${image(site.about?.image || "assets/images/living.svg", site.about?.imageAlt || "Interior concept")}</div><div><p class="eyebrow">Our philosophy</p><h2>${esc(site.about?.title || site.tagline)}</h2><p class="muted">${esc(site.about?.description || site.description)}</p>${note}</div></section><section class="surface section"><div class="container grid"><div><p class="eyebrow">Our mission</p><h3>${esc(site.about?.missionTitle || "Our mission")}</h3><p>${esc(site.about?.missionText || "")}</p></div><div><p class="eyebrow">Our vision</p><h3>${esc(site.about?.visionTitle || "Our vision")}</h3><p>${esc(site.about?.visionText || "")}</p></div><div><p class="eyebrow">People & milestones</p><h3>A studio taking shape.</h3><p>${site.team.length ? site.team.map((t) => esc(t.name) + " — " + esc(t.role)).join("<br>") : "Founder, team credentials and verified achievements await studio confirmation."}</p>${site.achievements.map((a) => `<p>${esc(a)}</p>`).join("")}</div></div></section><section class="container section"><p class="eyebrow">Our approach</p><h2>Considered at every stage.</h2>${process()}<h3 style="margin-top:4rem">Where we work</h3><p>${site.locations.length ? site.locations.map(esc).join(" · ") : "Service locations will be published after studio confirmation."}</p></section>${cta()}`;
}
function servicePage() {
  main.innerHTML =
    heading(
      "Our expertise",
      "A complete view.\nA considered detail.",
      "From the architecture of a room to the light that falls within it, explore our proposed design scope.",
    ) +
    `<section class="container section"><div class="grid">${services.map((s) => `<article class="service" id="service-${esc(s.id)}">${image(s.image, s.title + " illustrative concept")}<h2>${esc(s.title)}</h2><p class="muted">${esc(s.description)}</p><ul>${s.items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>${link("portfolio.html?search=" + encodeURIComponent(s.title.split(" ")[0]), "Explore design examples", "text-link")}<p>${link("appointment.html?service=" + encodeURIComponent(s.title), "Discuss your requirements", "text-link")}</p></article>`).join("")}</div></section>${cta()}`;
}
function portfolio() {
  main.innerHTML =
    heading(
      "The portfolio",
      "Different spaces.\nOne thoughtful approach.",
      "Explore the sample collection by project type or room. All current entries are clearly labelled illustrative concepts.",
    ) +
    `<section class="container section" style="padding-top:1rem"><div class="search-row"><label for="search">Find your inspiration</label><input id="search" type="search" placeholder="Search projects, rooms, materials…"></div><div class="filters" id="category-filters" aria-label="Project categories"></div><div class="search-row"><label for="room">View by room</label><select id="room" style="max-width:260px"><option value="">All rooms</option>${[...new Set(projects.map((p) => p.room))].map((r) => `<option>${esc(r)}</option>`).join("")}</select><span id="result-count" role="status"></span></div><div class="grid" id="project-grid"></div><div class="load-wrap"><button class="button outline" id="load-more">Load more studies ↓</button></div></section>${cta()}`;
  let category = "",
    limit = 6;
  const categories = ["", ...new Set(projects.map((p) => p.category))];
  $("#category-filters").innerHTML = categories
    .map(
      (c) =>
        `<button class="filter" data-category="${esc(c)}" aria-pressed="${c === ""}">${esc(c || "All projects")}</button>`,
    )
    .join("");
  const draw = () => {
    const q = $("#search").value.trim().toLowerCase(),
      room = $("#room").value;
    const found = projects.filter(
      (p) =>
        (!category || p.category === category) &&
        (!room || p.room === room) &&
        [p.title, p.description, p.room, p.category, ...p.scope]
          .join(" ")
          .toLowerCase()
          .includes(q),
    );
    $("#project-grid").innerHTML = found.length
      ? found.slice(0, limit).map(card).join("")
      : '<div class="empty"><h3>No spaces found just yet.</h3><p>Try a different search, category or room.</p><button class="button outline" id="clear-filters">Clear filters</button></div>';
    $("#result-count").textContent =
      `${found.length} ${found.length === 1 ? "study" : "studies"}`;
    $("#load-more").hidden = found.length <= limit;
    if ($("#clear-filters"))
      $("#clear-filters").onclick = () => {
        category = "";
        $("#search").value = "";
        $("#room").value = "";
        limit = 6;
        sync();
        draw();
      };
  };
  const sync = () =>
    $$("[data-category]").forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.category === category)),
    );
  $$("[data-category]").forEach(
    (b) =>
      (b.onclick = () => {
        category = b.dataset.category;
        limit = 6;
        sync();
        draw();
      }),
  );
  $("#search").value = new URLSearchParams(location.search).get("search") || "";
  $("#search").oninput = () => {
    limit = 6;
    draw();
  };
  $("#room").onchange = () => {
    limit = 6;
    draw();
  };
  $("#load-more").onclick = () => {
    limit += 6;
    draw();
  };
  draw();
}
function comparison(p) {
  const c = p.comparison;
  return `<article><h2>${esc(p.title)}</h2><div class="comparison" style="--position:50%">${image(c.before, c.beforeAlt)}<div class="after">${image(c.after, c.afterAlt)}</div><span class="compare-label before">Before</span><span class="compare-label after-label">After</span><span class="comparison-divider"></span><input type="range" min="0" max="100" value="50" aria-label="Reveal before and after for ${esc(p.title)}" aria-valuetext="50% after image revealed"></div><p class="image-note">Drag, touch, or use arrow keys to compare.</p>${link("project.html?slug=" + encodeURIComponent(p.slug), "Explore this project", "text-link")}</article>`;
}
function wireComparisons() {
  $$(".comparison input").forEach(
    (input) =>
      (input.oninput = () => {
        input
          .closest(".comparison")
          .style.setProperty("--position", input.value + "%");
        input.setAttribute(
          "aria-valuetext",
          `${100 - Number(input.value)}% after image revealed`,
        );
      }),
  );
}
function beforeAfter() {
  const pairs = projects.filter(
    (p) => p.comparison?.verified && p.comparison.before && p.comparison.after,
  );
  main.innerHTML =
    heading(
      "Before & after",
      "New life.\nSame space.",
      "A closer look at transformations, documented with matching photographs from the same project.",
    ) +
    `<section class="container section" style="padding-top:1rem">${pairs.length ? pairs.map(comparison).join("") : '<div class="empty"><p class="eyebrow">Authenticity first</p><h2>A transformation worth sharing.</h2><p>Verified matching before and after photographs have not been supplied yet. We’ll publish real comparisons here, never unrelated images presented as a renovation.</p>' + link("portfolio.html", "Explore concept studies", "button outline") + "</div>"}</section>${cta()}`;
  wireComparisons();
}
function project() {
  const slug = new URLSearchParams(location.search).get("slug");
  const p = projects.find((p) => p.slug === slug);
  if (!p) {
    main.innerHTML =
      heading(
        "Project not found",
        "Let’s find another space.",
        "This project link is missing or no longer available.",
      ) +
      `<section class="container section">${link("portfolio.html", "Back to the portfolio")}</section>`;
    document.title = "Project not found | " + site.name;
    return;
  }
  document.title = p.title + " | " + site.name;
  $('meta[name="description"]').content = p.description;
  $('meta[property="og:title"]').content = document.title;
  $('meta[property="og:description"]').content = p.description;
  $('meta[property="og:image"]').content = new URL(p.cover, location.href).href;
  $('meta[property="og:url"]').content = location.href;
  $('link[rel="canonical"]').href = location.href;
  main.innerHTML =
    heading(p.category, p.title, p.location) +
    `<div class="container">${p.demo ? note : ""}${image(p.cover, p.images[0]?.alt || p.title, true).replace("<img", '<img class="project-cover"')}<dl class="facts"><div><dt>Category</dt><dd>${esc(p.category)}</dd></div>${p.area ? `<div><dt>Area</dt><dd>${esc(p.area)}</dd></div>` : ""}${p.year ? `<div><dt>Completion year</dt><dd>${esc(p.year)}</dd></div>` : ""}<div><dt>Project type</dt><dd>${p.demo ? "Illustrative concept" : "Studio project"}</dd></div></dl></div><section class="container section split"><div><p class="eyebrow">The design story</p><h2>Thoughtful by design.</h2><p class="muted">${esc(p.description)}</p></div><div><h3>Design scope</h3><ul>${p.scope.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>${link("appointment.html", "Discuss a similar space")}</div></section><section class="container section" style="padding-top:0"><h2>A closer look</h2><div class="grid">${p.images.map((im, i) => `<button class="gallery-image" data-image="${i}" aria-label="Open image ${i + 1}: ${esc(im.alt)}">${image(im.src, im.alt)}</button>`).join("")}</div></section>${p.comparison?.verified ? `<section class="container section">${comparison(p)}</section>` : ""}<section class="container section surface"><p class="eyebrow">Keep exploring</p><h2>More spaces to inspire.</h2><div class="grid">${projects
      .filter((x) => x.slug !== p.slug)
      .sort(
        (a, b) =>
          Number(b.category === p.category) - Number(a.category === p.category),
      )
      .slice(0, 3)
      .map(card)
      .join(
        "",
      )}</div></section>${cta()}<dialog class="lightbox" aria-label="Project image gallery"><img id="lightbox-image" alt=""><div class="lightbox-bar"><button class="icon-button" id="image-prev" aria-label="Previous image">←</button><span id="image-caption" aria-live="polite"></span><button class="icon-button" id="image-next" aria-label="Next image">→</button><button class="icon-button" id="image-close" aria-label="Close image gallery">×</button></div></dialog>`;
  let i = 0;
  const dialog = $(".lightbox");
  function show(n) {
    i = (n + p.images.length) % p.images.length;
    $("#lightbox-image").src = asset(p.images[i].src);
    $("#lightbox-image").alt = p.images[i].alt;
    if (
      !reduced.matches &&
      !document.documentElement.classList.contains("motion-paused")
    ) {
      const photo = $("#lightbox-image");
      photo.getAnimations().forEach((animation) => animation.cancel());
      photo.animate(
        [
          { opacity: 0.25, transform: "scale(.985)" },
          { opacity: 1, transform: "scale(1)" },
        ],
        { duration: 420, easing: "ease-out" },
      );
    }
    $("#image-caption").textContent =
      `${i + 1} / ${p.images.length} · ${p.images[i].alt}`;
  }
  $$("[data-image]").forEach(
    (b) =>
      (b.onclick = () => {
        show(Number(b.dataset.image));
        dialog.showModal();
      }),
  );
  $("#image-close").onclick = () => dialog.close();
  $("#image-prev").onclick = () => show(i - 1);
  $("#image-next").onclick = () => show(i + 1);
  dialog.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") show(i + 1);
    if (e.key === "ArrowLeft") show(i - 1);
  });
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) dialog.close();
  });
  wireComparisons();
}
function businessNumber() {
  return /^\d{10,15}$/.test(site.whatsapp) ? site.whatsapp : "";
}
function appointment() {
  const field = (name, label, type = "text", extra = "") =>
    `<div class="field"><label for="${name}">${label}</label><input id="${name}" name="${name}" type="${type}" ${extra}></div>`;
  main.innerHTML =
    heading(
      "Let’s begin",
      "Your space.\nOur next conversation.",
      "Share a little about your plans. Prepare an enquiry to send through WhatsApp; the studio will confirm availability personally.",
    ) +
    `<div class="container form-layout"><form id="enquiry"><div class="form-grid">${field("name", "Full name *", "text", 'required autocomplete="name" maxlength="100"')}${field("mobile", "Mobile number *", "tel", 'required autocomplete="tel" pattern="[+0-9() .-]{7,25}" maxlength="25"')}${field("email", "Email address (optional)", "email", 'autocomplete="email" maxlength="150"')}<div class="field"><label for="service">Required service *</label><select name="service" id="service" required><option value="">Select a service</option>${services.map((s) => `<option>${esc(s.title)}</option>`).join("")}</select></div><div class="field"><label for="type">Project type *</label><select id="type" name="type" required><option value="">Select project type</option><option>New home</option><option>Renovation</option><option>Commercial space</option><option>Other</option></select></div>${field("location", "Project location *", "text", 'required autocomplete="address-level2" maxlength="150"')}${field("date", "Preferred date *", "date", "required")}<div class="field"><label for="time">Preferred time (studio local time) *</label><select id="time" name="time" required><option value="">Select a time</option>${site.timeSlots.map((t) => `<option>${esc(t)}</option>`).join("")}</select></div><div class="field wide"><label for="requirements">Tell us about your space *</label><textarea id="requirements" name="requirements" required minlength="10" maxlength="2000" placeholder="Your ideas, approximate area, style preferences and anything you’d like us to know…"></textarea></div><div class="field wide"><label for="budget">Budget range (optional)</label><input id="budget" name="budget" maxlength="100" placeholder="Your indicative budget and currency"></div></div><p class="muted" style="font-size:.75rem">* Required. This form does not store your details. Your enquiry is sent only when you choose to send it in WhatsApp. No appointment is automatically confirmed.</p><button type="submit" class="button">Prepare WhatsApp enquiry ↗</button><div class="form-status" id="form-status" role="status"></div></form><aside class="form-aside"><p class="eyebrow">A personal beginning</p><h2>Great spaces start<br>with good questions.</h2><p>We’ll talk about your space, your priorities and what a considered design process could look like.</p><hr><p class="muted">Your requested date and time are preferences. The studio must confirm availability manually.</p>${!businessNumber() ? '<p class="notice">Demo mode: the studio WhatsApp number has not been configured. You can preview an enquiry, but it cannot be sent yet.</p>' : ""}</aside></div>`;
  const date = $("#date"),
    now = new Date();
  date.min = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
  $("#service").value =
    new URLSearchParams(location.search).get("service") || "";
  const mobile = $("#mobile");
  mobile.addEventListener("input", () => mobile.setCustomValidity(""));
  date.addEventListener("input", () => date.setCustomValidity(""));
  $("#enquiry").onsubmit = (e) => {
    e.preventDefault();
    const digits = mobile.value.replace(/\D/g, "");
    mobile.setCustomValidity(
      digits.length >= 7 && digits.length <= 15
        ? ""
        : "Enter a mobile number with 7–15 digits.",
    );
    date.setCustomValidity(
      date.value < date.min ? "Choose today or a future date." : "",
    );
    if (!e.target.reportValidity()) return;
    const values = Object.fromEntries(new FormData(e.target));
    for (const key of ["name", "location", "requirements"]) {
      const input = $("#" + key);
      input.setCustomValidity(
        values[key].trim().length >= (key === "requirements" ? 10 : 2)
          ? ""
          : "Please enter a meaningful value.",
      );
      input.addEventListener("input", () => input.setCustomValidity(""), {
        once: true,
      });
    }
    if (!e.target.reportValidity()) return;
    const message = `Hello ${site.name}, I would like to enquire about a design consultation.\n\nName: ${values.name.trim()}\nMobile: ${values.mobile.trim()}\nEmail: ${values.email.trim() || "Not provided"}\nService: ${values.service}\nProject type: ${values.type}\nLocation: ${values.location.trim()}\nPreferred date: ${values.date}\nPreferred time: ${values.time} (studio local time)\nBudget: ${values.budget.trim() || "Not provided"}\n\nRequirements:\n${values.requirements.trim()}\n\nPlease confirm availability. I understand this is an enquiry, not a confirmed appointment.`;
    const number = businessNumber();
    $("#form-status").innerHTML =
      `<h3>Your enquiry preview</h3><pre style="white-space:pre-wrap;font:inherit;font-size:.8rem">${esc(message)}</pre>${number ? `<a class="button" target="_blank" rel="noopener noreferrer" href="https://wa.me/${number}?text=${encodeURIComponent(message)}">Open WhatsApp to send ↗</a><p>The enquiry is not sent yet. Send it in WhatsApp and wait for manual confirmation.</p>` : '<p class="notice">Sending is unavailable until the studio business number is configured. No enquiry has been sent and no appointment is confirmed.</p>'}`;
  };
}
function contact() {
  main.innerHTML =
    heading(
      "Get in touch",
      "Let’s make room\nfor your ideas.",
      "A new home, a familiar space reimagined, or just the beginning of an idea. We’d love to hear about it.",
    ) +
    `<section class="container section split" style="padding-top:1rem"><div><dl class="contact-list"><div><dt>Visit the studio</dt><dd>${esc(site.address || "Studio address awaiting confirmation.")}</dd></div><div><dt>Call us</dt><dd>${/^\+?[\d ()-]{7,25}$/.test(site.phone) ? `<a href="tel:${esc(site.phone)}">${esc(site.phone)}</a>` : "Business number awaiting confirmation."}</dd></div><div><dt>Email</dt><dd>${/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(site.email) ? `<a href="mailto:${esc(site.email)}">${esc(site.email)}</a>` : "Email address awaiting confirmation."}</dd></div><div><dt>Studio hours</dt><dd>${esc(site.hours || "Business hours awaiting confirmation.")}</dd></div></dl>${businessNumber() ? link("https://wa.me/" + businessNumber(), "Chat on WhatsApp") : link("appointment.html", "Prepare a consultation enquiry")}<div>${site.socials
      .filter((s) => https(s.url))
      .map(
        (s) =>
          `<p><a href="${esc(https(s.url))}" rel="noopener noreferrer">${esc(s.label)}</a></p>`,
      )
      .join(
        "",
      )}</div></div><div class="form-aside"><p class="eyebrow">Find us</p><h2>Your next chapter<br>starts here.</h2>${site.address ? link("https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(site.address), "View map", "text-link") : "<p>A map link will be available when the studio address has been verified.</p>"}<p class="notice">This is a studio concept. Contact details must be supplied before public launch.</p></div></section>${cta()}`;
}
try {
  const bundle = await loadPublicContent();
  [site, services, projects, testimonials] = bundle.values;
  if (!site.placeholder) note = "";
  const canonical = new URL(location.href);
  canonical.searchParams.delete("editorPreview");
  canonical.searchParams.delete("studio");
  $('link[rel="canonical"]').href = canonical.href;
  $('meta[property="og:url"]').content = canonical.href;
  if (page !== "project")
    $('meta[property="og:image"]').content = new URL(
      site.hero[0].image,
      new URL("../", import.meta.url),
    ).href;
  // Local previews keep their selected studio through relative page navigation.
  if (
    (["localhost", "127.0.0.1", "[::1]"].includes(location.hostname) &&
      new URLSearchParams(location.search).has("studio")) ||
    (parent !== window &&
      new URLSearchParams(location.search).get("editorPreview") === "1")
  ) {
    document.addEventListener(
      "click",
      (event) => {
        const anchor = event.target.closest("a[href]");
        if (!anchor) return;
        const url = new URL(anchor.href);
        if (url.origin === location.origin && url.pathname.endsWith(".html")) {
          url.searchParams.set("studio", bundle.studio.id);
          if (
            parent !== window &&
            new URLSearchParams(location.search).get("editorPreview") === "1"
          )
            url.searchParams.set("editorPreview", "1");
          anchor.href = url.href;
        }
      },
      { capture: true },
    );
  }
  document.title = document.title.replace(/\|.*$/, "| " + site.name);
  const copy = site.pages?.[page];
  if (
    !site.name ||
    !Array.isArray(site.hero) ||
    !site.hero.length ||
    !Array.isArray(services) ||
    !Array.isArray(projects) ||
    !Array.isArray(testimonials)
  )
    throw new Error("Invalid content configuration");
  shell();
  (
    ({
      index: home,
      about,
      services: servicePage,
      portfolio,
      project,
      "before-after": beforeAfter,
      appointment,
      contact,
    })[page] || home
  )();
  if (copy) {
    if (copy.title && page !== "project" && page !== "index")
      $("#main h1").textContent = copy.title;
    if (copy.description && $("#main .page-heading .intro"))
      $("#main .page-heading .intro").textContent = copy.description;
  }
  $('meta[property="og:title"]').content = document.title;
  if (copy?.description)
    $('meta[name="description"]').content = copy.description;
  $('meta[property="og:description"]').content = $(
    'meta[name="description"]',
  ).content;
  initializeMotion();
  document.addEventListener(
    "error",
    (e) => {
      if (e.target.tagName === "IMG" && !e.target.dataset.fallback) {
        e.target.dataset.fallback = "true";
        e.target.src = "assets/images/living.svg";
        e.target.alt += " (illustrated fallback)";
      }
    },
    true,
  );
} catch (error) {
  main.innerHTML =
    '<section class="container section"><p class="eyebrow">A small interruption</p><h1>This space is taking a moment.</h1><p>Content could not be loaded. Please refresh or return later.</p><a href="index.html">Return home</a></section>';
  console.error(error);
}
