import {
  defineTool,
  type ExtensionContext,
  type ToolDefinition,
} from "@earendil-works/pi-coding-agent";
import { Effect, type ManagedRuntime } from "effect";

import type { AppServices } from "../app/layer.ts";
import type { WebSearchInput } from "../domain/types.ts";
import { formatSearchMarkdown } from "../format/markdown.ts";
import { WebSearchToolInput, type WebSearchToolDetails } from "../schemas/search.ts";
import { WebService } from "../services/web.ts";

const errorMessage = (cause: unknown): string =>
  cause instanceof Error ? cause.message : String(cause);

export const makeWebSearchTool = (
  runtime: ManagedRuntime.ManagedRuntime<AppServices, never>,
): ToolDefinition<typeof WebSearchToolInput, WebSearchToolDetails> =>
  defineTool({
    name: "web_search",
    label: "Web Search",
    description: `Search the web for any topic and get clean, ready-to-use content.

Best for: Finding current information, news, facts, people, companies, or answering questions about any topic.
Returns: Clean text content from top search results.

Query tips: describe the ideal page, not keywords. Use category:people / category:company in the query when needed. If highlights are insufficient, follow up with web_fetch on the best URLs.`,
    promptSnippet: "Search the web for current information.",
    parameters: WebSearchToolInput,
    promptGuidelines: [
      "Use web_search when you do not know which URL to read.",
      "Write a semantically rich description of the ideal page, not bare keywords.",
      "Use category:people or category:company in the query when searching profiles or companies.",
      "Follow up with web_fetch on the best URLs when highlights are not enough.",
    ],
    async execute(toolCallId, params, signal, onUpdate, ctx: ExtensionContext) {
      try {
        const input = {
          query: params.query,
          searchQueries: params.searchQueries,
          mode: params.mode,
          numResults: params.numResults,
          filters: params.filters,
        } satisfies WebSearchInput;

        const output = await runtime.runPromise(
          Effect.flatMap(WebService.asEffect(), (web) => web.search(input, ctx.cwd)),
        );

        return {
          content: [{ type: "text", text: formatSearchMarkdown(output) }],
          details: {
            provider: output.provider,
            query: output.query,
            hitCount: output.hits.length,
            requestId: output.requestId,
            searchTime: output.searchTime,
          },
        };
      } catch (cause) {
        return {
          content: [{ type: "text", text: errorMessage(cause) }],
          details: {
            provider: "exa",
            query: params.query,
            hitCount: 0,
          },
          isError: true,
        };
      }
    },
  });
