import { Effect } from "effect";
import type Parallel from "parallel-web";

import { WebFetchError } from "../../domain/errors.ts";
import type { WebFetchInput, WebFetchOutput, WebFetchPage } from "../../domain/types.ts";
import type { WebConfig } from "../../services/config.ts";

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

const mapPage = (result: {
  url: string;
  title?: string | null;
  publish_date?: string | null;
  excerpts?: string[] | null;
  full_content?: string | null;
}): WebFetchPage => ({
  url: result.url,
  title: result.title ?? undefined,
  publishedAt: result.publish_date ?? undefined,
  text: result.full_content?.trim() || result.excerpts?.join("\n").trim() || "",
});

export const parallelFetch = (
  client: Parallel,
  config: WebConfig,
  input: WebFetchInput,
): Effect.Effect<WebFetchOutput, WebFetchError> =>
  Effect.tryPromise({
    try: async () => {
      const maxCharacters = clamp(
        input.maxCharacters ?? config.parallel.fetch.maxCharacters,
        1,
        config.caps.maxFetchMaxCharacters,
      );
      const response = await client.extract({
        urls: [...input.urls],
        ...(input.target ? { objective: input.target } : {}),
        max_chars_total: maxCharacters * input.urls.length,
        advanced_settings: {
          ...(input.target ? {} : { full_content: { max_chars_per_result: maxCharacters } }),
          ...(input.freshness === "fresh"
            ? { fetch_policy: { max_age_seconds: 600, disable_cache_fallback: true } }
            : {}),
          ...(input.freshness === "cached"
            ? { fetch_policy: { max_age_seconds: 60 * 60 * 24 * 30 } }
            : {}),
        },
      });

      const pages: WebFetchPage[] = response.results.map(mapPage);
      for (const err of response.errors) {
        pages.push({
          url: err.url,
          text: err.content ?? "",
          error: err.error_type,
        });
      }

      return {
        provider: "parallel" as const,
        pages,
      };
    },
    catch: (cause) =>
      new WebFetchError({
        message: cause instanceof Error ? cause.message : String(cause),
        cause,
      }),
  });
