import type { Theme } from "@earendil-works/pi-coding-agent";
import { describe, expect, it } from "vitest";

import type { ExecuteDetails } from "../schemas/execute.ts";
import type { SearchDetails } from "../schemas/search.ts";
import { renderExecuteCall, renderExecuteResult, renderSearchResult } from "./render.ts";

const theme = {
  bold: (value: string) => value,
  fg: (color: string, value: string) => value,
} as Theme;

const renderText = (text: { render: (width: number) => string[] }): string =>
  text.render(220).join("\n");

describe("renderSearchResult", () => {
  it("renders compact snippets and a source footer", () => {
    const details: SearchDetails = {
      total: 29,
      hasMore: true,
      nextOffset: 3,
      items: [
        {
          path: "posthog.query_error_tracking_issues_list",
          name: "query_error_tracking_issues_list",
          sourceId: "posthog",
          score: 1,
          description:
            "List and filter Error tracking issues. Returns compact issue rows with aggregate impact counts and optional volume buckets.\n\nUse this first when the user asks which errors are happening.",
        },
        {
          path: "sentry.search_issues",
          name: "search_issues",
          sourceId: "sentry",
          score: 0.9,
          details: {
            path: "sentry.search_issues",
            name: "search_issues",
            description:
              "Search for grouped issues/problems in Sentry - returns a LIST of issues, NOT counts or aggregations.\n\nProvide query as natural language or Sentry issue search syntax.",
            inputTypeScript: "type Input = { organizationSlug: string; query: string }",
            outputTypeScript: "type Output = { issues: Array<{ id: string; title: string }> }",
          },
        },
      ],
    };

    const output = renderText(renderSearchResult(details, "", { expanded: false }, theme));

    expect(output).toContain("29 result(s)");
    expect(output).toContain("Tools");
    expect(output).toContain("posthog.query_error_tracking_issues_list");
    expect(output).toContain("[posthog]");
    expect(output).toContain("sentry.search_issues");
    expect(output).toContain("Sources");
    expect(output).toContain("posthog, sentry");
    expect(output).toContain("More results at offset 3");
    expect(output).toContain("to expand descriptions");
    expect(output).not.toContain("Use this first when the user asks");
    expect(output).not.toContain("type Input =");
  });

  it("renders full descriptions and type details when expanded", () => {
    const details: SearchDetails = {
      total: 1,
      hasMore: false,
      nextOffset: null,
      items: [
        {
          path: "sentry.search_issues",
          name: "search_issues",
          sourceId: "sentry",
          score: 0.9,
          details: {
            path: "sentry.search_issues",
            name: "search_issues",
            description:
              "Search for grouped issues/problems in Sentry - returns a LIST of issues, NOT counts or aggregations.\n\nProvide query as natural language or Sentry issue search syntax.",
            inputTypeScript: "type Input = { organizationSlug: string; query: string }",
            outputTypeScript: "type Output = { issues: Array<{ id: string; title: string }> }",
          },
        },
      ],
    };

    const output = renderText(renderSearchResult(details, "", { expanded: true }, theme));

    expect(output).toContain("Provide query as natural language");
    expect(output).toContain("Input");
    expect(output).toContain("type Input =");
    expect(output).toContain("Output");
    expect(output).toContain("type Output =");
    expect(output).not.toContain("to expand descriptions");
  });
});

describe("renderExecuteResult", () => {
  it("renders code, pretty structured output, and log state without completion chrome", () => {
    const details: ExecuteDetails = {
      status: "completed",
      result: { value: 3, source: "executor-pi-dogfood" },
      logs: [],
    };

    const callOutput = renderText(
      renderExecuteCall({ code: "return { value: 1 + 2, source: 'executor-pi-dogfood' };" }, theme),
    );
    const output = renderText(renderExecuteResult(details, "", { expanded: false }, theme));

    expect(callOutput).toContain("Code");
    expect(output).toContain("Output");
    expect(output).toContain('"value": 3');
    expect(output).toContain('"source": "executor-pi-dogfood"');
    expect(output).toContain("Logs: none");
    expect(output).not.toContain("Executor completed");
  });
});
