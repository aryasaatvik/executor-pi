# web

Pi extension providing **`web_search`** and **`web_fetch`** with a pluggable **WebProvider** layer. It supports **Exa** via [`exa-js`](https://github.com/exa-labs/exa-js) and **Parallel** via [`parallel-web`](https://www.npmjs.com/package/parallel-web).

## Requirements

- Pi coding agent ≥ 0.37
- API keys stored in `~/.pi/agent/auth.json` under provider ids `exa` and/or `parallel`

## Install

```bash
pi install /path/to/pi-extensions/packages/web
```

## Tools

| Tool         | Description                                                                                                                              |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `web_search` | Web search with highlights/excerpts (default 10 results). Supports auto provider routing, mode, domain/date filters, and Exa categories. |
| `web_fetch`  | Page extraction for known URLs (default 3000 characters per page). Supports focused extraction via `target`.                             |

Use search to discover URLs; use fetch when highlights are not enough.

### Query tips (search)

- Describe the ideal page, not keywords: `blog post comparing React and Vue performance` not `React vs Vue`.
- Optional Exa category filter: `category:people`, `category:company`, `category:news`, `category:research paper`, `category:personal site`, or the structured `filters.category` input.
- Use `searchQueries` when you want Parallel-style keyword queries alongside the natural-language `query` objective.

## Configuration

Credentials are read from `~/.pi/agent/auth.json`. Provider selection and defaults are configured with `/web config`.

Credential shape:

```json
{
  "exa": {
    "type": "api_key",
    "key": "..."
  },
  "parallel": {
    "type": "api_key",
    "key": "..."
  }
}
```

Defaults:

- `provider: "auto"`
- search: 10 results, max 20
- fetch: 3000 characters per page, max 20000
- Exa search: `auto`, `fast`, or `deep-lite` based on mode
- Parallel search: `advanced` by default, `basic` for `mode: "fast"`

Settings files:

- Global: `~/.pi/agent/pi-web.json`
- Project override: `.pi/pi-web.json`

## Development

```bash
cd packages/web
bun run check
```
