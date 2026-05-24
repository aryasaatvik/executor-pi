import type { ExtensionCommandContext } from "@earendil-works/pi-coding-agent";
import { Effect, Match } from "effect";

import { runWebConfigUi } from "./web-config.ts";
import { parseWebSubcommand, webCommandHelp } from "./web-subcommand.ts";
import { globalPiWebConfigPath, projectPiWebConfigPath } from "../config/paths.ts";
import { WebConfigService, type WebConfig } from "../services/config.ts";

export interface WebCommandStatus {
  readonly summary: string;
  readonly level: "info" | "warning" | "error";
  readonly statusBar: string;
}

const authStatus = (key: string | undefined): string => (key ? "set" : "missing");

const formatStatus = (config: WebConfig, cwd: string): string =>
  [
    "Pi Web ready",
    `Provider: ${config.provider}`,
    `Auth: exa=${authStatus(config.exaApiKey)}, parallel=${authStatus(config.parallelApiKey)}`,
    `Search: default=${config.caps.defaultNumResults}, max=${config.caps.maxNumResults}, deep=${config.caps.allowDeepSearch}`,
    `Fetch: maxUrls=${config.caps.maxFetchUrls}, defaultChars=${config.caps.defaultFetchMaxCharacters}, maxChars=${config.caps.maxFetchMaxCharacters}`,
    `Exa: search=${config.exa.search.type}, results=${config.exa.search.numResults}, fetchChars=${config.exa.fetch.maxCharacters}`,
    `Parallel: search=${config.parallel.search.mode}, results=${config.parallel.search.maxResults}, fetchChars=${config.parallel.fetch.maxCharacters}`,
    `Global config: ${globalPiWebConfigPath()}`,
    `Project config: ${projectPiWebConfigPath(cwd)}`,
  ].join("\n");

const helpStatus = (): WebCommandStatus => ({
  summary: webCommandHelp,
  level: "info",
  statusBar: "web: help",
});

const unknownStatus = (name: string): WebCommandStatus => ({
  summary: `Unknown /web command: ${name}\n\n${webCommandHelp}`,
  level: "warning",
  statusBar: "web: help",
});

export const webCommand = (
  args: string,
  ctx: ExtensionCommandContext,
): Effect.Effect<WebCommandStatus, never, WebConfigService> =>
  Effect.gen(function* () {
    const configService = yield* WebConfigService;
    const subcommand = parseWebSubcommand(args);

    yield* Effect.logDebug("web.command").pipe(
      Effect.annotateLogs({
        cwd: ctx.cwd,
        hasUI: ctx.hasUI,
      }),
    );

    return yield* Match.value(subcommand).pipe(
      Match.tag("Help", () => Effect.succeed(helpStatus())),
      Match.tag("Config", () =>
        Effect.gen(function* () {
          yield* runWebConfigUi(ctx);
          const refreshed = yield* configService.resolve(ctx.cwd);
          return {
            summary: `Pi Web settings (${refreshed.settings.provider})`,
            level: "info",
            statusBar: configService.formatStatusBar(refreshed.settings),
          } satisfies WebCommandStatus;
        }),
      ),
      Match.tag("Status", () =>
        configService.resolve(ctx.cwd).pipe(
          Effect.map((resolved) => ({
            summary: formatStatus(resolved.config, resolved.cwd),
            level: "info" as const,
            statusBar: configService.formatStatusBar(resolved.settings),
          })),
        ),
      ),
      Match.tag("Unknown", ({ name }) => Effect.succeed(unknownStatus(name))),
      Match.exhaustive,
    );
  });
