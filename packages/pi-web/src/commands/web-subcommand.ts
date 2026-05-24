import { Data } from "effect";

export type WebSubcommand = Data.TaggedEnum<{
  Help: {};
  Config: {};
  Status: {};
  Unknown: { readonly name: string };
}>;

export const { Help, Config, Status, Unknown } = Data.taggedEnum<WebSubcommand>();

export const webCommandHelp = [
  "/web status - show provider configuration and auth status",
  "/web config - adjust pi-web provider defaults and limits",
  "/web help - show this help",
].join("\n");

const parseToken = (args: string): string =>
  args.trim().split(/\s+/, 1)[0]?.toLowerCase() || "status";

const subcommandByToken = {
  help: Help,
  config: Config,
  settings: Config,
  status: Status,
} as const;

export const parseWebSubcommand = (args: string): WebSubcommand => {
  const token = parseToken(args);
  const ctor = subcommandByToken[token as keyof typeof subcommandByToken];
  return ctor ? ctor() : Unknown({ name: token });
};
