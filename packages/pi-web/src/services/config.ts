import { AuthStorage } from "@earendil-works/pi-coding-agent";
import { Context, Effect, Layer } from "effect";

import {
  formatPiWebSettingsSummary,
  loadPiWebSettings,
  saveGlobalPiWebSettings,
  saveProjectPiWebSettings,
} from "../config/store.ts";
import type { WebConfigError } from "../domain/errors.ts";
import type { ProviderId } from "../domain/types.ts";
import type { WebSettings } from "../schemas/settings.ts";

export type WebConfig = WebSettings & {
  readonly exaApiKey: string | undefined;
  readonly parallelApiKey: string | undefined;
};

export interface ResolvedWebConfig {
  readonly cwd: string;
  readonly settings: WebSettings;
  readonly config: WebConfig;
}

const authKey = (auth: AuthStorage, provider: ProviderId): string | undefined => {
  const credential = auth.get(provider);
  if (credential?.type !== "api_key") return undefined;
  const key = credential.key.trim();
  return key.length > 0 ? key : undefined;
};

const loadAuth = (settings: WebSettings): WebConfig => {
  const auth = AuthStorage.create();
  return {
    ...settings,
    exaApiKey: authKey(auth, "exa"),
    parallelApiKey: authKey(auth, "parallel"),
  };
};

export class WebConfigService extends Context.Service<
  WebConfigService,
  {
    readonly resolve: (cwd: string) => Effect.Effect<ResolvedWebConfig>;
    readonly saveGlobal: (settings: WebSettings) => Effect.Effect<void, WebConfigError>;
    readonly saveProject: (
      cwd: string,
      settings: WebSettings,
    ) => Effect.Effect<void, WebConfigError>;
    readonly formatSettingsSummary: (settings: WebSettings) => string;
    readonly formatStatusBar: (settings: WebSettings) => string;
  }
>()("@pi-web/WebConfigService") {
  static readonly Default = Layer.succeed(this)({
    resolve: (cwd) =>
      loadPiWebSettings(cwd).pipe(
        Effect.map((settings) => ({
          cwd,
          settings,
          config: loadAuth(settings),
        })),
      ),
    saveGlobal: saveGlobalPiWebSettings,
    saveProject: saveProjectPiWebSettings,
    formatSettingsSummary: formatPiWebSettingsSummary,
    formatStatusBar: (settings) => `web: ${settings.provider}`,
  });
}
