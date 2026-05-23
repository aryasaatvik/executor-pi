import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

import { executorStatusCommand } from "./commands/executor.ts";
import { makeRuntime } from "./app/runtime.ts";

export default function piExecutor(pi: ExtensionAPI): void {
  const runtime = makeRuntime(pi);

  pi.registerCommand("executor", {
    description: "Show pi-executor extension status",
    handler: async (args, ctx) => {
      const status = await runtime.runPromise(executorStatusCommand(args, ctx));

      ctx.ui.notify(status.summary, status.level);
      ctx.ui.setStatus("executor", status.statusBar);
    },
  });

  pi.on("session_shutdown", async () => {
    await runtime.dispose();
  });
}
