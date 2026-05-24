import type { ExtensionCommandContext } from "@earendil-works/pi-coding-agent";
import { DynamicBorder, getSettingsListTheme } from "@earendil-works/pi-coding-agent";
import { Container, type SettingItem, SettingsList, Text } from "@earendil-works/pi-tui";
import { Effect } from "effect";

import { globalPiWebConfigPath, projectPiWebConfigPath } from "../config/paths.ts";
import type { WebSettings } from "../schemas/settings.ts";
import { WebConfigService } from "../services/config.ts";

const providerValues = ["auto", "exa", "parallel"] as const;
const exaSearchTypeValues = ["auto", "fast", "deep-lite"] as const;
const parallelSearchModeValues = ["basic", "advanced"] as const;
const booleanValues = ["on", "off"] as const;
const resultCountValues = ["5", "10", "20", "40"] as const;
const fetchUrlValues = ["5", "10", "20", "40"] as const;
const fetchCharacterValues = ["3000", "8000", "20000", "50000"] as const;
const configScopeValues = ["global", "project"] as const;

type ConfigScope = (typeof configScopeValues)[number];

const boolToOnOff = (value: boolean): string => (value ? "on" : "off");
const onOffToBool = (value: string): boolean => value === "on";

const buildSettingItems = (settings: WebSettings, scope: ConfigScope): SettingItem[] => [
  {
    id: "provider",
    label: "Provider",
    description: "Auto routes per request. Explicit providers force all web calls.",
    currentValue: settings.provider,
    values: [...providerValues],
  },
  {
    id: "exa.search.type",
    label: "Exa search type",
    description: "Default Exa search type when the tool call does not force a mode.",
    currentValue: settings.exa.search.type,
    values: [...exaSearchTypeValues],
  },
  {
    id: "parallel.search.mode",
    label: "Parallel mode",
    description: "Default Parallel search mode when the tool call does not force fast mode.",
    currentValue: settings.parallel.search.mode,
    values: [...parallelSearchModeValues],
  },
  {
    id: "caps.defaultNumResults",
    label: "Default results",
    description: "Default result count for provider calls.",
    currentValue: String(settings.caps.defaultNumResults),
    values: [...resultCountValues],
  },
  {
    id: "caps.maxNumResults",
    label: "Max results",
    description: "Upper bound for search result count.",
    currentValue: String(settings.caps.maxNumResults),
    values: [...resultCountValues],
  },
  {
    id: "caps.maxFetchUrls",
    label: "Max fetch URLs",
    description: "Maximum URLs accepted by one web_fetch call.",
    currentValue: String(settings.caps.maxFetchUrls),
    values: [...fetchUrlValues],
  },
  {
    id: "caps.defaultFetchMaxCharacters",
    label: "Default fetch chars",
    description: "Default character budget per fetched page.",
    currentValue: String(settings.caps.defaultFetchMaxCharacters),
    values: [...fetchCharacterValues],
  },
  {
    id: "caps.maxFetchMaxCharacters",
    label: "Max fetch chars",
    description: "Upper bound for per-page fetch character budget.",
    currentValue: String(settings.caps.maxFetchMaxCharacters),
    values: [...fetchCharacterValues],
  },
  {
    id: "caps.allowDeepSearch",
    label: "Deep search",
    description: "Allow deep-mode requests to use provider deep search features.",
    currentValue: boolToOnOff(settings.caps.allowDeepSearch),
    values: [...booleanValues],
  },
  {
    id: "saveScope",
    label: "Save to",
    description: "Global applies everywhere. Project writes .pi/pi-web.json.",
    currentValue: scope,
    values: [...configScopeValues],
  },
];

const applySettingChange = (settings: WebSettings, id: string, newValue: string): WebSettings => {
  if (id === "provider") return { ...settings, provider: newValue as WebSettings["provider"] };
  if (id === "exa.search.type") {
    return {
      ...settings,
      exa: { ...settings.exa, search: { ...settings.exa.search, type: newValue as never } },
    };
  }
  if (id === "parallel.search.mode") {
    return {
      ...settings,
      parallel: {
        ...settings.parallel,
        search: { ...settings.parallel.search, mode: newValue as never },
      },
    };
  }
  if (id === "caps.allowDeepSearch") {
    return {
      ...settings,
      caps: { ...settings.caps, allowDeepSearch: onOffToBool(newValue) },
    };
  }
  if (id.startsWith("caps.")) {
    const key = id.slice("caps.".length) as keyof WebSettings["caps"];
    return {
      ...settings,
      caps: { ...settings.caps, [key]: Number(newValue) },
    };
  }
  return settings;
};

const syncSettingsList = (settingsList: SettingsList, settings: WebSettings): void => {
  settingsList.updateValue("provider", settings.provider);
  settingsList.updateValue("exa.search.type", settings.exa.search.type);
  settingsList.updateValue("parallel.search.mode", settings.parallel.search.mode);
  settingsList.updateValue("caps.defaultNumResults", String(settings.caps.defaultNumResults));
  settingsList.updateValue("caps.maxNumResults", String(settings.caps.maxNumResults));
  settingsList.updateValue("caps.maxFetchUrls", String(settings.caps.maxFetchUrls));
  settingsList.updateValue(
    "caps.defaultFetchMaxCharacters",
    String(settings.caps.defaultFetchMaxCharacters),
  );
  settingsList.updateValue(
    "caps.maxFetchMaxCharacters",
    String(settings.caps.maxFetchMaxCharacters),
  );
  settingsList.updateValue("caps.allowDeepSearch", boolToOnOff(settings.caps.allowDeepSearch));
};

export const runWebConfigUi = (
  ctx: ExtensionCommandContext,
): Effect.Effect<void, never, WebConfigService> =>
  Effect.gen(function* () {
    const config = yield* WebConfigService;

    if (!ctx.hasUI) {
      const resolved = yield* config.resolve(ctx.cwd);
      ctx.ui.notify(
        [
          config.formatSettingsSummary(resolved.settings),
          "",
          "Interactive config requires a Pi TUI session. Edit JSON directly:",
          `  ${globalPiWebConfigPath()}`,
          `  ${projectPiWebConfigPath(ctx.cwd)}`,
        ].join("\n"),
        "info",
      );
      return;
    }

    let settings = (yield* config.resolve(ctx.cwd)).settings;
    let saveScope: ConfigScope = "global";
    const context = yield* Effect.context<WebConfigService>();

    const persist = (): Promise<void> =>
      Effect.runPromiseWith(context)(
        saveScope === "project"
          ? config.saveProject(ctx.cwd, settings)
          : config.saveGlobal(settings),
      );

    yield* Effect.promise(() =>
      ctx.ui.custom((tui, theme, _keybindings, done) => {
        const container = new Container();
        container.addChild(new DynamicBorder((line) => theme.fg("accent", line)));
        container.addChild(new Text(theme.fg("accent", theme.bold("Pi Web Settings")), 0, 0));
        container.addChild(
          new Text(
            theme.fg(
              "dim",
              "↑↓ navigate • enter/space change • esc close • changes save immediately",
            ),
            0,
            0,
          ),
        );

        const settingsList = new SettingsList(
          buildSettingItems(settings, saveScope),
          14,
          getSettingsListTheme(),
          (id, newValue) => {
            if (id === "saveScope") {
              saveScope = newValue as ConfigScope;
              settingsList.updateValue("saveScope", saveScope);
              tui.requestRender();
              return;
            }

            settings = applySettingChange(settings, id, newValue);

            void (async () => {
              try {
                await persist();
                syncSettingsList(settingsList, settings);
                ctx.ui.setStatus("web", config.formatStatusBar(settings));
                tui.requestRender();
              } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                ctx.ui.notify(message, "error");
              }
            })();
          },
          () => {
            done(undefined);
          },
        );

        container.addChild(settingsList);
        container.addChild(new DynamicBorder((line) => theme.fg("accent", line)));

        return {
          render(width: number) {
            return container.render(width);
          },
          invalidate() {
            container.invalidate();
          },
          handleInput(data: string) {
            settingsList.handleInput?.(data);
            tui.requestRender();
          },
        };
      }),
    );

    const resolved = yield* config.resolve(ctx.cwd);
    ctx.ui.setStatus("web", config.formatStatusBar(resolved.settings));
  });
