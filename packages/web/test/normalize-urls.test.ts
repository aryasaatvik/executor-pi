import { describe, expect, it } from "vitest";

import { normalizeUrls } from "../src/utils/normalize-urls.ts";

describe("normalizeUrls", () => {
  it("wraps a single string URL", () => {
    expect(normalizeUrls("https://example.com")).toEqual(["https://example.com"]);
  });

  it("parses a JSON array string", () => {
    expect(normalizeUrls('["https://a.com", "https://b.com"]')).toEqual([
      "https://a.com",
      "https://b.com",
    ]);
  });

  it("passes through string arrays", () => {
    expect(normalizeUrls(["https://example.com"])).toEqual(["https://example.com"]);
  });
});
