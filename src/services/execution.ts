import { Context, Effect, Layer } from "effect";

import { ExecutionError } from "../errors.ts";

export class ExecutionService extends Context.Service<
  ExecutionService,
  {
    readonly execute: () => Effect.Effect<never, ExecutionError>;
  }
>()("ExecutionService") {
  static readonly Default = Layer.succeed(this)({
    execute: () =>
      Effect.fail(
        new ExecutionError({
          message: "Executor execution is not wired in M0.",
        }),
      ),
  });
}
