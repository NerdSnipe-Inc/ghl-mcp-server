# GHL API v3 Phase 2f: Ad Publishing Resource Coverage — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 95 new tools covering all of GHL API v3's `ad-publishing-v3.json`
operations across Facebook (48), Google (31), and LinkedIn (16) ad platforms.

**Architecture:** Nine new tool modules, each following the exact pattern established
in Phase 1/1.5/2a-2e (`ghl_<verb>_<noun>` naming, Zod `inputSchema`,
`handler(args, config)` → `ghlRequest(...)` → `JSON.stringify` or `formatError`). Every
call uses `version: GHL_VERSION_V3`. Read the real request/response schema from the v3
spec file before writing each tool.

**Tech Stack:** TypeScript, Zod, Vitest, Node.js (existing stack — no new
dependencies).

## Global Constraints

- Spec: `docs/superpowers/specs/2026-08-04-v3-phase2f-ad-publishing-design.md` — read
  it before starting.
- v3 OpenAPI spec: `/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/ad-publishing-v3.json`.
- Tool naming: `ghl_` prefix, snake_case. **`PUT` endpoints with no ID in the path
  (`/facebook/campaigns`, `/facebook/adsets`, `/facebook/ads`, `/facebook/pixels`,
  `/facebook/custom-audience/{audienceId}` member endpoints, `/google/ads`,
  `/google/audiences`, `/google/segments`, `/google/conversions`, `/linkedin/ads`) are
  genuine upserts — name them `ghl_upsert_<platform>_<noun>`, not
  `ghl_update_<platform>_<noun>`, and document the create-vs-update duality (an
  optional `id` field in the body) in the tool's description. Verify this holds for
  each one individually against the live spec — don't assume every PUT in this
  resource is an upsert without checking (some, like `PUT /facebook/page/default` or
  `PUT /facebook/custom-audience/{audienceId}`, are plain updates with an ID already
  in the path).**
- Every `ghlRequest` call: `version: GHL_VERSION_V3` (imported from `../client.js`).
- Deeply nested, platform-specific fields (`audience`, `budget`, `media`,
  `adSchedule`, `biddingStrategy`, `networkSettings`, `adCampaigns`, `assets`,
  targeting/creative objects): model as `z.record(z.string(), z.unknown())` or
  `z.array(z.record(z.string(), z.unknown()))` per established precedent — do not
  attempt to fully type out ad-platform campaign/targeting schemas.
- **Verify `locationId` presence/placement per endpoint — don't assume.** It appears
  as a path segment, query param, or body field depending on the operation.
- **Disclose malformed/ambiguous upstream spec fields with a one-line code comment**
  as you write each tool, not as an afterthought.
- **Do not trim "large" required-field lists.**
- TDD throughout: write the test first against the real schema, confirm RED,
  implement, confirm GREEN.
- Each task registers its new tool array into `ALL_TOOLS` in `src/index.ts` and adds a
  `toHaveLength()` assertion plus `expectedTools` manifest entries (with correct
  running total) in `tests/server.test.ts`. Keep `expectedTools` accurate every task.
- README/CHANGELOG updates are consolidated into the final task.
- Do not bump `package.json`'s version, tag, or publish.

---

## Task 1: `facebook_accounts.ts` (14 tools)

**Files:**
- Create: `src/tools/facebook_accounts.ts`
- Create: `tests/tools/facebook_accounts.test.ts`
- Modify: `src/index.ts`, `tests/server.test.ts`
- Reference: `/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/ad-publishing-v3.json`

**Interfaces:**
- Consumes: `ghlRequest`, `formatError`, `GHLConfig`, `GHL_VERSION_V3` from `../client.js`.
- Produces: `export const facebookAccountsTools = [...]` (14 tools).

| Tool | Method | Path |
|---|---|---|
| `ghl_get_facebook_ad_accounts` | GET | `/ad-publishing/facebook/ad-accounts` |
| `ghl_get_facebook_ad_account` | GET | `/ad-publishing/facebook/ad-accounts/{adAccountId}` |
| `ghl_delete_facebook_ad_account` | DELETE | `/ad-publishing/facebook/ad-accounts/{adAccountId}` |
| `ghl_create_facebook_integration` | POST | `/ad-publishing/facebook/integration` |
| `ghl_get_facebook_integration` | GET | `/ad-publishing/facebook/integration` |
| `ghl_delete_facebook_integration` | DELETE | `/ad-publishing/facebook/integration` |
| `ghl_get_facebook_me` | GET | `/ad-publishing/facebook/me` |
| `ghl_get_facebook_entity` | GET | `/ad-publishing/facebook/entity` |
| `ghl_get_facebook_pages` | GET | `/ad-publishing/facebook/pages` |
| `ghl_delete_facebook_page` | DELETE | `/ad-publishing/facebook/page` |
| `ghl_set_default_facebook_page` | PUT | `/ad-publishing/facebook/page/default` |
| `ghl_get_facebook_page_forms` | GET | `/ad-publishing/facebook/page/{pageId}/forms` |
| `ghl_create_facebook_page_form` | POST | `/ad-publishing/facebook/page/{pageId}/forms` |
| `ghl_get_facebook_page_instagram_accounts` | GET | `/ad-publishing/facebook/page/{pageId}/instagram` |

- [ ] **Step 1: Read the real schemas**

```bash
python3 -c "
import json
f = json.load(open('/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/ad-publishing-v3.json'))
schemas = f['components']['schemas']
paths = [
    ('/ad-publishing/facebook/ad-accounts','get'), ('/ad-publishing/facebook/ad-accounts/{adAccountId}','get'),
    ('/ad-publishing/facebook/ad-accounts/{adAccountId}','delete'), ('/ad-publishing/facebook/integration','post'),
    ('/ad-publishing/facebook/integration','get'), ('/ad-publishing/facebook/integration','delete'),
    ('/ad-publishing/facebook/me','get'), ('/ad-publishing/facebook/entity','get'),
    ('/ad-publishing/facebook/pages','get'), ('/ad-publishing/facebook/page','delete'),
    ('/ad-publishing/facebook/page/default','put'), ('/ad-publishing/facebook/page/{pageId}/forms','get'),
    ('/ad-publishing/facebook/page/{pageId}/forms','post'), ('/ad-publishing/facebook/page/{pageId}/instagram','get'),
]
for path, method in paths:
    op = f['paths'][path][method]
    print('===', method.upper(), path, '===')
    for p in op.get('parameters', []):
        print(' param:', p.get('name'), p.get('required'), p.get('in'))
    body = op.get('requestBody', {}).get('content', {}).get('application/json', {}).get('schema', {})
    ref = body.get('\$ref')
    if ref:
        s = schemas[ref.split('/')[-1]]
        print(' body required:', s.get('required'))
        print(' body props:', list(s.get('properties', {}).keys()))
"
```

Confirmed during design research: `POST /facebook/integration` requires `locationId`,
`pageId` in body (`adAccountId` optional). `PUT /facebook/page/default` is a plain
update (not an upsert — verify), likely takes `locationId` + `pageId` in body. Verify
every other operation's exact params/body directly — this list is a path/method sweep
only.

- [ ] **Step 2: Write the failing tests first**

Create `tests/tools/facebook_accounts.test.ts` following `tests/tools/associations.test.ts`'s
structure (Phase 2d — read it for the concrete reference): `getTool` helper, one
`describe` per tool with success-path assertions on `method`/`pathname`/
`headers.Version`/relevant `params`/`body` fields, plus an error-path test per tool.

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run tests/tools/facebook_accounts.test.ts`
Expected: FAIL — `src/tools/facebook_accounts.ts` doesn't exist yet.

- [ ] **Step 4: Implement**

Create `src/tools/facebook_accounts.ts` with all 14 tools, each matched to its own
real schema from Step 1.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run tests/tools/facebook_accounts.test.ts`
Expected: PASS.

- [ ] **Step 6: Register the tool array**

`src/index.ts`: add the import and `...facebookAccountsTools,` to `ALL_TOOLS`.

`tests/server.test.ts`: add the import, `it('facebookAccounts has 14 tools', ...)`,
bump the total `ALL_TOOLS` length assertion, and add all 14 tool names to the
`expectedTools` array with its `toHaveLength()` bumped to match.

- [ ] **Step 7: Run the registration tests**

Run: `npx vitest run tests/server.test.ts`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/tools/facebook_accounts.ts tests/tools/facebook_accounts.test.ts src/index.ts tests/server.test.ts
git commit -m "feat(facebook): add ad account, integration, and page tools"
```

---

## Task 2: `facebook_campaigns.ts` (18 tools)

**Files:**
- Create: `src/tools/facebook_campaigns.ts`
- Create: `tests/tools/facebook_campaigns.test.ts`
- Modify: `src/index.ts`, `tests/server.test.ts`
- Reference: `/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/ad-publishing-v3.json`

**Interfaces:**
- Consumes: `ghlRequest`, `formatError`, `GHLConfig`, `GHL_VERSION_V3` from `../client.js`.
- Produces: `export const facebookCampaignsTools = [...]` (18 tools).

| Tool | Method | Path |
|---|---|---|
| `ghl_get_facebook_campaign` | GET | `/ad-publishing/facebook/campaign/{campaignId}` |
| `ghl_upsert_facebook_campaign` | PUT | `/ad-publishing/facebook/campaigns` |
| `ghl_delete_facebook_campaign` | DELETE | `/ad-publishing/facebook/campaigns/{campaignId}` |
| `ghl_duplicate_facebook_campaign` | POST | `/ad-publishing/facebook/campaigns/{campaignId}/duplicate` |
| `ghl_pause_facebook_campaign` | POST | `/ad-publishing/facebook/campaigns/{campaignId}/pause` |
| `ghl_publish_facebook_campaign` | POST | `/ad-publishing/facebook/campaigns/{campaignId}/publish` |
| `ghl_get_facebook_campaign_publishing_progress` | GET | `/ad-publishing/facebook/campaigns/{campaignId}/publishing-progress` |
| `ghl_resume_facebook_campaign` | POST | `/ad-publishing/facebook/campaigns/{campaignId}/resume` |
| `ghl_upsert_facebook_adset` | PUT | `/ad-publishing/facebook/adsets` |
| `ghl_delete_facebook_adset` | DELETE | `/ad-publishing/facebook/adsets/{adSetId}` |
| `ghl_duplicate_facebook_adset` | POST | `/ad-publishing/facebook/adsets/{adSetId}/duplicate` |
| `ghl_pause_facebook_adset` | POST | `/ad-publishing/facebook/adsets/{adSetId}/pause` |
| `ghl_resume_facebook_adset` | POST | `/ad-publishing/facebook/adsets/{adSetId}/resume` |
| `ghl_upsert_facebook_ad` | PUT | `/ad-publishing/facebook/ads` |
| `ghl_delete_facebook_ad` | DELETE | `/ad-publishing/facebook/ads/{adId}` |
| `ghl_duplicate_facebook_ad` | POST | `/ad-publishing/facebook/ads/{adId}/duplicate` |
| `ghl_pause_facebook_ad` | POST | `/ad-publishing/facebook/ads/{adId}/pause` |
| `ghl_resume_facebook_ad` | POST | `/ad-publishing/facebook/ads/{adId}/resume` |

- [ ] **Step 1: Read the real schemas**

```bash
python3 -c "
import json
f = json.load(open('/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/ad-publishing-v3.json'))
schemas = f['components']['schemas']
paths = [
    ('/ad-publishing/facebook/campaign/{campaignId}','get'), ('/ad-publishing/facebook/campaigns','put'),
    ('/ad-publishing/facebook/campaigns/{campaignId}','delete'), ('/ad-publishing/facebook/campaigns/{campaignId}/duplicate','post'),
    ('/ad-publishing/facebook/campaigns/{campaignId}/pause','post'), ('/ad-publishing/facebook/campaigns/{campaignId}/publish','post'),
    ('/ad-publishing/facebook/campaigns/{campaignId}/publishing-progress','get'), ('/ad-publishing/facebook/campaigns/{campaignId}/resume','post'),
    ('/ad-publishing/facebook/adsets','put'), ('/ad-publishing/facebook/adsets/{adSetId}','delete'),
    ('/ad-publishing/facebook/adsets/{adSetId}/duplicate','post'), ('/ad-publishing/facebook/adsets/{adSetId}/pause','post'),
    ('/ad-publishing/facebook/adsets/{adSetId}/resume','post'), ('/ad-publishing/facebook/ads','put'),
    ('/ad-publishing/facebook/ads/{adId}','delete'), ('/ad-publishing/facebook/ads/{adId}/duplicate','post'),
    ('/ad-publishing/facebook/ads/{adId}/pause','post'), ('/ad-publishing/facebook/ads/{adId}/resume','post'),
]
for path, method in paths:
    op = f['paths'][path][method]
    print('===', method.upper(), path, '===')
    for p in op.get('parameters', []):
        print(' param:', p.get('name'), p.get('required'), p.get('in'))
    body = op.get('requestBody', {}).get('content', {}).get('application/json', {}).get('schema', {})
    ref = body.get('\$ref')
    if ref:
        s = schemas[ref.split('/')[-1]]
        print(' body required:', s.get('required'))
        print(' body props:', list(s.get('properties', {}).keys()))
"
```

Confirmed during design research (upserts — no ID in path, optional `id` in body
decides create vs. update, name as `ghl_upsert_*`): `PUT /facebook/campaigns`
requires `locationId` (body props: `id`, `locationId`, `name`, `objective`,
`specialAdCategories`, `source`). `PUT /facebook/adsets` requires `locationId`,
`campaignId` (body has many more optional fields — `pageId`, `instagramActorId`,
`messagingPlatforms`, `whatsappNumber`, `audience`, `budget`, `conversionLocation`,
`customEventType`, `pixelId`; model `audience`/`budget` permissively). `PUT
/facebook/ads` requires `locationId`, `campaignId`, `adsetId` (optional: `name`,
`primaryText`, `headline`, `description`, `imageUrl`, `mediaType`, `media`,
`multiAdvertiserAds`, `cta`, `conversationFormId`, `destinationLink`,
`destinationFormId` — model `media` permissively). The 12 action endpoints
(duplicate/pause/resume/publish) likely take only the ID path param and no body, or a
minimal body — verify each directly, don't assume uniformity.

- [ ] **Step 2: Write the failing tests first**

Create `tests/tools/facebook_campaigns.test.ts` following
`tests/tools/associations.test.ts`'s structure.

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run tests/tools/facebook_campaigns.test.ts`
Expected: FAIL.

- [ ] **Step 4: Implement**

Create `src/tools/facebook_campaigns.ts` with all 18 tools.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run tests/tools/facebook_campaigns.test.ts`
Expected: PASS.

- [ ] **Step 6: Register the tool array**

`src/index.ts`: add the import and `...facebookCampaignsTools,` to `ALL_TOOLS`.

`tests/server.test.ts`: add the import, `it('facebookCampaigns has 18 tools', ...)`,
bump the total `ALL_TOOLS` length assertion, and add all 18 tool names to the
`expectedTools` array with its `toHaveLength()` bumped to match.

- [ ] **Step 7: Run the registration tests**

Run: `npx vitest run tests/server.test.ts`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/tools/facebook_campaigns.ts tests/tools/facebook_campaigns.test.ts src/index.ts tests/server.test.ts
git commit -m "feat(facebook): add campaign, ad set, and ad tools"
```

---

## Task 3: `facebook_audiences.ts` (12 tools)

**Files:**
- Create: `src/tools/facebook_audiences.ts`
- Create: `tests/tools/facebook_audiences.test.ts`
- Modify: `src/index.ts`, `tests/server.test.ts`
- Reference: `/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/ad-publishing-v3.json`

**Interfaces:**
- Consumes: `ghlRequest`, `formatError`, `GHLConfig`, `GHL_VERSION_V3` from `../client.js`.
- Produces: `export const facebookAudiencesTools = [...]` (12 tools).

| Tool | Method | Path |
|---|---|---|
| `ghl_get_facebook_custom_audiences` | GET | `/ad-publishing/facebook/custom-audience` |
| `ghl_delete_facebook_custom_audience` | DELETE | `/ad-publishing/facebook/custom-audience/{audienceId}` |
| `ghl_update_facebook_custom_audience` | PUT | `/ad-publishing/facebook/custom-audience/{audienceId}` |
| `ghl_get_facebook_custom_audience` | GET | `/ad-publishing/facebook/custom-audience/{audienceId}` |
| `ghl_add_facebook_custom_audience_member` | PUT | `/ad-publishing/facebook/custom-audience/{audienceId}/member` |
| `ghl_remove_facebook_custom_audience_member` | DELETE | `/ad-publishing/facebook/custom-audience/{audienceId}/member` |
| `ghl_batch_update_facebook_custom_audience_members` | PUT | `/ad-publishing/facebook/custom-audience/{audienceId}/member/batch` |
| `ghl_get_facebook_pixels` | GET | `/ad-publishing/facebook/pixels` |
| `ghl_upsert_facebook_pixel` | PUT | `/ad-publishing/facebook/pixels` |
| `ghl_get_facebook_conversation_forms` | GET | `/ad-publishing/facebook/conversation-forms` |
| `ghl_create_facebook_conversation_form` | POST | `/ad-publishing/facebook/conversation-forms` |
| `ghl_get_facebook_lead_form` | GET | `/ad-publishing/facebook/lead-form/{leadFormId}` |

- [ ] **Step 1: Read the real schemas**

```bash
python3 -c "
import json
f = json.load(open('/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/ad-publishing-v3.json'))
schemas = f['components']['schemas']
paths = [
    ('/ad-publishing/facebook/custom-audience','get'), ('/ad-publishing/facebook/custom-audience/{audienceId}','delete'),
    ('/ad-publishing/facebook/custom-audience/{audienceId}','put'), ('/ad-publishing/facebook/custom-audience/{audienceId}','get'),
    ('/ad-publishing/facebook/custom-audience/{audienceId}/member','put'), ('/ad-publishing/facebook/custom-audience/{audienceId}/member','delete'),
    ('/ad-publishing/facebook/custom-audience/{audienceId}/member/batch','put'), ('/ad-publishing/facebook/pixels','get'),
    ('/ad-publishing/facebook/pixels','put'), ('/ad-publishing/facebook/conversation-forms','get'),
    ('/ad-publishing/facebook/conversation-forms','post'), ('/ad-publishing/facebook/lead-form/{leadFormId}','get'),
]
for path, method in paths:
    op = f['paths'][path][method]
    print('===', method.upper(), path, '===')
    for p in op.get('parameters', []):
        print(' param:', p.get('name'), p.get('required'), p.get('in'))
    body = op.get('requestBody', {}).get('content', {}).get('application/json', {}).get('schema', {})
    ref = body.get('\$ref')
    if ref:
        s = schemas[ref.split('/')[-1]]
        print(' body required:', s.get('required'))
        print(' body props:', list(s.get('properties', {}).keys()))
"
```

Confirmed during design research: `PUT /facebook/custom-audience/{audienceId}` (plain
update, ID already in path — NOT named `upsert`) and `PUT /facebook/pixels` (no ID in
path — genuine upsert, name `ghl_upsert_facebook_pixel`). Verify both directly, and
verify every other operation's exact params/body — this list is a path/method sweep
only.

- [ ] **Step 2: Write the failing tests first**

Create `tests/tools/facebook_audiences.test.ts` following
`tests/tools/associations.test.ts`'s structure.

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run tests/tools/facebook_audiences.test.ts`
Expected: FAIL.

- [ ] **Step 4: Implement**

Create `src/tools/facebook_audiences.ts` with all 12 tools.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run tests/tools/facebook_audiences.test.ts`
Expected: PASS.

- [ ] **Step 6: Register the tool array**

`src/index.ts`: add the import and `...facebookAudiencesTools,` to `ALL_TOOLS`.

`tests/server.test.ts`: add the import, `it('facebookAudiences has 12 tools', ...)`,
bump the total `ALL_TOOLS` length assertion, and add all 12 tool names to the
`expectedTools` array with its `toHaveLength()` bumped to match.

- [ ] **Step 7: Run the registration tests**

Run: `npx vitest run tests/server.test.ts`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/tools/facebook_audiences.ts tests/tools/facebook_audiences.test.ts src/index.ts tests/server.test.ts
git commit -m "feat(facebook): add custom audience, pixel, and lead form tools"
```

---

## Task 4: `facebook_reporting.ts` (4 tools)

**Files:**
- Create: `src/tools/facebook_reporting.ts`
- Create: `tests/tools/facebook_reporting.test.ts`
- Modify: `src/index.ts`, `tests/server.test.ts`
- Reference: `/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/ad-publishing-v3.json`

**Interfaces:**
- Consumes: `ghlRequest`, `formatError`, `GHLConfig`, `GHL_VERSION_V3` from `../client.js`.
- Produces: `export const facebookReportingTools = [...]` (4 tools).

| Tool | Method | Path |
|---|---|---|
| `ghl_get_facebook_reporting` | GET | `/ad-publishing/facebook/reporting` |
| `ghl_get_facebook_campaign_reporting` | GET | `/ad-publishing/facebook/reporting/campaign/{campaignId}` |
| `ghl_get_facebook_reporting_list` | GET | `/ad-publishing/facebook/reporting/list` |
| `ghl_search_facebook_targeting` | GET | `/ad-publishing/facebook/targeting/search` |

- [ ] **Step 1: Read the real schemas**

```bash
python3 -c "
import json
f = json.load(open('/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/ad-publishing-v3.json'))
for path, method in [('/ad-publishing/facebook/reporting','get'), ('/ad-publishing/facebook/reporting/campaign/{campaignId}','get'), ('/ad-publishing/facebook/reporting/list','get'), ('/ad-publishing/facebook/targeting/search','get')]:
    op = f['paths'][path][method]
    print('===', method.upper(), path, '===')
    for p in op.get('parameters', []):
        print(' param:', p.get('name'), p.get('required'), p.get('in'))
"
```

Reporting/targeting-search endpoints typically take query params (date ranges,
filters, search terms) — read each directly, no body expected on these GETs.

- [ ] **Step 2: Write the failing tests first**

Create `tests/tools/facebook_reporting.test.ts` following
`tests/tools/associations.test.ts`'s structure.

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run tests/tools/facebook_reporting.test.ts`
Expected: FAIL.

- [ ] **Step 4: Implement**

Create `src/tools/facebook_reporting.ts` with all 4 tools.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run tests/tools/facebook_reporting.test.ts`
Expected: PASS.

- [ ] **Step 6: Register the tool array**

`src/index.ts`: add the import and `...facebookReportingTools,` to `ALL_TOOLS`.

`tests/server.test.ts`: add the import, `it('facebookReporting has 4 tools', ...)`,
bump the total `ALL_TOOLS` length assertion, and add all 4 tool names to the
`expectedTools` array with its `toHaveLength()` bumped to match. The running total
after this task should be 309 + 14 + 18 + 12 + 4 = 357 (all of Facebook) — confirm
against the actual assertion.

- [ ] **Step 7: Run the registration tests**

Run: `npx vitest run tests/server.test.ts`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/tools/facebook_reporting.ts tests/tools/facebook_reporting.test.ts src/index.ts tests/server.test.ts
git commit -m "feat(facebook): add reporting and targeting search tools"
```

---

## Task 5: `google_accounts.ts` (7 tools)

**Files:**
- Create: `src/tools/google_accounts.ts`
- Create: `tests/tools/google_accounts.test.ts`
- Modify: `src/index.ts`, `tests/server.test.ts`
- Reference: `/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/ad-publishing-v3.json`

**Interfaces:**
- Consumes: `ghlRequest`, `formatError`, `GHLConfig`, `GHL_VERSION_V3` from `../client.js`.
- Produces: `export const googleAccountsTools = [...]` (7 tools).

| Tool | Method | Path |
|---|---|---|
| `ghl_get_google_ad_accounts` | GET | `/ad-publishing/google/ad-accounts` |
| `ghl_get_google_ad_account` | GET | `/ad-publishing/google/ad-accounts/{adAccountId}` |
| `ghl_delete_google_ad_account` | DELETE | `/ad-publishing/google/ad-accounts/{adAccountId}` |
| `ghl_create_google_integration` | POST | `/ad-publishing/google/integration` |
| `ghl_get_google_integration` | GET | `/ad-publishing/google/integration` |
| `ghl_get_google_me` | GET | `/ad-publishing/google/me` |
| `ghl_get_google_entity` | GET | `/ad-publishing/google/entity` |

- [ ] **Step 1: Read the real schemas**

```bash
python3 -c "
import json
f = json.load(open('/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/ad-publishing-v3.json'))
schemas = f['components']['schemas']
paths = [
    ('/ad-publishing/google/ad-accounts','get'), ('/ad-publishing/google/ad-accounts/{adAccountId}','get'),
    ('/ad-publishing/google/ad-accounts/{adAccountId}','delete'), ('/ad-publishing/google/integration','post'),
    ('/ad-publishing/google/integration','get'), ('/ad-publishing/google/me','get'), ('/ad-publishing/google/entity','get'),
]
for path, method in paths:
    op = f['paths'][path][method]
    print('===', method.upper(), path, '===')
    for p in op.get('parameters', []):
        print(' param:', p.get('name'), p.get('required'), p.get('in'))
    body = op.get('requestBody', {}).get('content', {}).get('application/json', {}).get('schema', {})
    ref = body.get('\$ref')
    if ref:
        s = schemas[ref.split('/')[-1]]
        print(' body required:', s.get('required'))
        print(' body props:', list(s.get('properties', {}).keys()))
"
```

Confirmed during design research: `POST /google/integration` requires `locationId`,
`adAccountId`, `mccId` (all three, no optional fields per the design sweep — verify).

- [ ] **Step 2: Write the failing tests first**

Create `tests/tools/google_accounts.test.ts` following
`tests/tools/associations.test.ts`'s structure.

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run tests/tools/google_accounts.test.ts`
Expected: FAIL.

- [ ] **Step 4: Implement**

Create `src/tools/google_accounts.ts` with all 7 tools.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run tests/tools/google_accounts.test.ts`
Expected: PASS.

- [ ] **Step 6: Register the tool array**

`src/index.ts`: add the import and `...googleAccountsTools,` to `ALL_TOOLS`.

`tests/server.test.ts`: add the import, `it('googleAccounts has 7 tools', ...)`, bump
the total `ALL_TOOLS` length assertion, and add all 7 tool names to the
`expectedTools` array with its `toHaveLength()` bumped to match.

- [ ] **Step 7: Run the registration tests**

Run: `npx vitest run tests/server.test.ts`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/tools/google_accounts.ts tests/tools/google_accounts.test.ts src/index.ts tests/server.test.ts
git commit -m "feat(google): add ad account, integration, and identity tools"
```

---

## Task 6: `google_campaigns.ts` (6 tools)

**Files:**
- Create: `src/tools/google_campaigns.ts`
- Create: `tests/tools/google_campaigns.test.ts`
- Modify: `src/index.ts`, `tests/server.test.ts`
- Reference: `/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/ad-publishing-v3.json`

**Interfaces:**
- Consumes: `ghlRequest`, `formatError`, `GHLConfig`, `GHL_VERSION_V3` from `../client.js`.
- Produces: `export const googleCampaignsTools = [...]` (6 tools).

| Tool | Method | Path |
|---|---|---|
| `ghl_upsert_google_campaign` | PUT | `/ad-publishing/google/ads` |
| `ghl_get_google_campaign` | GET | `/ad-publishing/google/ads/{adId}` |
| `ghl_publish_google_campaign` | POST | `/ad-publishing/google/ads/{adId}/publish` |
| `ghl_get_google_assets` | GET | `/ad-publishing/google/assets` |
| `ghl_upsert_google_assets` | POST | `/ad-publishing/google/assets` |
| `ghl_get_google_keyword_ideas` | POST | `/ad-publishing/google/keyword-ideas` |

- [ ] **Step 1: Read the real schemas**

```bash
python3 -c "
import json
f = json.load(open('/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/ad-publishing-v3.json'))
schemas = f['components']['schemas']
paths = [
    ('/ad-publishing/google/ads','put'), ('/ad-publishing/google/ads/{adId}','get'),
    ('/ad-publishing/google/ads/{adId}/publish','post'), ('/ad-publishing/google/assets','get'),
    ('/ad-publishing/google/assets','post'), ('/ad-publishing/google/keyword-ideas','post'),
]
for path, method in paths:
    op = f['paths'][path][method]
    print('===', method.upper(), path, '===')
    for p in op.get('parameters', []):
        print(' param:', p.get('name'), p.get('required'), p.get('in'))
    body = op.get('requestBody', {}).get('content', {}).get('application/json', {}).get('schema', {})
    ref = body.get('\$ref')
    if ref:
        s = schemas[ref.split('/')[-1]]
        print(' body required:', s.get('required'))
        print(' body props:', list(s.get('properties', {}).keys()))
"
```

Confirmed during design research: `PUT /google/ads` (`ghl_upsert_google_campaign` —
genuine upsert, no ID in path) requires `name`, `locationId`,
`advertisingChannelType`; a long optional list including `budget`, `audience`,
`networkSettings`, `biddingStrategy`, `assets`, `adGroups`, `adSchedule` — model
these permissively. `POST /google/assets` is named "Upsert assets" in the spec
summary despite being a POST, not PUT — verify its real semantics directly (it may
still be an upsert keyed by an `id` in the body despite the POST method; if so, still
name the tool `ghl_upsert_google_assets` per the spec's own summary, which the table
above already reflects).

- [ ] **Step 2: Write the failing tests first**

Create `tests/tools/google_campaigns.test.ts` following
`tests/tools/associations.test.ts`'s structure.

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run tests/tools/google_campaigns.test.ts`
Expected: FAIL.

- [ ] **Step 4: Implement**

Create `src/tools/google_campaigns.ts` with all 6 tools.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run tests/tools/google_campaigns.test.ts`
Expected: PASS.

- [ ] **Step 6: Register the tool array**

`src/index.ts`: add the import and `...googleCampaignsTools,` to `ALL_TOOLS`.

`tests/server.test.ts`: add the import, `it('googleCampaigns has 6 tools', ...)`,
bump the total `ALL_TOOLS` length assertion, and add all 6 tool names to the
`expectedTools` array with its `toHaveLength()` bumped to match.

- [ ] **Step 7: Run the registration tests**

Run: `npx vitest run tests/server.test.ts`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/tools/google_campaigns.ts tests/tools/google_campaigns.test.ts src/index.ts tests/server.test.ts
git commit -m "feat(google): add campaign, asset, and keyword tools"
```

---

## Task 7: `google_audiences.ts` (14 tools)

**Files:**
- Create: `src/tools/google_audiences.ts`
- Create: `tests/tools/google_audiences.test.ts`
- Modify: `src/index.ts`, `tests/server.test.ts`
- Reference: `/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/ad-publishing-v3.json`

**Interfaces:**
- Consumes: `ghlRequest`, `formatError`, `GHLConfig`, `GHL_VERSION_V3` from `../client.js`.
- Produces: `export const googleAudiencesTools = [...]` (14 tools).

| Tool | Method | Path |
|---|---|---|
| `ghl_upsert_google_audience` | PUT | `/ad-publishing/google/audiences` |
| `ghl_get_google_audiences` | GET | `/ad-publishing/google/audiences` |
| `ghl_get_google_audience` | GET | `/ad-publishing/google/audiences/{audienceId}` |
| `ghl_get_google_segments` | GET | `/ad-publishing/google/segments` |
| `ghl_upsert_google_segment` | PUT | `/ad-publishing/google/segments` |
| `ghl_create_google_offline_user_list_job` | POST | `/ad-publishing/google/segments/offline-user-list-job` |
| `ghl_delete_google_segment` | DELETE | `/ad-publishing/google/segments/{segmentId}` |
| `ghl_get_google_segment` | GET | `/ad-publishing/google/segments/{segmentId}` |
| `ghl_get_google_conversions` | GET | `/ad-publishing/google/conversions` |
| `ghl_upsert_google_conversion` | PUT | `/ad-publishing/google/conversions` |
| `ghl_get_google_conversion` | GET | `/ad-publishing/google/conversions/{conversionId}` |
| `ghl_delete_google_conversion` | DELETE | `/ad-publishing/google/conversions/{conversionId}` |
| `ghl_get_google_conversion_goals` | GET | `/ad-publishing/google/conversion-goals` |
| `ghl_get_google_target_interests` | GET | `/ad-publishing/google/target-interests` |

- [ ] **Step 1: Read the real schemas**

```bash
python3 -c "
import json
f = json.load(open('/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/ad-publishing-v3.json'))
schemas = f['components']['schemas']
paths = [
    ('/ad-publishing/google/audiences','put'), ('/ad-publishing/google/audiences','get'),
    ('/ad-publishing/google/audiences/{audienceId}','get'), ('/ad-publishing/google/segments','get'),
    ('/ad-publishing/google/segments','put'), ('/ad-publishing/google/segments/offline-user-list-job','post'),
    ('/ad-publishing/google/segments/{segmentId}','delete'), ('/ad-publishing/google/segments/{segmentId}','get'),
    ('/ad-publishing/google/conversions','get'), ('/ad-publishing/google/conversions','put'),
    ('/ad-publishing/google/conversions/{conversionId}','get'), ('/ad-publishing/google/conversions/{conversionId}','delete'),
    ('/ad-publishing/google/conversion-goals','get'), ('/ad-publishing/google/target-interests','get'),
]
for path, method in paths:
    op = f['paths'][path][method]
    print('===', method.upper(), path, '===')
    for p in op.get('parameters', []):
        print(' param:', p.get('name'), p.get('required'), p.get('in'))
    body = op.get('requestBody', {}).get('content', {}).get('application/json', {}).get('schema', {})
    ref = body.get('\$ref')
    if ref:
        s = schemas[ref.split('/')[-1]]
        print(' body required:', s.get('required'))
        print(' body props:', list(s.get('properties', {}).keys()))
"
```

`PUT /google/audiences`, `PUT /google/segments`, `PUT /google/conversions` are all
genuine upserts (no ID in path) per the design research sweep — verify each directly
and name them `ghl_upsert_google_*` as the table above already reflects.

- [ ] **Step 2: Write the failing tests first**

Create `tests/tools/google_audiences.test.ts` following
`tests/tools/associations.test.ts`'s structure.

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run tests/tools/google_audiences.test.ts`
Expected: FAIL.

- [ ] **Step 4: Implement**

Create `src/tools/google_audiences.ts` with all 14 tools.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run tests/tools/google_audiences.test.ts`
Expected: PASS.

- [ ] **Step 6: Register the tool array**

`src/index.ts`: add the import and `...googleAudiencesTools,` to `ALL_TOOLS`.

`tests/server.test.ts`: add the import, `it('googleAudiences has 14 tools', ...)`,
bump the total `ALL_TOOLS` length assertion, and add all 14 tool names to the
`expectedTools` array with its `toHaveLength()` bumped to match.

- [ ] **Step 7: Run the registration tests**

Run: `npx vitest run tests/server.test.ts`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/tools/google_audiences.ts tests/tools/google_audiences.test.ts src/index.ts tests/server.test.ts
git commit -m "feat(google): add audience, segment, and conversion tools"
```

---

## Task 8: `google_reporting.ts` (4 tools)

**Files:**
- Create: `src/tools/google_reporting.ts`
- Create: `tests/tools/google_reporting.test.ts`
- Modify: `src/index.ts`, `tests/server.test.ts`
- Reference: `/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/ad-publishing-v3.json`

**Interfaces:**
- Consumes: `ghlRequest`, `formatError`, `GHLConfig`, `GHL_VERSION_V3` from `../client.js`.
- Produces: `export const googleReportingTools = [...]` (4 tools).

| Tool | Method | Path |
|---|---|---|
| `ghl_get_google_reporting` | GET | `/ad-publishing/google/reporting` |
| `ghl_get_google_campaign_reporting` | GET | `/ad-publishing/google/reporting/campaign/{campaignId}` |
| `ghl_get_google_reporting_list` | GET | `/ad-publishing/google/reporting/list` |
| `ghl_search_google_targeting` | GET | `/ad-publishing/google/targeting/search` |

- [ ] **Step 1: Read the real schemas**

```bash
python3 -c "
import json
f = json.load(open('/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/ad-publishing-v3.json'))
for path, method in [('/ad-publishing/google/reporting','get'), ('/ad-publishing/google/reporting/campaign/{campaignId}','get'), ('/ad-publishing/google/reporting/list','get'), ('/ad-publishing/google/targeting/search','get')]:
    op = f['paths'][path][method]
    print('===', method.upper(), path, '===')
    for p in op.get('parameters', []):
        print(' param:', p.get('name'), p.get('required'), p.get('in'))
"
```

- [ ] **Step 2: Write the failing tests first**

Create `tests/tools/google_reporting.test.ts` following
`tests/tools/associations.test.ts`'s structure.

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run tests/tools/google_reporting.test.ts`
Expected: FAIL.

- [ ] **Step 4: Implement**

Create `src/tools/google_reporting.ts` with all 4 tools.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run tests/tools/google_reporting.test.ts`
Expected: PASS.

- [ ] **Step 6: Register the tool array**

`src/index.ts`: add the import and `...googleReportingTools,` to `ALL_TOOLS`.

`tests/server.test.ts`: add the import, `it('googleReporting has 4 tools', ...)`,
bump the total `ALL_TOOLS` length assertion, and add all 4 tool names to the
`expectedTools` array with its `toHaveLength()` bumped to match. The running total
after this task should be 357 + 7 + 6 + 14 + 4 = 388 (all of Facebook + Google) —
confirm against the actual assertion.

- [ ] **Step 7: Run the registration tests**

Run: `npx vitest run tests/server.test.ts`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/tools/google_reporting.ts tests/tools/google_reporting.test.ts src/index.ts tests/server.test.ts
git commit -m "feat(google): add reporting and targeting search tools"
```

---

## Task 9: `linkedin.ts` (16 tools)

**Files:**
- Create: `src/tools/linkedin.ts`
- Create: `tests/tools/linkedin.test.ts`
- Modify: `src/index.ts`, `tests/server.test.ts`
- Reference: `/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/ad-publishing-v3.json`

**Interfaces:**
- Consumes: `ghlRequest`, `formatError`, `GHLConfig`, `GHL_VERSION_V3` from `../client.js`.
- Produces: `export const linkedinTools = [...]` (16 tools).

| Tool | Method | Path |
|---|---|---|
| `ghl_get_linkedin_ad_account` | GET | `/ad-publishing/linkedin/ad-account` |
| `ghl_delete_linkedin_ad_account` | DELETE | `/ad-publishing/linkedin/ad-account` |
| `ghl_get_linkedin_ad_accounts` | GET | `/ad-publishing/linkedin/ad-accounts` |
| `ghl_create_linkedin_integration` | POST | `/ad-publishing/linkedin/integration` |
| `ghl_get_linkedin_integration` | GET | `/ad-publishing/linkedin/integration` |
| `ghl_get_linkedin_me` | GET | `/ad-publishing/linkedin/me` |
| `ghl_upsert_linkedin_campaign` | PUT | `/ad-publishing/linkedin/ads` |
| `ghl_get_linkedin_campaign` | GET | `/ad-publishing/linkedin/ads/{adId}` |
| `ghl_publish_linkedin_campaign` | POST | `/ad-publishing/linkedin/ads/{adId}/publish` |
| `ghl_update_linkedin_ad_status` | PATCH | `/ad-publishing/linkedin/{adId}/status` |
| `ghl_create_linkedin_lead_form` | POST | `/ad-publishing/linkedin/{accountId}/form` |
| `ghl_get_linkedin_lead_forms` | GET | `/ad-publishing/linkedin/{accountId}/forms` |
| `ghl_get_linkedin_reporting` | GET | `/ad-publishing/linkedin/reporting` |
| `ghl_get_linkedin_campaign_group_reporting` | GET | `/ad-publishing/linkedin/reporting/campaign-group/{campaignGroupId}` |
| `ghl_get_linkedin_reporting_list` | GET | `/ad-publishing/linkedin/reporting/list` |
| `ghl_search_linkedin_targeting` | GET | `/ad-publishing/linkedin/targeting/search` |

- [ ] **Step 1: Read the real schemas**

```bash
python3 -c "
import json
f = json.load(open('/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/ad-publishing-v3.json'))
schemas = f['components']['schemas']
paths = [
    ('/ad-publishing/linkedin/ad-account','get'), ('/ad-publishing/linkedin/ad-account','delete'),
    ('/ad-publishing/linkedin/ad-accounts','get'), ('/ad-publishing/linkedin/integration','post'),
    ('/ad-publishing/linkedin/integration','get'), ('/ad-publishing/linkedin/me','get'),
    ('/ad-publishing/linkedin/ads','put'), ('/ad-publishing/linkedin/ads/{adId}','get'),
    ('/ad-publishing/linkedin/ads/{adId}/publish','post'), ('/ad-publishing/linkedin/{adId}/status','patch'),
    ('/ad-publishing/linkedin/{accountId}/form','post'), ('/ad-publishing/linkedin/{accountId}/forms','get'),
    ('/ad-publishing/linkedin/reporting','get'), ('/ad-publishing/linkedin/reporting/campaign-group/{campaignGroupId}','get'),
    ('/ad-publishing/linkedin/reporting/list','get'), ('/ad-publishing/linkedin/targeting/search','get'),
]
for path, method in paths:
    op = f['paths'][path][method]
    print('===', method.upper(), path, '===')
    for p in op.get('parameters', []):
        print(' param:', p.get('name'), p.get('required'), p.get('in'))
    body = op.get('requestBody', {}).get('content', {}).get('application/json', {}).get('schema', {})
    ref = body.get('\$ref')
    if ref:
        s = schemas[ref.split('/')[-1]]
        print(' body required:', s.get('required'))
        print(' body props:', list(s.get('properties', {}).keys()))
"
```

Confirmed during design research: `POST /linkedin/integration` requires
`locationId`, `adAccountId`, `adAccountName`, `currencyCode`, `organizationId` (all
five, no optional fields per the design sweep — verify). `PUT /linkedin/ads`
(`ghl_upsert_linkedin_campaign` — genuine upsert, no ID in path) requires only
`locationId`; optional fields include `budget`, `adCampaigns`,
`adBudgetOptimization`, `objectiveType`, `name` — model `adCampaigns`/`budget`
permissively.

- [ ] **Step 2: Write the failing tests first**

Create `tests/tools/linkedin.test.ts` following `tests/tools/associations.test.ts`'s
structure.

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run tests/tools/linkedin.test.ts`
Expected: FAIL.

- [ ] **Step 4: Implement**

Create `src/tools/linkedin.ts` with all 16 tools.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run tests/tools/linkedin.test.ts`
Expected: PASS.

- [ ] **Step 6: Register the tool array**

`src/index.ts`: add the import and `...linkedinTools,` to `ALL_TOOLS`.

`tests/server.test.ts`: add the import, `it('linkedin has 16 tools', ...)`, bump the
total `ALL_TOOLS` length assertion, and add all 16 tool names to the `expectedTools`
array with its `toHaveLength()` bumped to match. The running total after this task
should be 388 + 16 = 404 (all of Phase 2f) — confirm against the actual assertion.

- [ ] **Step 7: Run the registration tests**

Run: `npx vitest run tests/server.test.ts`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/tools/linkedin.ts tests/tools/linkedin.test.ts src/index.ts tests/server.test.ts
git commit -m "feat(linkedin): add ad account, campaign, form, and reporting tools"
```

---

## Task 10: Final verification, README, and CHANGELOG

**Files:**
- Modify: `README.md`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Full-repo typecheck**

Run: `npm run typecheck`
Expected: PASS with zero errors.

- [ ] **Step 2: Full test suite**

Run: `npm test` (or `npx vitest run`)
Expected: PASS, all suites green. Verify the actual final tool count from
`tests/server.test.ts` rather than assuming a number (should be 309 + 95 = 404, but
confirm against the live assertion).

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: succeeds with no errors.

- [ ] **Step 4: Update README.md**

- Bump the tool count (intro line and "All N Tools" heading) to the actual final
  total.
- Add category-table rows for the 3 platforms (Facebook, Google, LinkedIn — grouped
  rows rather than 9 individual module rows, to keep the table readable; use your
  judgment on exact row granularity, following the precedent of how Phase 2a grouped
  `store.ts`'s 18 tools).
- Add per-module "Full Reference" subsections (`### Facebook Accounts`,
  `### Facebook Campaigns`, `### Facebook Audiences`, `### Facebook Reporting`,
  `### Google Accounts`, `### Google Campaigns`, `### Google Audiences`,
  `### Google Reporting`, `### LinkedIn`) listing every individual tool name +
  description, matching the pattern used for every prior phase's modules — this is a
  large amount of content (95 tools) but the pattern must not be skipped (Phase 2c
  Task 5 skipped this once and it had to be added in a fix round; don't repeat that).
- The existing "Not yet covered" callout needs no changes this phase (all 95
  `ad-publishing` operations are now covered) — confirm it's still accurate, don't
  add anything to it.

- [ ] **Step 5: Update CHANGELOG.md**

Add a "Phase 2f — Ad Publishing" entry listing the 9 new modules grouped by platform,
their tool counts, the total new tool count (95), and a closing note that this
completes v3 coverage for every practically-buildable GHL resource this server's
location-scoped PIT token can reach — the only remaining gaps are the agency-only
exclusions documented across earlier phases (`saas`, `marketplace`, `companies`,
`snapshots`, `oauth`).

- [ ] **Step 6: Commit**

```bash
git add README.md CHANGELOG.md
git commit -m "docs: update README and changelog for Phase 2f Ad Publishing tools"
```

**Do not bump `package.json`'s version or tag/publish.** Stop here and report completion.
