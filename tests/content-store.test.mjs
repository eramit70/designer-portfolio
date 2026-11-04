import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  validateConfig,
  resolveStudio,
  validateContent,
  safePath,
} from "../js/content-store.js";
const config = JSON.parse(
  await readFile(new URL("../data/config.json", import.meta.url)),
);
const site = JSON.parse(
  await readFile(new URL("../data/site.json", import.meta.url)),
);
const awaitableProjects = await readFile(
  new URL("../data/projects.json", import.meta.url),
  "utf8",
);
const clone = (x) => structuredClone(x);
test("URL selection uses exact origin and longest complete path prefix", () => {
  const c = clone(config),
    other = clone(c.studios[0]);
  other.id = "oak";
  other.label = "Oak";
  other.urls = ["https://eramit70.github.io/designer-portfolio/oak/"];
  other.content = Object.fromEntries(
    Object.keys(other.content).map((type) => [
      type,
      `data/studios/oak/${type}.json`,
    ]),
  );
  c.studios.push(other);
  assert.equal(
    resolveStudio(
      c,
      "https://eramit70.github.io/designer-portfolio/project.html?slug=x",
    ).id,
    "forme",
  );
  assert.equal(
    resolveStudio(
      c,
      "https://eramit70.github.io/designer-portfolio/oak/contact.html",
    ).id,
    "oak",
  );
  assert.equal(
    resolveStudio(c, "http://localhost:8123/index.html?studio=oak").id,
    "oak",
  );
  assert.throws(() =>
    resolveStudio(c, "https://eramit70.github.io/designer-portfolio-other/"),
  );
  assert.throws(() =>
    resolveStudio(
      c,
      "https://eramit70.github.io.evil.example/designer-portfolio/",
    ),
  );
  assert.throws(() => resolveStudio(c, "https://unknown.example/"));
  assert.throws(() =>
    resolveStudio(c, "http://localhost:8000/?studio=missing"),
  );
});
test("studio paths are independent and credential metadata is rejected", () => {
  const c = clone(config);
  c.studios[0].admin.password = "synthetic-not-a-secret";
  assert.throws(() => validateConfig(c));
  const duplicate = clone(config);
  duplicate.studios.push(clone(duplicate.studios[0]));
  assert.throws(() => validateConfig(duplicate));
  const unsafe = clone(config);
  unsafe.studios[0].content.site = "data/../site.json";
  assert.throws(() => validateConfig(unsafe));
  assert.equal(safePath("/data/site.json"), false);
  assert.equal(safePath("data/../../other.json"), false);
});
test("content model rejects malformed public content and unverified claims", () => {
  assert.equal(validateContent("site", site), site);
  assert.throws(() => validateContent("site", { name: "Missing fields" }));
  const bad = clone(site);
  bad.hero[0].image = "javascript:alert(1)";
  assert.throws(() => validateContent("site", bad));
  assert.throws(() =>
    validateContent("testimonials", [
      { name: "Synthetic", quote: "Test", verified: "yes" },
    ]),
  );
  const projects = JSON.parse(awaitableProjects); // initialized below before tests execute
  const p = clone(projects[0]);
  p.demo = false;
  p.verified = false;
  assert.throws(() => validateContent("projects", [p]));
});
