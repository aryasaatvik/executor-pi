import { Context, Effect, Layer } from "effect";

import { UrlSafetyError } from "../domain/errors.ts";

const blockedHostPatterns = [
  /^localhost$/i,
  /^127\.\d+\.\d+\.\d+$/,
  /^10\.\d+\.\d+\.\d+$/,
  /^192\.168\.\d+\.\d+$/,
  /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/,
  /^169\.254\.\d+\.\d+$/,
  /^\[::1\]$/i,
  /^0\.0\.0\.0$/,
];

export class UrlSafetyService extends Context.Service<
  UrlSafetyService,
  {
    readonly assertHttpUrl: (url: string) => Effect.Effect<string, UrlSafetyError>;
  }
>()("@pi-web/UrlSafetyService") {
  static readonly Default = Layer.succeed(this, {
    assertHttpUrl: (url) =>
      Effect.try({
        try: () => {
          const parsed = new URL(url);
          if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
            throw new UrlSafetyError({
              url,
              reason: `Unsupported protocol: ${parsed.protocol}`,
            });
          }
          const host = parsed.hostname;
          if (blockedHostPatterns.some((pattern) => pattern.test(host))) {
            throw new UrlSafetyError({
              url,
              reason: "Blocked host (private or loopback)",
            });
          }
          return parsed.toString();
        },
        catch: (cause) =>
          cause instanceof UrlSafetyError
            ? cause
            : new UrlSafetyError({
                url,
                reason: cause instanceof Error ? cause.message : String(cause),
              }),
      }),
  });
}
