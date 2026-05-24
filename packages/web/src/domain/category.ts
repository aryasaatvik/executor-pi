/** Categories supported by `category:` in the search query (matches exa-mcp-server web_search_exa). */
export type ExaSearchCategory = "company" | "research paper" | "news" | "personal site" | "people";

const CATEGORY_PATTERN = /\bcategory:(company|research\s*paper|news|personal\s*site|people)\b/i;

export const parseCategoryFromQuery = (
  query: string,
): { readonly query: string; readonly category?: ExaSearchCategory } => {
  const match = query.match(CATEGORY_PATTERN);
  if (!match) {
    return { query };
  }
  const category = match[1].toLowerCase().replace(/\s+/g, " ") as ExaSearchCategory;
  const cleaned = query.replace(match[0], "").replace(/\s+/g, " ").trim();
  return { query: cleaned, category };
};
