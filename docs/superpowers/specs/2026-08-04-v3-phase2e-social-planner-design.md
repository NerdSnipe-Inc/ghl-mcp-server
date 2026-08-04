# GHL API v3 Migration — Phase 2e: Social Planner Resource Coverage

**Status:** Approved for planning
**Scope:** Add tool coverage for the 41 `social-planner-v3.json` operations not already
covered by Phase 1's `social.ts`. Newly discovered during Phase 2's ad-publishing
research — not part of the original 5-way domain split. Inserted as Phase 2e; the
originally-planned "ad-publishing" sub-phase is renumbered to Phase 2f.

## Background

`social-planner-v3.json` (45 operations, all `security: bearer` — fully
location-PIT-token-reachable, no exclusions needed) shares its `/social-media-posting/`
base path with the 3 tools Phase 1 already built in `social.ts`
(`ghl_get_social_accounts`, `ghl_get_social_posts`, `ghl_create_social_post`) plus a
4th (`ghl_delete_social_post`) — 4 of the 45 operations are already covered:

| Existing tool | Method + Path |
|---|---|
| `ghl_get_social_accounts` | `GET /social-media-posting/{locationId}/accounts` |
| `ghl_get_social_posts` | `POST /social-media-posting/{locationId}/posts/list` |
| `ghl_create_social_post` | `POST /social-media-posting/{locationId}/posts` |
| `ghl_delete_social_post` | `DELETE /social-media-posting/{locationId}/posts/{id}` |

The remaining 41 operations — content queues/categories, per-item queue editing
sessions, comment moderation, OAuth account connection, CSV bulk-import posting,
account/category/tag management, individual post get/edit, bulk-delete, and
statistics — have zero coverage. This spec covers those 41.

## Non-goals

- Do not touch or re-implement the 4 existing `social.ts` tools listed above.
- No changes to any other Phase 1 / Phase 1 follow-ups / Phase 2a-2d modules.
- `ad-publishing-v3.json` (95 operations, Facebook/Google/LinkedIn ad platforms) is a
  separate sub-phase (renumbered 2f), not covered here.

## Client capability gap: CSV upload requires multipart support

`POST /social-media-posting/{locationId}/csv` ("Upload CSV") requires a
`multipart/form-data` request body with a binary `file` field — the only
non-JSON-body operation across this entire codebase. `src/client.ts`'s `buildHeaders`
hardcodes `Content-Type: application/json`, and `ghlRequest` has no path for
multipart bodies.

**Resolution:** add a new exported function to `src/client.ts`,
`ghlRequestMultipart<T>(method, path, { token, version, params?, fields })`, that:
- Builds headers via `buildHeaders(token, version)` but **omits** the
  `Content-Type: application/json` entry (native `fetch`/`FormData` sets the correct
  `multipart/form-data; boundary=...` Content-Type automatically — an explicit
  `application/json` header would break the multipart request).
- Accepts `fields: { file: { content: string; filename: string } }` (the tool's input:
  raw CSV text content + a filename), constructs a `FormData` with a `Blob` from the
  string content (`new Blob([content], { type: "text/csv" })`), appends it as `file`,
  and passes the `FormData` as `fetch`'s `body`.
- Otherwise mirrors `ghlRequest`'s error handling (`GHLApiError`, `formatError`)
  exactly — same try/catch shape callers already expect.

`ghl_upload_social_csv`'s Zod `inputSchema` takes `csvContent: z.string()` (the raw
CSV text, not a file path — this server has no filesystem access to an MCP client's
local files) and `filename: z.string()`, and calls `ghlRequestMultipart` instead of
`ghlRequest`. This is the only tool in Phase 2e (or the whole codebase) using the new
function. Every other tool in this phase uses the existing `ghlRequest` unchanged.

## Design conventions (unchanged from prior sub-phases)

- `ghl_<verb>_<noun>` naming, Zod `inputSchema`, `handler(args, config)` pattern, every
  `ghlRequest`/`ghlRequestMultipart` call uses `version: GHL_VERSION_V3`.
- **Read the real schema before writing each tool.**
- `locationId` threading varies (path, query, or body field per-endpoint) — verify
  per-operation.
- Several request bodies contain deeply nested, loosely-specified structures
  (`modifiedPostPayload`, `variations`, `primaryImage`, `ogTagsDetails`,
  `postApprovalDetails`, `media`) — model these permissively
  (`z.record(z.string(), z.unknown())` or `z.array(z.record(z.string(), z.unknown()))`)
  per the established Phase 2a-2c precedent for deeply nested bodies, don't attempt to
  fully type them out unless they turn out to be simple when read directly.
- **Disclose malformed/ambiguous upstream spec fields with a one-line code comment**
  inline as you write each tool.
- File-per-sub-resource (see breakdown below), add each new tool array to `ALL_TOOLS`
  in `src/index.ts`, update `tests/server.test.ts`'s per-module `toHaveLength()`, the
  total, and the `expectedTools` manifest array (keep it accurate).
- TDD throughout.

## File / tool breakdown (41 tools across 4 files)

### `src/tools/social_planner_queues.ts` (new) — 18 operations

Category queue creation/configuration, queue items, edit sessions, calendar views,
and slots:

- `ghl_create_social_queue` (`POST /social-media-posting/category/queues`, required:
  `locationId`, `categoryId`, `timeSlots`, `userId`)
- `ghl_get_social_queue_categories` (`GET .../category/queues/available-categories`)
- `ghl_list_social_queues` (`POST .../category/queues/list`, required: `locationId`)
- `ghl_get_social_queue_calendar` (`POST .../category/queues/list/calendar`, required:
  `locationId`, `startDate`, `endDate`)
- `ghl_delete_social_queue_active_post` (`DELETE
  .../category/queues/{postId}/active-post`)
- `ghl_get_social_queue` (`GET .../category/queues/{queueId}`)
- `ghl_update_social_queue` (`PUT .../category/queues/{queueId}`, required:
  `locationId`)
- `ghl_create_social_queue_item` (`POST .../category/queues/{queueId}/create/item`,
  required: `locationId`)
- `ghl_get_social_queue_edit_calendar` (`POST
  .../category/queues/{queueId}/edit/calendar`, required: `locationId`, `sessionId`,
  `startDate`, `endDate`)
- `ghl_discard_social_queue_edit` (`POST .../category/queues/{queueId}/edit/discard`)
- `ghl_save_social_queue_edit` (`POST .../category/queues/{queueId}/edit/save`)
- `ghl_start_social_queue_edit` (`POST .../category/queues/{queueId}/edit/start`)
- `ghl_get_social_queue_items` (`POST .../category/queues/{queueId}/items`, required:
  `locationId`)
- `ghl_delete_social_queue_item` (`DELETE
  .../category/queues/{queueId}/items/{itemId}`)
- `ghl_update_social_queue_item` (`PUT .../category/queues/{queueId}/items/{itemId}`,
  required: `locationId`)
- `ghl_clone_social_queue_item` (`POST
  .../category/queues/{queueId}/items/{itemId}/clone`)
- `ghl_reset_social_queue_item` (`PUT
  .../category/queues/{queueId}/items/{itemId}/reset`)
- `ghl_get_social_queue_slots` (`POST .../category/queues/{queueId}/slots`, required:
  `locationId`)

### `src/tools/social_planner_comments.ts` (new) — 4 operations

- `ghl_create_social_comment` (`POST /social-media-posting/comments/{platform}`,
  required: `parentId`, `isParentThread`, `content`, plus required query
  `locationId`)
- `ghl_list_social_comments` (`POST .../comments/{platform}/list`, required:
  `originIds`, plus required query `locationId`)
- `ghl_like_social_comment` (`POST .../comments/{platform}/{id}/like`, required query
  `locationId`)
- `ghl_unlike_social_comment` (`DELETE .../comments/{platform}/{id}/like`, required
  query `locationId`)

### `src/tools/social_planner_accounts.ts` (new) — 9 operations

OAuth account connection flow, account/category/tag management:

- `ghl_start_social_oauth` (`GET /social-media-posting/oauth/{platform}/start`,
  required query: `locationId`, `userId`; optional: `page`, `reconnect` — step 1 of 3)
- `ghl_get_social_oauth_accounts` (`GET
  /social-media-posting/oauth/{locationId}/{platform}/accounts/{accountId}` — step 2
  of 3)
- `ghl_connect_social_oauth_account` (`POST
  /social-media-posting/oauth/{locationId}/{platform}/accounts/{accountId}` — step 3
  of 3)
- `ghl_delete_social_account` (`DELETE
  /social-media-posting/{locationId}/accounts/{id}`)
- `ghl_set_social_accounts` (`POST /social-media-posting/{locationId}/set-accounts`,
  required: `accountIds`, `filePath`, `rowsCount`, `fileName`, `userId` — note the
  required `filePath`/`fileName`/`rowsCount` fields suggest this endpoint associates
  accounts with an already-uploaded CSV job rather than being a general account
  linker; verify against the real schema/description and reflect that in the tool's
  description so callers aren't confused about when to use it vs. the OAuth connect
  flow)
- `ghl_get_social_categories` (`GET /social-media-posting/{locationId}/categories`)
- `ghl_get_social_category` (`GET
  /social-media-posting/{locationId}/categories/{id}`)
- `ghl_get_social_tags` (`GET /social-media-posting/{locationId}/tags`)
- `ghl_get_social_tags_by_ids` (`POST
  /social-media-posting/{locationId}/tags/details`, required: `tagIds`)

### `src/tools/social_planner_posts.ts` (new) — 10 operations

CSV bulk-import posting, remaining post operations, statistics:

- `ghl_upload_social_csv` (`POST /social-media-posting/{locationId}/csv`, multipart —
  see the Client capability gap section above; required: `csvContent`, `filename`)
- `ghl_get_social_csv_upload_status` (`GET /social-media-posting/{locationId}/csv`)
- `ghl_get_social_csv_post` (`GET /social-media-posting/{locationId}/csv/{id}`)
- `ghl_finalize_social_csv` (`PATCH /social-media-posting/{locationId}/csv/{id}`)
- `ghl_delete_social_csv` (`DELETE /social-media-posting/{locationId}/csv/{id}`)
- `ghl_delete_social_csv_post` (`DELETE
  /social-media-posting/{locationId}/csv/{csvId}/post/{postId}`)
- `ghl_bulk_delete_social_posts` (`POST
  /social-media-posting/{locationId}/posts/bulk-delete`, body: `postIds`)
- `ghl_get_social_post` (`GET /social-media-posting/{locationId}/posts/{id}`)
- `ghl_update_social_post` (`PUT /social-media-posting/{locationId}/posts/{id}`,
  required: `type`, `accountIds`, `userId`)
- `ghl_get_social_statistics` (`POST /social-media-posting/statistics`, required
  query: `locationId`)

## Testing

Every new file gets a corresponding `tests/tools/<module>.test.ts` written test-first,
following the established pattern: `getTool` helper, `mockFetchSuccess`/
`mockFetchError`, `parseLastFetchCall`, assert `method`/`pathname`/`params`/`body`/
`headers.Version` per tool, plus an error-path test per tool.
`tests/tools/social_planner_posts.test.ts` additionally needs a
`ghlRequestMultipart`-specific test for `ghl_upload_social_csv` asserting the request
body is a `FormData` instance containing the expected `file` entry, and that
`Content-Type` is NOT manually set to `application/json` (left for `fetch` to set).
Add a unit test for the new `ghlRequestMultipart` function itself in
`tests/client.test.ts` (or create it if it doesn't exist — check first) mirroring
whatever test coverage `ghlRequest` already has.

## Rollout

- No new environment variables.
- Update `CHANGELOG.md` with a "Phase 2e — Social Planner" entry, noting the 4
  operations already covered by Phase 1's `social.ts` and the new
  `ghlRequestMultipart` client capability added for CSV upload.
- `README.md`: bump tool count, add category-table rows for the 4 new modules. No new
  "not yet covered" exclusions this phase (all 45 operations are reachable; 4 already
  built, 41 new).
- No `package.json` version bump, no tag, no publish — requires explicit human
  approval.
