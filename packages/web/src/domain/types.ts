export type ProviderId = "exa" | "parallel";
export type ProviderSelection = "auto" | ProviderId;
export type WebSearchMode = "fast" | "standard" | "deep";
export type WebFetchFreshness = "cached" | "fresh" | "auto";

export type WebSearchFilters = {
  readonly includeDomains?: readonly string[];
  readonly excludeDomains?: readonly string[];
  readonly startPublishedDate?: string;
  readonly endPublishedDate?: string;
  readonly category?: "company" | "people" | "news" | "research paper" | "pdf" | "personal site";
  readonly location?: string;
};

export type WebSearchInput = {
  readonly query: string;
  readonly searchQueries?: readonly string[];
  readonly mode?: WebSearchMode;
  readonly numResults?: number;
  readonly filters?: WebSearchFilters;
};

export type WebSearchHit = {
  readonly title: string;
  readonly url: string;
  readonly publishedAt?: string;
  readonly author?: string;
  readonly highlights?: readonly string[];
  readonly text?: string;
};

export type WebSearchOutput = {
  readonly provider: ProviderId;
  readonly query: string;
  readonly hits: readonly WebSearchHit[];
  readonly requestId?: string;
  readonly searchTime?: number;
};

export type WebFetchInput = {
  readonly urls: readonly string[];
  readonly target?: string;
  readonly maxCharacters?: number;
  readonly freshness?: WebFetchFreshness;
};

export type WebFetchPage = {
  readonly url: string;
  readonly title?: string;
  readonly text: string;
  readonly publishedAt?: string;
  readonly author?: string;
  readonly error?: string;
};

export type WebFetchOutput = {
  readonly provider: ProviderId;
  readonly pages: readonly WebFetchPage[];
  readonly searchTime?: number;
};
