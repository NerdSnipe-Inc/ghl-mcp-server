# GHL API v3 Phase 2e: Social Planner Resource Coverage — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 41 new tools covering GHL API v3's `social-planner-v3.json` operations
not already built in Phase 1's `social.ts` (which covers 4 of the resource's 45
operations), plus a new `ghlRequestMultipart` client capability required by one of
them (CSV upload).

**Architecture:** One small addition to `src/client.ts` (`ghlRequestMultipart`), then
four new tool modules following the exact pattern established in Phase 1/1.5/2a-2d
(`ghl_<verb>_<noun>` naming, Zod `inputSchema`, `handler(args, config)` →
`ghlRequest(...)` → `JSON.stringify` or `formatError`). Every call uses
`version: GHL_VERSION_V3`. Read the real request/response schema from the v3 spec file
before writing each tool.

**Tech Stack:** TypeScript, Zod, Vitest, Node.js (existing stack — no new
dependencies; `FormData`/`Blob` are Node 18+ globals, already available).

## Global Constraints

- Spec: `docs/superpowers/specs/2026-08-04-v3-phase2e-social-planner-design.md` — read
  it before starting.
- v3 OpenAPI spec: `/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/social-planner-v3.json`.
- Do NOT re-implement or modify the 4 tools Phase 1 already built in `src/tools/social.ts`
  (`ghl_get_social_accounts`, `ghl_get_social_posts`, `ghl_create_social_post`,
  `ghl_delete_social_post`) — they already cover `GET .../accounts`,
  `POST .../posts/list`, `POST .../posts`, `DELETE .../posts/{id}`.
- Tool naming: `ghl_` prefix, snake_case.
- Every `ghlRequest`/`ghlRequestMultipart` call: `version: GHL_VERSION_V3` (imported
  from `../client.js`).
- Deeply nested/loosely-specified request bodies (`modifiedPostPayload`,
  `variations`, `primaryImage`, `ogTagsDetails`, `postApprovalDetails`, `media`):
  model as `z.record(z.string(), z.unknown())` or
  `z.array(z.record(z.string(), z.unknown()))` — established Phase 2a-2c precedent for
  deeply nested bodies. Don't fully type them out unless they turn out simple when
  read directly.
- **Disclose malformed/ambiguous upstream spec fields with a one-line code comment**
  as you write each tool, not as an afterthought.
- **Verify `locationId` presence/placement per endpoint — don't assume.** It appears
  as a path segment, query param, or body field depending on the operation; some
  operations (e.g. `available-categories`) may have none.
- **Do not trim "large" required-field lists.**
- TDD throughout: write the test first against the real schema, confirm RED,
  implement, confirm GREEN.
- Each task registers its new tool array into `ALL_TOOLS` in `src/index.ts` and adds a
  `toHaveLength()` assertion plus `expectedTools` manifest entries (with correct
  running total) in `tests/server.test.ts`. Keep `expectedTools` accurate every task.
- README/CHANGELOG updates are consolidated into the final task.
- Do not bump `package.json`'s version, tag, or publish.

---

## Task 1: `ghlRequestMultipart` client capability

**Files:**
- Modify: `src/client.ts`
- Modify: `tests/client.test.ts`
- Reference: `/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/social-planner-v3.json` (`POST /social-media-posting/{locationId}/csv`)

**Interfaces:**
- Produces: `export async function ghlRequestMultipart<T = unknown>(method: "POST", path: string, options: { token: string; version: string; params?: Record<string, string | number | boolean | undefined>; fields: { file: { content: string; filename: string } } }): Promise<T>` from `src/client.ts` — Task 5's `ghl_upload_social_csv` tool consumes this.

- [ ] **Step 1: Write the failing test**

Add to `tests/client.test.ts`, in a new `describe('ghlRequestMultipart', ...)` block
following the existing `describe('ghlRequest', ...)` block's mocking pattern (read
that block first for the `mockFetchSuccess`/`mockFetchError` helper usage from
`./helpers.js`):

```typescript
describe('ghlRequestMultipart', () => {
  it('sends a multipart/form-data body with the file field', async () => {
    const fetchMock = mockFetchSuccess({ id: 'csv-123' });
    await ghlRequestMultipart('POST', '/social-media-posting/loc-1/csv', {
      token: 'tok',
      version: GHL_VERSION_V3,
      fields: { file: { content: 'name,platform\nJohn,facebook', filename: 'posts.csv' } },
    });
    const call = fetchMock.mock.calls[0];
    const [url, init] = call;
    expect(url).toBe(`${GHL_BASE_URL}/social-media-posting/loc-1/csv`);
    expect(init.body).toBeInstanceOf(FormData);
    const body = init.body as FormData;
    const file = body.get('file');
    expect(file).toBeInstanceOf(Blob);
    expect((file as File).name).toBe('posts.csv');
    // Content-Type must NOT be manually set to application/json — fetch sets the
    // correct multipart boundary automatically. Confirm it's absent from our headers.
    expect(init.headers['Content-Type']).toBeUndefined();
    expect(init.headers['Authorization']).toBe('Bearer tok');
    expect(init.headers['Version']).toBe(GHL_VERSION_V3);
  });

  it('throws GHLApiError on non-2xx response', async () => {
    mockFetchError(400, { message: 'invalid file' });
    await expect(
      ghlRequestMultipart('POST', '/social-media-posting/loc-1/csv', {
        token: 'tok',
        version: GHL_VERSION_V3,
        fields: { file: { content: 'bad', filename: 'x.csv' } },
      })
    ).rejects.toThrow(GHLApiError);
  });
});
```

Adjust the exact assertion style to match however `mockFetchSuccess`/`mockFetchError`
expose the underlying `fetch` mock in the existing `ghlRequest` tests in this file —
read those tests first and mirror their exact mocking mechanics rather than
reinventing them.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/client.test.ts`
Expected: FAIL — `ghlRequestMultipart` is not exported yet.

- [ ] **Step 3: Implement `ghlRequestMultipart`**

Add to `src/client.ts`, after `ghlRequest`:

```typescript
export async function ghlRequestMultipart<T = unknown>(
  method: "POST",
  path: string,
  options: {
    token: string;
    version: string;
    params?: Record<string, string | number | boolean | undefined>;
    fields: { file: { content: string; filename: string } };
  }
): Promise<T> {
  const { token, version, params, fields } = options;

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

  // Omit Content-Type from buildHeaders' output: fetch sets the correct
  // multipart/form-data boundary automatically when given a FormData body, and an
  // explicit application/json Content-Type would break the multipart request.
  const headers = buildHeaders(token, version);
  delete headers["Content-Type"];

  const formData = new FormData();
  formData.set(
    "file",
    new Blob([fields.file.content], { type: "text/csv" }),
    fields.file.filename
  );

  const response = await fetch(url, {
    method,
    headers,
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    let errorBody: unknown;
    try {
      errorBody = JSON.parse(text);
    } catch {
      errorBody = text;
    }
    throw new GHLApiError(response.status, response.statusText, errorBody, path);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/client.test.ts`
Expected: PASS.

- [ ] **Step 5: Run the full suite to confirm no regressions**

Run: `npx vitest run`
Expected: PASS, all existing suites green.

- [ ] **Step 6: Commit**

```bash
git add src/client.ts tests/client.test.ts
git commit -m "feat(client): add ghlRequestMultipart for multipart/form-data uploads"
```

---

## Task 2: `social_planner_queues.ts` (18 tools)

**Files:**
- Create: `src/tools/social_planner_queues.ts`
- Create: `tests/tools/social_planner_queues.test.ts`
- Modify: `src/index.ts`, `tests/server.test.ts`
- Reference: `/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/social-planner-v3.json`

**Interfaces:**
- Consumes: `ghlRequest`, `formatError`, `GHLConfig`, `GHL_VERSION_V3` from `../client.js`.
- Produces: `export const socialPlannerQueuesTools = [...]` (18 tools).

| Tool | Method | Path |
|---|---|---|
| `ghl_create_social_queue` | POST | `/social-media-posting/category/queues` |
| `ghl_get_social_queue_categories` | GET | `/social-media-posting/category/queues/available-categories` |
| `ghl_list_social_queues` | POST | `/social-media-posting/category/queues/list` |
| `ghl_get_social_queue_calendar` | POST | `/social-media-posting/category/queues/list/calendar` |
| `ghl_delete_social_queue_active_post` | DELETE | `/social-media-posting/category/queues/{postId}/active-post` |
| `ghl_get_social_queue` | GET | `/social-media-posting/category/queues/{queueId}` |
| `ghl_update_social_queue` | PUT | `/social-media-posting/category/queues/{queueId}` |
| `ghl_create_social_queue_item` | POST | `/social-media-posting/category/queues/{queueId}/create/item` |
| `ghl_get_social_queue_edit_calendar` | POST | `/social-media-posting/category/queues/{queueId}/edit/calendar` |
| `ghl_discard_social_queue_edit` | POST | `/social-media-posting/category/queues/{queueId}/edit/discard` |
| `ghl_save_social_queue_edit` | POST | `/social-media-posting/category/queues/{queueId}/edit/save` |
| `ghl_start_social_queue_edit` | POST | `/social-media-posting/category/queues/{queueId}/edit/start` |
| `ghl_get_social_queue_items` | POST | `/social-media-posting/category/queues/{queueId}/items` |
| `ghl_delete_social_queue_item` | DELETE | `/social-media-posting/category/queues/{queueId}/items/{itemId}` |
| `ghl_update_social_queue_item` | PUT | `/social-media-posting/category/queues/{queueId}/items/{itemId}` |
| `ghl_clone_social_queue_item` | POST | `/social-media-posting/category/queues/{queueId}/items/{itemId}/clone` |
| `ghl_reset_social_queue_item` | PUT | `/social-media-posting/category/queues/{queueId}/items/{itemId}/reset` |
| `ghl_get_social_queue_slots` | POST | `/social-media-posting/category/queues/{queueId}/slots` |

- [ ] **Step 1: Read the real schemas**

```bash
python3 -c "
import json
f = json.load(open('/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/social-planner-v3.json'))
schemas = f['components']['schemas']
paths = [
    ('/social-media-posting/category/queues','post'),
    ('/social-media-posting/category/queues/available-categories','get'),
    ('/social-media-posting/category/queues/list','post'),
    ('/social-media-posting/category/queues/list/calendar','post'),
    ('/social-media-posting/category/queues/{postId}/active-post','delete'),
    ('/social-media-posting/category/queues/{queueId}','get'),
    ('/social-media-posting/category/queues/{queueId}','put'),
    ('/social-media-posting/category/queues/{queueId}/create/item','post'),
    ('/social-media-posting/category/queues/{queueId}/edit/calendar','post'),
    ('/social-media-posting/category/queues/{queueId}/edit/discard','post'),
    ('/social-media-posting/category/queues/{queueId}/edit/save','post'),
    ('/social-media-posting/category/queues/{queueId}/edit/start','post'),
    ('/social-media-posting/category/queues/{queueId}/items','post'),
    ('/social-media-posting/category/queues/{queueId}/items/{itemId}','delete'),
    ('/social-media-posting/category/queues/{queueId}/items/{itemId}','put'),
    ('/social-media-posting/category/queues/{queueId}/items/{itemId}/clone','post'),
    ('/social-media-posting/category/queues/{queueId}/items/{itemId}/reset','put'),
    ('/social-media-posting/category/queues/{queueId}/slots','post'),
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

Confirmed during design research (verify all directly, this is a starting point not
gospel): `POST /category/queues` requires `locationId`, `categoryId`, `timeSlots`,
`userId` in body. `POST /category/queues/list` requires `locationId`.
`POST /category/queues/list/calendar` requires `locationId`, `startDate`, `endDate`.
`PUT /category/queues/{queueId}` requires `locationId`. `POST
/category/queues/{queueId}/create/item` requires `locationId`. `POST
/category/queues/{queueId}/edit/calendar` requires `locationId`, `sessionId`,
`startDate`, `endDate`. `POST /category/queues/{queueId}/items` requires
`locationId`. `PUT /category/queues/{queueId}/items/{itemId}` requires `locationId`.
`POST /category/queues/{queueId}/slots` requires `locationId`. The `edit/discard`,
`edit/save`, `edit/start`, and `items/{itemId}/clone` operations' exact body shape
wasn't captured in design research — read their real schemas directly, they likely
take `sessionId` and/or `locationId` in the body given the pattern of sibling
`edit/*` operations. `modifiedPostPayload`, `variations`, `primaryImage` fields
(appearing in `create/item` and `items/{itemId}` update bodies): model as
`z.record(z.string(), z.unknown())` per the Global Constraints note on deeply nested
bodies.

- [ ] **Step 2: Write the failing tests first**

Create `tests/tools/social_planner_queues.test.ts` following
`tests/tools/associations.test.ts`'s structure (Phase 2d — read it for the concrete
reference): `getTool` helper, one `describe` per tool with success-path assertions on
`method`/`pathname`/`headers.Version`/relevant `params`/`body` fields, plus an
error-path test per tool.

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run tests/tools/social_planner_queues.test.ts`
Expected: FAIL — `src/tools/social_planner_queues.ts` doesn't exist yet.

- [ ] **Step 4: Implement**

Create `src/tools/social_planner_queues.ts` with all 18 tools, each matched to its
own real schema from Step 1.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run tests/tools/social_planner_queues.test.ts`
Expected: PASS.

- [ ] **Step 6: Register the tool array**

`src/index.ts`: add the import and `...socialPlannerQueuesTools,` to `ALL_TOOLS`.

`tests/server.test.ts`: add the import, `it('socialPlannerQueues has 18 tools', ...)`,
bump the total `ALL_TOOLS` length assertion, and add all 18 tool names to the
`expectedTools` array with its `toHaveLength()` bumped to match.

- [ ] **Step 7: Run the registration tests**

Run: `npx vitest run tests/server.test.ts`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/tools/social_planner_queues.ts tests/tools/social_planner_queues.test.ts src/index.ts tests/server.test.ts
git commit -m "feat(social-planner): add content queue and queue item tools"
```

---

## Task 3: `social_planner_comments.ts` (4 tools)

**Files:**
- Create: `src/tools/social_planner_comments.ts`
- Create: `tests/tools/social_planner_comments.test.ts`
- Modify: `src/index.ts`, `tests/server.test.ts`
- Reference: `/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/social-planner-v3.json`

**Interfaces:**
- Consumes: `ghlRequest`, `formatError`, `GHLConfig`, `GHL_VERSION_V3` from `../client.js`.
- Produces: `export const socialPlannerCommentsTools = [...]` (4 tools).

| Tool | Method | Path |
|---|---|---|
| `ghl_create_social_comment` | POST | `/social-media-posting/comments/{platform}` |
| `ghl_list_social_comments` | POST | `/social-media-posting/comments/{platform}/list` |
| `ghl_like_social_comment` | POST | `/social-media-posting/comments/{platform}/{id}/like` |
| `ghl_unlike_social_comment` | DELETE | `/social-media-posting/comments/{platform}/{id}/like` |

- [ ] **Step 1: Read the real schemas**

```bash
python3 -c "
import json
f = json.load(open('/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/social-planner-v3.json'))
schemas = f['components']['schemas']
paths = [
    ('/social-media-posting/comments/{platform}','post'),
    ('/social-media-posting/comments/{platform}/list','post'),
    ('/social-media-posting/comments/{platform}/{id}/like','post'),
    ('/social-media-posting/comments/{platform}/{id}/like','delete'),
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

Confirmed during design research: `platform` is a required path param on all 4.
`POST /comments/{platform}` requires `parentId`, `isParentThread`, `content` in body,
plus a required `locationId` query param. `POST /comments/{platform}/list` requires
`originIds` in body, plus required query `locationId`. `POST`/`DELETE
/comments/{platform}/{id}/like` both take required query `locationId` (verify the
`DELETE` doesn't also need a body — likely not, but check directly).

- [ ] **Step 2: Write the failing tests first**

Create `tests/tools/social_planner_comments.test.ts` following
`tests/tools/associations.test.ts`'s structure.

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run tests/tools/social_planner_comments.test.ts`
Expected: FAIL.

- [ ] **Step 4: Implement**

Create `src/tools/social_planner_comments.ts` with all 4 tools.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run tests/tools/social_planner_comments.test.ts`
Expected: PASS.

- [ ] **Step 6: Register the tool array**

`src/index.ts`: add the import and `...socialPlannerCommentsTools,` to `ALL_TOOLS`.

`tests/server.test.ts`: add the import, `it('socialPlannerComments has 4 tools', ...)`,
bump the total `ALL_TOOLS` length assertion, and add all 4 tool names to the
`expectedTools` array with its `toHaveLength()` bumped to match.

- [ ] **Step 7: Run the registration tests**

Run: `npx vitest run tests/server.test.ts`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/tools/social_planner_comments.ts tests/tools/social_planner_comments.test.ts src/index.ts tests/server.test.ts
git commit -m "feat(social-planner): add comment moderation tools"
```

---

## Task 4: `social_planner_accounts.ts` (9 tools)

**Files:**
- Create: `src/tools/social_planner_accounts.ts`
- Create: `tests/tools/social_planner_accounts.test.ts`
- Modify: `src/index.ts`, `tests/server.test.ts`
- Reference: `/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/social-planner-v3.json`

**Interfaces:**
- Consumes: `ghlRequest`, `formatError`, `GHLConfig`, `GHL_VERSION_V3` from `../client.js`.
- Produces: `export const socialPlannerAccountsTools = [...]` (9 tools).

| Tool | Method | Path |
|---|---|---|
| `ghl_start_social_oauth` | GET | `/social-media-posting/oauth/{platform}/start` |
| `ghl_get_social_oauth_accounts` | GET | `/social-media-posting/oauth/{locationId}/{platform}/accounts/{accountId}` |
| `ghl_connect_social_oauth_account` | POST | `/social-media-posting/oauth/{locationId}/{platform}/accounts/{accountId}` |
| `ghl_delete_social_account` | DELETE | `/social-media-posting/{locationId}/accounts/{id}` |
| `ghl_set_social_accounts` | POST | `/social-media-posting/{locationId}/set-accounts` |
| `ghl_get_social_categories` | GET | `/social-media-posting/{locationId}/categories` |
| `ghl_get_social_category` | GET | `/social-media-posting/{locationId}/categories/{id}` |
| `ghl_get_social_tags` | GET | `/social-media-posting/{locationId}/tags` |
| `ghl_get_social_tags_by_ids` | POST | `/social-media-posting/{locationId}/tags/details` |

- [ ] **Step 1: Read the real schemas**

```bash
python3 -c "
import json
f = json.load(open('/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/social-planner-v3.json'))
schemas = f['components']['schemas']
paths = [
    ('/social-media-posting/oauth/{platform}/start','get'),
    ('/social-media-posting/oauth/{locationId}/{platform}/accounts/{accountId}','get'),
    ('/social-media-posting/oauth/{locationId}/{platform}/accounts/{accountId}','post'),
    ('/social-media-posting/{locationId}/accounts/{id}','delete'),
    ('/social-media-posting/{locationId}/set-accounts','post'),
    ('/social-media-posting/{locationId}/categories','get'),
    ('/social-media-posting/{locationId}/categories/{id}','get'),
    ('/social-media-posting/{locationId}/tags','get'),
    ('/social-media-posting/{locationId}/tags/details','post'),
]
for path, method in paths:
    op = f['paths'][path][method]
    print('===', method.upper(), path, '===', op.get('summary',''))
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

Confirmed during design research: `GET /oauth/{platform}/start` requires query
`locationId`, `userId`; optional `page`, `reconnect` (step 1 of a 3-step OAuth
connect flow — describe this in the tool description so callers understand the
3-step sequence). `POST /set-accounts` requires `accountIds`, `filePath`, `rowsCount`,
`fileName`, `userId` in body — the required `filePath`/`fileName`/`rowsCount` fields
strongly suggest this associates accounts with an already-uploaded CSV job (see Task
5's CSV upload flow) rather than being a general-purpose account linker. Read the
operation's full `description` field directly and write the tool's description to
clarify this distinction so a caller doesn't confuse it with the OAuth connect flow
above. `POST /tags/details` requires `tagIds` in body. Read the `GET
/oauth/{locationId}/{platform}/accounts/{accountId}` and its sibling `POST` (step
2/3) directly — their exact required params weren't fully captured in design
research.

- [ ] **Step 2: Write the failing tests first**

Create `tests/tools/social_planner_accounts.test.ts` following
`tests/tools/associations.test.ts`'s structure.

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run tests/tools/social_planner_accounts.test.ts`
Expected: FAIL.

- [ ] **Step 4: Implement**

Create `src/tools/social_planner_accounts.ts` with all 9 tools.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run tests/tools/social_planner_accounts.test.ts`
Expected: PASS.

- [ ] **Step 6: Register the tool array**

`src/index.ts`: add the import and `...socialPlannerAccountsTools,` to `ALL_TOOLS`.

`tests/server.test.ts`: add the import, `it('socialPlannerAccounts has 9 tools', ...)`,
bump the total `ALL_TOOLS` length assertion, and add all 9 tool names to the
`expectedTools` array with its `toHaveLength()` bumped to match.

- [ ] **Step 7: Run the registration tests**

Run: `npx vitest run tests/server.test.ts`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/tools/social_planner_accounts.ts tests/tools/social_planner_accounts.test.ts src/index.ts tests/server.test.ts
git commit -m "feat(social-planner): add OAuth connection and account/category/tag tools"
```

---

## Task 5: `social_planner_posts.ts` (10 tools, including multipart CSV upload)

**Files:**
- Create: `src/tools/social_planner_posts.ts`
- Create: `tests/tools/social_planner_posts.test.ts`
- Modify: `src/index.ts`, `tests/server.test.ts`
- Reference: `/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/social-planner-v3.json`

**Interfaces:**
- Consumes: `ghlRequest`, `ghlRequestMultipart` (Task 1), `formatError`, `GHLConfig`,
  `GHL_VERSION_V3` from `../client.js`.
- Produces: `export const socialPlannerPostsTools = [...]` (10 tools).

| Tool | Method | Path |
|---|---|---|
| `ghl_upload_social_csv` | POST | `/social-media-posting/{locationId}/csv` |
| `ghl_get_social_csv_upload_status` | GET | `/social-media-posting/{locationId}/csv` |
| `ghl_get_social_csv_post` | GET | `/social-media-posting/{locationId}/csv/{id}` |
| `ghl_finalize_social_csv` | PATCH | `/social-media-posting/{locationId}/csv/{id}` |
| `ghl_delete_social_csv` | DELETE | `/social-media-posting/{locationId}/csv/{id}` |
| `ghl_delete_social_csv_post` | DELETE | `/social-media-posting/{locationId}/csv/{csvId}/post/{postId}` |
| `ghl_bulk_delete_social_posts` | POST | `/social-media-posting/{locationId}/posts/bulk-delete` |
| `ghl_get_social_post` | GET | `/social-media-posting/{locationId}/posts/{id}` |
| `ghl_update_social_post` | PUT | `/social-media-posting/{locationId}/posts/{id}` |
| `ghl_get_social_statistics` | POST | `/social-media-posting/statistics` |

- [ ] **Step 1: Read the real schemas**

```bash
python3 -c "
import json
f = json.load(open('/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/social-planner-v3.json'))
schemas = f['components']['schemas']
paths = [
    ('/social-media-posting/{locationId}/csv','post'),
    ('/social-media-posting/{locationId}/csv','get'),
    ('/social-media-posting/{locationId}/csv/{id}','get'),
    ('/social-media-posting/{locationId}/csv/{id}','patch'),
    ('/social-media-posting/{locationId}/csv/{id}','delete'),
    ('/social-media-posting/{locationId}/csv/{csvId}/post/{postId}','delete'),
    ('/social-media-posting/{locationId}/posts/bulk-delete','post'),
    ('/social-media-posting/{locationId}/posts/{id}','get'),
    ('/social-media-posting/{locationId}/posts/{id}','put'),
    ('/social-media-posting/statistics','post'),
]
for path, method in paths:
    op = f['paths'][path][method]
    print('===', method.upper(), path, '===')
    for p in op.get('parameters', []):
        print(' param:', p.get('name'), p.get('required'), p.get('in'))
    rb = op.get('requestBody', {})
    content = rb.get('content', {})
    for ct, sch in content.items():
        ref = sch.get('schema', {}).get('\$ref')
        print(' body content-type:', ct, 'ref:', ref)
        if ref:
            s = schemas[ref.split('/')[-1]]
            print('  required:', s.get('required'))
            print('  props:', list(s.get('properties', {}).keys()))
"
```

Confirmed during design research: `POST /{locationId}/csv` requires
`multipart/form-data` with a binary `file` field — use `ghlRequestMultipart` from
Task 1, NOT `ghlRequest`. The tool's `inputSchema` takes `csvContent: z.string()`
(raw CSV text) and `filename: z.string()` and calls
`ghlRequestMultipart("POST", ..., { token, version: GHL_VERSION_V3, fields: { file: {
content: args.csvContent, filename: args.filename } } })`. `PUT
/{locationId}/posts/{id}` requires `type`, `accountIds`, `userId` in body.
`POST /{locationId}/posts/bulk-delete` — body required is `None` per design research
but has a `postIds` property; verify directly whether it's truly optional or the
spec's `required: None` is misleading (an empty `postIds` array would be a
no-op delete, worth disclosing either way). `POST /statistics` requires query
`locationId`, body is an inline empty-ish object — read its actual shape directly, it
may take a date range or platform filter; don't assume it takes no body just because
design research showed an inline type without deep inspection.

- [ ] **Step 2: Write the failing tests first**

Create `tests/tools/social_planner_posts.test.ts` following
`tests/tools/associations.test.ts`'s structure for the 9 `ghlRequest`-based tools.
For `ghl_upload_social_csv`, follow this shape (adjust to match whatever mocking
helpers this codebase's test files use for asserting on `fetch` call bodies —
consistent with Task 1's `ghlRequestMultipart` test in `tests/client.test.ts`):

```typescript
describe('ghl_upload_social_csv', () => {
  it('sends multipart form data with the csv file', async () => {
    const fetchMock = mockFetchSuccess({ uploadId: 'up-1' });
    const tool = getTool(socialPlannerPostsTools, 'ghl_upload_social_csv');
    await tool.handler(
      { csvContent: 'name,platform\nJohn,facebook', filename: 'posts.csv' },
      config
    );
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${GHL_BASE_URL}/social-media-posting/${config.locationId}/csv`);
    expect(init.body).toBeInstanceOf(FormData);
  });

  it('formats errors', async () => {
    mockFetchError(400, { message: 'bad file' });
    const tool = getTool(socialPlannerPostsTools, 'ghl_upload_social_csv');
    const result = await tool.handler({ csvContent: 'x', filename: 'x.csv' }, config);
    expect(JSON.parse(result).error).toBe(true);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run tests/tools/social_planner_posts.test.ts`
Expected: FAIL.

- [ ] **Step 4: Implement**

Create `src/tools/social_planner_posts.ts` with all 10 tools. `ghl_upload_social_csv`
uses `ghlRequestMultipart`; the other 9 use `ghlRequest`.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run tests/tools/social_planner_posts.test.ts`
Expected: PASS.

- [ ] **Step 6: Register the tool array**

`src/index.ts`: add the import and `...socialPlannerPostsTools,` to `ALL_TOOLS`.

`tests/server.test.ts`: add the import, `it('socialPlannerPosts has 10 tools', ...)`,
bump the total `ALL_TOOLS` length assertion, and add all 10 tool names to the
`expectedTools` array with its `toHaveLength()` bumped to match. The running total
after this task should be 268 + 18 + 4 + 9 + 10 = 309 — confirm against the actual
assertion, don't just trust this arithmetic.

- [ ] **Step 7: Run the registration tests**

Run: `npx vitest run tests/server.test.ts`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/tools/social_planner_posts.ts tests/tools/social_planner_posts.test.ts src/index.ts tests/server.test.ts
git commit -m "feat(social-planner): add CSV bulk-import, post, and statistics tools"
```

---

## Task 6: Final verification, README, and CHANGELOG

**Files:**
- Modify: `README.md`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Full-repo typecheck**

Run: `npm run typecheck`
Expected: PASS with zero errors.

- [ ] **Step 2: Full test suite**

Run: `npm test` (or `npx vitest run`)
Expected: PASS, all suites green. Verify the actual final tool count from
`tests/server.test.ts` rather than assuming a number (should be 268 + 41 = 309, but
confirm against the live assertion).

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: succeeds with no errors.

- [ ] **Step 4: Update README.md**

- Bump the tool count (intro line and "All N Tools" heading) to the actual final
  total.
- Add category-table rows for Social Planner Queues, Social Planner Comments, Social
  Planner Accounts, Social Planner Posts (or a single combined "Social Planner"
  category row spanning all 41, whichever reads more coherently against the existing
  table's granularity — check how Phase 2a split `store.ts`'s 18 tools into the table
  for precedent).
- Add per-module "Full Reference" subsections (`### Social Planner Queues`,
  `### Social Planner Comments`, `### Social Planner Accounts`,
  `### Social Planner Posts`) listing every individual tool name + description,
  matching the pattern used for every prior phase's modules.
- The existing "Not yet covered" callout needs no changes this phase (all 45
  `social-planner` operations are now covered, 4 pre-existing + 41 new) — confirm
  it's still accurate, don't add anything to it.
- Optionally add a brief note near `social.ts`'s existing tools or in the new Social
  Planner section clarifying the split between `social.ts` (Phase 1, 4 basic
  post/account tools) and the new `social_planner_*.ts` modules (Phase 2e, the fuller
  content-queue/CSV/comment/OAuth surface) so future contributors understand why two
  naming schemes exist for the same underlying `/social-media-posting/` resource.

- [ ] **Step 5: Update CHANGELOG.md**

Add a "Phase 2e — Social Planner" entry listing the 4 new modules, their tool counts,
the total new tool count (41), a note that 4 of the resource's 45 operations were
already covered by Phase 1's `social.ts`, and a note about the new
`ghlRequestMultipart` client capability added to support CSV file upload.

- [ ] **Step 6: Commit**

```bash
git add README.md CHANGELOG.md
git commit -m "docs: update README and changelog for Phase 2e Social Planner tools"
```

**Do not bump `package.json`'s version or tag/publish.** Stop here and report completion.
