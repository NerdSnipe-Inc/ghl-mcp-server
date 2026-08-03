# GHL API v3 Migration — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate every existing GHL MCP tool to call GoHighLevel API v3 (`Version: v3` header) instead of the legacy `2021-07-28` header, fixing the handful of renamed paths and reworking `emails.ts` where v3 removed the old endpoints outright.

**Architecture:** `client.ts`'s `ghlRequest`/`buildHeaders` gain a required `version` parameter (no default) so every one of the ~120 call sites across 19 tool modules must be explicitly touched and verified against the v3 OpenAPI specs. Each module is migrated as its own task: verify paths against the matching `highlevel-api-docs/apps/v3/<resource>-v3.json` spec, add `version: GHL_VERSION_V3` to every `ghlRequest` call, fix any renamed path, and add/update a `Version` header assertion to that module's tests.

**Tech Stack:** TypeScript, Zod, Vitest, Node.js (existing stack — no new dependencies).

## Global Constraints

- Spec: `docs/superpowers/specs/2026-08-02-v3-migration-phase1-design.md` — read it before starting if you haven't.
- Base URL and error handling (`GHLApiError`, `formatError`) do not change.
- **Never remove a tool to fix an error** — if a specific operation has no v3 equivalent, keep it on `GHL_VERSION_LEGACY` with a one-line comment citing the v2 spec file (per `_DEV_NOTES.md`'s existing rule). Per the design-phase audit, this is not expected to be needed anywhere in Phase 1 except inside the `emails.ts` rework — if you find one elsewhere, treat it as a real finding, verify carefully, and flag it rather than silently guessing.
- `src/tools/locations.ts` is an intentional tombstone (empty `locationTools` export, real tools live in `location.ts`, `tags.ts`, `custom_fields.ts`, etc.) — it needs no migration work, skip it.
- Vitest here does not type-check (esbuild transform only, see `vitest.config.ts`), so `npx vitest run tests/tools/<module>.test.ts` is a valid, fast per-task gate even while other not-yet-migrated modules in the repo are mid-flight. Full `npm run typecheck` only needs to pass at the very end (Task 20), because `client.ts`'s new required `version` field will make every un-migrated call site type-invalid until its task lands.
- Tool naming convention (`ghl_` prefix, snake_case) and the "add tool → update `tests/server.test.ts` `toHaveLength()`" rule from `_DEV_NOTES.md` still apply if any task adds a genuinely new tool (only expected in the `emails.ts` task).
- v3 OpenAPI specs live at `/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/<resource>-v3.json`; the v2 originals are one directory up, `/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/<resource>.json`.

---

## Task 1: `client.ts` — per-request `version` support

**Files:**
- Modify: `src/client.ts`
- Modify: `tests/client.test.ts`

**Interfaces:**
- Produces: `GHL_VERSION_V3 = "v3"`, `GHL_VERSION_LEGACY = "2021-07-28"` (exported constants). `buildHeaders(token: string, version: string): Record<string, string>`. `ghlRequest<T>(method, path, options: { token: string; version: string; body?: unknown; params?: Record<string, string | number | boolean | undefined> })`. Every later task's tool code calls `ghlRequest(..., { token: config.token, version: GHL_VERSION_V3, ... })`.

- [ ] **Step 1: Write the failing tests**

Edit `tests/client.test.ts`: replace the `GHL_VERSION` import with `GHL_VERSION_V3, GHL_VERSION_LEGACY`, and update the `buildHeaders` describe block:

```ts
import {
  getConfig,
  buildHeaders,
  ghlRequest,
  formatError,
  GHLApiError,
  GHL_BASE_URL,
  GHL_VERSION_V3,
  GHL_VERSION_LEGACY,
} from '../src/client.js';
```

```ts
describe('buildHeaders', () => {
  it('includes Authorization Bearer token', () => {
    const headers = buildHeaders('my-secret-token', GHL_VERSION_V3);
    expect(headers['Authorization']).toBe('Bearer my-secret-token');
  });

  it('sends the exact version string it is given', () => {
    expect(buildHeaders('tok', GHL_VERSION_V3)['Version']).toBe('v3');
    expect(buildHeaders('tok', GHL_VERSION_LEGACY)['Version']).toBe('2021-07-28');
  });

  it('includes JSON Content-Type and Accept', () => {
    const headers = buildHeaders('tok', GHL_VERSION_V3);
    expect(headers['Content-Type']).toBe('application/json');
    expect(headers['Accept']).toBe('application/json');
  });
});
```

Update every `ghlRequest(...)` call in the `ghlRequest` describe block to pass `version: GHL_VERSION_V3` inside the options object, e.g.:

```ts
await ghlRequest('GET', '/contacts/', { token: 'tok', version: GHL_VERSION_V3 });
```

Apply that same addition (`version: GHL_VERSION_V3,`) to all 9 `ghlRequest(...)` call sites in that describe block (URL building, query params, undefined params, POST body, no body on GET, 204 handling, both error cases).

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/client.test.ts`
Expected: FAIL — `buildHeaders`/`ghlRequest` don't accept/require a second arg yet, `GHL_VERSION_V3`/`GHL_VERSION_LEGACY` are not exported.

- [ ] **Step 3: Implement the client changes**

In `src/client.ts`, replace:

```ts
export const GHL_BASE_URL = "https://services.leadconnectorhq.com";
export const GHL_VERSION = "2021-07-28";
```

with:

```ts
export const GHL_BASE_URL = "https://services.leadconnectorhq.com";
/** GHL API v3 — use for every endpoint that has a v3 spec (the default going forward). */
export const GHL_VERSION_V3 = "v3";
/** Legacy GHL API version header — only for the small number of operations with no v3 equivalent yet. */
export const GHL_VERSION_LEGACY = "2021-07-28";
```

Replace `buildHeaders`:

```ts
export function buildHeaders(token: string, version: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Version: version,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}
```

Replace the `ghlRequest` signature and header call:

```ts
export async function ghlRequest<T = unknown>(
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
  path: string,
  options: {
    token: string;
    version: string;
    body?: unknown;
    params?: Record<string, string | number | boolean | undefined>;
  }
): Promise<T> {
  const { token, version, body, params } = options;

  let url = `${GHL_BASE_URL}${path}`;

  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        searchParams.set(key, String(value));
      }
    }
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  }

  const response = await fetch(url, {
    method,
    headers: buildHeaders(token, version),
    body: body ? JSON.stringify(body) : undefined,
  });
```

(the rest of the function is unchanged). Update the file's top comment to mention v3 instead of the hardcoded legacy version.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/client.test.ts`
Expected: PASS (all cases).

- [ ] **Step 5: Commit**

```bash
git add src/client.ts tests/client.test.ts
git commit -m "feat(client): support per-request GHL API version header"
```

---

## Task 2: `contacts.ts` — migrate (canonical worked example)

Every remaining module task (3 onward) follows this exact procedure. Read this task fully even when working a later one.

**Files:**
- Modify: `src/tools/contacts.ts`
- Modify: `tests/tools/contacts.test.ts`
- Reference: `/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/contacts-v3.json`

**Interfaces:**
- Consumes: `ghlRequest`, `GHL_VERSION_V3` from `../client.js` (Task 1).

- [ ] **Step 1: Verify paths against the v3 spec**

```bash
grep -oE '"/contacts[a-zA-Z0-9/{}_-]*"' /Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/contacts-v3.json | sort -u
```

Confirm every path used in `src/tools/contacts.ts` appears in that output. The one known exception: `/contacts/${args.contactId}/campaigns/removeAll` is **not** in v3 — it was renamed to `/contacts/{contactId}/campaigns/remove-all`. Find that call site (the `ghl_remove_contact_from_campaign`-style tool using `campaigns/removeAll`) and update the path to `campaigns/remove-all`.

- [ ] **Step 2: Update the failing tests first**

In `tests/tools/contacts.test.ts`, import the version constant:

```ts
import { GHL_VERSION_V3 } from '../../src/client.js';
```

For every existing `it(...)` block that calls `parseLastFetchCall(fetch)` and asserts `call.pathname`, add immediately after that assertion:

```ts
expect(call.headers.Version).toBe(GHL_VERSION_V3);
```

For the campaign-removal test specifically, also update the expected pathname from `/contacts/abc/campaigns/removeAll`-style to `/contacts/abc/campaigns/remove-all`.

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run tests/tools/contacts.test.ts`
Expected: FAIL — `call.headers.Version` is `undefined` (contacts.ts doesn't send `version` yet), and the renamed-path test fails on the old pathname.

- [ ] **Step 4: Migrate the implementation**

In `src/tools/contacts.ts`:
1. Import `GHL_VERSION_V3` alongside the existing `ghlRequest, formatError` import from `../client.js`.
2. For every one of the 20 `ghlRequest(...)` calls in the file, add `version: GHL_VERSION_V3,` as a field in the options object (alongside `token: config.token,`).
3. Change the `campaigns/removeAll` path literal to `campaigns/remove-all`.

Example of the transform (repeat for all 20 call sites):

```ts
// before
const result = await ghlRequest("GET", "/contacts/", {
  token: config.token,
  params: { ... },
});

// after
const result = await ghlRequest("GET", "/contacts/", {
  token: config.token,
  version: GHL_VERSION_V3,
  params: { ... },
});
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run tests/tools/contacts.test.ts`
Expected: PASS (all cases).

- [ ] **Step 6: Commit**

```bash
git add src/tools/contacts.ts tests/tools/contacts.test.ts
git commit -m "feat(contacts): migrate to GHL API v3"
```

---

## Task 3: `emails.ts` — rework to v3 templates + campaigns API

This is the one module with real restructuring, not just a header swap. Current shape: `emailBuilderTools` (5 tools on `/emails/builder*`) + `emailCampaignTools` (4 tools on `/emails/schedule*`) — **both endpoint families are gone in v3**.

**Files:**
- Modify: `src/tools/emails.ts`
- Modify: `tests/tools/emails.test.ts`
- Reference: `/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/emails-v3.json`

**Interfaces:**
- Consumes: `ghlRequest`, `GHL_VERSION_V3` from `../client.js`.
- Produces: same two exports, `emailBuilderTools` and `emailCampaignTools` (keep these names — `src/index.ts` imports them), same 9 tool names (`ghl_get_email_builder_templates`, `ghl_get_email_builder_template`, `ghl_create_email_builder_template`, `ghl_update_email_builder_template`, `ghl_delete_email_builder_template`, `ghl_get_email_campaigns`, `ghl_get_email_campaign`, `ghl_create_email_campaign`, `ghl_delete_email_campaign`).

- [ ] **Step 1: Read the v3 request/response schemas**

```bash
python3 -c "
import json
f = json.load(open('/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/emails-v3.json'))
import sys
for p in ['/emails/locations/{locationId}/templates', '/emails/locations/{locationId}/templates/{templateId}', '/emails/locations/{locationId}/campaigns/emails', '/emails/locations/{locationId}/campaigns/emails/{campaignId}', '/emails/locations/{locationId}/campaigns/emails/{campaignId}/schedule']:
    print('===', p, '===')
    print(json.dumps(f['paths'].get(p, {}), indent=2)[:3000])
"
```

Note the exact request body / response schema field names (resolve any `\$ref` into `components.schemas` in the same file) — you will need them for Step 3.

- [ ] **Step 2: Rewrite the tests first**

Rewrite `tests/tools/emails.test.ts` (or wherever the existing email tests live — check `tests/tools/` for `emails.test.ts`) to match the new endpoints instead of the old ones:

- `ghl_get_email_builder_templates` → `GET /emails/locations/{locationId}/templates`
- `ghl_get_email_builder_template` → `GET /emails/locations/{locationId}/templates/{templateId}`
- `ghl_create_email_builder_template` → `POST /emails/locations/{locationId}/templates` (single call now, not the old two-step create-then-push-html — confirm from Step 1's schema whether HTML is part of the create body; if so this collapses the current two-`ghlRequest` implementation into one)
- `ghl_update_email_builder_template` → `PATCH /emails/locations/{locationId}/templates/{templateId}`
- `ghl_delete_email_builder_template` → `DELETE /emails/locations/{locationId}/templates/{templateId}`
- `ghl_get_email_campaigns` → `GET /emails/locations/{locationId}/campaigns/emails`
- `ghl_get_email_campaign` → `GET /emails/locations/{locationId}/campaigns/emails/{campaignId}`
- `ghl_create_email_campaign` → `POST /emails/locations/{locationId}/campaigns/emails`
- `ghl_delete_email_campaign` → `DELETE /emails/locations/{locationId}/campaigns/emails/{campaignId}`

Follow the existing test file's structure (one `describe` per tool, `mockFetchSuccess`/`mockFetchError`, `parseLastFetchCall`, `expectSuccess`/`expectError`) and add `expect(call.headers.Version).toBe(GHL_VERSION_V3)` to each. Assert `call.pathname` against the new v3 paths with `config.locationId` interpolated in (`TEST_CONFIG.locationId`).

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run tests/tools/emails.test.ts`
Expected: FAIL — old implementation still calls the old paths.

- [ ] **Step 4: Rewrite the implementation**

Rewrite `src/tools/emails.ts`'s handlers to call the new paths with `version: GHL_VERSION_V3`, using the request/response field names discovered in Step 1. Keep the tool `name`, `description` (update description text to reflect the new mechanics — e.g. drop the "handles both the skeleton creation and HTML content upload in one call" language if v3's create is single-step), and `inputSchema` as close to today's as the v3 API allows; only change what v3's schema forces you to change. Keep the module doc-comment at the top of the file, updating it if the builder/vs-location-templates distinction has changed.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run tests/tools/emails.test.ts`
Expected: PASS.

- [ ] **Step 6: Update tool count bookkeeping if the tool count changed**

If Step 4 added or removed any tool (e.g. you added a thin wrapper for `campaigns/emails/{campaignId}/schedule` because it was a natural byproduct — optional, skip if it adds real scope), update `tests/server.test.ts`'s `toHaveLength()` for the emails module and the total, plus `README.md`'s tool count table and header count, plus the startup log line in `src/index.ts`. If the tool count is unchanged (9 tools, same names), skip this step.

- [ ] **Step 7: Commit**

```bash
git add src/tools/emails.ts tests/tools/emails.test.ts
git commit -m "feat(emails): migrate to v3 templates + campaigns API"
```

---

## Task 4: `calendars.ts` — migrate

**Files:**
- Modify: `src/tools/calendars.ts`
- Modify: `tests/tools/calendars.test.ts`
- Reference: `/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/calendars-v3.json`

**Interfaces:**
- Consumes: `ghlRequest`, `GHL_VERSION_V3` from `../client.js`.

10 `ghlRequest` call sites. Per the design-phase audit, all existing calendar paths this module uses are unchanged in v3 (the v3 spec adds new service/booking endpoints this module doesn't use — ignore those, out of scope).

- [ ] **Step 1: Verify paths against the v3 spec**

```bash
grep -oE '"/calendars[a-zA-Z0-9/{}_-]*"' /Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/calendars-v3.json | sort -u
grep -oE '(GET|POST|PUT|DELETE|PATCH)", ?[`"]/calendars[a-zA-Z0-9/{}_$.-]*' src/tools/calendars.ts
```

Confirm every path used by the module appears in the spec's path list. If you find a mismatch beyond what's documented here, stop and treat it as a real finding — re-read the spec file directly rather than guessing.

- [ ] **Step 2: Update the failing tests first**

In `tests/tools/calendars.test.ts`, import `GHL_VERSION_V3` from `'../../src/client.js'`. For every existing `it(...)` block asserting `call.pathname`, add `expect(call.headers.Version).toBe(GHL_VERSION_V3);` immediately after.

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run tests/tools/calendars.test.ts`
Expected: FAIL on the new `Version` header assertions.

- [ ] **Step 4: Migrate the implementation**

Import `GHL_VERSION_V3` in `src/tools/calendars.ts`. Add `version: GHL_VERSION_V3,` to all 10 `ghlRequest` call sites' options objects (same transform pattern as Task 2 Step 4).

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run tests/tools/calendars.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/tools/calendars.ts tests/tools/calendars.test.ts
git commit -m "feat(calendars): migrate to GHL API v3"
```

---

## Task 5: `conversations.ts` — migrate

**Files:**
- Modify: `src/tools/conversations.ts`
- Modify: `tests/tools/conversations.test.ts`
- Reference: `/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/conversations-v3.json`

9 `ghlRequest` call sites. Note from the design audit: v3 conversations dropped `/conversations/preferences/custom-subtypes*` and `/conversations/preferences/unsubscriptions/*` paths and added `/conversations/messages/email/{id}/status` — check whether this module's `ghl_get_message`/status-related call sites (if any) intersect these; the module's known call sites (`/conversations/search`, `/conversations/`, `/conversations/{id}`, `/conversations/messages`, `/conversations/messages/inbound`) are unaffected.

- [ ] **Step 1: Verify paths against the v3 spec**

```bash
grep -oE '"/conversations[a-zA-Z0-9/{}_-]*"' /Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/conversations-v3.json | sort -u
grep -n 'ghlRequest(' src/tools/conversations.ts
```

Confirm every path used by the module appears in the spec's path list.

- [ ] **Step 2: Update the failing tests first**

Same pattern as Task 4 Step 2, applied to `tests/tools/conversations.test.ts`.

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run tests/tools/conversations.test.ts`

- [ ] **Step 4: Migrate the implementation**

Same pattern as Task 4 Step 4, applied to `src/tools/conversations.ts` (9 call sites).

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run tests/tools/conversations.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/tools/conversations.ts tests/tools/conversations.test.ts
git commit -m "feat(conversations): migrate to GHL API v3"
```

---

## Task 6: `funnels.ts` — migrate

**Files:**
- Modify: `src/tools/funnels.ts`
- Modify: `tests/tools/funnels.test.ts`
- Reference: `/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/funnels-v3.json`

3 `ghlRequest` call sites (`/funnels/funnel/list`, `/funnels/page`, `/funnels/page/count`).

- [ ] **Step 1: Verify paths against the v3 spec** — same grep pattern as Task 4 Step 1, resource `funnels`.
- [ ] **Step 2: Update the failing tests first** — same pattern as Task 4 Step 2, file `tests/tools/funnels.test.ts`.
- [ ] **Step 3: Run tests to verify they fail** — `npx vitest run tests/tools/funnels.test.ts`
- [ ] **Step 4: Migrate the implementation** — same pattern as Task 4 Step 4, file `src/tools/funnels.ts`, 3 call sites.
- [ ] **Step 5: Run tests to verify they pass** — `npx vitest run tests/tools/funnels.test.ts`, expect PASS.
- [ ] **Step 6: Commit**

```bash
git add src/tools/funnels.ts tests/tools/funnels.test.ts
git commit -m "feat(funnels): migrate to GHL API v3"
```

---

## Task 7: `opportunities.ts` — migrate

**Files:**
- Modify: `src/tools/opportunities.ts`
- Modify: `tests/tools/opportunities.test.ts`
- Reference: `/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/opportunities-v3.json`

8 `ghlRequest` call sites.

- [ ] **Step 1: Verify paths against the v3 spec** — resource `opportunities`.
- [ ] **Step 2: Update the failing tests first** — file `tests/tools/opportunities.test.ts`.
- [ ] **Step 3: Run tests to verify they fail** — `npx vitest run tests/tools/opportunities.test.ts`
- [ ] **Step 4: Migrate the implementation** — file `src/tools/opportunities.ts`, 8 call sites.
- [ ] **Step 5: Run tests to verify they pass** — `npx vitest run tests/tools/opportunities.test.ts`, expect PASS.
- [ ] **Step 6: Commit**

```bash
git add src/tools/opportunities.ts tests/tools/opportunities.test.ts
git commit -m "feat(opportunities): migrate to GHL API v3"
```

---

## Task 8: `payments.ts` — migrate

**Files:**
- Modify: `src/tools/payments.ts`
- Modify: `tests/tools/payments.test.ts`
- Reference: `/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/payments-v3.json`, `/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/invoices-v3.json` (this module covers both payments and invoices tools per `_DEV_NOTES.md`)

12 `ghlRequest` call sites (payments x6, invoices x6). Verify payment call sites against `payments-v3.json` and invoice call sites against `invoices-v3.json` separately.

- [ ] **Step 1: Verify paths against both v3 specs**

```bash
grep -oE '"/payments[a-zA-Z0-9/{}_-]*"' /Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/payments-v3.json | sort -u
grep -oE '"/invoices[a-zA-Z0-9/{}_-]*"' /Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/invoices-v3.json | sort -u
grep -n 'ghlRequest(' src/tools/payments.ts
```

- [ ] **Step 2: Update the failing tests first** — file `tests/tools/payments.test.ts`, same pattern as Task 4 Step 2.
- [ ] **Step 3: Run tests to verify they fail** — `npx vitest run tests/tools/payments.test.ts`
- [ ] **Step 4: Migrate the implementation** — file `src/tools/payments.ts`, 12 call sites, same transform pattern.
- [ ] **Step 5: Run tests to verify they pass** — `npx vitest run tests/tools/payments.test.ts`, expect PASS.
- [ ] **Step 6: Commit**

```bash
git add src/tools/payments.ts tests/tools/payments.test.ts
git commit -m "feat(payments): migrate to GHL API v3"
```

---

## Task 9: `phone_numbers.ts` — migrate

**Files:**
- Modify: `src/tools/phone_numbers.ts`
- Modify: `tests/tools/phone_numbers.test.ts`
- Reference: `/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/phone-system-v3.json`

5 `ghlRequest` call sites.

- [ ] **Step 1: Verify paths against the v3 spec** — resource `phone-system` (note the hyphenated filename differs from the module's own `phone_numbers.ts` name).
- [ ] **Step 2: Update the failing tests first** — file `tests/tools/phone_numbers.test.ts`.
- [ ] **Step 3: Run tests to verify they fail** — `npx vitest run tests/tools/phone_numbers.test.ts`
- [ ] **Step 4: Migrate the implementation** — file `src/tools/phone_numbers.ts`, 5 call sites.
- [ ] **Step 5: Run tests to verify they pass** — `npx vitest run tests/tools/phone_numbers.test.ts`, expect PASS.
- [ ] **Step 6: Commit**

```bash
git add src/tools/phone_numbers.ts tests/tools/phone_numbers.test.ts
git commit -m "feat(phone_numbers): migrate to GHL API v3"
```

---

## Task 10: `social.ts` — migrate

**Files:**
- Modify: `src/tools/social.ts`
- Modify: `tests/tools/social.test.ts`
- Reference: `/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/social-planner-v3.json` (social posts), `/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/medias-v3.json` (media), `/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/links-v3.json` (trigger links)

9 `ghlRequest` call sites (social x4, media x2, trigger links x3) covering three different v3 spec files. **Important:** `social-planner` has no v2 spec file at all (it's a v3-only resource per the design audit) — check carefully whether this module's social-post endpoints (likely under `/social-media-posting/...` in v2) map cleanly into `social-planner-v3.json`'s paths, or whether they're actually still served by a `social-media-posting.json`-equivalent v3 file under a different name. Read `src/tools/social.ts`'s current social-post paths first, then search across all files in `.../apps/v3/` for a path match:

```bash
grep -n 'ghlRequest(' src/tools/social.ts
grep -rl 'social-media-posting\|"/social' /Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/*.json
```

- [ ] **Step 1: Verify paths against the v3 spec(s)** — identify the correct v3 file(s) for each of the three sub-areas (social posts, media, trigger links) using the search above before assuming `social-planner-v3.json` is correct.
- [ ] **Step 2: Update the failing tests first** — file `tests/tools/social.test.ts`, same pattern as Task 4 Step 2.
- [ ] **Step 3: Run tests to verify they fail** — `npx vitest run tests/tools/social.test.ts`
- [ ] **Step 4: Migrate the implementation** — file `src/tools/social.ts`, 9 call sites. If any path genuinely has no v3 equivalent after the search in Step 1, use `GHL_VERSION_LEGACY` for that call site with a comment citing the v2 spec file, per Global Constraints.
- [ ] **Step 5: Run tests to verify they pass** — `npx vitest run tests/tools/social.test.ts`, expect PASS.
- [ ] **Step 6: Commit**

```bash
git add src/tools/social.ts tests/tools/social.test.ts
git commit -m "feat(social): migrate to GHL API v3"
```

---

## Task 11: `surveys.ts` — migrate

**Files:**
- Modify: `src/tools/surveys.ts`
- Modify: `tests/tools/surveys.test.ts`
- Reference: `/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/surveys-v3.json`

2 `ghlRequest` call sites (`/surveys/`, `/surveys/submissions`).

- [ ] **Step 1: Verify paths against the v3 spec** — resource `surveys`.
- [ ] **Step 2: Update the failing tests first** — file `tests/tools/surveys.test.ts`.
- [ ] **Step 3: Run tests to verify they fail** — `npx vitest run tests/tools/surveys.test.ts`
- [ ] **Step 4: Migrate the implementation** — file `src/tools/surveys.ts`, 2 call sites.
- [ ] **Step 5: Run tests to verify they pass** — `npx vitest run tests/tools/surveys.test.ts`, expect PASS.
- [ ] **Step 6: Commit**

```bash
git add src/tools/surveys.ts tests/tools/surveys.test.ts
git commit -m "feat(surveys): migrate to GHL API v3"
```

---

## Task 12: `workflows.ts` — migrate

**Files:**
- Modify: `src/tools/workflows.ts`
- Modify: `tests/tools/workflows.test.ts`
- Reference: `/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/workflows-v3.json`

2 `ghlRequest` call sites.

- [ ] **Step 1: Verify paths against the v3 spec** — resource `workflows`.
- [ ] **Step 2: Update the failing tests first** — file `tests/tools/workflows.test.ts`.
- [ ] **Step 3: Run tests to verify they fail** — `npx vitest run tests/tools/workflows.test.ts`
- [ ] **Step 4: Migrate the implementation** — file `src/tools/workflows.ts`, 2 call sites.
- [ ] **Step 5: Run tests to verify they pass** — `npx vitest run tests/tools/workflows.test.ts`, expect PASS.
- [ ] **Step 6: Commit**

```bash
git add src/tools/workflows.ts tests/tools/workflows.test.ts
git commit -m "feat(workflows): migrate to GHL API v3"
```

---

## Task 13: `knowledge_base.ts` — migrate

**Files:**
- Modify: `src/tools/knowledge_base.ts`
- Modify: `tests/knowledge_base.test.ts` (note: lives directly under `tests/`, not `tests/tools/`)
- Reference: `/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/knowledge-base-v3.json`

14 `ghlRequest` call sites (KB x5, FAQ x4, crawler x5).

- [ ] **Step 1: Verify paths against the v3 spec** — resource `knowledge-base`.
- [ ] **Step 2: Update the failing tests first** — file `tests/knowledge_base.test.ts`, same pattern as Task 4 Step 2.
- [ ] **Step 3: Run tests to verify they fail** — `npx vitest run tests/knowledge_base.test.ts`
- [ ] **Step 4: Migrate the implementation** — file `src/tools/knowledge_base.ts`, 14 call sites.
- [ ] **Step 5: Run tests to verify they pass** — `npx vitest run tests/knowledge_base.test.ts`, expect PASS.
- [ ] **Step 6: Commit**

```bash
git add src/tools/knowledge_base.ts tests/knowledge_base.test.ts
git commit -m "feat(knowledge_base): migrate to GHL API v3"
```

---

## Task 14: `custom_fields.ts` — migrate + add tests

This module (and Tasks 15–20) currently has **no dedicated test file**. Rather than migrate blind, write characterization tests against the current behavior first (still v2, still passing), then migrate both the implementation and the just-written tests together — this still leaves you with a real regression net, it's just built in this task instead of having existed already.

**Files:**
- Modify: `src/tools/custom_fields.ts`
- Create: `tests/tools/custom_fields.test.ts`
- Reference: `/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/custom-fields-v3.json`

4 `ghlRequest` call sites.

- [ ] **Step 1: Read the module and list its tools**

Read `src/tools/custom_fields.ts` fully. Note each exported tool's `name`, HTTP method, path, and the shape of `args`/`config` it uses.

- [ ] **Step 2: Write characterization tests against current (v2) behavior**

Create `tests/tools/custom_fields.test.ts` following the exact structure of `tests/tools/contacts.test.ts` (imports from `../helpers.js`, a `getTool` helper, one `describe` block per tool with a success-path `it` asserting `call.method`/`call.pathname`/relevant `call.params`/`call.body` fields, plus one `it` exercising an error path via `mockFetchError`). Use the **current** (pre-migration) paths — you're capturing today's behavior first.

- [ ] **Step 3: Run tests to verify they pass against current implementation**

Run: `npx vitest run tests/tools/custom_fields.test.ts`
Expected: PASS (this confirms your characterization tests accurately describe the existing code before you change anything).

- [ ] **Step 4: Verify paths against the v3 spec**

```bash
grep -oE '"/(locations/\{locationId\}/customFields|custom-fields)[a-zA-Z0-9/{}_-]*"' /Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/custom-fields-v3.json | sort -u
grep -n 'ghlRequest(' src/tools/custom_fields.ts
```

- [ ] **Step 5: Update the tests for v3**

Add `import { GHL_VERSION_V3 } from '../../src/client.js';` and `expect(call.headers.Version).toBe(GHL_VERSION_V3);` after each pathname assertion. Update any pathname expectations if Step 4 found a rename.

- [ ] **Step 6: Run tests to verify they fail**

Run: `npx vitest run tests/tools/custom_fields.test.ts`
Expected: FAIL on the new `Version` header assertions.

- [ ] **Step 7: Migrate the implementation**

Same transform pattern as Task 4 Step 4, applied to `src/tools/custom_fields.ts`, 4 call sites.

- [ ] **Step 8: Run tests to verify they pass**

Run: `npx vitest run tests/tools/custom_fields.test.ts`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/tools/custom_fields.ts tests/tools/custom_fields.test.ts
git commit -m "feat(custom_fields): add test coverage and migrate to GHL API v3"
```

---

## Task 15: `custom_values.ts` — migrate + add tests

Same procedure as Task 14, applied to:

**Files:**
- Modify: `src/tools/custom_values.ts`
- Create: `tests/tools/custom_values.test.ts`
- Reference: `/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/custom-fields-v3.json` (custom values share the custom-fields spec file in GHL's API — confirm by grepping for `customValues` inside it)

4 `ghlRequest` call sites. Follow Task 14's Steps 1–9 verbatim, substituting this module/file/resource.

- [ ] **Step 1: Read the module and list its tools**
- [ ] **Step 2: Write characterization tests against current (v2) behavior**
- [ ] **Step 3: Run tests to verify they pass against current implementation** — `npx vitest run tests/tools/custom_values.test.ts`
- [ ] **Step 4: Verify paths against the v3 spec**
- [ ] **Step 5: Update the tests for v3**
- [ ] **Step 6: Run tests to verify they fail** — `npx vitest run tests/tools/custom_values.test.ts`
- [ ] **Step 7: Migrate the implementation** — 4 call sites
- [ ] **Step 8: Run tests to verify they pass** — `npx vitest run tests/tools/custom_values.test.ts`
- [ ] **Step 9: Commit**

```bash
git add src/tools/custom_values.ts tests/tools/custom_values.test.ts
git commit -m "feat(custom_values): add test coverage and migrate to GHL API v3"
```

---

## Task 16: `forms.ts` — migrate + add tests

Same procedure as Task 14, applied to:

**Files:**
- Modify: `src/tools/forms.ts`
- Create: `tests/tools/forms.test.ts`
- Reference: `/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/forms-v3.json`

2 `ghlRequest` call sites (`/forms/`, `/forms/submissions`). Follow Task 14's Steps 1–9 verbatim.

- [ ] **Step 1: Read the module and list its tools**
- [ ] **Step 2: Write characterization tests against current (v2) behavior**
- [ ] **Step 3: Run tests to verify they pass against current implementation** — `npx vitest run tests/tools/forms.test.ts`
- [ ] **Step 4: Verify paths against the v3 spec**
- [ ] **Step 5: Update the tests for v3**
- [ ] **Step 6: Run tests to verify they fail** — `npx vitest run tests/tools/forms.test.ts`
- [ ] **Step 7: Migrate the implementation** — 2 call sites
- [ ] **Step 8: Run tests to verify they pass** — `npx vitest run tests/tools/forms.test.ts`
- [ ] **Step 9: Commit**

```bash
git add src/tools/forms.ts tests/tools/forms.test.ts
git commit -m "feat(forms): add test coverage and migrate to GHL API v3"
```

---

## Task 17: `location.ts` — migrate + add tests

Same procedure as Task 14, applied to:

**Files:**
- Modify: `src/tools/location.ts`
- Create: `tests/tools/location.test.ts`
- Reference: `/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/locations-v3.json`

1 `ghlRequest` call site (`GET /locations/{locationId}`). Follow Task 14's Steps 1–9 verbatim.

- [ ] **Step 1: Read the module and list its tools**
- [ ] **Step 2: Write characterization tests against current (v2) behavior**
- [ ] **Step 3: Run tests to verify they pass against current implementation** — `npx vitest run tests/tools/location.test.ts`
- [ ] **Step 4: Verify paths against the v3 spec**
- [ ] **Step 5: Update the tests for v3**
- [ ] **Step 6: Run tests to verify they fail** — `npx vitest run tests/tools/location.test.ts`
- [ ] **Step 7: Migrate the implementation** — 1 call site
- [ ] **Step 8: Run tests to verify they pass** — `npx vitest run tests/tools/location.test.ts`
- [ ] **Step 9: Commit**

```bash
git add src/tools/location.ts tests/tools/location.test.ts
git commit -m "feat(location): add test coverage and migrate to GHL API v3"
```

---

## Task 18: `tags.ts` — migrate + add tests

Same procedure as Task 14, applied to:

**Files:**
- Modify: `src/tools/tags.ts`
- Create: `tests/tools/tags.test.ts`
- Reference: `/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/locations-v3.json` (location tags live under the locations resource, confirm by grepping for `/tags` inside it)

3 `ghlRequest` call sites. Follow Task 14's Steps 1–9 verbatim.

- [ ] **Step 1: Read the module and list its tools**
- [ ] **Step 2: Write characterization tests against current (v2) behavior**
- [ ] **Step 3: Run tests to verify they pass against current implementation** — `npx vitest run tests/tools/tags.test.ts`
- [ ] **Step 4: Verify paths against the v3 spec**
- [ ] **Step 5: Update the tests for v3**
- [ ] **Step 6: Run tests to verify they fail** — `npx vitest run tests/tools/tags.test.ts`
- [ ] **Step 7: Migrate the implementation** — 3 call sites
- [ ] **Step 8: Run tests to verify they pass** — `npx vitest run tests/tools/tags.test.ts`
- [ ] **Step 9: Commit**

```bash
git add src/tools/tags.ts tests/tools/tags.test.ts
git commit -m "feat(tags): add test coverage and migrate to GHL API v3"
```

---

## Task 19: `templates.ts` — migrate + add tests

Same procedure as Task 14, applied to:

**Files:**
- Modify: `src/tools/templates.ts`
- Create: `tests/tools/templates.test.ts`
- Reference: `/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/locations-v3.json` (location-level templates, distinct from the email-builder templates in Task 3 — confirm by grepping for `/templates` inside it)

4 `ghlRequest` call sites. Follow Task 14's Steps 1–9 verbatim.

- [ ] **Step 1: Read the module and list its tools**
- [ ] **Step 2: Write characterization tests against current (v2) behavior**
- [ ] **Step 3: Run tests to verify they pass against current implementation** — `npx vitest run tests/tools/templates.test.ts`
- [ ] **Step 4: Verify paths against the v3 spec**
- [ ] **Step 5: Update the tests for v3**
- [ ] **Step 6: Run tests to verify they fail** — `npx vitest run tests/tools/templates.test.ts`
- [ ] **Step 7: Migrate the implementation** — 4 call sites
- [ ] **Step 8: Run tests to verify they pass** — `npx vitest run tests/tools/templates.test.ts`
- [ ] **Step 9: Commit**

```bash
git add src/tools/templates.ts tests/tools/templates.test.ts
git commit -m "feat(templates): add test coverage and migrate to GHL API v3"
```

---

## Task 20: `users.ts` — migrate + add tests, then final verification

Same procedure as Task 14, applied to:

**Files:**
- Modify: `src/tools/users.ts`
- Create: `tests/tools/users.test.ts`
- Reference: `/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/users-v3.json`

6 `ghlRequest` call sites. Follow Task 14's Steps 1–9 verbatim for the migration itself, then continue with the whole-repo verification below in the same task since this is the last module.

- [ ] **Step 1: Read the module and list its tools**
- [ ] **Step 2: Write characterization tests against current (v2) behavior**
- [ ] **Step 3: Run tests to verify they pass against current implementation** — `npx vitest run tests/tools/users.test.ts`
- [ ] **Step 4: Verify paths against the v3 spec**
- [ ] **Step 5: Update the tests for v3**
- [ ] **Step 6: Run tests to verify they fail** — `npx vitest run tests/tools/users.test.ts`
- [ ] **Step 7: Migrate the implementation** — 6 call sites
- [ ] **Step 8: Run tests to verify they pass** — `npx vitest run tests/tools/users.test.ts`
- [ ] **Step 9: Commit**

```bash
git add src/tools/users.ts tests/tools/users.test.ts
git commit -m "feat(users): add test coverage and migrate to GHL API v3"
```

- [ ] **Step 10: Full-repo typecheck**

Run: `npm run typecheck`
Expected: PASS with zero errors. If it fails, find whichever module still has a `ghlRequest` call missing the `version` field (search: `grep -rn 'ghlRequest(' src/tools/ | grep -v version` won't work directly since `version` may be on a following line — instead run `npx tsc --noEmit` and fix each reported call site) and fix it; that means an earlier task's migration was incomplete.

- [ ] **Step 11: Full test suite**

Run: `npm test` (or `npx vitest run`)
Expected: PASS, all suites green.

- [ ] **Step 12: Build**

Run: `npm run build`
Expected: succeeds with no errors.

- [ ] **Step 13: Grep for any leftover legacy version usage**

```bash
grep -rn 'GHL_VERSION_LEGACY\|2021-07-28' src/
```

Review every hit. Each should have the one-line comment (per Global Constraints) explaining why that specific call has no v3 equivalent. If any hit lacks that justification, treat it as unfinished work from an earlier task and go fix it there.

- [ ] **Step 14: Update README if the emails rework changed tool count/behavior**

If Task 3 changed the emails tool count or names, update `README.md`'s header tool count and category table, and `src/index.ts`'s startup log line, per `_DEV_NOTES.md`'s "Keeping Tool Counts in Sync" section. If unchanged, skip.

- [ ] **Step 15: Final commit**

```bash
git add -A
git commit -m "chore: v3 migration Phase 1 complete — full suite green"
```

(Only if Step 14 or any cleanup produced uncommitted changes — if steps 10-13 found nothing to fix and 14 was a no-op, there's nothing to commit here and this step is skipped.)

**Do not bump `package.json`'s version or tag/publish** — that requires explicit human approval per this project's deployment-approval rule. Stop here and report completion.
