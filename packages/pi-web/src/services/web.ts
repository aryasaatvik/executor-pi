import { Context, Effect, Layer } from "effect";

import { WebFetchError, type WebSearchError, type UrlSafetyError } from "../domain/errors.ts";
import { ExaWebProvider, ParallelWebProvider, type WebProvider } from "../domain/web-provider.ts";
import type {
  ProviderId,
  WebFetchInput,
  WebFetchOutput,
  WebSearchInput,
  WebSearchOutput,
} from "../domain/types.ts";
import { WebConfigService, type WebConfig } from "./config.ts";
import { UrlSafetyService } from "./url-safety.ts";

export class WebService extends Context.Service<
  WebService,
  {
    readonly search: (
      input: WebSearchInput,
      cwd: string,
    ) => Effect.Effect<WebSearchOutput, WebSearchError>;
    readonly fetch: (
      input: WebFetchInput,
      cwd: string,
    ) => Effect.Effect<WebFetchOutput, WebFetchError | UrlSafetyError>;
  }
>()("@pi-web/WebService") {
  static readonly Default = Layer.effect(this)(
    Effect.gen(function* () {
      const configService = yield* WebConfigService;
      const exa = yield* ExaWebProvider;
      const parallel = yield* ParallelWebProvider;
      const urlSafety = yield* UrlSafetyService;

      const providers = { exa, parallel } satisfies Record<ProviderId, WebProvider>;

      const chooseSearchProvider = (config: WebConfig, input: WebSearchInput): WebProvider => {
        if (config.provider !== "auto") return providers[config.provider];
        if (!config.exaApiKey && config.parallelApiKey) return parallel;
        if (
          config.parallelApiKey &&
          (input.mode === "deep" || (input.searchQueries && input.searchQueries.length > 0))
        ) {
          return parallel;
        }
        return exa;
      };

      const chooseFetchProvider = (config: WebConfig, input: WebFetchInput): WebProvider => {
        if (config.provider !== "auto") return providers[config.provider];
        if (!config.exaApiKey && config.parallelApiKey) return parallel;
        if (
          config.parallelApiKey &&
          (input.target || input.urls.some((url) => url.toLowerCase().endsWith(".pdf")))
        ) {
          return parallel;
        }
        return exa;
      };

      return {
        search: (input, cwd) =>
          Effect.gen(function* () {
            const { config } = yield* configService.resolve(cwd);
            return yield* chooseSearchProvider(config, input).search(input, cwd);
          }),
        fetch: (input, cwd) =>
          Effect.gen(function* () {
            const { config } = yield* configService.resolve(cwd);
            if (input.urls.length > config.caps.maxFetchUrls) {
              return yield* new WebFetchError({
                message: `web_fetch accepts at most ${config.caps.maxFetchUrls} URLs per call`,
              });
            }
            const safeUrls: string[] = [];
            for (const url of input.urls) {
              safeUrls.push(yield* urlSafety.assertHttpUrl(url));
            }
            return yield* chooseFetchProvider(config, input).fetch(
              { ...input, urls: safeUrls },
              cwd,
            );
          }),
      };
    }),
  );
}
