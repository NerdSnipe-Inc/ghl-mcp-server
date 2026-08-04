# GHL API v3 Migration — Phase 2d: Platform/Org Resource Coverage

**Status:** Approved for planning
**Scope:** Add tool coverage for the Platform/Org domain group: `businesses`,
`associations`, and a subset of `objects`. `companies`, `snapshots`, and `oauth` are
explicitly excluded (see Non-goals). Fourth of five Phase 2 sub-phases (2a Commerce
done → 2b Marketing/Content done → 2c AI/Communication done → **2d Platform/Org** →
2e ad-publishing).

## Background

Same pattern as prior sub-phases: these resources have zero tool coverage today. Unlike
2a-2c, this domain group's raw spec sweep (32 operations across 6 spec files) revealed
that a large minority genuinely cannot be served by this server's location-scoped PIT
token — verified per-operation via each spec's declared `security` scheme, not assumed.

## Non-goals

- **`companies-v3.json` (1 operation) is out of scope.** `GET /companies/{companyId}`
  is `security: [{'Agency-Access': [...]}]` — the schema's own `securitySchemes`
  description confirms `Agency-Access` requires "the Access Token generated with user
  type as Agency (OR) Private Integration Token of Agency," distinct from the
  `Location-Access`/`bearer` schemes this server's location PIT token satisfies.
- **`snapshots-v3.json` (4 operations) is out of scope.** All four operations are
  `Agency-Access` and require a `companyId` query param — snapshots are an
  agency-level concept (sharing account templates across locations) with no
  location-scoped access path at all.
- **`oauth-v3.json` (3 operations) is out of scope.** `POST /oauth/token` requires a
  Marketplace app's `clientId`/`clientSecret` plus an already-obtained authorization
  code or refresh token — a different credential model than this server's PIT token
  entirely (it's the OAuth exchange flow itself, not a resource this server calls
  post-auth). `POST /oauth/location-token` and `GET /oauth/installed-locations` are
  `Agency-Access-Only`.
  All three exclusions follow the same reasoning already established for `saas.ts`
  (Phase 2a) and `marketplace.ts` (Phase 2b): building tools that would silently 403
  for this server's documented location-PIT-token user base is worse than not building
  them. Document in README's existing "Not yet covered" section alongside
  `saas`/`marketplace`.
- **`objects-v3.json`'s `POST /objects/` (Create Custom Object schema) is out of
  scope** — it alone among `objects`' 9 operations is `Agency-Access`; the other 8 are
  `bearer`/`Location-Access` and fully buildable.
- No changes to Phase 1 / Phase 1 follow-ups / Phase 2a / Phase 2b / Phase 2c modules.
- No new resources outside `businesses`, `associations`, `objects` (partial).

## Design conventions (unchanged from prior sub-phases)

- `ghl_<verb>_<noun>` naming, Zod `inputSchema`, `handler(args, config)` pattern, every
  `ghlRequest` call uses `version: GHL_VERSION_V3`.
- **Read the real schema before writing each tool.**
- `config.locationId` threading varies per-endpoint — verify per-operation. Note:
  `objects`' three record-level endpoints (`GET`/`PUT`/`DELETE
  /objects/{schemaKey}/records/{id}`) declare `security: [{'bearer': []}]` (empty
  scope) and only `PUT` has a `locationId` query param — `GET` and `DELETE` have none
  at all. Verify this holds against the live schema and disclose the inconsistency
  inline with a one-line comment; don't force-inject a `locationId` param where the
  spec doesn't ask for one.
- `CreateCustomObjectRecordDto` and `UpdateCustomObjectRecordDto` are genuinely empty
  schemas in the spec (`{"type": "object", "properties": {}}`, no example) — custom
  object records carry dynamic fields defined by each object's own schema. Model the
  record body permissively as `z.record(z.string(), z.unknown())` with a one-line
  comment noting the spec provides no fixed shape for this reason.
- **Disclose malformed/ambiguous upstream spec fields with a one-line code comment**
  inline as you write the tool — established discipline, keep doing it consistently.
- File-per-resource, add each new tool array to `ALL_TOOLS` in `src/index.ts`, update
  `tests/server.test.ts`'s per-module `toHaveLength()`, the total, and the
  `expectedTools` manifest array (keep it accurate — recurring drift source every
  phase).
- TDD throughout.

## File / tool breakdown

### `src/tools/businesses.ts` (new) — 5 operations, all `bearer`/location-scoped

- `ghl_get_businesses` — `GET /businesses/` (required query: `locationId`)
- `ghl_get_business` — `GET /businesses/{businessId}`
- `ghl_create_business` — `POST /businesses/` (required: `name`, `locationId`)
- `ghl_update_business` — `PUT /businesses/{businessId}` (no required fields beyond
  `businessId` path — verify against schema, all body fields appear optional)
- `ghl_delete_business` — `DELETE /businesses/{businessId}`

### `src/tools/associations.ts` (new) — 10 operations, all `bearer`/location-scoped

- Relations: `ghl_create_association_relation` (`POST /associations/relations`,
  required: `locationId`, `associationId`, `firstRecordId`, `secondRecordId`),
  `ghl_get_association_relations` (`GET /associations/relations/{recordId}`, required
  query: `locationId`, `skip`, `limit`), `ghl_delete_association_relation`
  (`DELETE /associations/relations/{relationId}`, required query: `locationId`) (3 ops)
- Associations: `ghl_get_association_by_key` (`GET /associations/key/{key_name}`,
  required query: `locationId`), `ghl_get_association_by_object_key`
  (`GET /associations/objectKey/{objectKey}` — note path/query params are optional per
  spec, verify), `ghl_create_association` (`POST /associations/`, required:
  `locationId`, `key`, `firstObjectLabel`, `firstObjectKey`, `secondObjectLabel`,
  `secondObjectKey`), `ghl_get_association` (`GET /associations/{associationId}`),
  `ghl_update_association` (`PUT /associations/{associationId}`, required:
  `firstObjectLabel`, `secondObjectLabel`), `ghl_delete_association`
  (`DELETE /associations/{associationId}`), `ghl_list_associations`
  (`GET /associations/`, required query: `locationId`, `skip`, `limit`) (7 ops)

### `src/tools/objects.ts` (new) — 8 operations (excludes `POST /objects/`)

- Schema: `ghl_get_object_schema` (`GET /objects/{key}`, required query:
  `locationId`), `ghl_update_object_schema` (`PUT /objects/{key}`, required:
  `locationId`, `searchableProperties`), `ghl_get_objects` (`GET /objects/`, required
  query: `locationId` — lists all objects, standard + custom, for the location) (3 ops)
- Records: `ghl_get_object_record` (`GET /objects/{schemaKey}/records/{id}` — no
  `locationId` param per spec, disclose), `ghl_update_object_record`
  (`PUT /objects/{schemaKey}/records/{id}`, required query: `locationId`),
  `ghl_delete_object_record` (`DELETE /objects/{schemaKey}/records/{id}` — no
  `locationId` param per spec, disclose), `ghl_create_object_record`
  (`POST /objects/{schemaKey}/records`), `ghl_search_object_records`
  (`POST /objects/{schemaKey}/records/search`, required: `locationId`, `page`,
  `pageLimit`, `query`, `searchAfter`) (5 ops)

`ghl_create_object_record`/`ghl_update_object_record` bodies: `z.record(z.string(),
z.unknown())` per the Design Conventions note above.

## Testing

Every new file gets a corresponding `tests/tools/<module>.test.ts` written test-first,
following the established pattern: `getTool` helper, `mockFetchSuccess`/
`mockFetchError`, `parseLastFetchCall`, assert `method`/`pathname`/`params`/`body`/
`headers.Version` per tool, plus an error-path test per tool.

## Rollout

- No new environment variables.
- Update `CHANGELOG.md` with a "Phase 2d — Platform/Org" entry.
- `README.md`: bump tool count, add category-table rows, add `companies.ts`,
  `snapshots.ts`, `oauth.ts` to the existing "Not yet covered" callout alongside
  `saas`/`marketplace`, each with a one-line reason (agency-only credential
  requirement).
- No `package.json` version bump, no tag, no publish — requires explicit human
  approval.
