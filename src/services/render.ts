import { highlightCode, keyText, type Theme } from "@earendil-works/pi-coding-agent";
import { Text } from "@earendil-works/pi-tui";
import { Context, Effect, Layer } from "effect";

import type { ExecuteDetails, ExecuteInput } from "../schemas/execute.ts";
import type { SearchDetails, SearchInput } from "../schemas/search.ts";

const maxPreviewChars = 4_000;
const maxSearchSnippetChars = 120;
const maxCollapsedOutputChars = 1_200;

const stringify = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (value === undefined) return "undefined";

  try {
    return JSON.stringify(value, null, 2) ?? "null";
  } catch {
    return String(value);
  }
};

const truncate = (value: string, limit = maxPreviewChars): string =>
  value.length <= limit ? value : `${value.slice(0, limit)}\n... truncated`;

const normalizeWhitespace = (value: string): string => value.replace(/\s+/g, " ").trim();

const firstParagraph = (value: string): string =>
  value.split(/\n\s*\n/).find((part) => part.trim()) ?? value;

const truncateLine = (value: string, limit: number): string => {
  const normalized = normalizeWhitespace(value);
  return normalized.length <= limit ? normalized : `${normalized.slice(0, limit - 1)}…`;
};

const indentedLines = (value: string, theme: Theme, prefix = "  "): string[] =>
  value
    .trim()
    .split("\n")
    .map((line) => theme.fg("dim", `${prefix}${line}`));

const formatSources = (details: SearchDetails): string => {
  const sources = [...new Set(details.items.map((item) => item.sourceId))].sort();
  return sources.length === 0 ? "none" : sources.join(", ");
};

const formatSearchItem = (
  item: SearchDetails["items"][number],
  options: { readonly expanded?: boolean },
  theme: Theme,
): string[] => {
  const description = item.details?.description ?? item.description;
  const lines = [`${theme.fg("toolOutput", item.path)} ${theme.fg("dim", `[${item.sourceId}]`)}`];

  if (description) {
    const renderedDescription = options.expanded
      ? description.trim()
      : truncateLine(firstParagraph(description), maxSearchSnippetChars);
    lines.push(...indentedLines(renderedDescription, theme));
  }

  if (options.expanded && item.details) {
    if (item.details.inputTypeScript) {
      lines.push(theme.fg("muted", "  Input"));
      lines.push(...indentedLines(item.details.inputTypeScript, theme, "    "));
    }
    if (item.details.outputTypeScript) {
      lines.push(theme.fg("muted", "  Output"));
      lines.push(...indentedLines(item.details.outputTypeScript, theme, "    "));
    }
  }

  return lines;
};

const sectionLabel = (label: string, theme: Theme): string => theme.fg("muted", theme.bold(label));

const highlightJson = (value: string): string[] => highlightCode(value, "json");

const formatExecuteOutput = (
  value: unknown,
  options: { readonly expanded?: boolean },
  theme: Theme,
): string[] => {
  const formatted = stringify(value);
  const truncated = truncate(
    formatted,
    options.expanded ? maxPreviewChars : maxCollapsedOutputChars,
  );

  return highlightJson(truncated).map((line) => theme.fg("toolOutput", line));
};

const formatExecuteLogs = (
  logs: readonly string[],
  options: { readonly expanded?: boolean },
  theme: Theme,
): string[] => {
  if (logs.length === 0) {
    return [theme.fg("dim", "Logs: none")];
  }

  const logLines = logs.flatMap((entry) => entry.split("\n"));
  const visibleLogs = options.expanded ? logLines : logLines.slice(0, 6);
  const remaining = logLines.length - visibleLogs.length;

  return [
    sectionLabel("Logs", theme),
    ...visibleLogs.map((line) => theme.fg("dim", line)),
    ...(remaining > 0 ? [theme.fg("dim", `... ${remaining} more log line(s)`)] : []),
  ];
};

export const renderExecuteCall = (args: ExecuteInput, theme: Theme): Text => {
  const highlighted = highlightCode(args.code.trim(), "typescript");
  return new Text([sectionLabel("Code", theme), ...highlighted].join("\n"), 0, 0);
};

export const renderExecuteResult = (
  details: ExecuteDetails | undefined,
  contentText: string,
  options: { readonly expanded?: boolean; readonly isPartial?: boolean },
  theme: Theme,
): Text => {
  if (options.isPartial) {
    return new Text(theme.fg("warning", "running..."), 0, 0);
  }

  if (!details) {
    return new Text(truncate(contentText), 0, 0);
  }

  if (details.status === "error") {
    const lines = [
      theme.fg("error", theme.bold("failed")),
      theme.fg("error", details.error),
      "",
      ...formatExecuteLogs(details.logs, options, theme),
    ];
    return new Text(lines.join("\n"), 0, 0);
  }

  const lines = [
    sectionLabel("Output", theme),
    ...formatExecuteOutput(details.result, options, theme),
    "",
    ...formatExecuteLogs(details.logs, options, theme),
  ];

  return new Text(lines.join("\n"), 0, 0);
};

export const renderSearchCall = (args: SearchInput, theme: Theme): Text => {
  const suffix = [
    args.namespace ? `namespace=${args.namespace}` : undefined,
    args.limit ? `limit=${args.limit}` : undefined,
    args.offset ? `offset=${args.offset}` : undefined,
    args.includeDetails ? "details" : undefined,
  ]
    .filter((part): part is string => part !== undefined)
    .join(" ");
  const lines = [
    theme.fg("toolTitle", theme.bold("Search")),
    theme.fg("toolOutput", args.query),
    ...(suffix ? [theme.fg("dim", suffix)] : []),
  ];

  return new Text(lines.join("\n"), 0, 0);
};

export const renderSearchResult = (
  details: SearchDetails | undefined,
  contentText: string,
  options: { readonly expanded?: boolean; readonly isPartial?: boolean },
  theme: Theme,
): Text => {
  if (options.isPartial) {
    return new Text(theme.fg("warning", "Search running..."), 0, 0);
  }

  if (!details) {
    return new Text(truncate(contentText), 0, 0);
  }

  const lines = [
    theme.fg("success", theme.bold(`${details.total} result(s)`)),
    sectionLabel("Tools", theme),
    ...details.items.flatMap((item) => formatSearchItem(item, options, theme)),
  ];

  if (details.hasMore && details.nextOffset !== null) {
    lines.push(theme.fg("dim", `More results at offset ${details.nextOffset}`));
  }

  if (!options.expanded) {
    const hasExpandedContent = details.items.some(
      (item) =>
        item.details?.description !== undefined ||
        item.details?.inputTypeScript !== undefined ||
        item.details?.outputTypeScript !== undefined ||
        item.details?.typeScriptDefinitions !== undefined,
    );
    if (hasExpandedContent) {
      lines.push(theme.fg("muted", `${keyText("app.tools.expand")} to expand descriptions`));
    }
  }

  lines.push("", sectionLabel("Sources", theme), theme.fg("dim", formatSources(details)));

  return new Text(lines.join("\n"), 0, 0);
};

export class RenderService extends Context.Service<
  RenderService,
  {
    readonly summarize: (value: unknown) => Effect.Effect<string>;
    readonly formatJson: (value: unknown) => Effect.Effect<string>;
  }
>()("RenderService") {
  static readonly Default = Layer.succeed(this)({
    summarize: (value) =>
      Effect.sync(() => {
        return truncate(stringify(value));
      }),
    formatJson: (value) => Effect.sync(() => stringify(value)),
  });
}
