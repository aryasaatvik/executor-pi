import { Data } from "effect";

export class WebConfigError extends Data.TaggedError("WebConfigError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class WebSearchError extends Data.TaggedError("WebSearchError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class WebFetchError extends Data.TaggedError("WebFetchError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class UrlSafetyError extends Data.TaggedError("UrlSafetyError")<{
  readonly url: string;
  readonly reason: string;
}> {}
