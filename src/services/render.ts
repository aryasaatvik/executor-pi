import { Context, Effect, Layer } from "effect";

export class RenderService extends Context.Service<
  RenderService,
  {
    readonly summarize: (value: unknown) => Effect.Effect<string>;
  }
>()("RenderService") {
  static readonly Default = Layer.succeed(this)({
    summarize: (value) =>
      Effect.sync(() => {
        if (typeof value === "string") {
          return value;
        }

        return String(value);
      }),
  });
}
