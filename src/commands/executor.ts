import type { ExtensionCommandContext } from "@earendil-works/pi-coding-agent";
import { Effect } from "effect";

import { ConfigService } from "../services/config.ts";
import { LoggerService } from "../services/logger.ts";
import { SessionStateService } from "../services/session-state.ts";

export interface ExecutorStatus {
  readonly summary: string;
  readonly level: "info" | "warning" | "error";
  readonly statusBar: string;
}

export const executorStatusCommand = (
  args: string,
  ctx: ExtensionCommandContext,
): Effect.Effect<ExecutorStatus, never, ConfigService | LoggerService | SessionStateService> =>
  Effect.gen(function* () {
    const config = yield* ConfigService;
    const logger = yield* LoggerService;
    const sessionState = yield* SessionStateService;
    const resolved = yield* config.resolve(ctx.cwd);
    const snapshot = yield* sessionState.snapshot(ctx);
    const trimmedArgs = args.trim();

    yield* logger.debug("executor.status", {
      args: trimmedArgs,
      cwd: resolved.cwd,
      hasUI: snapshot.hasUI,
      model: snapshot.model,
    });

    return {
      summary: `pi-executor loaded for ${resolved.cwd}`,
      level: "info",
      statusBar: "executor: ready",
    };
  });
