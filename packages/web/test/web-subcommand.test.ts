import { describe, expect, it } from "vitest";

import {
  Config,
  Help,
  Status,
  Unknown,
  parseWebSubcommand,
} from "../src/commands/web-subcommand.ts";

describe("parseWebSubcommand", () => {
  it("parses known tokens", () => {
    expect(parseWebSubcommand("")).toEqual(Status());
    expect(parseWebSubcommand("status")).toEqual(Status());
    expect(parseWebSubcommand("help")).toEqual(Help());
    expect(parseWebSubcommand("config")).toEqual(Config());
    expect(parseWebSubcommand("settings")).toEqual(Config());
  });

  it("returns Unknown for unrecognized tokens", () => {
    expect(parseWebSubcommand("nope")).toEqual(Unknown({ name: "nope" }));
  });

  it("exports tagged constructors", () => {
    expect(Help()).toEqual({ _tag: "Help" });
    expect(Config()).toEqual({ _tag: "Config" });
    expect(Status()).toEqual({ _tag: "Status" });
  });
});
