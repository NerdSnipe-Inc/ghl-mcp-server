# GHL API v3 Migration — Phase 1: Migrate Existing Tools

**Status:** Approved for planning
**Scope:** Migrate the 20 existing `src/tools/*.ts` modules to GoHighLevel API v3, where a v3
equivalent exists. Adding tool modules for currently-uncovered v3 resources is **out of scope**
(Phase 2, to be spec'd separately after Phase 1 ships).

## Background

The current server hardcodes a single API version everywhere:

```ts
export const GHL_VERSION = "2021-07-28";
```

Cross-referencing every OpenAPI spec in `highlevel-api-docs/apps/*.json` (v2) against
`highlevel-api-docs/apps/v3/*-v3.json` (v3) shows:

- Nearly every endpoint the server currently calls **still exists at the same path** in v3 — the
  only required change for most of them is sending `Version: v3` instead of `2021-07-28`.
- A small number of paths were renamed or restructured between v2 and v3 (below).
- v3 is **per-endpoint versioned**: some operations in a resource's v3 spec file may not exist,
  meaning that specific call has no v3 equivalent yet and must keep using the legacy version
  header.

## Goals

1. `client.ts` supports sending a different `Version` header per request instead of one global
   constant.
2. Every tool in the 20 existing modules calls its v3 endpoint (correct path + `Version: v3`)
   wherever a v3 equivalent exists.
3. Where no v3 equivalent exists for a specific operation, the tool explicitly keeps
   `Version: 2021-07-28` (not silently guessed — verified against the v3 spec file that the
   operation is genuinely absent).
4. `emails.ts` is reworked: the v2 "email builder" (`/emails/builder*`) and "schedule"
   (`/emails/schedule*`) endpoints do not exist in v3. They are replaced by the v3
   templates API (`/emails/locations/{locationId}/templates*`) and campaigns API
   (`/emails/locations/{locationId}/campaigns/emails*`).
5. All existing tests pass against the updated paths/versions; tests are updated to assert the
   new `Version` header and paths where changed.
6. No tool is removed to make this land — if a v2-only capability has no v3 replacement, it stays
   on the legacy version header rather than being deleted (per this project's existing rule in
   `_DEV_NOTES.md`: "Never remove tools to fix errors").

## Non-goals

- No new tool modules for resources with zero current coverage (ad-publishing, agent-studio,
  brand-boards, businesses, campaigns, chat-widget, companies, conversation-ai, courses,
  custom-menus, email-isv, marketplace, objects, oauth, products, proposals, saas, snapshots,
  social-planner, store, voice-ai, affiliate-manager, associations, blogs). That's Phase 2.
- No behavior changes beyond what's required to hit the correct v3 endpoint (no new parameters,
  no new tools, no schema redesign) — except where the v3 API genuinely requires a different
  request/response shape (e.g. emails).

## Architecture

### `client.ts`

- Replace the single `GHL_VERSION` export with:
  ```ts
  export const GHL_VERSION_V3 = "v3";
  export const GHL_VERSION_LEGACY = "2021-07-28";
  ```
- `buildHeaders(token: string, version: string)` — version becomes a required parameter, no
  default (forces every call site to be explicit and auditable).
- `ghlRequest<T>(method, path, options)` — `options` gains a required `version: string` field.
- No change to `GHLApiError`, `formatError`, or the base URL — v3 uses the same
  `https://services.leadconnectorhq.com` host.

This is a breaking change to `ghlRequest`'s call signature, which is intentional: it forces every
one of the ~180 call sites across the 20 modules to be touched and verified against the v3 spec,
rather than silently defaulting and risking unverified endpoints.

### Per-module migration process

For each module, for each `ghlRequest(...)` call site:

1. Look up the path + method in the corresponding `highlevel-api-docs/apps/v3/<resource>-v3.json`.
2. If found: update the path if renamed, pass `version: GHL_VERSION_V3`.
3. If not found (operation genuinely absent from the v3 spec): pass
   `version: GHL_VERSION_LEGACY`, and leave a one-line comment noting why (`// no v3 equivalent
   yet — see highlevel-api-docs/apps/<resource>.json`).
4. If the resource has no `-v3.json` file at all (shouldn't apply to any of the current 20 modules
   per the audit — flag immediately if discovered otherwise).

### Known path renames (confirmed via spec diff)

| Module | v2 path | v3 path |
|---|---|---|
| `contacts.ts` | `/contacts/{contactId}/campaigns/removeAll` | `/contacts/{contactId}/campaigns/remove-all` |

No other existing call sites in `calendars.ts`, `locations.ts`, or `conversations.ts` hit the
paths that were renamed/restructured in those resources' v3 specs (the renamed/added paths in
those three are net-new v3-only endpoints not currently used by any tool) — **must be
re-verified per-module during implementation**, this table reflects the audit done during design,
not a line-by-line guarantee.

### `emails.ts` rework

Current shape: `emailBuilderTools` (5 tools operating on `/emails/builder*`) +
`emailCampaignTools` (4 tools operating on `/emails/schedule*`).

v3 replacement endpoints (from `emails-v3.json`):

- Templates: `POST/GET /emails/locations/{locationId}/templates`,
  `GET/PATCH/DELETE /emails/locations/{locationId}/templates/{templateId}`,
  `POST /emails/locations/{locationId}/templates/folders`,
  `POST /emails/locations/{locationId}/templates/import`.
- Campaigns: `POST/GET /emails/locations/{locationId}/campaigns/emails`,
  `GET/PATCH/DELETE /emails/locations/{locationId}/campaigns/emails/{campaignId}`,
  `POST .../schedule`, plus read-only `campaigns/workflows*`, `campaigns/bulk-actions*`, and
  `campaigns/stats/{source}/{sourceId}`.

Approach: keep the existing 9 tool names and their public input schemas as stable as reasonably
possible (minimize breakage for existing users of the MCP server), but repoint each handler at
its v3 equivalent and adapt the request/response body shape to what v3 actually expects/returns
(read `emails-v3.json`'s request/response schemas during implementation — this design doc does
not lock exact field names). If a v3 endpoint's shape forces a tool input schema change (e.g.
`PATCH` instead of two-step create+data-push for templates), that's acceptable and expected —
document it in the tool's `description`.

The read-only `campaigns/workflows`, `campaigns/bulk-actions`, and `campaigns/stats` endpoints are
new capability with no v2 equivalent tool today — adding thin tools for them is in-scope only if
it's a natural byproduct of the rework (cheap, same file, same session); if it adds meaningfully
more design/test surface, defer to Phase 2 rather than scope-creep Phase 1.

## Data flow

Unchanged. Tool handler → `ghlRequest(method, path, {token, body, params, version})` →
`fetch` → JSON response or `GHLApiError`.

## Error handling

Unchanged — `GHLApiError` and `formatError` behavior stays identical. A v3 4xx/5xx response is
handled exactly like a v2 one.

## Testing

- `tests/helpers.ts` `mockFetch`/`parseLastFetchCall` — verify it can assert on the `Version`
  header value; extend if it currently hardcodes `2021-07-28`.
- `tests/client.test.ts` — update/add cases for `buildHeaders` and `ghlRequest` now requiring an
  explicit `version`.
- `tests/tools/*.test.ts` — for every existing test, assert the new path (where renamed) and the
  new `Version` header value per call.
- `tests/tools/emails.test.ts` (or equivalent) — rewritten to match the new template/campaign
  endpoints and payload shapes.
- `tests/server.test.ts` — tool registry count assertions stay the same unless the emails rework
  changes the tool count (e.g. adding a folder/import tool) — update `toHaveLength()` calls to
  match.
- Run `npm run typecheck` and the full test suite before considering Phase 1 done.

## Rollout

- No new environment variables, no config changes for end users.
- Bump `package.json` version per existing release process in `_DEV_NOTES.md` once Phase 1 is
  merged and verified — **do not tag/publish without explicit human approval**, per this
  project's global deployment-approval rule.
- Update `README.md` only if tool descriptions/behavior meaningfully changed (the emails rework);
  no tool count changes expected elsewhere in Phase 1.

## Open questions for Phase 2 (not blocking Phase 1)

- Which of the 26 uncovered v3 resources to prioritize first.
- Whether `invoices`/`links`/`medias` (currently folded into `payments.ts`/`social.ts`) should be
  split into their own modules when Phase 2 adds full coverage for those resource families.
