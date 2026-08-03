# GHL API v3 Migration — Phase 2b: Marketing/Content Resource Coverage

**Status:** Approved for planning
**Scope:** Add tool coverage for the Marketing/Content domain group: `blogs`,
`courses`, `proposals`, `brand-boards`, `custom-menus`. `marketplace` is explicitly
excluded (see Non-goals). Second of five Phase 2 sub-phases (2a Commerce done →
**2b Marketing/Content** → 2c AI/Communication → 2d Platform/Org → 2e ad-publishing).

## Background

Same pattern as Phase 2a: these five resources have zero tool coverage today. 28
operations total across 5 spec files, mapping to roughly 25-28 tools (courses' single
bulk-import operation may stay one tool; other resources map close to 1:1).

## Non-goals

- **`marketplace-v3.json` is out of scope**, same reasoning as `saas.ts` in Phase 2a:
  its 9 operations (app uninstall, installer details, wallet charges, rebilling config,
  external-auth migration) are scoped to a GHL Marketplace app's own developer
  credentials, not a sub-account location PIT token. Building these tools would silently
  fail for this server's actual user base. Document the exclusion in README/CHANGELOG
  the same way `saas.ts` was documented.
- No changes to Phase 1 / Phase 1 follow-ups / Phase 2a modules.
- No new resources outside the five named above.

## Design conventions (unchanged from Phase 2a)

- `ghl_<verb>_<noun>` naming, Zod `inputSchema`, `handler(args, config)` pattern, every
  `ghlRequest` call uses `version: GHL_VERSION_V3`.
- **Read the real schema before writing each tool** — the operation lists below are
  from a path/method sweep only.
- Threading `config.locationId` varies per-endpoint (path segment, query param, or body
  field) — verify per-operation, don't assume consistency across or within resources
  (Phase 2a's `products.ts` had 3 different conventions across its own 27 operations).
- **Disclose malformed/ambiguous upstream spec fields with a one-line code comment**
  when you have to override a spec-declared type or infer an underspecified shape —
  Phase 2a's final review had to add these after the fact; do it inline this time.
- File-per-resource matching existing convention, add each new tool array to
  `ALL_TOOLS` in `src/index.ts`, update `tests/server.test.ts`'s per-module
  `toHaveLength()`, the total, and the `expectedTools` manifest array (keep it accurate
  — Phase 2a Task 5 found and fixed a drift in this list; don't reintroduce it).
- TDD throughout.

## File / tool breakdown

### `src/tools/blogs.ts` (new) — 7 operations

- `ghl_get_blog_authors` — `GET /blogs/authors`
- `ghl_get_blog_categories` — `GET /blogs/categories`
- `ghl_get_blogs` — `GET /blogs/site/all` (blogs for the location)
- `ghl_get_blog_posts` — `GET /blogs/posts/all`
- `ghl_check_blog_url_slug` — `GET /blogs/posts/url-slug-exists`
- `ghl_create_blog_post` — `POST /blogs/posts` (required: `title`, `locationId`,
  `blogId`, `imageUrl`, `description`, `rawHTML`, `status`, `imageAltText`,
  `categories`, `author`, `urlSlug`, `publishedAt` — a large required set, verify all of
  it against the real schema, don't trim it down without confirming which fields are
  genuinely optional)
- `ghl_update_blog_post` — `PUT /blogs/posts/{postId}`

### `src/tools/courses.ts` (new) — 1 operation

- `ghl_import_courses` — `POST /courses/courses-exporter/public/import`. Required:
  `locationId`, `products` (array of `ProductInterface` — a nested course/lesson/product
  bundle structure). Model `products` permissively (`z.array(z.record(z.unknown()))`)
  matching how Phase 2a handled deeply nested, complex bodies — don't try to fully type
  out `ProductInterface` unless it turns out to be simple when you read it.

### `src/tools/proposals.ts` (new) — 4 operations

- `ghl_get_proposal_documents` — `GET /proposals/document`
- `ghl_send_proposal_document` — `POST /proposals/document/send`
- `ghl_get_proposal_templates` — `GET /proposals/templates`
- `ghl_send_proposal_template` — `POST /proposals/templates/send`

### `src/tools/brand_boards.ts` (new) — 11 operations, two sub-resources

- Brand boards: `ghl_create_brand_board` (`POST /brand-boards/`),
  `ghl_get_brand_boards` (`GET /brand-boards/{locationId}`), `ghl_get_brand_board`
  (`GET /brand-boards/{locationId}/{id}`), `ghl_update_brand_board`
  (`PATCH /brand-boards/{locationId}/{id}`), `ghl_delete_brand_board`
  (`DELETE /brand-boards/{locationId}/{id}`) (5 ops)
- Brand voices: `ghl_get_brand_voices`, `ghl_create_brand_voice`, `ghl_get_brand_voice`,
  `ghl_update_brand_voice`, `ghl_delete_brand_voice`, `ghl_set_default_brand_voice` (6
  ops, all under `/brand-boards/locations/{locationId}/brand-voices...`)

Implementer's call whether brand-board and brand-voice tools live in one file
(`brand_boards.ts`, 11 tools) or split into two (`brand_boards.ts` + `brand_voices.ts`)
— they're related but structurally distinct sub-resources with different path prefixes
(`/brand-boards/{locationId}/...` vs `/brand-boards/locations/{locationId}/brand-voices...`).
Follow whichever reads cleaner, document the decision in the task report, matching how
Phase 2a's Task 5/6 split (or didn't split) `store.ts`.

### `src/tools/custom_menus.ts` (new) — 5 operations

- `ghl_get_custom_menus` — `GET /custom-menus/`
- `ghl_get_custom_menu` — `GET /custom-menus/{customMenuId}`
- `ghl_create_custom_menu` — `POST /custom-menus/`
- `ghl_update_custom_menu` — `PUT /custom-menus/{customMenuId}`
- `ghl_delete_custom_menu` — `DELETE /custom-menus/{customMenuId}`

## Testing

Every new file gets a corresponding `tests/tools/<module>.test.ts` written test-first,
following the established pattern: `getTool` helper, `mockFetchSuccess`/
`mockFetchError`, `parseLastFetchCall`, assert `method`/`pathname`/`params`/`body`/
`headers.Version` per tool, plus an error-path test per tool.

## Rollout

- No new environment variables.
- Update `CHANGELOG.md` with a "Phase 2b — Marketing/Content" entry.
- `README.md`: bump tool count, add category-table rows, note `marketplace.ts` was
  intentionally skipped and why (mirroring the `saas.ts` note from Phase 2a).
- No `package.json` version bump, no tag, no publish — requires explicit human approval.
