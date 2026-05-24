import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { Effect } from "effect";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as paths from "../src/config/paths.ts";
import { loadPiWebSettings, saveGlobalPiWebSettings } from "../src/config/store.ts";
import { DefaultWebSettings } from "../src/schemas/settings.ts";

describe("web config store", () => {
  let tempDir = "";

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "web-config-"));
    vi.spyOn(paths, "globalPiWebConfigPath").mockReturnValue(join(tempDir, "pi-web.json"));
    vi.spyOn(paths, "projectPiWebConfigPath").mockImplementation((cwd) =>
      join(cwd, ".pi", "pi-web.json"),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("returns defaults when no config files exist", () => {
    const settings = Effect.runSync(loadPiWebSettings("/tmp/project"));
    expect(settings).toEqual(DefaultWebSettings);
  });

  it("loads global config and merges project overrides", () => {
    const projectDir = join(tempDir, "project");
    mkdirSync(join(projectDir, ".pi"), { recursive: true });

    writeFileSync(
      join(tempDir, "pi-web.json"),
      JSON.stringify({
        ...DefaultWebSettings,
        provider: "parallel",
        caps: { ...DefaultWebSettings.caps, maxFetchUrls: 10 },
      }),
    );
    writeFileSync(
      join(projectDir, ".pi", "pi-web.json"),
      JSON.stringify({
        provider: "exa",
        caps: { maxNumResults: 40 },
      }),
    );

    const settings = Effect.runSync(loadPiWebSettings(projectDir));
    expect(settings.provider).toBe("exa");
    expect(settings.caps.maxFetchUrls).toBe(10);
    expect(settings.caps.maxNumResults).toBe(40);
  });

  it("persists global settings", () => {
    Effect.runSync(saveGlobalPiWebSettings({ ...DefaultWebSettings, provider: "parallel" }));

    const settings = Effect.runSync(loadPiWebSettings("/tmp/project"));
    expect(settings.provider).toBe("parallel");
  });
});
