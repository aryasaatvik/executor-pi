import { Context, type Effect } from "effect";

import type { WebFetchError, WebSearchError } from "./errors.ts";
import type {
  ProviderId,
  WebFetchInput,
  WebFetchOutput,
  WebSearchInput,
  WebSearchOutput,
} from "./types.ts";

export type WebProvider = {
  readonly id: ProviderId;
  readonly search: (
    input: WebSearchInput,
    cwd: string,
  ) => Effect.Effect<WebSearchOutput, WebSearchError>;
  readonly fetch: (
    input: WebFetchInput,
    cwd: string,
  ) => Effect.Effect<WebFetchOutput, WebFetchError>;
};

export class ExaWebProvider extends Context.Service<ExaWebProvider, WebProvider>()(
  "@pi-web/ExaWebProvider",
) {}

export class ParallelWebProvider extends Context.Service<ParallelWebProvider, WebProvider>()(
  "@pi-web/ParallelWebProvider",
) {}
