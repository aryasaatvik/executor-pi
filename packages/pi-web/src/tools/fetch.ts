import {
  defineTool,
  type ExtensionContext,
  type ToolDefinition,
} from "@earendil-works/pi-coding-agent";
import { Effect, type ManagedRuntime } from "effect";

import type { AppServices } from "../app/layer.ts";
import type { WebFetchInput } from "../domain/types.ts";
import {
  fetchHasSuccessfulContent,
  formatFetchAllErrors,
  formatFetchMarkdown,
} from "../format/markdown.ts";
import { WebFetchToolInput, type WebFetchToolDetails } from "../schemas/fetch.ts";
import { WebService } from "../services/web.ts";
import { normalizeUrls } from "../utils/normalize-urls.ts";

const errorMessage = (cause: unknown): string =>
  cause instanceof Error ? cause.message : String(cause);

export const makeWebFetchTool = (
  runtime: ManagedRuntime.ManagedRuntime<AppServices, never>,
): ToolDefinition<typeof WebFetchToolInput, WebFetchToolDetails> =>
  defineTool({
    name: "web_fetch",
    label: "Web Fetch",
    description: `Read a webpage's full content as clean text. Use after web_search when highlights are insufficient or to read any URL.

Best for: Extracting full content from known URLs. Batch multiple URLs in one call.
Returns: Clean text content and metadata from the page(s).`,
    promptSnippet: "Fetch full page text from known URLs.",
    parameters: WebFetchToolInput,
    promptGuidelines: [
      "Use web_fetch only when you already have URLs.",
      "Batch multiple URLs in one call when comparing sources.",
    ],
    prepareArguments: (args) => {
      const raw = args as Record<string, unknown>;
      const urls = normalizeUrls(raw.urls);
      if (urls.length === 0) {
        throw new Error("urls must contain at least one HTTP(S) URL");
      }
      return {
        urls,
        target: typeof raw.target === "string" ? raw.target : undefined,
        maxCharacters: typeof raw.maxCharacters === "number" ? raw.maxCharacters : undefined,
        freshness:
          raw.freshness === "cached" || raw.freshness === "fresh" || raw.freshness === "auto"
            ? raw.freshness
            : undefined,
      };
    },
    async execute(toolCallId, params, signal, onUpdate, ctx: ExtensionContext) {
      try {
        const input = {
          urls: params.urls,
          target: params.target,
          maxCharacters: params.maxCharacters,
          freshness: params.freshness,
        } satisfies WebFetchInput;

        const output = await runtime.runPromise(
          Effect.flatMap(WebService.asEffect(), (web) => web.fetch(input, ctx.cwd)),
        );

        if (!fetchHasSuccessfulContent(output)) {
          return {
            content: [{ type: "text", text: formatFetchAllErrors(output) }],
            details: {
              provider: output.provider,
              urlCount: output.pages.length,
              searchTime: output.searchTime,
            },
            isError: true,
          };
        }

        return {
          content: [{ type: "text", text: formatFetchMarkdown(output) }],
          details: {
            provider: output.provider,
            urlCount: output.pages.length,
            searchTime: output.searchTime,
          },
        };
      } catch (cause) {
        return {
          content: [{ type: "text", text: errorMessage(cause) }],
          details: {
            provider: "exa",
            urlCount: 0,
          },
          isError: true,
        };
      }
    },
  });
