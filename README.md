# accessibility-advisor-mcp

A cloud-hosted Accessibility Advisor MCP for AI-assisted council website generation.

The server is not a scanner-first product. It exposes structured JSON tools that turn source-backed WCAG 2.2 criteria into practical build rules, CSS hints, automation boundaries, human-review prompts, and audit trace metadata.

## Endpoint

Use this Azure Functions v4 route when adding the remote MCP server in ChatGPT:

- `POST /api/accessibility-mcp` — JSON-RPC 2.0 MCP endpoint.

The deployed Function App must run on Azure Functions v4 with Node.js 22. The MCP endpoint is intentionally POST-only and only accepts standard JSON-RPC MCP requests such as `initialize`, `ping`, `tools/list`, and `tools/call`.

## Azure Functions deployment

This repository uses the Azure Functions Node.js v4 programming model only:

- `package.json` sets `main` to `src/functions/register.js`, where the HTTP function is registered in code with `app.http()`.
- `engines.node` is pinned to Node.js 22 (`>=22 <23`). Configure the Function App runtime to Node 22 and `FUNCTIONS_EXTENSION_VERSION=~4` in Azure.
- There are no `function.json` HTTP triggers; the v4 app registration is the runtime source of truth.

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
