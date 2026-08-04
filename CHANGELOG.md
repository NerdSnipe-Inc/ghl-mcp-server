# Changelog

## Unreleased — Phase 2e — Social Planner

Adds GHL API v3 Social Planner coverage — 41 new tools across 4 new modules:

- `social_planner_queues.ts` (18 tools) — content queue creation/configuration, queue items, edit sessions, calendar views, and slots
- `social_planner_comments.ts` (4 tools) — comment moderation on social media posts (create, list, like, unlike)
- `social_planner_accounts.ts` (9 tools) — OAuth account connection flow (3-step), plus account/category/tag management
- `social_planner_posts.ts` (10 tools) — CSV bulk-import posting, remaining post get/update/bulk-delete operations, and statistics

Total tool count: 268 → 309.

`social-planner-v3.json` has 45 operations total; 4 were already covered by Phase 1's
`social.ts` (`ghl_get_social_accounts`, `ghl_get_social_posts`, `ghl_create_social_post`,
`ghl_delete_social_post`). This phase covers the remaining 41, giving full coverage of
the resource across the two modules (`social.ts` from Phase 1, `social_planner_*.ts`
from Phase 2e — see the README's Social & Media / Social Planner sections for the split
rationale).

Adds a new `ghlRequestMultipart` client capability to `src/client.ts` to support
`ghl_upload_social_csv`'s `multipart/form-data` CSV file upload — the only
non-JSON-body operation in the codebase. It mirrors `ghlRequest`'s error handling but
omits the `Content-Type: application/json` header so `fetch`/`FormData` can set the
correct multipart boundary automatically.

This phase was discovered mid-way through Phase 2's original ad-publishing research and
was not part of the original 5-way domain split; it was inserted as Phase 2e, and the
originally-planned "ad-publishing" sub-phase is now renumbered to Phase 2f. See
`docs/superpowers/specs/2026-08-04-v3-phase2e-social-planner-design.md`.

## Unreleased — Phase 2d — Platform/Org

Adds GHL API v3 Platform/Org coverage — 23 new tools across 3 new modules:

- `businesses.ts` (5 tools) — business CRUD within a location
- `associations.ts` (10 tools) — association CRUD and association relation CRUD between records
- `objects.ts` (8 tools) — custom/standard object schema get/update, object listing, and object record CRUD & search

Total tool count: 245 → 268.

`companies.ts`, `snapshots.ts`, and `oauth.ts` were intentionally not built: this server
authenticates via a location-scoped Private Integration Token with no agency-level
identity, so agency-only `companies`/`snapshots` endpoints and Marketplace-app-developer-only
`oauth` endpoints are unreachable. See
`docs/superpowers/specs/2026-08-04-v3-phase2d-platform-org-design.md`.

`objects.ts`'s `POST /objects/` operation (create a custom object schema) was also
excluded: its `security` scheme is `Agency-Access`, not `bearer`, so it's unreachable
with this server's location-scoped PIT token for the same reason.

## Unreleased — Phase 2c — AI/Communication

Adds GHL API v3 AI/Communication coverage — 39 new tools across 4 new modules:

- `conversation_ai.ts` (12 tools) — conversation AI agent CRUD, agent actions (attach/list/get/update/remove), follow-up settings, and generation
- `voice_ai.ts` (11 tools) — voice AI agent CRUD, voice AI actions CRUD, and call logs
- `chat_widget.ts` (8 tools) — chat widget CRUD, clone, config, and listing
- `agent_studio.ts` (8 tools) — Agent Studio agent CRUD, metadata/version updates, publish, and execute

Total tool count: 206 → 245.

`agent-studio`'s 3 `public-api/*` operations (`GET /agent-studio/public-api/agents`,
`GET /agent-studio/public-api/agents/{agentId}`,
`POST /agent-studio/public-api/agents/{agentId}/execute`) were intentionally excluded —
they're marked `"deprecated": true` in the v3 spec's operation summaries in favor of
the non-`public-api` Agent Studio endpoints already covered above.

## Unreleased — Phase 2b — Marketing/Content

Adds GHL API v3 Marketing/Content coverage — 28 new tools across 5 new modules:

- `blogs.ts` (7 tools) — blog authors, categories, sites, posts, slug checks, create/update posts
- `courses.ts` (1 tool) — course import (lessons and modules from product objects)
- `proposals.ts` (4 tools) — proposal/estimate documents and templates, listing and sending
- `brand_boards.ts` (11 tools) — brand boards (logos/colors/fonts) and brand voices, including defaults
- `custom_menus.ts` (5 tools) — custom menu link CRUD

Total tool count: 178 → 206.

`marketplace.ts` (app installs/uninstalls, billing-wallet charges, rebilling config)
was intentionally not built, for the same reason as `saas.ts` in Phase 2a: this server
authenticates via a location-scoped Private Integration Token with no Marketplace-app-developer
identity, so these endpoints are unreachable. See
`docs/superpowers/specs/2026-08-04-v3-phase2b-marketing-design.md`.

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
