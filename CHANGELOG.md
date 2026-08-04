# Changelog

## Unreleased — Full Spec-Fidelity Remediation

After all 8 sub-phases of the v3 migration were complete (404 tools), a full-project
audit compared every MCP tool's Zod request schema against the real v3 OpenAPI specs.
Response handling was confirmed clean project-wide (every handler is a verbatim
`JSON.stringify(result)` passthrough — no response-side changes were needed). The
audit found 79 request-schema mismatches (24 Critical, ~35 Important, ~20 Minor)
across ~30 files, all now fixed:

- **contacts.ts** — `ghl_get_contacts` removed (targeted a nonexistent `GET
  /contacts/`; `ghl_search_contacts` already covers list/search via the real `POST
  /contacts/search`); `customFields` items now use `fieldValue` (was `value`) on
  create/update/upsert; added missing real fields (`name`, `gender`,
  `inboundDndSettings`, `dateOfBirth`, `assignedTo`, `dndSettings`, plus more on
  upsert).
- **calendars.ts** — `meetingLocationType` enum corrected (`gmeet` not
  `google_meet`, added `address`/`ms_teams`/`google`, removed invalid `default`);
  `notes` renamed to `description`; added `assignedUserId`, `meetingLocationId`,
  `overrideLocationConfig`, `ignoreFreeSlotValidation`, `rrule`, `address`,
  `showDrafted`, `userId`/`userIds`.
- **conversations.ts** — `ghl_add_inbound_message` now requires
  `conversationProviderId` and `conversationId`; `ghl_update_message_status`'s
  invalid `"unread"` enum value removed; `ghl_send_message`'s invalid `"GMB"`/`"Call"`
  enum values removed; `ghl_search_conversations`'s `lastMessageType` enum expanded
  to the full ~42-value set with many missing filter params added.
- **custom_fields.ts** — `options` renamed to `picklistOptions`;
  `ghl_update_custom_field`'s `name` is now correctly required; added
  `acceptedFormat`, `isMultipleFile`, `maxNumberOfFiles`, `textBoxListOptions`,
  `model`; removed fabricated `fieldKey`/`showInForms`/`parentId`.
- **custom_values.ts** — `ghl_update_custom_value` now correctly requires both
  `name` and `value` (the real API has no partial-update support here).
- **opportunities.ts** — `ghl_search_opportunities`'s query params corrected to
  camelCase (`locationId`, `contactId`, `pipelineId`, `pipelineStageId`,
  `assignedTo` — previously snake_case and silently ignored by the API);
  `customFields` now uses `fieldValue`; `ghl_upsert_opportunity` corrected to match
  the real `UpsertOpportunityDto` (no `contactId` field exists — matching is by
  optional `id`; added required `followers`/`isRemoveAllFollowers`/
  `followersActionType`).
- **payments.ts** — `ghl_get_orders`/`ghl_get_transactions`/
  `ghl_get_subscriptions` now use `limit`/`offset` (not `page`);
  `ghl_get_orders`'s `status` filter corrected to `paymentStatus` with the real
  enum; `ghl_create_coupon` (`discountValue`, valid `discountType`, required
  `startDate`), `ghl_create_invoice` (required `businessDetails`/`contactDetails`/
  `issueDate`/`sentTo`/`liveMode`, `amount`/`qty` item fields), `ghl_send_invoice`
  (valid `action` enum), and `ghl_record_invoice_payment` (`altId`/`altType` now
  sent, `mode` not `paymentMethod`, valid enum, required `notes`) all corrected.
- **phone_numbers.ts** — `ghl_search_available_phone_numbers`'s 8 spec-required
  fields now all required; `ghl_purchase_phone_number` now requires all 12 real
  fields (was missing 10 of them).
- **templates.ts** — `ghl_create_template`/`ghl_update_template` removed. Verified
  (for the third time in this project's history) via exhaustive sweep of every v3
  and legacy spec file: `/locations/{locationId}/templates` only exposes `GET`/
  `DELETE`, no `POST`/`PUT` operation exists anywhere. `ghl_get_templates`/
  `ghl_delete_template` remain fully supported. **Tool count: 404 → 401.**
- **social.ts** (Phase 1's original 4 tools) — `ghl_get_social_posts`'s filter
  field corrected from `status` to `type` with the real 10-value enum, plus
  required `fromDate`/`toDate`/`includeUsers`; `ghl_create_social_post`'s fields
  corrected (`summary` not `content`, `media` not `mediaUrls`, `scheduleDate` not
  `scheduledAt`, added required `type`/`userId`) — now field-for-field consistent
  with the sibling `social_planner_posts.ts` module.
- **emails.ts** — `ghl_schedule_email_campaign`'s `scheduleConfig`/`rssConfig`
  properly typed (previously opaque JSON-string params); added `include`,
  `userName`, `abTestConfig`.
- **forms.ts** — added missing `q` submission-search filter.
- **funnels.ts** — added missing `type`/`category`/`parentId` filters.
- **surveys.ts** — removed nonexistent `contactId` filter param.
- **users.ts** — `attributionReportEnabled` renamed to
  `attributionsReportingEnabled`; removed 4 fabricated permission fields; added the
  15 real missing permission fields plus `scopes`/`scopesAssignedToOnly` and several
  Minor fields — the corrected `permissions` object is now a verified exact
  bijection with the real 38-field `PermissionsDto`.
- **products.ts** — `taxes`/`prices`/`digitalDelivery` corrected from
  objects/records to arrays of strings (previously a spec-correct API call would
  have failed Zod validation); `productType`/price `type` properly enum-typed;
  `label`/`seo`/price `recurring`/`meta`/bulk-update `price`/`compareAtPrice`
  properly typed as objects; `ghl_get_products`'s `expand`/`productIds` now sent as
  real repeated-key array query params (see `src/client.ts` change below) instead
  of comma-joined — resolves the "Known limitations" note under Phase 2a below.
- **store.ts** — `ghl_get_available_shipping_rates`'s `source.type`/`source.subType`
  properly enum-typed.
- **proposals.ts** — `ghl_send_proposal_document`'s `ccRecipients`/
  `notificationSettings` properly typed as objects; `ghl_get_proposal_documents`'s
  `status`/`paymentStatus` properly enum-typed.
- **brand_boards.ts** — `logos`/`colors`/`fonts` on both create/update tools
  properly typed as objects (`Logo`/`Color`/`Font`) instead of permissive records.
- **voice_ai.ts** — `agentWorkingHours[].intervals` properly typed as an object
  (`startHour`/`endHour`/`startMinute`/`endMinute`, all required numbers).
- **associations.ts** — `ghl_get_association_relations`'s `associationIds` now an
  array (joined internally), matching the codebase's established array-param
  convention.
- **facebook_accounts.ts** — `ghl_create_facebook_page_form`'s `thankYouPage`/
  `greetingCard`/`customDisclaimer` properly typed as objects matching their real
  spec schemas.
- **google_campaigns.ts** — `ghl_upsert_google_campaign`'s `assets` field properly
  typed as an object.

**`src/client.ts` change:** `ghlRequest`'s `params` option now additionally accepts
`string[]` values, serialized as repeated query keys (`URLSearchParams.append`) per
the OpenAPI default array-param style — previously only comma-joined strings could
be sent for array-shaped filters. This is purely additive; every existing scalar
`params` usage across all ~401 tools is unaffected (verified via full-suite green
and a manual audit of every `params:` call site in `src/tools/`).

Several of these fixes are breaking changes for existing callers of this MCP
server: `ghl_get_social_posts` now requires `fromDate`/`toDate`/`includeUsers`;
`ghl_schedule_email_campaign` moved `sendAt`/RSS fields into nested
`scheduleConfig`/`rssConfig` objects; `ghl_create_contact`/`ghl_update_contact`/
`ghl_upsert_contact`'s `customFields` now use `fieldValue` instead of `value`;
`ghl_opportunities`' search params are now camelCase; several `payments.ts` and
`phone_numbers.ts` tools now reject calls missing newly-required fields that were
previously (incorrectly) optional. All of these bring the tools in line with what
the real v3 API actually requires — the old behavior was silently failing or
silently dropping data in every one of these cases.

Bonus fix discovered during remediation: several corrected fields (previously
`z.record()`) are now proper typed `z.object()`/`z.enum()` schemas. Since
`src/index.ts`'s `zodToJsonSchema` had no branch for `ZodRecord`, every `z.record()`
field was being advertised to calling LLMs as a plain `string` in its JSON Schema —
this fix corrects that AI-facing schema, not just internal validation.

## Unreleased — Phase 2f — Ad Publishing

Adds GHL API v3 Ad Publishing coverage — 95 new tools across 9 new modules, spanning
three ad platforms:

**Facebook — 48 tools across 4 files**
- `facebook_accounts.ts` (14 tools) — ad accounts, integration, identity, pages/Instagram, lead forms on pages
- `facebook_campaigns.ts` (18 tools) — campaign/ad set/ad CRUD, duplicate, pause, resume, publish, publishing progress
- `facebook_audiences.ts` (12 tools) — custom audiences & members, conversion pixels, conversation forms, lead forms
- `facebook_reporting.ts` (4 tools) — aggregated reporting, per-campaign reporting, reporting lists, targeting search

**Google — 31 tools across 4 files**
- `google_accounts.ts` (7 tools) — ad accounts, integration, identity, entity listing
- `google_campaigns.ts` (6 tools) — campaign upsert/get/publish, creative assets, keyword ideas
- `google_audiences.ts` (14 tools) — audiences, segments, offline user list jobs, conversion actions, conversion goals, target interests
- `google_reporting.ts` (4 tools) — aggregated reporting, per-campaign reporting, reporting lists, targeting search

**LinkedIn — 16 tools in 1 file**
- `linkedin.ts` (16 tools) — ad accounts, integration, identity, campaign groups (upsert/get/publish/status), lead forms, reporting, targeting search

Total tool count: 309 → 404.

All 95 operations in `ad-publishing-v3.json` declare `security: bearer`, so unlike
several prior phases this sub-phase required no agency-only exclusions — full coverage
was achievable with this server's location-scoped PIT token.

**Notable implementation detail:** despite living in the `ad-publishing-v3.json` spec
file (and this repo's "Phase 2f" / `-v3` naming), 94 of these 95 operations declare a
fixed legacy `Version: 2021-07-28` header, not a v3 header — `GHL_VERSION_LEGACY` is
used throughout all 9 new modules for that reason. The sole exception is
`ghl_get_facebook_campaign_publishing_progress` (`GET
/ad-publishing/facebook/campaigns/{campaignId}/publishing-progress`), whose `Version`
header enum is `["v3"]` — it's the only `GHL_VERSION_V3` usage across the entire
resource. Future contributors extending this resource should verify each new
operation's `Version` header against the live spec rather than assuming `-v3` in the
filename implies a v3 header.

The `PUT /{platform}/campaigns|adsets|ads|audiences|segments|pixels|conversions` family
are genuine upserts (no ID in the path; an optional ID/resource-name field in the body
selects create vs. update) and are named `ghl_upsert_<platform>_<noun>` accordingly,
consistent with the naming precedent already established for similar upsert-shaped
endpoints in earlier phases.

This completes v3 coverage for every practically-buildable GHL resource this server's
location-scoped Private Integration Token can reach. The only remaining gaps are the
agency-only exclusions documented across earlier phases: `saas` (Phase 2a),
`marketplace` (Phase 2b), and `companies`/`snapshots`/`oauth` (Phase 2d) — all of which
require agency-level or Marketplace-app-developer credentials this server's
location-scoped PIT token does not have. See
`docs/superpowers/specs/2026-08-04-v3-phase2f-ad-publishing-design.md`.

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
- `templates.ts`'s `ghl_get_templates` migrated to v3, with a new optional `originId` parameter (defaults to the location ID); `ghl_create_template`/`ghl_update_template` remained on the legacy API version at the time, pending confirmation of a v3 equivalent. **Update:** confirmed in the "Full Spec-Fidelity Remediation" pass above that no create/update endpoint exists in any API version — both tools were subsequently removed.
- `users.ts`'s `ghl_get_users`, `ghl_search_users`, and `ghl_create_user` migrated to v3 via an internally-derived `companyId`; `ghl_create_user` now requires `password` and `type`, and accepts `locationIds`.

## Unreleased — v3 migration

User-visible contract changes introduced by the GHL API v3 migration:

- `ghl_create_email_campaign` now creates a draft only (no `subject`/`scheduledAt` in one call), and requires `userId`.
- `ghl_get_email_builder_templates`'s `sortByDate` param was renamed to `sortOrder` (old param name is now silently ignored — pass `sortOrder` instead), and the default `limit` changed from 25 to 10.
- `ghl_update_user` still accepts an `email` field in its input but v3 silently ignores it server-side (GHL deprecated updating email this way) — the call will succeed but the email won't change.
