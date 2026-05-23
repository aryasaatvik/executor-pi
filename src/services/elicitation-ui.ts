import { Context, Effect, Layer } from "effect";

import { ElicitationUiError } from "../errors.ts";

export class ElicitationUiService extends Context.Service<
  ElicitationUiService,
  {
    readonly request: () => Effect.Effect<never, ElicitationUiError>;
  }
>()("ElicitationUiService") {
  static readonly Default = Layer.succeed(this)({
    request: () =>
      Effect.fail(
        new ElicitationUiError({
          message: "Executor elicitation UI is not wired in M0.",
        }),
      ),
  });
}
