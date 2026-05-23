import { Context, Effect, Layer } from "effect";

export type LogFields = Record<string, unknown>;

export class LoggerService extends Context.Service<
  LoggerService,
  {
    readonly debug: (event: string, fields?: LogFields) => Effect.Effect<void>;
    readonly info: (event: string, fields?: LogFields) => Effect.Effect<void>;
  }
>()("LoggerService") {
  static readonly Default = Layer.succeed(this)({
    debug: (event, fields) =>
      Effect.sync(() => {
        console.debug("[pi-executor]", "debug", event, fields ?? {});
      }),
    info: (event, fields) =>
      Effect.sync(() => {
        console.info("[pi-executor]", "info", event, fields ?? {});
      }),
  });
}
