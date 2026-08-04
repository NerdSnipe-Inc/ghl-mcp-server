# Changelog

## [2.0.0] - 2026-08-04

Full migration of the GoHighLevel MCP server from API v2 to API v3, plus complete
coverage of every practically-buildable v3 resource this server's location-scoped
Private Integration Token can reach, plus a full-project audit-and-remediation pass
verifying every tool's request schema against the real v3 OpenAPI specs.

**Tool count: 127 → 401.** This is a major version bump: several tools' input
schemas changed in breaking ways (see "Full Spec-Fidelity Remediation" below) to
correct them against the real API — the old shapes were silently failing or
silently dropping data.

### Full Spec-Fidelity Remediation

After the full migration was complete, a full-project audit compared every MCP
tool's Zod request schema against the real v3 OpenAPI specs. Response handling was
confirmed clean project-wide (every handler is a verbatim `JSON.stringify(result)`
passthrough — no response-side changes were needed). The audit found 79
request-schema mismatches (24 Critical, ~35 Important, ~20 Minor) across ~30 files,
all now fixed:

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
  `ghl_delete_template` remain fully supported.
- **social.ts** (the 4 original tools from the v3 migration) — `ghl_get_social_posts`'s
  filter field corrected from `status` to `type` with the real 10-value enum, plus
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
  of comma-joined.
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
`params` usage across all 401 tools is unaffected.

**Breaking changes from this pass:** `ghl_get_social_posts` now requires
`fromDate`/`toDate`/`includeUsers`; `ghl_schedule_email_campaign` moved
`sendAt`/RSS fields into nested `scheduleConfig`/`rssConfig` objects;
`ghl_create_contact`/`ghl_update_contact`/`ghl_upsert_contact`'s `customFields` now
use `fieldValue` instead of `value`; `ghl_search_opportunities`'s search params are
now camelCase; several `payments.ts` and `phone_numbers.ts` tools now reject calls
missing newly-required fields that were previously (incorrectly) optional;
`ghl_get_contacts`/`ghl_create_template`/`ghl_update_template` were removed
(nonexistent endpoints). All of these bring the tools in line with what the real v3
API actually requires.

Bonus fix discovered during remediation: several corrected fields (previously
`z.record()`) are now proper typed `z.object()`/`z.enum()` schemas. Since
`src/index.ts`'s `zodToJsonSchema` had no branch for `ZodRecord`, every `z.record()`
field was being advertised to calling LLMs as a plain `string` in its JSON Schema —
this fix corrects that AI-facing schema, not just internal validation.

### Phase 2f — Ad Publishing (+95 tools, 309 → 404)

Adds GHL API v3 Ad Publishing coverage across three ad platforms:

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

All 95 operations in `ad-publishing-v3.json` declare `security: bearer`, so unlike
several prior phases this sub-phase required no agency-only exclusions.

**Notable implementation detail:** despite living in the `ad-publishing-v3.json` spec
file, 94 of these 95 operations declare a fixed legacy `Version: 2021-07-28` header,
not a v3 header — `GHL_VERSION_LEGACY` is used throughout all 9 new modules for that
reason. The sole exception is `ghl_get_facebook_campaign_publishing_progress`
(`GET /ad-publishing/facebook/campaigns/{campaignId}/publishing-progress`), whose
`Version` header enum is `["v3"]`.

The `PUT /{platform}/campaigns|adsets|ads|audiences|segments|pixels|conversions`
family are genuine upserts (no ID in the path; an optional ID/resource-name field in
the body selects create vs. update) and are named `ghl_upsert_<platform>_<noun>`
accordingly.

This completes v3 coverage for every practically-buildable GHL resource this
server's location-scoped Private Integration Token can reach. The only remaining
gaps are the agency-only exclusions documented below: `saas`, `marketplace`,
`companies`, `snapshots`, and `oauth` — all require agency-level or
Marketplace-app-developer credentials this server's location-scoped PIT token does
not have.

### Phase 2e — Social Planner (+41 tools, 268 → 309)

Adds GHL API v3 Social Planner coverage across 4 new modules:

- `social_planner_queues.ts` (18 tools) — content queue creation/configuration, queue items, edit sessions, calendar views, and slots
- `social_planner_comments.ts` (4 tools) — comment moderation on social media posts (create, list, like, unlike)
- `social_planner_accounts.ts` (9 tools) — OAuth account connection flow (3-step), plus account/category/tag management
- `social_planner_posts.ts` (10 tools) — CSV bulk-import posting, remaining post get/update/bulk-delete operations, and statistics

`social-planner-v3.json` has 45 operations total; 4 were already covered by the v3
migration's `social.ts` (`ghl_get_social_accounts`, `ghl_get_social_posts`,
`ghl_create_social_post`, `ghl_delete_social_post`). This phase covers the
remaining 41.

Adds a new `ghlRequestMultipart` client capability to `src/client.ts` to support
`ghl_upload_social_csv`'s `multipart/form-data` CSV file upload — the only
non-JSON-body operation in the codebase. It mirrors `ghlRequest`'s error handling
but omits the `Content-Type: application/json` header so `fetch`/`FormData` can set
the correct multipart boundary automatically.

### Phase 2d — Platform/Org (+23 tools, 245 → 268)

Adds GHL API v3 Platform/Org coverage across 3 new modules:

- `businesses.ts` (5 tools) — business CRUD within a location
- `associations.ts` (10 tools) — association CRUD and association relation CRUD between records
- `objects.ts` (8 tools) — custom/standard object schema get/update, object listing, and object record CRUD & search

`companies.ts`, `snapshots.ts`, and `oauth.ts` were intentionally not built:
agency-only or Marketplace-app-developer-only endpoints, unreachable with this
server's location-scoped PIT token. `objects.ts`'s `POST /objects/` operation
(create a custom object schema) was also excluded for the same reason (`Agency-Access`
security scheme).

### Phase 2c — AI/Communication (+39 tools, 206 → 245)

Adds GHL API v3 AI/Communication coverage across 4 new modules:

- `conversation_ai.ts` (12 tools) — conversation AI agent CRUD, agent actions (attach/list/get/update/remove), follow-up settings, and generation
- `voice_ai.ts` (11 tools) — voice AI agent CRUD, voice AI actions CRUD, and call logs
- `chat_widget.ts` (8 tools) — chat widget CRUD, clone, config, and listing
- `agent_studio.ts` (8 tools) — Agent Studio agent CRUD, metadata/version updates, publish, and execute

`agent-studio`'s 3 `public-api/*` operations were intentionally excluded — they're
marked `"deprecated": true` in the v3 spec in favor of the non-`public-api` Agent
Studio endpoints already covered above.

### Phase 2b — Marketing/Content (+28 tools, 178 → 206)

Adds GHL API v3 Marketing/Content coverage across 5 new modules:

- `blogs.ts` (7 tools) — blog authors, categories, sites, posts, slug checks, create/update posts
- `courses.ts` (1 tool) — course import (lessons and modules from product objects)
- `proposals.ts` (4 tools) — proposal/estimate documents and templates, listing and sending
- `brand_boards.ts` (11 tools) — brand boards (logos/colors/fonts) and brand voices, including defaults
- `custom_menus.ts` (5 tools) — custom menu link CRUD

`marketplace.ts` was intentionally not built, for the same reason as `saas.ts`
below: Marketplace-app-developer-only endpoints, unreachable with a location PIT
token.

### Phase 2a — Commerce (+50 tools, 128 → 178)

Adds GHL API v3 Commerce coverage across 7 new modules:

- `products.ts` (14 tools) — products, prices, and inventory CRUD, including bulk product/price updates
- `product_collections.ts` (5 tools) — product collection CRUD
- `product_reviews.ts` (5 tools) — review listing, counting, bulk status updates, update, and delete
- `product_store.ts` (3 tools) — storefront visibility, sort priority, and stats
- `store.ts` (18 tools) — shipping carriers, zones, rates, and store settings
- `affiliate_manager.ts` (4 tools) — affiliates, commissions, and payouts (read-only)
- `email_isv.ts` (1 tool) — single-use email deliverability verification

`saas.ts` (agency-level SaaS management) was intentionally not built:
agency-only endpoints, unreachable with a location PIT token.

### v3 migration follow-ups (+1 tool, 127 → 128)

- `ghl_send_email` now calls the real v3 endpoint — it previously called a path that never existed in any GHL API version, so every call failed. Its input arguments also changed to match the v3 shape: `conversationId`→`contactId`, `body`→`message` (now optional), `to: string[]`→`emailTo: string`, `from`→`emailFrom`, `cc`/`bcc`→`emailCc`/`emailBcc`, `replyToMessageId`→`replyMessageId`; `fromName` was dropped.
- New `ghl_schedule_email_campaign` tool, pairing with `ghl_create_email_campaign` to restore the create-then-schedule flow that the v3 migration split into two calls.
- `custom_fields.ts` fully migrated to v3 (the initial migration had referenced the wrong spec file and left it on the legacy version).
- `templates.ts`'s `ghl_get_templates` migrated to v3, with a new optional `originId` parameter (defaults to the location ID); `ghl_create_template`/`ghl_update_template` remained on the legacy API version at the time, pending confirmation of a v3 equivalent. **Superseded above:** confirmed in the "Full Spec-Fidelity Remediation" section that no create/update endpoint exists in any API version — both tools were subsequently removed.
- `users.ts`'s `ghl_get_users`, `ghl_search_users`, and `ghl_create_user` migrated to v3 via an internally-derived `companyId`; `ghl_create_user` now requires `password` and `type`, and accepts `locationIds`.

### v3 migration — user-visible contract changes

- `ghl_create_email_campaign` now creates a draft only (no `subject`/`scheduledAt` in one call), and requires `userId`.
- `ghl_get_email_builder_templates`'s `sortByDate` param was renamed to `sortOrder` (old param name is now silently ignored — pass `sortOrder` instead), and the default `limit` changed from 25 to 10.
- `ghl_update_user` still accepts an `email` field in its input but v3 silently ignores it server-side (GHL deprecated updating email this way) — the call will succeed but the email won't change.
