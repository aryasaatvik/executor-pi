import { Exa } from "exa-js";
import { Effect, Layer } from "effect";

import { WebSearchError, WebFetchError } from "../../domain/errors.ts";
import { ExaWebProvider } from "../../domain/web-provider.ts";
import { WebConfigService } from "../../services/config.ts";
import { exaFetch } from "./fetch.ts";
import { exaSearch } from "./search.ts";

const missingKeyMessage =
  'Exa API key is not stored in ~/.pi/agent/auth.json. Add an "exa" api_key credential before using web_search or web_fetch.';

export const ExaWebProviderLive = Layer.effect(ExaWebProvider)(
  Effect.gen(function* () {
    const configService = yield* WebConfigService;

    return {
      id: "exa" as const,
      search: (input, cwd) =>
        Effect.gen(function* () {
          const { config } = yield* configService.resolve(cwd);
          if (!config.exaApiKey) {
            return yield* new WebSearchError({ message: missingKeyMessage });
          }
          const client = new Exa(config.exaApiKey);
          return yield* exaSearch(client, config, input);
        }),
      fetch: (input, cwd) =>
        Effect.gen(function* () {
          const { config } = yield* configService.resolve(cwd);
          if (!config.exaApiKey) {
            return yield* new WebFetchError({ message: missingKeyMessage });
          }
          const client = new Exa(config.exaApiKey);
          return yield* exaFetch(client, config, input);
        }),
    };
  }),
);
