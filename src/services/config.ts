import { Context, Effect, Layer } from "effect";

import { DefaultExecutorSettings, type ExecutorSettings } from "../schemas/settings.ts";

export interface ResolvedConfig {
  readonly cwd: string;
  readonly settings: ExecutorSettings;
}

export class ConfigService extends Context.Service<
  ConfigService,
  {
    readonly resolve: (cwd: string) => Effect.Effect<ResolvedConfig>;
  }
>()("ConfigService") {
  static readonly Default = Layer.succeed(this)({
    resolve: (cwd) =>
      Effect.succeed({
        cwd,
        settings: DefaultExecutorSettings,
      }),
  });
}
