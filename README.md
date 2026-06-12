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
- `accessibility_advise_colour_contrast` (accepts computed colours — hex, `rgb()`/`rgba()`, `hsl()`/`hsla()`, named colours, and `var(--token)` resolved through a `tokens` map; translucent colours are composited over the background and `page_background`)
- `accessibility_advise_focus_visible`
- `accessibility_advise_form_errors`
- `accessibility_advise_component` (accepts component prose and/or an `html` fragment; detects tabs, accordions, menus, dialogs, disclosures, breadcrumbs, pagination, search, forms, cards, tables, alerts, status messages, and comboboxes)
- `accessibility_check_css_rule`
- `accessibility_validate_aria_attributes`
- `accessibility_get_component_requirements` (returns a concise build-agent contract by default)
- `accessibility_audit_summary` (audits a drafted summary against a finding's governance block and reports drift: upgraded, downgraded, or broadened claims, and omitted classifications)

Validator issues are classified so hard failures are separable from smells:

- `failure` — deterministic violation (e.g. an invalid ARIA attribute); the result decision is `fail`
- `warning` — likely problem that may be legitimate (e.g. a possibly redundant accessible name); decision is `warn`
- `note` — legitimate markup that still needs a manual check; decision stays `pass`

All advisor and validator tools accept `output_mode: "build_agent"` to return a concise implementation contract instead of the full response:

```json
{ "must": [], "should": [], "tests": [], "wcag": [], "example_fix": "" }
```

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

## Governance contract

Every MCP response carries a machine-readable `governance` block. Its purpose is to prevent governance drift: an assistant may explain the MCP output, but must not upgrade, downgrade, broaden, or certify beyond the tool finding.

```json
{
  "governance": {
    "finding_classification": "failure | warning | note | pass | caution | human_review | not_applicable | not_tested",
    "scope": "static_snippet | css_static | contrast_calculation | component_guidance | wcag_reference | response_audit",
    "confidence": "high | medium | low",
    "claim_boundary": {
      "can_claim": "The static HTML snippet check found 1 failure related to 4.1.2 in the supplied fragment.",
      "cannot_claim": [
        "Do not say this page fails WCAG.",
        "Do not say this component is inaccessible.",
        "Do not say this constitutes a full accessibility audit.",
        "Do not say no issues exist beyond this static check."
      ]
    },
    "release_gate": {
      "gate_status": "block | allow_with_warning | allow | manual_review_required | not_applicable",
      "blocks_release": true,
      "blocking_findings": [{ "criterion": "4.1.2", "reason": "aria-expandd is not a recognised ARIA attribute." }]
    },
    "next_evidence_required": ["Rendered browser test with assistive technology", "Keyboard navigation test"],
    "assistant_handling_instruction": {
      "must": ["Report the finding_classification exactly as returned in this governance block.", "..."],
      "must_not": ["Upgrade a warning to a failure.", "Claim WCAG compliance unless the scope is a complete rendered audit.", "..."]
    }
  }
}
```

Decision taxonomy and release-gate mapping:

| `decision` | Meaning | `gate_status` |
|---|---|---|
| `fail` | Deterministic failure found in the checked scope | `block` |
| `warn` | Likely issue or best-practice concern; not a confirmed WCAG failure | `allow_with_warning` |
| `caution` | Guidance applies but evidence is incomplete | `manual_review_required` |
| `human_review` | The tool cannot safely decide | `manual_review_required` |
| `pass` | The specific check passed — only that check, only that scope | `allow` |
| `not_applicable` | Reference data, not a test finding | `not_applicable` |

A `pass` never means "the page is accessible". A `fail` never means "the whole page fails WCAG" — the `scope` field states exactly what was tested, and `claim_boundary` states exactly what may and may not be said about it. Pass results carry additional explicit prohibitions (compliance, page-level, and rendered-behaviour claims), and a `block` gate always carries at least one `blocking_finding`. The governance block survives `output_mode: "build_agent"` unchanged.

To close the loop, `accessibility_audit_summary` takes a drafted summary plus the governance block it summarises and deterministically reports drift — a warning reported as a failure, a failure reported as clean, a snippet finding broadened to page-level compliance, or an omitted classification. A tool's own `can_claim` sentence always passes the audit.

## Attribution

WCAG material is copied from or derived from W3C WCAG 2.2 and Understanding WCAG 2.2 material. See [ATTRIBUTION.md](ATTRIBUTION.md).
