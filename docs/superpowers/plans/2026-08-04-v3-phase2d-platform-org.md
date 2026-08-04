# GHL API v3 Phase 2d: Platform/Org Resource Coverage — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 23 new tools covering GHL API v3's Platform/Org resources that this
server's location-scoped PIT token can actually reach: `businesses`, `associations`,
and 8 of `objects`' 9 operations.

**Architecture:** Three new tool modules, each following the exact pattern established
in Phase 1/1.5/2a/2b/2c (`ghl_<verb>_<noun>` naming, Zod `inputSchema`,
`handler(args, config)` → `ghlRequest(...)` → `JSON.stringify` or `formatError`). Every
call uses `version: GHL_VERSION_V3`. Read the real request/response schema from the v3
spec file before writing each tool.

**Tech Stack:** TypeScript, Zod, Vitest, Node.js (existing stack — no new dependencies).

## Global Constraints

- Spec: `docs/superpowers/specs/2026-08-04-v3-phase2d-platform-org-design.md` — read it
  before starting. `companies`, `snapshots`, and `oauth` are entirely out of scope
  (all-agency-credential resources) — do not build tools for them. `objects-v3.json`'s
  `POST /objects/` (Create Custom Object schema) is also out of scope — it alone among
  `objects`' operations is `Agency-Access`.
- v3 OpenAPI specs: `/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/<resource>-v3.json`.
- Tool naming: `ghl_` prefix, snake_case.
- Every `ghlRequest` call: `version: GHL_VERSION_V3` (imported from `../client.js`).
- **Disclose malformed/ambiguous upstream spec fields with a one-line code comment**
  as you write each tool, not as an afterthought.
- **Verify `locationId` presence/absence per endpoint — don't assume.**
  `objects`' three record-level endpoints (`GET`/`PUT`/`DELETE
  /objects/{schemaKey}/records/{id}`) are inconsistent: only `PUT` has a `locationId`
  query param, `GET`/`DELETE` have none. Confirm against the live schema and disclose
  inline; don't force-inject a param the real spec doesn't ask for.
- `CreateCustomObjectRecordDto`/`UpdateCustomObjectRecordDto` are empty schemas in the
  spec (no properties, no example) — model the record body as
  `z.record(z.string(), z.unknown())` with a one-line comment explaining why (dynamic
  per-object-schema fields, spec provides no fixed shape).
- **Do not trim "large" required-field lists** — always implement the full `required`
  array from the real schema.
- TDD throughout: write the test first against the real schema, confirm RED, implement,
  confirm GREEN.
- Each task registers its new tool array into `ALL_TOOLS` in `src/index.ts` and adds a
  `toHaveLength()` assertion plus `expectedTools` manifest entries (with correct running
  total) in `tests/server.test.ts`. Keep `expectedTools` accurate every task.
- README/CHANGELOG updates are consolidated into the final task.
- Do not bump `package.json`'s version, tag, or publish.

---

## Task 1: `businesses.ts` (5 tools)

**Files:**
- Create: `src/tools/businesses.ts`
- Create: `tests/tools/businesses.test.ts`
- Modify: `src/index.ts`, `tests/server.test.ts`
- Reference: `/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/businesses-v3.json`

**Interfaces:**
- Consumes: `ghlRequest`, `formatError`, `GHLConfig`, `GHL_VERSION_V3` from `../client.js`.
- Produces: `export const businessesTools = [...]` (5 tools).

| Tool | Method | Path |
|---|---|---|
| `ghl_get_businesses` | GET | `/businesses/` |
| `ghl_get_business` | GET | `/businesses/{businessId}` |
| `ghl_create_business` | POST | `/businesses/` |
| `ghl_update_business` | PUT | `/businesses/{businessId}` |
| `ghl_delete_business` | DELETE | `/businesses/{businessId}` |

- [ ] **Step 1: Read the real schemas**

```bash
python3 -c "
import json
f = json.load(open('/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/businesses-v3.json'))
schemas = f['components']['schemas']
for path, method in [('/businesses/','get'), ('/businesses/{businessId}','get'), ('/businesses/','post'), ('/businesses/{businessId}','put'), ('/businesses/{businessId}','delete')]:
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

Confirmed during design research: `GET /businesses/` requires `locationId` as a query
param (list businesses for a location). `POST /businesses/` (`CreateBusinessDto`)
requires `name`, `locationId`; optional: `phone`, `email`, `website`, `address`,
`city`, `postalCode`, `state`, `country`, `description`. `PUT
/businesses/{businessId}` (`UpdateBusinessDto`) has no required body fields — all of
`name`, `phone`, `email`, `postalCode`, `website`, `address`, `state`, `city`,
`country`, `description` are optional; verify this directly rather than assuming.
`GET`/`DELETE /businesses/{businessId}` take only the `businessId` path param.

- [ ] **Step 2: Write the failing tests first**

Create `tests/tools/businesses.test.ts` following `tests/tools/blogs.test.ts`'s
structure (Phase 2b — read it for the concrete reference): `getTool` helper, one
`describe` per tool with success-path assertions on `method`/`pathname`/
`headers.Version`/relevant `params`/`body` fields, plus an error-path test per tool.

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run tests/tools/businesses.test.ts`
Expected: FAIL — `src/tools/businesses.ts` doesn't exist yet.

- [ ] **Step 4: Implement**

Create `src/tools/businesses.ts` with all 5 tools, each matched to its own real schema
from Step 1.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run tests/tools/businesses.test.ts`
Expected: PASS.

- [ ] **Step 6: Register the tool array**

`src/index.ts`: add the import and `...businessesTools,` to `ALL_TOOLS`.

`tests/server.test.ts`: add the import, `it('businesses has 5 tools', ...)`, bump the
total `ALL_TOOLS` length assertion, and add all 5 tool names to the `expectedTools`
array with its `toHaveLength()` bumped to match.

- [ ] **Step 7: Run the registration tests**

Run: `npx vitest run tests/server.test.ts`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/tools/businesses.ts tests/tools/businesses.test.ts src/index.ts tests/server.test.ts
git commit -m "feat(businesses): add business CRUD tools"
```

---

## Task 2: `associations.ts` (10 tools)

**Files:**
- Create: `src/tools/associations.ts`
- Create: `tests/tools/associations.test.ts`
- Modify: `src/index.ts`, `tests/server.test.ts`
- Reference: `/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/associations-v3.json`

**Interfaces:**
- Consumes: `ghlRequest`, `formatError`, `GHLConfig`, `GHL_VERSION_V3` from `../client.js`.
- Produces: `export const associationsTools = [...]` (10 tools).

| Tool | Method | Path |
|---|---|---|
| `ghl_create_association_relation` | POST | `/associations/relations` |
| `ghl_get_association_relations` | GET | `/associations/relations/{recordId}` |
| `ghl_delete_association_relation` | DELETE | `/associations/relations/{relationId}` |
| `ghl_get_association_by_key` | GET | `/associations/key/{key_name}` |
| `ghl_get_association_by_object_key` | GET | `/associations/objectKey/{objectKey}` |
| `ghl_create_association` | POST | `/associations/` |
| `ghl_get_association` | GET | `/associations/{associationId}` |
| `ghl_update_association` | PUT | `/associations/{associationId}` |
| `ghl_delete_association` | DELETE | `/associations/{associationId}` |
| `ghl_list_associations` | GET | `/associations/` |

- [ ] **Step 1: Read the real schemas**

```bash
python3 -c "
import json
f = json.load(open('/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/associations-v3.json'))
schemas = f['components']['schemas']
paths = [
    ('/associations/relations','post'), ('/associations/relations/{recordId}','get'),
    ('/associations/relations/{relationId}','delete'), ('/associations/key/{key_name}','get'),
    ('/associations/objectKey/{objectKey}','get'), ('/associations/','post'),
    ('/associations/{associationId}','get'), ('/associations/{associationId}','put'),
    ('/associations/{associationId}','delete'), ('/associations/','get'),
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

Confirmed during design research:
- `POST /associations/relations` (`createRelationReqDto`) requires `locationId`,
  `associationId`, `firstRecordId`, `secondRecordId` — all in the body.
- `GET /associations/relations/{recordId}` requires query params `locationId`, `skip`,
  `limit`; `associationIds` is optional.
- `DELETE /associations/relations/{relationId}` requires query param `locationId`.
- `GET /associations/key/{key_name}` requires query param `locationId`.
- `GET /associations/objectKey/{objectKey}` — verify directly: per the raw sweep both
  the `objectKey` path param and `locationId` query param are marked
  `required=False`, which is unusual for a path segment (path params are normally
  always required) — disclose this spec quirk inline with a one-line comment, and
  still implement `objectKey` as a required tool input since a path segment cannot
  meaningfully be omitted at the HTTP layer even if the spec's `required` flag says
  otherwise.
- `POST /associations/` (`createAssociationReqDto`) requires `locationId`, `key`,
  `firstObjectLabel`, `firstObjectKey`, `secondObjectLabel`, `secondObjectKey`.
- `PUT /associations/{associationId}` (`UpdateAssociationReqDto`) requires
  `firstObjectLabel`, `secondObjectLabel` in the body, plus the `associationId` path
  param.
- `GET`/`DELETE /associations/{associationId}` take only the `associationId` path
  param.
- `GET /associations/` requires query params `locationId`, `skip`, `limit`.

- [ ] **Step 2: Write the failing tests first**

Create `tests/tools/associations.test.ts` following `tests/tools/blogs.test.ts`'s
structure: `getTool` helper, one `describe` per tool with success-path assertions on
`method`/`pathname`/`headers.Version`/relevant `params`/`body` fields, plus an
error-path test per tool.

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run tests/tools/associations.test.ts`
Expected: FAIL — `src/tools/associations.ts` doesn't exist yet.

- [ ] **Step 4: Implement**

Create `src/tools/associations.ts` with all 10 tools, each matched to its own real
schema from Step 1.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run tests/tools/associations.test.ts`
Expected: PASS.

- [ ] **Step 6: Register the tool array**

`src/index.ts`: add the import and `...associationsTools,` to `ALL_TOOLS`.

`tests/server.test.ts`: add the import, `it('associations has 10 tools', ...)`, bump
the total `ALL_TOOLS` length assertion, and add all 10 tool names to the
`expectedTools` array with its `toHaveLength()` bumped to match.

- [ ] **Step 7: Run the registration tests**

Run: `npx vitest run tests/server.test.ts`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/tools/associations.ts tests/tools/associations.test.ts src/index.ts tests/server.test.ts
git commit -m "feat(associations): add association and relation CRUD tools"
```

---

## Task 3: `objects.ts` (8 tools, excludes agency-only schema creation)

**Files:**
- Create: `src/tools/objects.ts`
- Create: `tests/tools/objects.test.ts`
- Modify: `src/index.ts`, `tests/server.test.ts`
- Reference: `/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/objects-v3.json`

**Interfaces:**
- Consumes: `ghlRequest`, `formatError`, `GHLConfig`, `GHL_VERSION_V3` from `../client.js`.
- Produces: `export const objectsTools = [...]` (8 tools).

| Tool | Method | Path |
|---|---|---|
| `ghl_get_object_schema` | GET | `/objects/{key}` |
| `ghl_update_object_schema` | PUT | `/objects/{key}` |
| `ghl_get_objects` | GET | `/objects/` |
| `ghl_get_object_record` | GET | `/objects/{schemaKey}/records/{id}` |
| `ghl_update_object_record` | PUT | `/objects/{schemaKey}/records/{id}` |
| `ghl_delete_object_record` | DELETE | `/objects/{schemaKey}/records/{id}` |
| `ghl_create_object_record` | POST | `/objects/{schemaKey}/records` |
| `ghl_search_object_records` | POST | `/objects/{schemaKey}/records/search` |

Do **not** build a tool for `POST /objects/` (Create Custom Object schema) — its
`security` scheme is `Agency-Access`, which this server's location PIT token cannot
satisfy. Confirm this against the live spec before skipping it (don't take the plan's
word for it).

- [ ] **Step 1: Read the real schemas**

```bash
python3 -c "
import json
f = json.load(open('/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/objects-v3.json'))
schemas = f['components']['schemas']
paths = [
    ('/objects/{key}','get'), ('/objects/{key}','put'), ('/objects/','get'),
    ('/objects/{schemaKey}/records/{id}','get'), ('/objects/{schemaKey}/records/{id}','put'),
    ('/objects/{schemaKey}/records/{id}','delete'), ('/objects/{schemaKey}/records','post'),
    ('/objects/{schemaKey}/records/search','post'), ('/objects/','post'),
]
for path, method in paths:
    op = f['paths'][path][method]
    print('===', method.upper(), path, '===', 'security:', op.get('security'))
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

Confirmed during design research:
- `GET /objects/{key}` requires query param `locationId`; `fetchProperties` optional.
- `PUT /objects/{key}` (`UpdateCustomObjectSchemaDTO`) requires `locationId`,
  `searchableProperties` in the body; `labels`, `description` optional.
- `GET /objects/` requires query param `locationId` (lists all objects, standard +
  custom, for the location).
- `GET /objects/{schemaKey}/records/{id}` — no `locationId` param anywhere (not
  query, not body) — verify and don't inject one; disclose this inline as it's
  inconsistent with the sibling `PUT` on the same path.
- `PUT /objects/{schemaKey}/records/{id}` (`UpdateCustomObjectRecordDto`) requires
  query param `locationId`; body is an empty schema — implement as
  `z.record(z.string(), z.unknown())` with a comment noting the spec defines no
  properties (dynamic per-object-schema fields).
- `DELETE /objects/{schemaKey}/records/{id}` — no `locationId` param anywhere, same
  as the `GET` above — disclose inline.
- `POST /objects/{schemaKey}/records` (`CreateCustomObjectRecordDto`) — same empty
  schema as the `PUT` above; implement identically as
  `z.record(z.string(), z.unknown())` with the same disclosure comment. Verify
  whether `locationId` is required here (the raw sweep showed no `locationId`
  parameter on this operation either — confirm directly).
- `POST /objects/{schemaKey}/records/search` (`SearchRecordsBody`) requires
  `locationId`, `page`, `pageLimit`, `query`, `searchAfter` in the body.
- `POST /objects/` — confirm `security` is `Agency-Access` (not `bearer`) and skip
  building a tool for it.

- [ ] **Step 2: Write the failing tests first**

Create `tests/tools/objects.test.ts` following `tests/tools/blogs.test.ts`'s
structure: `getTool` helper, one `describe` per tool with success-path assertions on
`method`/`pathname`/`headers.Version`/relevant `params`/`body` fields, plus an
error-path test per tool.

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run tests/tools/objects.test.ts`
Expected: FAIL — `src/tools/objects.ts` doesn't exist yet.

- [ ] **Step 4: Implement**

Create `src/tools/objects.ts` with all 8 tools, each matched to its own real schema
from Step 1.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run tests/tools/objects.test.ts`
Expected: PASS.

- [ ] **Step 6: Register the tool array**

`src/index.ts`: add the import and `...objectsTools,` to `ALL_TOOLS`.

`tests/server.test.ts`: add the import, `it('objects has 8 tools', ...)`, bump the
total `ALL_TOOLS` length assertion, and add all 8 tool names to the `expectedTools`
array with its `toHaveLength()` bumped to match.

- [ ] **Step 7: Run the registration tests**

Run: `npx vitest run tests/server.test.ts`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/tools/objects.ts tests/tools/objects.test.ts src/index.ts tests/server.test.ts
git commit -m "feat(objects): add custom object schema and record tools"
```

---

## Task 4: Final verification, README, and CHANGELOG

**Files:**
- Modify: `README.md`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Full-repo typecheck**

Run: `npm run typecheck`
Expected: PASS with zero errors.

- [ ] **Step 2: Full test suite**

Run: `npm test` (or `npx vitest run`)
Expected: PASS, all suites green. Verify the actual final tool count from
`tests/server.test.ts` rather than assuming a number (should be 245 + 23 = 268, but
confirm against the live assertion).

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: succeeds with no errors.

- [ ] **Step 4: Update README.md**

- Bump the tool count (intro line and "All N Tools" heading) to the actual final
  total.
- Add category-table rows for Businesses, Associations, Objects.
- Add per-module "Full Reference" subsections (`### Businesses`, `### Associations`,
  `### Objects`) listing every tool name and description, matching the pattern used
  for every prior phase's modules (this was accidentally skipped once in Phase 2c and
  had to be fixed in a review round — don't repeat that).
- Extend the existing "Not yet covered" callout: add `companies.ts`, `snapshots.ts`,
  and `oauth.ts` alongside the existing `saas`/`marketplace` entries, each with a
  one-line reason (agency-only credential requirement — this server authenticates via
  a location-scoped PIT token and has no agency-level identity).

- [ ] **Step 5: Update CHANGELOG.md**

Add a "Phase 2d — Platform/Org" entry listing the 3 new modules, their tool counts,
the total new tool count, and a note that `companies`, `snapshots`, and `oauth` were
intentionally excluded (agency-only credentials) along with `objects`' single
excluded `POST /objects/` operation.

- [ ] **Step 6: Commit**

```bash
git add README.md CHANGELOG.md
git commit -m "docs: update README and changelog for Phase 2d Platform/Org tools"
```

**Do not bump `package.json`'s version or tag/publish.** Stop here and report completion.
