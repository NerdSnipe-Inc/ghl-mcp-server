# GHL API v3 Migration — Phase 2f: Ad Publishing Resource Coverage

**Status:** Approved for planning
**Scope:** Add tool coverage for all 95 `ad-publishing-v3.json` operations across
Facebook (48), Google (31), and LinkedIn (16) ad platforms. Final Phase 2 sub-phase
(2a Commerce → 2b Marketing/Content → 2c AI/Communication → 2d Platform/Org → 2e
Social Planner → **2f Ad Publishing**).

## Background

`ad-publishing-v3.json` (95 operations, all `security: bearer` — fully
location-PIT-token-reachable, no exclusions needed) covers three independent ad
platform integrations, each with its own campaign hierarchy, targeting model, and
reporting shape. This is by far the largest single sub-phase (bigger than 2a-2e
combined) but structurally simple: almost every operation is a straightforward
CRUD/action call once the request/response schema is read, following the same
`ghl_<verb>_<noun>` → `ghlRequest` pattern as every prior phase. Per your explicit
choice, this is built as one combined sub-phase rather than split across three
platform-specific sub-phases — reviewed the same way (task-by-task, one task per
file, final whole-branch review) but under a single spec/plan.

## Non-goals

- No changes to any Phase 1 / Phase 1 follow-ups / Phase 2a-2e modules.
- No new resources outside `ad-publishing-v3.json`.

## Design conventions (unchanged from prior sub-phases)

- `ghl_<verb>_<noun>` naming, Zod `inputSchema`, `handler(args, config)` pattern, every
  `ghlRequest` call uses `version: GHL_VERSION_V3`.
- **Read the real schema before writing each tool** — this spec's operation lists are
  from a path/method sweep plus spot-checks of representative schemas, not an
  exhaustive per-operation field dump. Task briefs must re-derive required/optional
  fields from the live spec.
- **The `PUT /{platform}/campaigns` / `PUT /{platform}/adsets` / `PUT /{platform}/ads`
  / `PUT /{platform}/audiences` / `PUT /{platform}/segments` / `PUT /{platform}/pixels`
  / `PUT /{platform}/conversions` family are genuine upserts**, not plain updates: the
  path has no ID segment, and the body's optional `id` field determines create
  (omitted) vs. update (present). Name these tools `ghl_upsert_<platform>_<noun>` (not
  `ghl_update_...`) and document the create/update duality in each tool's description.
  Confirmed directly for `facebook/campaigns` (`required: [locationId]`, `id`
  optional), `facebook/adsets` (`required: [locationId, campaignId]`),
  `facebook/ads` (`required: [locationId, campaignId, adsetId]`), `google/ads`
  (`required: [name, locationId, advertisingChannelType]`), `linkedin/ads`
  (`required: [locationId]`) — verify every other upsert-shaped operation in this
  phase follows the same pattern, don't assume without checking.
- Deeply nested, platform-specific structures (`audience`, `budget`, `media`,
  `adSchedule`, `biddingStrategy`, `networkSettings`, `adCampaigns`, `assets`,
  targeting objects, creative objects) are extensive and platform-specific — model
  permissively (`z.record(z.string(), z.unknown())` or
  `z.array(z.record(z.string(), z.unknown()))`) per the established Phase 2a-2e
  precedent for deeply nested bodies. Do not attempt to fully type out ad-platform
  campaign/targeting schemas — they are large, versioned by the ad platforms
  themselves (Meta/Google/LinkedIn), and out of proportion to this server's purpose as
  an MCP tool layer over GHL's own API.
- `locationId` threading varies per-endpoint (path, query, or body field) — verify
  per-operation, same discipline as every prior phase.
- **Disclose malformed/ambiguous upstream spec fields with a one-line code comment**
  inline as you write each tool.
- File-per-sub-resource (see breakdown below), add each new tool array to `ALL_TOOLS`
  in `src/index.ts`, update `tests/server.test.ts`'s per-module `toHaveLength()`, the
  total, and the `expectedTools` manifest array (keep it accurate).
- TDD throughout.

## File / tool breakdown (95 tools across 9 files)

### Facebook — 48 tools across 4 files

**`src/tools/facebook_accounts.ts` (14 tools)** — ad accounts, integration,
pages/Instagram, identity:
- Ad accounts: `ghl_get_facebook_ad_accounts` (GET `/facebook/ad-accounts`),
  `ghl_get_facebook_ad_account` (GET `/facebook/ad-accounts/{adAccountId}`),
  `ghl_delete_facebook_ad_account` (DELETE `/facebook/ad-accounts/{adAccountId}`) (3)
- Integration: `ghl_create_facebook_integration` (POST `/facebook/integration`,
  required: `locationId`, `pageId`), `ghl_get_facebook_integration` (GET
  `/facebook/integration`), `ghl_delete_facebook_integration` (DELETE
  `/facebook/integration`) (3)
- Identity/entity: `ghl_get_facebook_me` (GET `/facebook/me`),
  `ghl_get_facebook_entity` (GET `/facebook/entity`) (2)
- Pages/Instagram: `ghl_get_facebook_pages` (GET `/facebook/pages`),
  `ghl_delete_facebook_page` (DELETE `/facebook/page`), `ghl_set_default_facebook_page`
  (PUT `/facebook/page/default`), `ghl_get_facebook_page_forms` (GET
  `/facebook/page/{pageId}/forms`), `ghl_create_facebook_page_form` (POST
  `/facebook/page/{pageId}/forms`), `ghl_get_facebook_page_instagram_accounts` (GET
  `/facebook/page/{pageId}/instagram`) (6)

**`src/tools/facebook_campaigns.ts` (18 tools)** — campaigns, ad sets, ads:
- Campaigns: `ghl_get_facebook_campaign` (GET `/facebook/campaign/{campaignId}`),
  `ghl_upsert_facebook_campaign` (PUT `/facebook/campaigns`),
  `ghl_delete_facebook_campaign` (DELETE `/facebook/campaigns/{campaignId}`),
  `ghl_duplicate_facebook_campaign` (POST
  `/facebook/campaigns/{campaignId}/duplicate`), `ghl_pause_facebook_campaign` (POST
  `/facebook/campaigns/{campaignId}/pause`), `ghl_publish_facebook_campaign` (POST
  `/facebook/campaigns/{campaignId}/publish`),
  `ghl_get_facebook_campaign_publishing_progress` (GET
  `/facebook/campaigns/{campaignId}/publishing-progress`),
  `ghl_resume_facebook_campaign` (POST `/facebook/campaigns/{campaignId}/resume`) (8)
- Ad sets: `ghl_upsert_facebook_adset` (PUT `/facebook/adsets`, required:
  `locationId`, `campaignId`), `ghl_delete_facebook_adset` (DELETE
  `/facebook/adsets/{adSetId}`), `ghl_duplicate_facebook_adset` (POST
  `/facebook/adsets/{adSetId}/duplicate`), `ghl_pause_facebook_adset` (POST
  `/facebook/adsets/{adSetId}/pause`), `ghl_resume_facebook_adset` (POST
  `/facebook/adsets/{adSetId}/resume`) (5)
- Ads: `ghl_upsert_facebook_ad` (PUT `/facebook/ads`, required: `locationId`,
  `campaignId`, `adsetId`), `ghl_delete_facebook_ad` (DELETE
  `/facebook/ads/{adId}`), `ghl_duplicate_facebook_ad` (POST
  `/facebook/ads/{adId}/duplicate`), `ghl_pause_facebook_ad` (POST
  `/facebook/ads/{adId}/pause`), `ghl_resume_facebook_ad` (POST
  `/facebook/ads/{adId}/resume`) (5)

**`src/tools/facebook_audiences.ts` (12 tools)** — custom audiences, pixels,
conversation/lead forms:
- Custom audiences: `ghl_get_facebook_custom_audiences` (GET
  `/facebook/custom-audience`), `ghl_delete_facebook_custom_audience` (DELETE
  `/facebook/custom-audience/{audienceId}`), `ghl_update_facebook_custom_audience`
  (PUT `/facebook/custom-audience/{audienceId}`), `ghl_get_facebook_custom_audience`
  (GET `/facebook/custom-audience/{audienceId}`),
  `ghl_add_facebook_custom_audience_member` (PUT
  `/facebook/custom-audience/{audienceId}/member`),
  `ghl_remove_facebook_custom_audience_member` (DELETE
  `/facebook/custom-audience/{audienceId}/member`),
  `ghl_batch_update_facebook_custom_audience_members` (PUT
  `/facebook/custom-audience/{audienceId}/member/batch`) (7)
- Pixels: `ghl_get_facebook_pixels` (GET `/facebook/pixels`),
  `ghl_upsert_facebook_pixel` (PUT `/facebook/pixels`) (2)
- Forms: `ghl_get_facebook_conversation_forms` (GET `/facebook/conversation-forms`),
  `ghl_create_facebook_conversation_form` (POST `/facebook/conversation-forms`),
  `ghl_get_facebook_lead_form` (GET `/facebook/lead-form/{leadFormId}`) (3)

**`src/tools/facebook_reporting.ts` (4 tools)**:
- `ghl_get_facebook_reporting` (GET `/facebook/reporting`),
  `ghl_get_facebook_campaign_reporting` (GET
  `/facebook/reporting/campaign/{campaignId}`), `ghl_get_facebook_reporting_list` (GET
  `/facebook/reporting/list`), `ghl_search_facebook_targeting` (GET
  `/facebook/targeting/search`) (4)

### Google — 31 tools across 4 files

**`src/tools/google_accounts.ts` (7 tools)** — ad accounts, integration, identity:
- `ghl_get_google_ad_accounts` (GET `/google/ad-accounts`),
  `ghl_get_google_ad_account` (GET `/google/ad-accounts/{adAccountId}`),
  `ghl_delete_google_ad_account` (DELETE `/google/ad-accounts/{adAccountId}`),
  `ghl_create_google_integration` (POST `/google/integration`, required:
  `locationId`, `adAccountId`, `mccId`), `ghl_get_google_integration` (GET
  `/google/integration`), `ghl_get_google_me` (GET `/google/me`),
  `ghl_get_google_entity` (GET `/google/entity`) (7)

**`src/tools/google_campaigns.ts` (6 tools)** — campaigns (called "ads" in this
resource's paths), assets, keyword research:
- `ghl_upsert_google_campaign` (PUT `/google/ads`, required: `name`, `locationId`,
  `advertisingChannelType`), `ghl_get_google_campaign` (GET `/google/ads/{adId}`),
  `ghl_publish_google_campaign` (POST `/google/ads/{adId}/publish`),
  `ghl_get_google_assets` (GET `/google/assets`), `ghl_upsert_google_assets` (POST
  `/google/assets`), `ghl_get_google_keyword_ideas` (POST `/google/keyword-ideas`) (6)

**`src/tools/google_audiences.ts` (14 tools)** — audiences, segments, conversions,
targeting inputs:
- Audiences: `ghl_upsert_google_audience` (PUT `/google/audiences`),
  `ghl_get_google_audiences` (GET `/google/audiences`), `ghl_get_google_audience`
  (GET `/google/audiences/{audienceId}`) (3)
- Segments: `ghl_get_google_segments` (GET `/google/segments`),
  `ghl_upsert_google_segment` (PUT `/google/segments`),
  `ghl_create_google_offline_user_list_job` (POST
  `/google/segments/offline-user-list-job`), `ghl_delete_google_segment` (DELETE
  `/google/segments/{segmentId}`), `ghl_get_google_segment` (GET
  `/google/segments/{segmentId}`) (5)
- Conversions: `ghl_get_google_conversions` (GET `/google/conversions`),
  `ghl_upsert_google_conversion` (PUT `/google/conversions`),
  `ghl_get_google_conversion` (GET `/google/conversions/{conversionId}`),
  `ghl_delete_google_conversion` (DELETE `/google/conversions/{conversionId}`) (4)
- `ghl_get_google_conversion_goals` (GET `/google/conversion-goals`),
  `ghl_get_google_target_interests` (GET `/google/target-interests`) (2)

**`src/tools/google_reporting.ts` (4 tools)**:
- `ghl_get_google_reporting` (GET `/google/reporting`),
  `ghl_get_google_campaign_reporting` (GET `/google/reporting/campaign/{campaignId}`),
  `ghl_get_google_reporting_list` (GET `/google/reporting/list`),
  `ghl_search_google_targeting` (GET `/google/targeting/search`) (4)

### LinkedIn — 16 tools in 1 file

**`src/tools/linkedin.ts` (16 tools)** — small enough to keep as one file, matching
Phase 2a's `store.ts` (18 tools, single file) precedent:
- Accounts/integration/identity: `ghl_get_linkedin_ad_account` (GET
  `/linkedin/ad-account`), `ghl_delete_linkedin_ad_account` (DELETE
  `/linkedin/ad-account`), `ghl_get_linkedin_ad_accounts` (GET
  `/linkedin/ad-accounts`), `ghl_create_linkedin_integration` (POST
  `/linkedin/integration`, required: `locationId`, `adAccountId`, `adAccountName`,
  `currencyCode`, `organizationId`), `ghl_get_linkedin_integration` (GET
  `/linkedin/integration`), `ghl_get_linkedin_me` (GET `/linkedin/me`) (6)
- Campaigns: `ghl_upsert_linkedin_campaign` (PUT `/linkedin/ads`, required:
  `locationId`), `ghl_get_linkedin_campaign` (GET `/linkedin/ads/{adId}`),
  `ghl_publish_linkedin_campaign` (POST `/linkedin/ads/{adId}/publish`),
  `ghl_update_linkedin_ad_status` (PATCH `/linkedin/{adId}/status`) (4)
- Forms: `ghl_create_linkedin_lead_form` (POST `/linkedin/{accountId}/form`),
  `ghl_get_linkedin_lead_forms` (GET `/linkedin/{accountId}/forms`) (2)
- Reporting/targeting: `ghl_get_linkedin_reporting` (GET `/linkedin/reporting`),
  `ghl_get_linkedin_campaign_group_reporting` (GET
  `/linkedin/reporting/campaign-group/{campaignGroupId}`),
  `ghl_get_linkedin_reporting_list` (GET `/linkedin/reporting/list`),
  `ghl_search_linkedin_targeting` (GET `/linkedin/targeting/search`) (4)

## Testing

Every new file gets a corresponding `tests/tools/<module>.test.ts` written test-first,
following the established pattern: `getTool` helper, `mockFetchSuccess`/
`mockFetchError`, `parseLastFetchCall`, assert `method`/`pathname`/`params`/`body`/
`headers.Version` per tool, plus an error-path test per tool.

## Rollout

- No new environment variables.
- Update `CHANGELOG.md` with a "Phase 2f — Ad Publishing" entry, noting this
  completes v3 coverage for every practically-buildable GHL resource (modulo the
  agency-only exclusions documented across earlier phases: `saas`, `marketplace`,
  `companies`, `snapshots`, `oauth`).
- `README.md`: bump tool count, add category-table rows for the 9 new modules (likely
  grouped as three platform rows — Facebook, Google, LinkedIn — rather than 9
  individual rows, to keep the category table readable; individual "Full Reference"
  subsections still list every tool). No new "not yet covered" exclusions this phase.
- No `package.json` version bump, no tag, no publish — requires explicit human
  approval.
