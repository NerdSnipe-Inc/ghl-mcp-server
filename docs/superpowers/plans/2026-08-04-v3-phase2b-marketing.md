# GHL API v3 Phase 2b: Marketing/Content Resource Coverage — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add ~28 new tools covering GHL API v3's Marketing/Content resources (`blogs`,
`courses`, `proposals`, `brand-boards`, `custom-menus`).

**Architecture:** Five new tool modules, each following the exact pattern established in
Phase 1/1.5/2a (`ghl_<verb>_<noun>` naming, Zod `inputSchema`, `handler(args, config)` →
`ghlRequest(...)` → `JSON.stringify` or `formatError`). Every call uses
`version: GHL_VERSION_V3`. Read the real request/response schema from the v3 spec file
before writing each tool.

**Tech Stack:** TypeScript, Zod, Vitest, Node.js (existing stack — no new dependencies).

## Global Constraints

- Spec: `docs/superpowers/specs/2026-08-04-v3-phase2b-marketing-design.md` — read it
  before starting. **`marketplace-v3.json` is explicitly out of scope** — do not build
  `marketplace.ts` in this plan.
- v3 OpenAPI specs: `/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/<resource>-v3.json`.
- Tool naming: `ghl_` prefix, snake_case.
- Every `ghlRequest` call: `version: GHL_VERSION_V3` (imported from `../client.js`).
- **Disclose malformed/ambiguous upstream spec fields with a one-line code comment**
  whenever you override a spec-declared type or infer an underspecified shape — do this
  inline as you write the tool, not as an afterthought (Phase 2a's final review had to
  retrofit these).
- TDD throughout: write the test first against the real schema, confirm RED, implement,
  confirm GREEN.
- Each task registers its new tool array into `ALL_TOOLS` in `src/index.ts` and adds a
  `toHaveLength()` assertion plus `expectedTools` manifest entries (with correct running
  total) in `tests/server.test.ts`. Keep `expectedTools` accurate every task — Phase 2a
  Task 5 found and fixed a drift here; don't reintroduce it.
- README/CHANGELOG updates are consolidated into the final task.
- Do not bump `package.json`'s version, tag, or publish.

---

## Task 1: `blogs.ts` (7 tools)

**Files:**
- Create: `src/tools/blogs.ts`
- Create: `tests/tools/blogs.test.ts`
- Modify: `src/index.ts`, `tests/server.test.ts`
- Reference: `/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/blogs-v3.json`

**Interfaces:**
- Consumes: `ghlRequest`, `formatError`, `GHLConfig`, `GHL_VERSION_V3` from `../client.js`.
- Produces: `export const blogTools = [...]` (7 tools).

| Tool | Method | Path |
|---|---|---|
| `ghl_get_blog_authors` | GET | `/blogs/authors` |
| `ghl_get_blog_categories` | GET | `/blogs/categories` |
| `ghl_get_blogs` | GET | `/blogs/site/all` |
| `ghl_get_blog_posts` | GET | `/blogs/posts/all` |
| `ghl_check_blog_url_slug` | GET | `/blogs/posts/url-slug-exists` |
| `ghl_create_blog_post` | POST | `/blogs/posts` |
| `ghl_update_blog_post` | PUT | `/blogs/posts/{postId}` |

- [ ] **Step 1: Read the real schemas**

```bash
python3 -c "
import json
f = json.load(open('/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/blogs-v3.json'))
schemas = f['components']['schemas']
for path, method in [('/blogs/authors','get'), ('/blogs/categories','get'), ('/blogs/site/all','get'), ('/blogs/posts/all','get'), ('/blogs/posts/url-slug-exists','get'), ('/blogs/posts','post'), ('/blogs/posts/{postId}','put')]:
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

Note: `POST /blogs/posts`'s real schema (from design research) requires `title`,
`locationId`, `blogId`, `imageUrl`, `description`, `rawHTML`, `status`, `imageAltText`,
`categories`, `author`, `urlSlug`, `publishedAt` — a large required set. Verify this
directly and implement all of it; don't trim fields you assume are optional without
confirming.

- [ ] **Step 2: Write the failing tests first**

Create `tests/tools/blogs.test.ts` following `tests/tools/products.test.ts`'s structure
(from Phase 2a — read it for the concrete reference): `getTool` helper, one `describe`
per tool with success-path assertions on `method`/`pathname`/`headers.Version`/relevant
`params`/`body` fields, plus an error-path test per tool.

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run tests/tools/blogs.test.ts`
Expected: FAIL — `src/tools/blogs.ts` doesn't exist yet.

- [ ] **Step 4: Implement**

Create `src/tools/blogs.ts` with all 7 tools, each matched to its own real schema from
Step 1. `locationId` threading varies — some blog endpoints take it as a query param
(e.g. `/blogs/site/all`), the create-post body requires it explicitly — verify each.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run tests/tools/blogs.test.ts`
Expected: PASS.

- [ ] **Step 6: Register the tool array**

`src/index.ts`: add `import { blogTools } from "./tools/blogs.js";` and `...blogTools,`
to `ALL_TOOLS`.

`tests/server.test.ts`: add the import, `it('blogs has 7 tools', () =>
expect(blogTools).toHaveLength(7));`, bump the total `ALL_TOOLS` length assertion, and
add all 7 tool names to the `expectedTools` array with its `toHaveLength()` bumped to
match.

- [ ] **Step 7: Run the registration tests**

Run: `npx vitest run tests/server.test.ts`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/tools/blogs.ts tests/tools/blogs.test.ts src/index.ts tests/server.test.ts
git commit -m "feat(blogs): add blog and blog-post tools"
```

---

## Task 2: `courses.ts` (1 tool)

**Files:**
- Create: `src/tools/courses.ts`
- Create: `tests/tools/courses.test.ts`
- Modify: `src/index.ts`, `tests/server.test.ts`
- Reference: `/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/courses-v3.json`

**Interfaces:**
- Produces: `export const courseTools = [...]` (1 tool: `ghl_import_courses`).

`POST /courses/courses-exporter/public/import` — required: `locationId`, `products`
(array of `ProductInterface` — a nested course/lesson/product bundle structure).

- [ ] **Step 1: Read the real schema**

```bash
python3 -c "
import json
f = json.load(open('/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/courses-v3.json'))
schemas = f['components']['schemas']
op = f['paths']['/courses/courses-exporter/public/import']['post']
ref = op['requestBody']['content']['application/json']['schema'].get('\$ref')
s = schemas[ref.split('/')[-1]] if ref else op['requestBody']['content']['application/json']['schema']
print('required:', s.get('required'))
print('props:', s.get('properties'))
# ProductInterface — check its complexity before deciding how to type it
pi = schemas.get('ProductInterface')
if pi:
    print('ProductInterface required:', pi.get('required'))
    print('ProductInterface props:', list(pi.get('properties', {}).keys()) if pi.get('properties') else pi)
"
```

If `ProductInterface` is deeply nested (likely, given it represents a full course with
modules/lessons), model `products` as `z.array(z.record(z.unknown()))` in the Zod schema
— matching Phase 2a's precedent for complex nested bodies (see `products.ts`'s
`variants`/`taxes`/`label` fields) — rather than fully typing out the nested structure.

- [ ] **Step 2-8:** Follow Task 1's exact TDD/implement/register/commit procedure for
  this single tool. Commit: `git commit -m "feat(courses): add course import tool"`.

---

## Task 3: `proposals.ts` (4 tools)

**Files:**
- Create: `src/tools/proposals.ts`
- Create: `tests/tools/proposals.test.ts`
- Modify: `src/index.ts`, `tests/server.test.ts`
- Reference: `/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/proposals-v3.json`

**Interfaces:**
- Produces: `export const proposalTools = [...]` (4 tools).

| Tool | Method | Path |
|---|---|---|
| `ghl_get_proposal_documents` | GET | `/proposals/document` |
| `ghl_send_proposal_document` | POST | `/proposals/document/send` |
| `ghl_get_proposal_templates` | GET | `/proposals/templates` |
| `ghl_send_proposal_template` | POST | `/proposals/templates/send` |

Design research already confirmed `POST /proposals/document/send`'s required fields:
`locationId`, `documentId`, `sentBy` (optional: `documentName`, `medium`,
`ccRecipients`, `notificationSettings`) — verify this and the `/proposals/templates/send`
equivalent directly during implementation.

Follow Task 1's exact procedure, scoped to these 4 tools. Commit:
`git commit -m "feat(proposals): add document and template tools"`.

---

## Task 4: `brand_boards.ts` (11 tools — brand boards + brand voices)

**Files:**
- Create: `src/tools/brand_boards.ts`
- Create: `tests/tools/brand_boards.test.ts`
- Modify: `src/index.ts`, `tests/server.test.ts`
- Reference: `/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/brand-boards-v3.json`

**Interfaces:**
- Produces: `export const brandBoardTools = [...]` (11 tools, both sub-resources — brand
  boards and brand voices — in one export; if it reads cleaner to split into two arrays
  in the same file, e.g. `brandBoardTools` + `brandVoiceTools`, that's fine too, just
  make sure both get spread into `ALL_TOOLS` and both get their own `toHaveLength()`
  assertion. Your call — document which you chose in the task report.).

| Tool | Method | Path |
|---|---|---|
| `ghl_create_brand_board` | POST | `/brand-boards/` |
| `ghl_get_brand_boards` | GET | `/brand-boards/{locationId}` |
| `ghl_get_brand_board` | GET | `/brand-boards/{locationId}/{id}` |
| `ghl_update_brand_board` | PATCH | `/brand-boards/{locationId}/{id}` |
| `ghl_delete_brand_board` | DELETE | `/brand-boards/{locationId}/{id}` |
| `ghl_get_brand_voices` | GET | `/brand-boards/locations/{locationId}/brand-voices` |
| `ghl_create_brand_voice` | POST | `/brand-boards/locations/{locationId}/brand-voices` |
| `ghl_get_brand_voice` | GET | `/brand-boards/locations/{locationId}/brand-voices/{brandVoiceId}` |
| `ghl_update_brand_voice` | PATCH | `/brand-boards/locations/{locationId}/brand-voices/{brandVoiceId}` |
| `ghl_delete_brand_voice` | DELETE | `/brand-boards/locations/{locationId}/brand-voices/{brandVoiceId}` |
| `ghl_set_default_brand_voice` | POST | `/brand-boards/locations/{locationId}/brand-voices/{brandVoiceId}/default` |

Design research already confirmed: `POST /brand-boards/` requires `locationId`, `name`
(optional: `logos`, `colors`, `fonts`, `default`, `parentId`, `type`, `url`).
`POST .../brand-voices` requires only `type` (optional: `name`, `url`, `description`,
`answers`). Verify these and all remaining operations directly.

Note the two distinct path prefixes (`/brand-boards/{locationId}/...` for boards vs.
`/brand-boards/locations/{locationId}/brand-voices...` for voices) — don't conflate
them; `locationId` sits at a different position/depth in each.

Follow Task 1's exact procedure, scoped to these 11 tools. Commit:
`git commit -m "feat(brand-boards): add brand board and brand voice tools"`.

---

## Task 5: `custom_menus.ts` (5 tools)

**Files:**
- Create: `src/tools/custom_menus.ts`
- Create: `tests/tools/custom_menus.test.ts`
- Modify: `src/index.ts`, `tests/server.test.ts`
- Reference: `/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/custom-menus-v3.json`

**Interfaces:**
- Produces: `export const customMenuTools = [...]` (5 tools).

| Tool | Method | Path |
|---|---|---|
| `ghl_get_custom_menus` | GET | `/custom-menus/` |
| `ghl_get_custom_menu` | GET | `/custom-menus/{customMenuId}` |
| `ghl_create_custom_menu` | POST | `/custom-menus/` |
| `ghl_update_custom_menu` | PUT | `/custom-menus/{customMenuId}` |
| `ghl_delete_custom_menu` | DELETE | `/custom-menus/{customMenuId}` |

Design research already confirmed `POST /custom-menus/`'s required fields: `title`,
`url`, `icon`, `showOnCompany`, `showOnLocation`, `showToAllLocations`, `openMode`,
`locations`, `userRole` (optional: `allowCamera`, `allowMicrophone`). Verify this
directly and implement the full required set — don't trim it.

Follow Task 1's exact procedure, scoped to these 5 tools. Commit:
`git commit -m "feat(custom-menus): add custom menu link tools"`.

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
`tests/server.test.ts` rather than assuming a number (should be 178 + 28 = 206, but
confirm against the live assertion).

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: succeeds with no errors.

- [ ] **Step 4: Update README.md**

- Bump the tool count (intro line and "All N Tools" heading) to the actual final total.
- Add category-table rows for Blogs, Courses, Proposals, Brand Boards & Voices, Custom
  Menus.
- README already has a "Not yet covered" callout (added ahead of this plan) listing
  `saas` and `marketplace` as unbuilt, with a link to open a GitHub issue to request
  them. Confirm it's still accurate and up to date — no new note needed unless the
  callout's wording has drifted from this plan's actual scope.

- [ ] **Step 5: Update CHANGELOG.md**

Add a "Phase 2b — Marketing/Content" entry listing the 5 new modules, their tool
counts, the total new tool count, and the `marketplace.ts` exclusion.

- [ ] **Step 6: Commit**

```bash
git add README.md CHANGELOG.md
git commit -m "docs: update README and changelog for Phase 2b Marketing/Content tools"
```

**Do not bump `package.json`'s version or tag/publish.** Stop here and report completion.
