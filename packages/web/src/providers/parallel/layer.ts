import Parallel from "parallel-web";
import { Effect, Layer } from "effect";

import { WebFetchError, WebSearchError } from "../../domain/errors.ts";
import { ParallelWebProvider } from "../../domain/web-provider.ts";
import { WebConfigService } from "../../services/config.ts";
import { parallelFetch } from "./fetch.ts";
import { parallelSearch } from "./search.ts";

const missingKeyMessage =
  'Parallel API key is not stored in ~/.pi/agent/auth.json. Add a "parallel" api_key credential before using the Parallel web provider.';

export const ParallelWebProviderLive = Layer.effect(ParallelWebProvider)(
  Effect.gen(function* () {
    const configService = yield* WebConfigService;

    return {
      id: "parallel" as const,
      search: (input, cwd) =>
        Effect.gen(function* () {
          const { config } = yield* configService.resolve(cwd);
          if (!config.parallelApiKey) {
            return yield* new WebSearchError({ message: missingKeyMessage });
          }
          const client = new Parallel({ apiKey: config.parallelApiKey });
          return yield* parallelSearch(client, config, input);
        }),
      fetch: (input, cwd) =>
        Effect.gen(function* () {
          const { config } = yield* configService.resolve(cwd);
          if (!config.parallelApiKey) {
            return yield* new WebFetchError({ message: missingKeyMessage });
          }
          const client = new Parallel({ apiKey: config.parallelApiKey });
          return yield* parallelFetch(client, config, input);
        }),
    };
  }),
);
