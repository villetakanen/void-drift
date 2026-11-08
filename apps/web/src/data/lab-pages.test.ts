import { describe, expect, it } from "vitest";
import { labPages } from "./lab-pages";

// Studies and reviews have their own registry; an index is the map itself.
// Retired routes remain explicit redirects, not navigation entries.
const retiredRedirects = { "/lab/flight": "/builder" } as const;
const routeSources = import.meta.glob("../pages/lab/**/*.astro", {
  eager: true,
  query: "?raw",
  import: "default",
});
const routed = Object.keys(import.meta.glob("../pages/lab/**/*.astro"))
  .map((file) => file.replace(/^\.\.\/pages/, "").replace(/\.astro$/, ""))
  .filter((href) => !/^\/lab\/(studies|reviews)\//.test(href))
  .filter((href) => !href.endsWith("/index"));

describe("Lab page map", () => {
  it("lists every routed Lab page and only routed pages", () => {
    const listed = labPages.map((page) => page.href).sort();
    expect(listed).toEqual(
      [
        ...routed.filter((href) => !(href in retiredRedirects)),
        "/lab/studies",
      ].sort(),
    );
    for (const [href, target] of Object.entries(retiredRedirects)) {
      expect(routed).toContain(href);
      expect(routeSources[`../pages${href}.astro`]).toContain(
        `Astro.redirect("${target}", 302)`,
      );
    }
  });

  it("points each alias at a listed page that is not itself an alias", () => {
    const canonical = new Set(
      labPages.filter((page) => !page.aliasOf).map((page) => page.href),
    );
    for (const page of labPages.filter((entry) => entry.aliasOf)) {
      expect(canonical.has(page.aliasOf ?? "")).toBe(true);
    }
  });
});
