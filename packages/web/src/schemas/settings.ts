import { Schema } from "effect";

export const ProviderSelection = Schema.Union([
  Schema.Literal("auto"),
  Schema.Literal("exa"),
  Schema.Literal("parallel"),
]);

export const ExaSearchType = Schema.Union([
  Schema.Literal("auto"),
  Schema.Literal("fast"),
  Schema.Literal("deep-lite"),
]);

export const ParallelSearchMode = Schema.Union([
  Schema.Literal("basic"),
  Schema.Literal("advanced"),
]);

export const WebCapsSettings = Schema.Struct({
  defaultNumResults: Schema.Number,
  maxNumResults: Schema.Number,
  maxFetchUrls: Schema.Number,
  defaultFetchMaxCharacters: Schema.Number,
  maxFetchMaxCharacters: Schema.Number,
  allowDeepSearch: Schema.Boolean,
});

export type WebCapsSettings = typeof WebCapsSettings.Type;

export const ExaSettings = Schema.Struct({
  search: Schema.Struct({
    type: ExaSearchType,
    numResults: Schema.Number,
  }),
  fetch: Schema.Struct({
    maxCharacters: Schema.Number,
  }),
});

export type ExaSettings = typeof ExaSettings.Type;

export const ParallelSettings = Schema.Struct({
  search: Schema.Struct({
    mode: ParallelSearchMode,
    maxResults: Schema.Number,
  }),
  fetch: Schema.Struct({
    maxCharacters: Schema.Number,
  }),
});

export type ParallelSettings = typeof ParallelSettings.Type;

export const WebSettings = Schema.Struct({
  provider: ProviderSelection,
  caps: WebCapsSettings,
  exa: ExaSettings,
  parallel: ParallelSettings,
});

export type WebSettings = typeof WebSettings.Type;

export const DefaultWebSettings: WebSettings = {
  provider: "auto",
  caps: {
    defaultNumResults: 10,
    maxNumResults: 20,
    maxFetchUrls: 20,
    defaultFetchMaxCharacters: 3000,
    maxFetchMaxCharacters: 20000,
    allowDeepSearch: true,
  },
  exa: {
    search: { type: "auto", numResults: 10 },
    fetch: { maxCharacters: 3000 },
  },
  parallel: {
    search: { mode: "advanced", maxResults: 10 },
    fetch: { maxCharacters: 3000 },
  },
};
