import type { WebFetchOutput, WebSearchHit, WebSearchOutput } from "../domain/types.ts";

const formatSearchHit = (hit: WebSearchHit): string => {
  const lines = [
    `Title: ${hit.title || "N/A"}`,
    `URL: ${hit.url}`,
    `Published: ${hit.publishedAt ?? "N/A"}`,
    `Author: ${hit.author ?? "N/A"}`,
  ];
  if (hit.highlights && hit.highlights.length > 0) {
    lines.push(`Highlights:\n${hit.highlights.join("\n")}`);
  } else if (hit.text) {
    lines.push(`Text: ${hit.text}`);
  }
  return lines.join("\n");
};

export const formatSearchMarkdown = (output: WebSearchOutput): string => {
  if (output.hits.length === 0) {
    return "No search results found. Please try a different query.";
  }
  return output.hits.map(formatSearchHit).join("\n\n---\n\n");
};

export const formatFetchMarkdown = (output: WebFetchOutput): string => {
  if (output.pages.length === 0) {
    return "No content found for the provided URL(s).";
  }

  const lines: string[] = [];
  for (const page of output.pages) {
    if (page.error) {
      lines.push(`Error fetching ${page.url}: ${page.error}`);
      continue;
    }
    lines.push(`# ${page.title || "(no title)"}`);
    lines.push(`URL: ${page.url}`);
    if (page.publishedAt) {
      lines.push(`Published: ${page.publishedAt}`);
    }
    if (page.author) {
      lines.push(`Author: ${page.author}`);
    }
    lines.push("");
    if (page.text) {
      lines.push(page.text);
    }
    lines.push("");
  }

  return lines.join("\n").trim();
};

export const fetchHasSuccessfulContent = (output: WebFetchOutput): boolean =>
  output.pages.some((page) => !page.error && page.text.length > 0);

export const formatFetchAllErrors = (output: WebFetchOutput): string => {
  const errors = output.pages.filter((page) => page.error);
  if (errors.length === 0) {
    return "No content found for the provided URL(s).";
  }
  return `Error fetching URL(s): ${errors.map((page) => `${page.url}: ${page.error}`).join("; ")}`;
};
