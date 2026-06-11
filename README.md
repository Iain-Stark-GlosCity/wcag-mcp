# accessibility-advisor-mcp

A cloud-hosted Accessibility Advisor MCP for AI-assisted council website generation.

The server is not a scanner-first product. It exposes structured JSON tools that turn source-backed WCAG 2.2 criteria into practical build rules, CSS hints, automation boundaries, human-review prompts, and audit trace metadata.

## Endpoints

Suggested Azure Functions routes:

- `POST /api/accessibility-mcp` — JSON-RPC 2.0 MCP endpoint.
- `GET /api/accessibility-health` — health and data counts.
- `GET /api/accessibility-about` — source, licence, and attribution metadata.

The MCP endpoint supports `initialize`, `notifications/initialized`, `ping`, `tools/list`, and `tools/call`. Use the HTTPS Azure Functions URL (for example `https://<app>.azurewebsites.net/api/accessibility-mcp`) when adding the remote MCP server in ChatGPT. The endpoint is configured for Azure Functions v4 on Node.js 22 and implements Streamable HTTP-style JSON-RPC: `POST` handles MCP messages, `OPTIONS` handles browser/ChatGPT CORS preflight requests, and `GET` returns `405 Method Not Allowed` so clients can identify that no standalone SSE stream is offered. It advertises MCP protocol version `2025-06-18` and supports the `search`/`fetch` tool names expected by ChatGPT data-only app and deep research compatibility checks.


## Azure Functions deployment

This repository uses the Azure Functions Node.js v4 programming model:

- `package.json` sets `main` to `src/functions/register.js`, where the HTTP functions are registered in code with `app.http()`.
- `engines.node` is pinned to Node.js 22 (`>=22 <23`). Configure the Function App runtime to Node 22 and `FUNCTIONS_EXTENSION_VERSION=~4` in Azure.
- The legacy `function.json` files are kept only as fallback/discovery metadata for tooling; the v4 app registration is the source of truth at runtime.

## Tools

Reference tools:

- `wcag_get_criterion`
- `wcag_search`
- `wcag_get_techniques`
- `wcag_get_failures`
- `wcag_get_glossary_term`

Advisor tools:

- `accessibility_advise_text_layout`
- `accessibility_advise_colour_contrast`
- `accessibility_advise_focus_visible`
- `accessibility_advise_form_errors`
- `accessibility_advise_component`
- `accessibility_check_css_rule`
- `accessibility_get_component_requirements`

## Data pipeline

```sh
npm run build
npm run normalise
npm run validate:data
```

The fork keeps the W3C-derived `data/wcag.json` model and normalises it into `data/normalised/` for deterministic service access.

## Response contract

Advisor responses include structured JSON first and markdown second:

- `answer`
- `decision`
- `criteria`
- `implementation`
- `automated_checks`
- `human_review`
- `limitations`
- `confidence`
- `sources`
- `answer_markdown`
- `trace`

Hard rule: if no source-backed WCAG success criterion can be mapped, the advisor returns `decision: "human_review"` and does not present the answer as authoritative WCAG guidance.

## Attribution

WCAG material is copied from or derived from W3C WCAG 2.2 and Understanding WCAG 2.2 material. See [ATTRIBUTION.md](ATTRIBUTION.md).
