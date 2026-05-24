import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

import { makeRuntime } from "./app/runtime.ts";
import { webCommand } from "./commands/web.ts";
import { makeWebFetchTool } from "./tools/fetch.ts";
import { makeWebSearchTool } from "./tools/search.ts";

export default function piWeb(pi: ExtensionAPI): void {
  const runtime = makeRuntime(pi);

  pi.registerTool(makeWebSearchTool(runtime));
  pi.registerTool(makeWebFetchTool(runtime));

  pi.registerCommand("web", {
    description: "Inspect and configure the pi-web extension",
    handler: async (args, ctx) => {
      const status = await runtime.runPromise(webCommand(args, ctx));
      ctx.ui.notify(status.summary, status.level);
      ctx.ui.setStatus("web", status.statusBar);
    },
  });

  pi.on("session_shutdown", async () => {
    await runtime.dispose();
  });
}
