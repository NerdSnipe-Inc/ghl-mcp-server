# GHL API v3 Migration — Phase 2a: Commerce Resource Coverage

**Status:** Approved for planning
**Scope:** Add tool coverage for the Commerce domain group of currently-uncovered v3
resources: `products`, `store`, `affiliate-manager`, `email-isv`. `saas` is explicitly
excluded (see Non-goals). This is the first of five planned Phase 2 sub-phases
(2a Commerce → 2b Marketing/Content → 2c AI/Communication → 2d Platform/Org →
2e ad-publishing), each spec'd and executed independently.

## Background

Phase 1 (merged) migrated the server's 20 pre-existing tool modules to GHL API v3.
Phase 1 follow-ups (merged) closed every item Phase 1 deferred. Neither touched the ~26
v3 resources this server has never had any tools for. Phase 2 adds that coverage,
grouped by business domain to keep each sub-phase reviewable.

This spec covers Commerce: `products-v3.json` (27 operations), `store-v3.json` (18
operations), `affiliate-manager-v3.json` (4 operations), `email-isv-v3.json` (1
operation) — 50 operations total, mapping to roughly 46-50 tools (some operations
naturally combine, e.g. bulk-update variants may become optional args on one tool rather
than separate tools — implementer's judgment per module, following existing precedent
like `payments.ts`'s handling of multiple related sub-resources in one file).

## Non-goals

- **`saas-v3.json` is explicitly out of scope for this and all Phase 2 sub-phases**,
  pending a separate decision. Its 25 operations are agency/reseller-level (enabling/
  disabling SaaS mode across locations, agency billing plans, rebilling, wallet
  balances) — all keyed by an agency `companyId`, and most require the calling token to
  hold agency-level permissions, not sub-account (location) permissions. This server
  authenticates via a single location-scoped PIT token (`GHL_PIT_TOKEN` +
  `GHL_LOCATION`); it has no agency-level identity or credential. Building `saas.ts`
  tools that would silently fail (403) for the overwhelming majority of this server's
  users — anyone using a sub-account PIT token, which is the documented, expected
  credential type per `README.md` — is worse than not building them. If agency-level
  support is wanted later, it needs its own design decision about how the server would
  authenticate as an agency (a second credential? a separate deployment mode?), not a
  silent addition here.
- No changes to any Phase 1 / Phase 1 follow-ups modules.
- No new resources outside the four named above — Marketing/Content, AI/Communication,
  Platform/Org, and ad-publishing are separate future sub-phases, each to be spec'd on
  its own before implementation starts.

## Design conventions (carried over from Phase 1/1.5 — not new)

- Every tool: `ghl_<verb>_<noun>` naming, Zod `inputSchema`, `handler(args, config)`
  returning `JSON.stringify(result, null, 2)` on success or `formatError(e)` on
  catch — exactly the shape every existing tool in this codebase already follows. Read
  `src/tools/contacts.ts` or `src/tools/payments.ts` for the concrete pattern before
  writing new tools.
- Every `ghlRequest` call passes `version: GHL_VERSION_V3` (imported from
  `../client.js`) — these are brand-new v3-only tools, there is no legacy version to
  fall back to.
- `config.locationId` is threaded into the request (path segment, query param, or body
  field, whichever the real endpoint expects — verify per-endpoint against the spec,
  don't assume).
- **Read the real schema before writing each tool.** This plan's operation list below is
  from a path/method sweep only — request/response bodies, required fields, and enums
  must be read from the actual spec file during implementation, the same discipline
  Phase 1/1.5 used throughout (and which caught real errors, e.g. `custom_fields.ts`'s
  Phase 1 mistake).
- File-per-sub-resource, matching this codebase's existing convention of splitting large
  resources into focused files (e.g. `payments.ts` vs `custom_fields.ts` vs
  `custom_values.ts` are all `locations-v3.json`-adjacent but live in separate files by
  concern).
- Add each new tool array to `ALL_TOOLS` in `src/index.ts`, update
  `tests/server.test.ts`'s per-module `toHaveLength()` and total, update `README.md`'s
  tool count and add a category-table entry, per `_DEV_NOTES.md`'s "Adding New Tools"
  checklist — same bookkeeping Phase 1 follow-ups' Task 2 already demonstrated.
- TDD throughout: write the test first against the real schema, confirm RED, implement,
  confirm GREEN — same as every Phase 1/1.5 task.

## File / tool breakdown

### `src/tools/products.ts` (new) — core product + price CRUD, 13 operations

- `ghl_get_products` — `GET /products/` (list)
- `ghl_get_product` — `GET /products/{productId}`
- `ghl_create_product` — `POST /products/`
- `ghl_update_product` — `PUT /products/{productId}`
- `ghl_delete_product` — `DELETE /products/{productId}`
- `ghl_bulk_update_products` — `POST /products/bulk-update`
- `ghl_bulk_edit_product_prices` — `POST /products/bulk-update/edit`
- `ghl_get_product_prices` — `GET /products/{productId}/price`
- `ghl_get_product_price` — `GET /products/{productId}/price/{priceId}`
- `ghl_create_product_price` — `POST /products/{productId}/price`
- `ghl_update_product_price` — `PUT /products/{productId}/price/{priceId}`
- `ghl_delete_product_price` — `DELETE /products/{productId}/price/{priceId}`
- `ghl_get_product_inventory` / `ghl_update_product_inventory` — `GET`/`POST
  /products/inventory` (implementer's call whether inventory belongs in this file or a
  separate `product_inventory.ts` — 2 operations is small enough to keep here unless it
  reads better split out; use judgment, note the decision in the task report)

### `src/tools/product_collections.ts` (new) — 5 operations

- `ghl_get_product_collections` — `GET /products/collections`
- `ghl_get_product_collection` — `GET /products/collections/{collectionId}`
- `ghl_create_product_collection` — `POST /products/collections`
- `ghl_update_product_collection` — `PUT /products/collections/{collectionId}`
- `ghl_delete_product_collection` — `DELETE /products/collections/{collectionId}`

### `src/tools/product_reviews.ts` (new) — 4 operations

- `ghl_get_product_reviews` — `GET /products/reviews`
- `ghl_get_product_review_count` — `GET /products/reviews/count`
- `ghl_bulk_update_product_reviews` — `POST /products/reviews/bulk-update`
- `ghl_update_product_review` — `PUT /products/reviews/{reviewId}`
- `ghl_delete_product_review` — `DELETE /products/reviews/{reviewId}`

(5 operations, count corrected above — 5 not 4, fix during task write-up if this
mismatches the final brief.)

### `src/tools/store.ts` (new) — 3 operations (product-in-store display, not shipping)

- `ghl_set_product_store_visibility` — `POST /products/store/{storeId}` (include/exclude
  product in store)
- `ghl_update_product_store_priority` — `POST /products/store/{storeId}/priority`
- `ghl_get_product_store_stats` — `GET /products/store/{storeId}/stats`

### `src/tools/shipping.ts` (new) — 15 operations (carriers, zones, rates, store settings)

- Shipping carriers: `ghl_get_shipping_carriers`, `ghl_create_shipping_carrier`,
  `ghl_get_shipping_carrier`, `ghl_update_shipping_carrier`,
  `ghl_delete_shipping_carrier` (5 ops)
- Shipping zones: `ghl_get_shipping_zones`, `ghl_create_shipping_zone`,
  `ghl_get_shipping_zone`, `ghl_update_shipping_zone`, `ghl_delete_shipping_zone`,
  `ghl_get_available_shipping_rates` (`POST /store/shipping-zone/shipping-rates`) (6 ops)
- Shipping rates (per zone): `ghl_get_shipping_rates`, `ghl_create_shipping_rate`,
  `ghl_get_shipping_rate`, `ghl_update_shipping_rate`, `ghl_delete_shipping_rate` (5 ops)
- Store settings: `ghl_get_store_settings`, `ghl_update_store_settings` (2 ops —
  `POST /store/store-setting` per the spec's summary "Create/Update Store Settings" is
  likely an upsert; read the schema to confirm whether one tool with an upsert
  description suffices or two tools are warranted)

(Total for this file: 5 + 6 + 5 + 2 = 18, matches `store-v3.json`'s full operation
count — this file owns the entire `store` resource except the 3 product-in-store-display
operations, which conceptually belong with `products.ts`'s domain and are separated into
`src/tools/store.ts` above by mistake in this draft — **implementer resolution**: put
the 3 `POST/GET /products/store/{storeId}*` operations in whichever of `products.ts` or
a new `product_store.ts` reads more coherently; put all 18 `store-v3.json` operations
(shipping + store-setting) in `src/tools/shipping.ts`, or rename that file `store.ts` if
that's clearer once the split is finalized — this is a naming/organization call for
Task 1 of the implementation plan to make explicitly and document, not a fixed
requirement of this spec.)

### `src/tools/affiliate_manager.ts` (new) — 4 operations, all GET (read-only in v3 today)

- `ghl_get_affiliates` — `GET /affiliate-manager/{locationId}/affiliates`
- `ghl_get_affiliate` — `GET /affiliate-manager/{locationId}/affiliates/{affiliateId}`
- `ghl_get_affiliate_commissions` — `GET /affiliate-manager/{locationId}/commissions`
- `ghl_get_affiliate_payouts` — `GET /affiliate-manager/{locationId}/payouts`

### `src/tools/email_isv.ts` (new) — 1 operation

- `ghl_verify_email` — `POST /email/verify` — read the request/response schema; this is
  likely a single-address deliverability/validity check (ISV = "Independent Software
  Vendor" email verification add-on).

## Testing

Every new file gets a corresponding `tests/tools/<module>.test.ts` written test-first
(characterization isn't needed here — there's no pre-existing v2 behavior to preserve,
these are net-new v3-only tools), following the exact pattern established in Phase
1/1.5: `getTool` helper, `mockFetchSuccess`/`mockFetchError`, `parseLastFetchCall`,
assert `method`/`pathname`/`params`/`body`/`headers.Version` per tool, plus an
error-path test per tool.

## Rollout

- No new environment variables.
- Update `CHANGELOG.md` with a new "Phase 2a — Commerce" entry summarizing the new
  modules and tool count.
- `README.md`: bump tool count, add category-table rows for Products/Store/Affiliates,
  note `saas.ts` was intentionally skipped and why (one sentence, pointing to this spec
  if useful) so a future contributor doesn't silently "fix" the omission without reading
  why.
- No `package.json` version bump, no tag, no publish — requires explicit human approval.
