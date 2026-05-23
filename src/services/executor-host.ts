import { Context, Effect, Layer } from "effect";

export interface ExecutorHostStatus {
  readonly available: false;
  readonly reason: "not-wired";
}

export class ExecutorHostService extends Context.Service<
  ExecutorHostService,
  {
    readonly status: Effect.Effect<ExecutorHostStatus>;
  }
>()("ExecutorHostService") {
  static readonly Default = Layer.succeed(this)({
    status: Effect.succeed({
      available: false,
      reason: "not-wired",
    }),
  });
}
