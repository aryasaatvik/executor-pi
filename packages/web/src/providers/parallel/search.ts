import { Effect } from "effect";
import type Parallel from "parallel-web";

import { WebSearchError } from "../../domain/errors.ts";
import type { WebSearchHit, WebSearchInput, WebSearchOutput } from "../../domain/types.ts";
import type { WebConfig } from "../../services/config.ts";

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

const nonEmpty = (values: readonly string[] | undefined): string[] | undefined => {
  const cleaned = values?.map((value) => value.trim()).filter((value) => value.length > 0);
  return cleaned && cleaned.length > 0 ? cleaned : undefined;
};

const mapHit = (result: {
  title?: string | null;
  url: string;
  publish_date?: string | null;
  excerpts?: string[] | null;
}): WebSearchHit => ({
  title: result.title ?? result.url,
  url: result.url,
  publishedAt: result.publish_date ?? undefined,
  highlights: result.excerpts && result.excerpts.length > 0 ? result.excerpts : undefined,
});

export const parallelSearch = (
  client: Parallel,
  config: WebConfig,
  input: WebSearchInput,
): Effect.Effect<WebSearchOutput, WebSearchError> =>
  Effect.tryPromise({
    try: async () => {
      const numResults = clamp(
        input.numResults ?? config.parallel.search.maxResults,
        1,
        config.caps.maxNumResults,
      );
      const searchQueries = nonEmpty(input.searchQueries) ?? [input.query];
      const mode = input.mode === "fast" ? "basic" : config.parallel.search.mode;
      const response = await client.search({
        objective: input.query,
        search_queries: searchQueries,
        mode,
        advanced_settings: {
          max_results: numResults,
          ...(input.filters?.location ? { location: input.filters.location } : {}),
          ...(input.filters?.includeDomains ||
          input.filters?.excludeDomains ||
          input.filters?.startPublishedDate
            ? {
                source_policy: {
                  ...(input.filters.includeDomains
                    ? { include_domains: [...input.filters.includeDomains] }
                    : {}),
                  ...(input.filters.excludeDomains
                    ? { exclude_domains: [...input.filters.excludeDomains] }
                    : {}),
                  ...(input.filters.startPublishedDate
                    ? { after_date: input.filters.startPublishedDate }
                    : {}),
                },
              }
            : {}),
        },
      });

      return {
        provider: "parallel" as const,
        query: input.query,
        hits: response.results.map(mapHit),
        requestId: response.search_id,
      };
    },
    catch: (cause) =>
      new WebSearchError({
        message: cause instanceof Error ? cause.message : String(cause),
        cause,
      }),
  });
