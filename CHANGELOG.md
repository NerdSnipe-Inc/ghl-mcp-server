# Changelog

## Unreleased — Phase 2a — Commerce

Adds GHL API v3 Commerce coverage — 50 new tools across 7 new modules:

- `products.ts` (14 tools) — products, prices, and inventory CRUD, including bulk product/price updates
- `product_collections.ts` (5 tools) — product collection CRUD
- `product_reviews.ts` (5 tools) — review listing, counting, bulk status updates, update, and delete
- `product_store.ts` (3 tools) — storefront visibility, sort priority, and stats
- `store.ts` (18 tools) — shipping carriers, zones, rates, and store settings
- `affiliate_manager.ts` (4 tools) — affiliates, commissions, and payouts (read-only)
- `email_isv.ts` (1 tool) — single-use email deliverability verification

Total tool count: 128 → 178.

`saas.ts` (agency-level SaaS management — mode toggling, billing plans, rebilling, wallets)
was intentionally not built: this server authenticates via a location-scoped Private
Integration Token with no agency-level identity, so agency-only `saas` endpoints are
unreachable. See `docs/superpowers/specs/2026-08-04-v3-phase2a-commerce-design.md`.

### Known limitations

- `ghl_get_products`'s `expand`/`productIds` array-filter params use comma-joined
  serialization, unverified against the live v3 API — if filtering by these params
  doesn't work as expected, this is the suspect. Fixing this properly likely requires
  extending `src/client.ts`'s query-param serialization to support repeated keys.

## Unreleased — Phase 1 follow-ups

Fixes and completions from the post-migration follow-up pass:

- `ghl_send_email` now calls the real v3 endpoint — it previously called a path that never existed in any GHL API version, so every call failed. Its input arguments also changed to match the v3 shape: `conversationId`→`contactId`, `body`→`message` (now optional), `to: string[]`→`emailTo: string`, `from`→`emailFrom`, `cc`/`bcc`→`emailCc`/`emailBcc`, `replyToMessageId`→`replyMessageId`; `fromName` was dropped.
- New `ghl_schedule_email_campaign` tool, pairing with `ghl_create_email_campaign` to restore the create-then-schedule flow that the v3 migration split into two calls.
- `custom_fields.ts` fully migrated to v3 (the initial Phase 1 migration had referenced the wrong spec file and left it on the legacy version).
- `templates.ts`'s `ghl_get_templates` migrated to v3, with a new optional `originId` parameter (defaults to the location ID); `ghl_create_template`/`ghl_update_template` remain on the legacy API version because v3 has no equivalent endpoint yet.
- `users.ts`'s `ghl_get_users`, `ghl_search_users`, and `ghl_create_user` migrated to v3 via an internally-derived `companyId`; `ghl_create_user` now requires `password` and `type`, and accepts `locationIds`.

## Unreleased — v3 migration

User-visible contract changes introduced by the GHL API v3 migration:

- `ghl_create_email_campaign` now creates a draft only (no `subject`/`scheduledAt` in one call), and requires `userId`.
- `ghl_get_email_builder_templates`'s `sortByDate` param was renamed to `sortOrder` (old param name is now silently ignored — pass `sortOrder` instead), and the default `limit` changed from 25 to 10.
- `ghl_update_user` still accepts an `email` field in its input but v3 silently ignores it server-side (GHL deprecated updating email this way) — the call will succeed but the email won't change.
