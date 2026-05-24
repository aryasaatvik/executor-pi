import { Effect } from "effect";

import { WebFetchError } from "../../domain/errors.ts";
import type { WebFetchInput, WebFetchOutput, WebFetchPage } from "../../domain/types.ts";
import type { WebConfig } from "../../services/config.ts";
import type { Exa } from "exa-js";

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

type ContentsStatus = {
  id: string;
  status: string;
  error?: { tag?: string };
};

const formatPublishedDate = (publishedDate?: string | null): string | undefined => {
  if (!publishedDate) return undefined;
  return publishedDate.split("T")[0];
};

export const exaFetch = (
  client: Exa,
  config: WebConfig,
  input: WebFetchInput,
): Effect.Effect<WebFetchOutput, WebFetchError> =>
  Effect.tryPromise({
    try: async () => {
      const maxCharacters = clamp(
        input.maxCharacters ?? config.exa.fetch.maxCharacters,
        1,
        config.caps.maxFetchMaxCharacters,
      );
      const response = await client.getContents([...input.urls], {
        text: { maxCharacters },
        ...(input.target ? { highlights: { query: input.target } } : {}),
        ...(input.freshness === "fresh" ? { maxAgeHours: 0 } : {}),
      });

      const statuses: ContentsStatus[] = Array.isArray(response.statuses)
        ? (response.statuses as ContentsStatus[])
        : [];
      const urlErrors = statuses.filter((status) => status.status === "error");

      const pages: WebFetchPage[] = (response.results ?? []).map((result) => ({
        url: result.url ?? "",
        title: result.title ?? undefined,
        publishedAt: formatPublishedDate(result.publishedDate),
        author: result.author ?? undefined,
        text: result.text?.trim() ?? "",
      }));

      for (const err of urlErrors) {
        pages.push({
          url: err.id,
          text: "",
          error: err.error?.tag ?? "unknown error",
        });
      }

      return {
        provider: "exa" as const,
        pages,
        searchTime: typeof response.searchTime === "number" ? response.searchTime : undefined,
      };
    },
    catch: (cause) =>
      new WebFetchError({
        message: cause instanceof Error ? cause.message : String(cause),
        cause,
      }),
  });
