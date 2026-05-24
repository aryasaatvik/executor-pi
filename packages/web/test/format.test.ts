import { describe, expect, it } from "vitest";

import {
  fetchHasSuccessfulContent,
  formatFetchAllErrors,
  formatFetchMarkdown,
  formatSearchMarkdown,
} from "../src/format/markdown.ts";
import type { WebFetchOutput, WebSearchOutput } from "../src/domain/types.ts";

describe("formatSearchMarkdown", () => {
  it("formats hits like exa-mcp-server", () => {
    const output: WebSearchOutput = {
      provider: "exa",
      query: "test",
      hits: [
        {
          title: "Result One",
          url: "https://example.com/one",
          publishedAt: "2026-04-01T12:00:00.000Z",
          author: "Author",
          highlights: ["First highlight"],
        },
      ],
    };
    const text = formatSearchMarkdown(output);
    expect(text).toContain("Title: Result One");
    expect(text).toContain("Highlights:\nFirst highlight");
  });

  it("separates multiple hits with ---", () => {
    const output: WebSearchOutput = {
      provider: "exa",
      query: "test",
      hits: [
        { title: "One", url: "https://example.com/one", highlights: ["a"] },
        { title: "Two", url: "https://example.com/two", highlights: ["b"] },
      ],
    };
    expect(formatSearchMarkdown(output)).toContain("---");
  });
});

describe("formatFetchMarkdown", () => {
  it("includes per-url errors in the text blob", () => {
    const output: WebFetchOutput = {
      provider: "exa",
      pages: [
        {
          url: "https://example.com/page",
          title: "Page",
          text: "Body",
        },
        {
          url: "https://example.com/missing",
          text: "",
          error: "not_found",
        },
      ],
    };
    const text = formatFetchMarkdown(output);
    expect(text).toContain("# Page");
    expect(text).toContain("Error fetching https://example.com/missing: not_found");
    expect(fetchHasSuccessfulContent(output)).toBe(true);
  });

  it("reports all failures for error helper", () => {
    const output: WebFetchOutput = {
      provider: "exa",
      pages: [{ url: "https://example.com/missing", text: "", error: "not_found" }],
    };
    expect(fetchHasSuccessfulContent(output)).toBe(false);
    expect(formatFetchAllErrors(output)).toContain("not_found");
  });
});
