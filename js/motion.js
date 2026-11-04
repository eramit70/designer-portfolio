/** Original, dependency-free motion system. Content stays readable without it. */
const preference = matchMedia("(prefers-reduced-motion: reduce)");
const root = document.documentElement;
let manuallyPaused = false;
try {
  manuallyPaused = localStorage.getItem("forme-motion") === "paused";
} catch {
  /* Storage is optional. */
}
const disabled = () => preference.matches || manuallyPaused;
let observer;

export function animateHeading(heading) {
  if (!heading) return;
  // Keep the heading as a single accessible name; decorative words are hidden from AT.
  const text = heading.textContent;
  heading.setAttribute("aria-label", text.replace(/\s+/g, " ").trim());
  heading.classList.add("motion-heading");
  heading.replaceChildren();
  let index = 0;
  for (const part of text.split(/(\s+)/)) {
    if (!part) continue;
    if (/^\s+$/.test(part)) {
      heading.append(document.createTextNode(part));
      continue;
    }
    const mask = document.createElement("span");
    mask.className = "word-mask";
    mask.setAttribute("aria-hidden", "true");
    const word = document.createElement("span");
    word.className = "word";
    word.textContent = part;
    word.style.setProperty("--word-delay", `${Math.min(index++, 10) * 65}ms`);
    mask.append(word);
    heading.append(mask);
  }
  // Only animate headings in view; subsequent sections enter on intersection.
  heading.classList.remove("words-visible");
  if (disabled()) heading.classList.add("words-visible");
  else if (heading.getBoundingClientRect().top < innerHeight) {
    requestAnimationFrame(() => heading.classList.add("words-visible"));
  } else observer?.observe(heading);
}

export function initializeMotion() {
  const main = document.querySelector("main");
  const button = document.createElement("button");
  button.className = "motion-toggle";
  button.type = "button";
  button.setAttribute("aria-label", "Pause decorative animations");
  document.body.append(button);
  const progress = document.createElement("div");
  progress.className = "reading-progress";
  progress.setAttribute("aria-hidden", "true");
  document.body.append(progress);

  function apply() {
    const paused = disabled();
    root.classList.toggle("motion-paused", paused);
    button.textContent = paused ? "Motion off" : "Motion on";
    button.setAttribute("aria-pressed", String(paused));
    button.setAttribute(
      "aria-label",
      paused ? "Enable decorative animations" : "Pause decorative animations",
    );
    button.disabled = preference.matches;
    button.title = preference.matches
      ? "Reduced motion is enabled in your device settings"
      : "Toggle decorative motion";
    if (paused) {
      document
        .querySelectorAll(".motion-enter, .reveal.pending")
        .forEach((el) => {
          el.classList.add("is-visible");
          el.classList.remove("pending");
        });
      document
        .querySelectorAll(".motion-heading")
        .forEach((el) => el.classList.add("words-visible"));
      root.style.setProperty("--hero-travel", "0px");
    }
    document.dispatchEvent(
      new CustomEvent("site:motion", { detail: { paused } }),
    );
  }
  button.onclick = () => {
    manuallyPaused = !manuallyPaused;
    try {
      localStorage.setItem(
        "forme-motion",
        manuallyPaused ? "paused" : "enabled",
      );
    } catch {
      /* No persistence required. */
    }
    apply();
  };
  preference.addEventListener("change", apply);
  apply();

  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-visible", "words-visible");
        entry.target
          .querySelectorAll(":scope > .image-reveal")
          .forEach((image) => image.classList.add("is-visible"));
        entry.target.classList.remove("pending");
        observer.unobserve(entry.target);
      }
    },
    { threshold: 0.08, rootMargin: "0px 0px -24px 0px" },
  );

  function register(scope) {
    scope.querySelectorAll("h1,h2").forEach((el) => {
      if (!el.classList.contains("motion-heading")) animateHeading(el);
      observer.observe(el);
    });
    const selector =
      ".reveal,.section-top,.page-heading > p,.split > div,.grid > .card,.grid > .service,.carousel-track > .card,.step,.principles > div,.cta > p,.cta > a,.form-grid > .field,.form-aside,.contact-list > div,.empty";
    scope.querySelectorAll(selector).forEach((el, index) => {
      if (el.classList.contains("motion-enter")) return;
      // Avoid compounded opacity and transform on nested reveal containers.
      if (el.parentElement.closest(".motion-enter")) return;
      el.classList.add("motion-enter");
      const siblings = [...el.parentElement.children];
      el.style.setProperty(
        "--enter-delay",
        `${Math.min(siblings.indexOf(el), 4) * 85}ms`,
      );
      if (disabled()) el.classList.add("is-visible");
      else observer.observe(el);
    });
    scope
      .querySelectorAll(".editorial-image,.service > img,.project-cover")
      .forEach((el) => {
        if (el.classList.contains("image-reveal")) return;
        el.classList.add("image-reveal");
        if (disabled()) el.classList.add("is-visible");
        else observer.observe(el.parentElement);
      });
  }
  register(main);

  const grid = document.querySelector("#project-grid");
  if (grid)
    new MutationObserver(() => register(grid)).observe(grid, {
      childList: true,
    });

  const quote = document.querySelector("#quote");
  if (quote)
    new MutationObserver(() => {
      if (!disabled())
        quote.animate(
          [
            { opacity: 0, transform: "translateY(12px)" },
            { opacity: 1, transform: "none" },
          ],
          { duration: 450, easing: "ease-out" },
        );
    }).observe(quote, { childList: true });

  const ribbon = document.querySelector(".ribbon");
  if (ribbon) {
    const track = document.createElement("div");
    track.className = "ribbon-track";
    while (ribbon.firstChild) track.append(ribbon.firstChild);
    const copy = track.cloneNode(true);
    copy.setAttribute("aria-hidden", "true");
    ribbon.append(track, copy);
    ribbon.setAttribute(
      "aria-label",
      "Architecture, interiors, thoughtful details, timeless living",
    );
  }

  let frame = 0;
  const hero = document.querySelector(".hero");
  function update() {
    frame = 0;
    const range = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${range > 0 ? Math.min(1, scrollY / range) : 0})`;
    if (hero && !disabled() && matchMedia("(min-width: 761px)").matches) {
      const bounds = hero.getBoundingClientRect();
      if (bounds.bottom > 0)
        root.style.setProperty(
          "--hero-travel",
          `${Math.min(scrollY * 0.16, 120)}px`,
        );
    }
  }
  const queue = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };
  addEventListener("scroll", queue, { passive: true });
  addEventListener("resize", queue, { passive: true });
  update();
  root.classList.add("motion-ready");
}
