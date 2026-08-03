# GHL API v3 Phase 2a: Commerce Resource Coverage — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add ~50 new tools covering GHL API v3's Commerce resources (`products`,
`store`, `affiliate-manager`, `email-isv`) that this MCP server has never had any
coverage for.

**Architecture:** Six new tool modules, each following the exact pattern every existing
tool in this codebase uses (`ghl_<verb>_<noun>` naming, Zod `inputSchema`,
`handler(args, config)` → `ghlRequest(...)` → `JSON.stringify` or `formatError`). Every
call uses `version: GHL_VERSION_V3` (no legacy fallback — these are net-new tools with
no v2 history). Read the real request/response schema from the v3 spec file before
writing each tool — the operation lists below are from a path/method sweep only.

**Tech Stack:** TypeScript, Zod, Vitest, Node.js (existing stack — no new dependencies).

## Global Constraints

- Spec: `docs/superpowers/specs/2026-08-04-v3-phase2a-commerce-design.md` — read it
  before starting if you haven't. In particular: **`saas-v3.json` is explicitly out of
  scope** — do not build any `saas.ts` tools in this plan.
- v3 OpenAPI specs: `/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/<resource>-v3.json`.
- Tool naming: `ghl_` prefix, snake_case, following existing convention.
- Every `ghlRequest` call: `version: GHL_VERSION_V3` (imported from `../client.js`).
- TDD throughout: write the test first against the real schema, confirm RED, implement,
  confirm GREEN.
- Each task registers its new tool array into `ALL_TOOLS` in `src/index.ts` and adds a
  `toHaveLength()` assertion (plus bumping the total) in `tests/server.test.ts` — same
  bookkeeping pattern as every prior phase. README/CHANGELOG updates are consolidated
  into the final task (Task 9) rather than repeated per-task.
- Do not bump `package.json`'s version, tag, or publish.

---

## Task 1: `products.ts` — core product + price CRUD (14 tools)

**Files:**
- Create: `src/tools/products.ts`
- Create: `tests/tools/products.test.ts`
- Modify: `src/index.ts` (import + spread into `ALL_TOOLS`)
- Modify: `tests/server.test.ts` (import, `toHaveLength(14)`, bump total)
- Reference: `/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/products-v3.json`

**Interfaces:**
- Consumes: `ghlRequest`, `formatError`, `GHLConfig`, `GHL_VERSION_V3` from `../client.js`.
- Produces: `export const productTools = [...]` (14 tools) — this exact export name is
  what `src/index.ts` and `tests/server.test.ts` will import.

Operations (verify each against the spec before implementing — this is a path/method
list only, not a schema):

| Tool | Method | Path |
|---|---|---|
| `ghl_get_products` | GET | `/products/` |
| `ghl_get_product` | GET | `/products/{productId}` |
| `ghl_create_product` | POST | `/products/` |
| `ghl_update_product` | PUT | `/products/{productId}` |
| `ghl_delete_product` | DELETE | `/products/{productId}` |
| `ghl_bulk_update_products` | POST | `/products/bulk-update` |
| `ghl_bulk_edit_product_prices` | POST | `/products/bulk-update/edit` |
| `ghl_get_product_prices` | GET | `/products/{productId}/price` |
| `ghl_get_product_price` | GET | `/products/{productId}/price/{priceId}` |
| `ghl_create_product_price` | POST | `/products/{productId}/price` |
| `ghl_update_product_price` | PUT | `/products/{productId}/price/{priceId}` |
| `ghl_delete_product_price` | DELETE | `/products/{productId}/price/{priceId}` |
| `ghl_get_product_inventory` | GET | `/products/inventory` |
| `ghl_update_product_inventory` | POST | `/products/inventory` |

- [ ] **Step 1: Read the real schemas**

```bash
python3 -c "
import json
f = json.load(open('/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/products-v3.json'))
schemas = f['components']['schemas']
for path, method in [('/products/','post'), ('/products/{productId}','put'), ('/products/bulk-update','post'), ('/products/bulk-update/edit','post'), ('/products/{productId}/price','post'), ('/products/{productId}/price/{priceId}','put'), ('/products/inventory','post')]:
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

Also read the GET operations' query parameters (`limit`/`offset`/filters) directly from
the spec for `/products/`, `/products/{productId}/price`, `/products/inventory`.

- [ ] **Step 2: Write the failing tests first**

Create `tests/tools/products.test.ts` following `tests/tools/contacts.test.ts`'s
structure exactly: imports from `../helpers.js`, a `getTool` helper, one `describe`
block per tool with a success-path test asserting `call.method`/`call.pathname`/
`call.headers.Version`/relevant `call.params`/`call.body` fields (per the real schema
read in Step 1), plus an error-path test (`mockFetchError`) per tool.

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run tests/tools/products.test.ts`
Expected: FAIL — `src/tools/products.ts` doesn't exist yet.

- [ ] **Step 4: Implement**

Create `src/tools/products.ts`. Worked example for the first tool (create), to set the
pattern for the rest — the exact fields shown come from Step 1's real schema read
(`required: ['name', 'locationId', 'productType']`, plus a long list of optional
fields — only wire up the fields that make sense as top-level MCP tool args; don't
blindly expose every nested object like `variants`/`taxes`/`label` as a raw
`z.any()` unless the schema is simple enough — use `z.array(z.record(z.unknown()))`
or similar permissive types for complex nested structures the tool doesn't need to
validate deeply, matching how this codebase handles complex bodies elsewhere, e.g.
`emails.ts`'s `ghl_schedule_email_campaign`):

```ts
import { z } from "zod";
import { ghlRequest, formatError, GHLConfig, GHL_VERSION_V3 } from "../client.js";

export const productTools = [
  {
    name: "ghl_create_product",
    description: "Create a new product in the store catalog.",
    inputSchema: z.object({
      name: z.string().describe("Product name"),
      productType: z.string().describe("Product type"),
      description: z.string().optional(),
      image: z.string().optional().describe("Product image URL"),
      statementDescriptor: z.string().optional(),
      availableInStore: z.boolean().optional(),
      collectionIds: z.array(z.string()).optional().describe("Category/collection IDs"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("POST", "/products/", {
          token: config.token,
          version: GHL_VERSION_V3,
          body: { ...args, locationId: config.locationId },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  // ... remaining 13 tools follow the same pattern, each verified against its own
  // real schema from Step 1.
];
```

Implement all 14 tools following this pattern, each with fields matched to its own real
schema (don't copy the create-product field list onto other tools).

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run tests/tools/products.test.ts`
Expected: PASS (all cases).

- [ ] **Step 6: Register the tool array**

In `src/index.ts`: add `import { productTools } from "./tools/products.js";` near the
other tool imports, and add `...productTools,` to the `ALL_TOOLS` array.

In `tests/server.test.ts`: add `import { productTools } from '../src/tools/products.js';`,
add `it('products has 14 tools', () => expect(productTools).toHaveLength(14));`, and
bump the total `ALL_TOOLS` length assertion by 14.

- [ ] **Step 7: Run the registration tests**

Run: `npx vitest run tests/server.test.ts`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/tools/products.ts tests/tools/products.test.ts src/index.ts tests/server.test.ts
git commit -m "feat(products): add core product and price CRUD tools"
```

---

## Task 2: `product_collections.ts` (5 tools)

**Files:**
- Create: `src/tools/product_collections.ts`
- Create: `tests/tools/product_collections.test.ts`
- Modify: `src/index.ts`, `tests/server.test.ts`
- Reference: `/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/products-v3.json`

**Interfaces:**
- Produces: `export const productCollectionTools = [...]` (5 tools).

| Tool | Method | Path |
|---|---|---|
| `ghl_get_product_collections` | GET | `/products/collections` |
| `ghl_get_product_collection` | GET | `/products/collections/{collectionId}` |
| `ghl_create_product_collection` | POST | `/products/collections` |
| `ghl_update_product_collection` | PUT | `/products/collections/{collectionId}` |
| `ghl_delete_product_collection` | DELETE | `/products/collections/{collectionId}` |

Follow Task 1's exact procedure (Steps 1-8), scoped to these 5 tools:
1. Read real schemas for the POST/PUT bodies via a python script identical in shape to
   Task 1 Step 1's, pointed at `/products/collections` and `/products/collections/{collectionId}`.
2. Write `tests/tools/product_collections.test.ts` first (RED).
3. Implement `src/tools/product_collections.ts` following the worked-example pattern
   from Task 1.
4. Verify GREEN.
5. Register in `src/index.ts` (`import { productCollectionTools } from "./tools/product_collections.js";`) and `tests/server.test.ts` (`toHaveLength(5)`, bump total).
6. Commit: `git commit -m "feat(products): add product collection tools"`.

---

## Task 3: `product_reviews.ts` (5 tools)

**Files:**
- Create: `src/tools/product_reviews.ts`
- Create: `tests/tools/product_reviews.test.ts`
- Modify: `src/index.ts`, `tests/server.test.ts`
- Reference: `/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/products-v3.json`

**Interfaces:**
- Produces: `export const productReviewTools = [...]` (5 tools).

| Tool | Method | Path |
|---|---|---|
| `ghl_get_product_reviews` | GET | `/products/reviews` |
| `ghl_get_product_review_count` | GET | `/products/reviews/count` |
| `ghl_bulk_update_product_reviews` | POST | `/products/reviews/bulk-update` |
| `ghl_update_product_review` | PUT | `/products/reviews/{reviewId}` |
| `ghl_delete_product_review` | DELETE | `/products/reviews/{reviewId}` |

Follow Task 1's exact procedure, scoped to these 5 tools. Commit:
`git commit -m "feat(products): add product review tools"`.

---

## Task 4: `product_store.ts` (3 tools)

**Files:**
- Create: `src/tools/product_store.ts`
- Create: `tests/tools/product_store.test.ts`
- Modify: `src/index.ts`, `tests/server.test.ts`
- Reference: `/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/products-v3.json`

**Interfaces:**
- Produces: `export const productStoreTools = [...]` (3 tools).

| Tool | Method | Path |
|---|---|---|
| `ghl_set_product_store_visibility` | POST | `/products/store/{storeId}` |
| `ghl_update_product_store_priority` | POST | `/products/store/{storeId}/priority` |
| `ghl_get_product_store_stats` | GET | `/products/store/{storeId}/stats` |

Follow Task 1's exact procedure, scoped to these 3 tools. Note: `storeId` here refers to
a store/funnel ID that displays products, not a location ID — read the parameter
description in the spec to confirm and describe it accurately in the tool's
`.describe()`. Commit: `git commit -m "feat(products): add product store display tools"`.

---

## Task 5: `store.ts` — shipping carriers + zones (11 tools)

**Files:**
- Create: `src/tools/store.ts`
- Create: `tests/tools/store.test.ts`
- Modify: `src/index.ts`, `tests/server.test.ts`
- Reference: `/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/store-v3.json`

**Interfaces:**
- Produces: `export const storeTools = [...]` — starts with 11 tools in this task; Task 6
  appends 7 more to the same array in the same file (18 total when both tasks are done).

| Tool | Method | Path |
|---|---|---|
| `ghl_get_shipping_carriers` | GET | `/store/shipping-carrier` |
| `ghl_create_shipping_carrier` | POST | `/store/shipping-carrier` |
| `ghl_get_shipping_carrier` | GET | `/store/shipping-carrier/{shippingCarrierId}` |
| `ghl_update_shipping_carrier` | PUT | `/store/shipping-carrier/{shippingCarrierId}` |
| `ghl_delete_shipping_carrier` | DELETE | `/store/shipping-carrier/{shippingCarrierId}` |
| `ghl_get_shipping_zones` | GET | `/store/shipping-zone` |
| `ghl_create_shipping_zone` | POST | `/store/shipping-zone` |
| `ghl_get_shipping_zone` | GET | `/store/shipping-zone/{shippingZoneId}` |
| `ghl_update_shipping_zone` | PUT | `/store/shipping-zone/{shippingZoneId}` |
| `ghl_delete_shipping_zone` | DELETE | `/store/shipping-zone/{shippingZoneId}` |
| `ghl_get_available_shipping_rates` | POST | `/store/shipping-zone/shipping-rates` |

Follow Task 1's exact procedure, scoped to these 11 tools. In Step 6, register
`storeTools` in `src/index.ts`/`tests/server.test.ts` with `toHaveLength(11)` for now
(Task 6 will bump this to 18 — don't skip this step waiting for Task 6, land it
incrementally so this task is independently complete and testable). Commit:
`git commit -m "feat(store): add shipping carrier and zone tools"`.

---

## Task 6: `store.ts` — shipping rates + store settings (7 tools, appends to Task 5's file)

**Files:**
- Modify: `src/tools/store.ts` (append to the existing `storeTools` array)
- Modify: `tests/tools/store.test.ts` (append tests)
- Modify: `tests/server.test.ts` (bump `storeTools` count from 11 to 18)
- Reference: `/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/store-v3.json`

| Tool | Method | Path |
|---|---|---|
| `ghl_get_shipping_rates` | GET | `/store/shipping-zone/{shippingZoneId}/shipping-rate` |
| `ghl_create_shipping_rate` | POST | `/store/shipping-zone/{shippingZoneId}/shipping-rate` |
| `ghl_get_shipping_rate` | GET | `/store/shipping-zone/{shippingZoneId}/shipping-rate/{shippingRateId}` |
| `ghl_update_shipping_rate` | PUT | `/store/shipping-zone/{shippingZoneId}/shipping-rate/{shippingRateId}` |
| `ghl_delete_shipping_rate` | DELETE | `/store/shipping-zone/{shippingZoneId}/shipping-rate/{shippingRateId}` |
| `ghl_get_store_settings` | GET | `/store/store-setting` |
| `ghl_update_store_settings` | POST | `/store/store-setting` |

Follow Task 1's Steps 1-5 procedure, scoped to these 7 tools, appending to the existing
`src/tools/store.ts` file and `tests/tools/store.test.ts` file rather than creating new
ones. Read `/store/store-setting`'s POST schema carefully — its summary
("Create/Update Store Settings") suggests it's an upsert; if so, a single
`ghl_update_store_settings` tool covering both create-if-absent and update-if-present is
correct (don't create a separate `ghl_create_store_settings` unless the schema genuinely
requires two distinct request shapes).

- [ ] **Step 6: Update the registration count**

In `tests/server.test.ts`: change `storeTools` from `toHaveLength(11)` to
`toHaveLength(18)`, and adjust the total `ALL_TOOLS` length assertion by +7 (on top of
whatever it was after Task 5).

- [ ] **Step 7: Run the registration tests**

Run: `npx vitest run tests/server.test.ts`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/tools/store.ts tests/tools/store.test.ts tests/server.test.ts
git commit -m "feat(store): add shipping rate and store settings tools"
```

---

## Task 7: `affiliate_manager.ts` (4 tools, all read-only)

**Files:**
- Create: `src/tools/affiliate_manager.ts`
- Create: `tests/tools/affiliate_manager.test.ts`
- Modify: `src/index.ts`, `tests/server.test.ts`
- Reference: `/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/affiliate-manager-v3.json`

**Interfaces:**
- Produces: `export const affiliateManagerTools = [...]` (4 tools).

| Tool | Method | Path |
|---|---|---|
| `ghl_get_affiliates` | GET | `/affiliate-manager/{locationId}/affiliates` |
| `ghl_get_affiliate` | GET | `/affiliate-manager/{locationId}/affiliates/{affiliateId}` |
| `ghl_get_affiliate_commissions` | GET | `/affiliate-manager/{locationId}/commissions` |
| `ghl_get_affiliate_payouts` | GET | `/affiliate-manager/{locationId}/payouts` |

All 4 are GET-only (read-only), so this is the simplest task in the plan — no request
body schemas to verify, just query parameters and response shapes. Follow Task 1's exact
procedure. Commit: `git commit -m "feat(affiliate-manager): add read-only affiliate tools"`.

---

## Task 8: `email_isv.ts` (1 tool)

**Files:**
- Create: `src/tools/email_isv.ts`
- Create: `tests/tools/email_isv.test.ts`
- Modify: `src/index.ts`, `tests/server.test.ts`
- Reference: `/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/email-isv-v3.json`

**Interfaces:**
- Produces: `export const emailIsvTools = [...]` (1 tool: `ghl_verify_email`).

- [ ] **Step 1: Read the real schema**

```bash
python3 -c "
import json
f = json.load(open('/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/email-isv-v3.json'))
schemas = f['components']['schemas']
op = f['paths']['/email/verify']['post']
ref = op['requestBody']['content']['application/json']['schema'].get('\$ref')
s = schemas[ref.split('/')[-1]] if ref else op['requestBody']['content']['application/json']['schema']
print('required:', s.get('required'))
print('props:', s.get('properties'))
resp = op['responses'].get('200', {}).get('content', {}).get('application/json', {}).get('schema', {})
rref = resp.get('\$ref')
if rref:
    print('response:', schemas[rref.split('/')[-1]].get('properties'))
"
```

- [ ] **Step 2-8:** Follow Task 1's exact TDD/implement/register/commit procedure for
  this single tool (`ghl_verify_email`, `POST /email/verify`). Commit:
  `git commit -m "feat(email-isv): add email verification tool"`.

---

## Task 9: Final verification, README, and CHANGELOG

**Files:**
- Modify: `README.md`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Full-repo typecheck**

Run: `npm run typecheck`
Expected: PASS with zero errors.

- [ ] **Step 2: Full test suite**

Run: `npm test` (or `npx vitest run`)
Expected: PASS, all suites green. Total tool count should be 128 (Phase 1 + follow-ups)
+ 50 (this plan) = 178.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: succeeds with no errors.

- [ ] **Step 4: Update README.md**

- Bump the tool count (intro line and any "All N Tools" heading) to the actual final
  `ALL_TOOLS.length` (verify by reading `tests/server.test.ts`'s final total assertion
  rather than assuming 178 — earlier tasks may have adjusted counts).
- Add category-table rows for the new modules: Products (collections, reviews, store
  display), Store & Shipping, Affiliates, Email Verification — group them sensibly
  rather than one row per file if that reads better (matching the existing table's
  granularity, e.g. "Location Settings" already bundles several small modules into one
  row).
- Add a one-sentence note (wherever fits best — a "Scope" or "Not covered" section if
  one exists, or a comment near the Commerce rows) that `saas.ts` (agency-level SaaS
  management) was intentionally not built because this server authenticates via a
  location-scoped PIT token with no agency identity — point to
  `docs/superpowers/specs/2026-08-04-v3-phase2a-commerce-design.md` if a doc-link
  convention exists in this README, otherwise just state the reason inline.

- [ ] **Step 5: Update CHANGELOG.md**

Add a new "Phase 2a — Commerce" entry (above or alongside the existing Phase 1/Phase 1
follow-ups entries, matching the file's existing structure) listing: new `products.ts`/
`product_collections.ts`/`product_reviews.ts`/`product_store.ts` tools, new `store.ts`
(shipping + settings) tools, new `affiliate_manager.ts` tools, new `email_isv.ts` tool,
and the total new tool count. Note `saas.ts` was intentionally skipped.

- [ ] **Step 6: Commit**

```bash
git add README.md CHANGELOG.md
git commit -m "docs: update README and changelog for Phase 2a Commerce tools"
```

**Do not bump `package.json`'s version or tag/publish** — that requires explicit human
approval per this project's deployment-approval rule. Stop here and report completion.
