import { describe, expect, it } from "vitest";

import { parseCategoryFromQuery } from "../src/domain/category.ts";

describe("parseCategoryFromQuery", () => {
  it("strips category:news and returns cleaned query", () => {
    expect(parseCategoryFromQuery("category:news AI breakthroughs")).toEqual({
      query: "AI breakthroughs",
      category: "news",
    });
  });

  it("parses research paper with spaces", () => {
    expect(parseCategoryFromQuery("category:research paper transformer papers")).toEqual({
      query: "transformer papers",
      category: "research paper",
    });
  });

  it("leaves query unchanged when no category prefix", () => {
    expect(parseCategoryFromQuery("latest typescript releases")).toEqual({
      query: "latest typescript releases",
    });
  });
});
