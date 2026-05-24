/** Coerce tool `urls` input (matches exa-mcp-server web_fetch_exa preprocess). */
export const normalizeUrls = (val: unknown): string[] => {
  if (typeof val === "string") {
    try {
      const parsed: unknown = JSON.parse(val);
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === "string");
      }
      return [val];
    } catch {
      return [val];
    }
  }
  if (Array.isArray(val)) {
    return val.filter((item): item is string => typeof item === "string");
  }
  return [];
};
