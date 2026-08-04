# GHL API v3 Full Spec-Fidelity Remediation

**Status:** Approved for planning
**Scope:** Fix every request-schema mismatch and response-handling issue found by a
full-project audit comparing all 404 MCP tools (52 files) against their real v3
OpenAPI specs at `/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/`.

## Background

After completing all 8 sub-phases of the v3 migration (Phase 1 → Phase 1 follow-ups →
Phase 2a-2f), the user requested a 100%-fidelity audit: does every tool's Zod
`inputSchema` exactly match its real v3 spec's request schema (required/optional
fields, field names, enums, nested object shapes), and does every tool's response
handling avoid silently dropping/misrepresenting API response data?

Nine parallel audit agents (one per phase/platform grouping) independently verified
every tool against the live spec files. Response handling was confirmed clean
project-wide — every handler does a verbatim `JSON.stringify(result, null, 2)` on the
raw `ghlRequest`/`ghlRequestMultipart` result with no post-processing, so **no
response-side data loss was found anywhere**. All findings below are request-schema
(Zod) vs. real-spec mismatches.

Findings split roughly in half: many of the most severe (Critical) findings are in
**Phase 1's original core-CRM tools** (contacts, calendars, conversations,
custom_fields, custom_values, opportunities, payments, phone_numbers, social,
templates) — code that predates this multi-phase migration effort and was never
audited this rigorously before. The rest are newer findings in code built during this
session's phases (mostly the recurring "small well-defined nested object flattened to
`z.record()` instead of `z.object()`" pattern already fixed several times during
Phase 2f's own review cycles, but missed in a handful of additional spots).

## Non-goals

- No new tools, no new resources, no new endpoints.
- No changes to `src/client.ts` beyond what a specific finding requires (none of the
  findings require client changes).
- No `package.json` version bump, no tag, no publish.
- Findings marked "Minor/Unverifiable" (e.g. `contacts.ts`'s `ghl_search_contacts`,
  whose real spec body is a literal empty schema with no documented shape) are fixed
  where a clear correct answer exists; where the spec itself provides no ground truth,
  leave the existing implementation and disclose the ambiguity inline instead of
  guessing.

## Severity definitions (used throughout the plan)

- **Critical**: the tool's current schema would cause a spec-correct real-world call
  to fail (wrong required-field name/missing required field/invalid enum value), OR
  would cause data the caller supplied to be silently dropped by the upstream API
  (wrong field name that the API doesn't recognize).
- **Important**: a spec/code disagreement that degrades correctness or usability
  (missing optional fields that are real spec features, small well-defined nested
  objects flattened to permissive records losing enum/required-field visibility) but
  wouldn't necessarily break a call.
- **Minor**: cosmetic/type-precision issues with no functional risk.

## Full findings list, grouped by remediation task

### Task 1: `contacts.ts`, `calendars.ts`, `conversations.ts`, `custom_fields.ts`, `custom_values.ts`

**contacts.ts:**
- Critical: `ghl_get_contacts` calls `GET /contacts/`, which doesn't exist in the spec
  (only `POST /contacts/` for create, `POST /contacts/search` for search/list). Fix:
  either remove this tool (it targets a nonexistent endpoint) or repoint it to
  `POST /contacts/search` if that's the intended list behavior — read the real spec's
  `POST /contacts/search` operation and decide based on what best preserves the
  tool's documented purpose (verify with the real schema before choosing).
- Critical: `ghl_create_contact`/`ghl_update_contact`/`ghl_upsert_contact`'s
  `customFields` array items use `{ id, value }` — spec requires `{ id, fieldValue }`
  (deprecated alias `field_value`). Fix all three.
- Important: `ghl_create_contact`/`ghl_update_contact` missing spec fields `name`,
  `gender`, `inboundDndSettings`, `dateOfBirth`, `assignedTo`, `dndSettings`. Add them.
- Important: `ghl_upsert_contact` missing `name`, `gender`, `address1`, `city`,
  `state`, `postalCode`, `website`, `timezone`, `dnd`, `inboundDndSettings`,
  `dateOfBirth`, `country`, `assignedTo`, `createNewIfDuplicateAllowed`,
  `dndSettings`. Add them.
- Minor: `ghl_create_contact_note`/`ghl_update_contact_note` missing `title`,
  `color`, `pinned`; update-note wrongly requires `body` when spec has no required
  fields — make optional.

**calendars.ts:**
- Critical: `ghl_create_appointment`/`ghl_update_appointment`'s `meetingLocationType`
  enum is `["default","zoom","google_meet","phone","custom"]` — real enum is
  `["custom","zoom","gmeet","phone","address","ms_teams","google"]`. Fix the enum.
- Critical: same two tools' `notes` field doesn't exist in the spec — real field is
  `description`. Rename.
- Important: same two tools missing `assignedUserId`, `meetingLocationId`,
  `overrideLocationConfig`, `ignoreFreeSlotValidation`, `rrule`, `address`. Add them.
- Important: `appointmentStatus` enum missing valid spec values `completed`,
  `active`. Add them.
- Minor: `ghl_get_calendars` missing `showDrafted`; `ghl_get_free_slots` missing
  `userId`/`userIds`.

**conversations.ts:**
- Critical: `ghl_add_inbound_message` missing required `conversationProviderId`
  entirely, and wrongly makes required `conversationId` optional. Fix both.
- Critical: `ghl_update_message_status`'s `status` enum includes invalid `"unread"` —
  real enum is `["delivered","failed","pending","read"]`. Fix.
- Critical: `ghl_send_message`'s `type` enum includes invalid `"GMB"`/`"Call"` — real
  enum is `["SMS","RCS","Email","WhatsApp","IG","FB","Custom","Live_Chat","TIKTOK"]`.
  Fix, and add the missing valid `"RCS"`/`"TIKTOK"` if not already present.
- Important: `ghl_send_message` missing real fields `appointmentId`, `templateId`,
  `threadId`, `customSubtypeId`, `emailReplyMode`, `forward`, `toNumber`,
  `usesNativeSchedulingAi`, `optimizationPeriod`; `fromName` isn't a real field
  (remove or clarify it's a no-op) — verify directly and correct. Note: the spec also
  marks `subType`/`status` as required on `SendMessageBodyDto`, which looks like it
  may be a spec-documentation artifact (fields that make more sense on a response
  than a request) — verify directly against the spec, and if the `required` array
  genuinely includes them, add them as required fields; if investigation suggests
  this is a spec error, disclose the discrepancy inline with a comment rather than
  guessing.
- Important: `ghl_search_conversations`'s `lastMessageType` enum has only ~5 of ~45
  valid spec values — expand to the full enum. Missing query params `assignedTo`,
  `followers`, `mentions`, `sort`, `startAfterDate`, `id`, `lastMessageAction`,
  `lastMessageDirection`, `sortBy`, `sortScoreProfile`, `scoreProfile*`, `startDate`,
  `endDate` — add them.
- Minor: `ghl_add_inbound_message`'s `type` enum is a valid subset but omits common
  values (`GMB`, `WebChat`, `Live_Chat`, etc.) — expand.

**custom_fields.ts:**
- Critical: `ghl_create_custom_field`/`ghl_update_custom_field`'s `options` field
  doesn't exist in the spec — real field is `picklistOptions`. Rename in both.
- Critical: `ghl_update_custom_field` wrongly makes required `name` optional. Fix.
- Important: both create/update missing `acceptedFormat`, `isMultipleFile`,
  `maxNumberOfFiles` (FILE_UPLOAD fields), `textBoxListOptions` (TEXTBOX_LIST
  fields), `model` (`contact`/`opportunity`). Add them.
- Minor: `fieldKey`, `showInForms`, `parentId` aren't real `CreateCustomFieldsDTO`
  fields — remove them (they're silently ignored no-ops today).
- Important: `ghl_get_custom_fields` missing `model` query param filter. Add it.

**custom_values.ts:**
- Critical: `ghl_update_custom_value` wrongly makes both required fields (`name`,
  `value`) optional — the real `PUT` uses the same DTO as create, requiring both.
  Make both required, and update the tool's description (it currently implies
  partial updates are supported, which they're not per the spec).

### Task 2: `opportunities.ts`, `payments.ts`, `phone_numbers.ts`

**opportunities.ts:**
- Critical: `ghl_search_opportunities`'s query params are sent as snake_case
  (`location_id`, `contact_id`, `pipeline_id`, `pipeline_stage_id`, `assigned_to`) —
  spec requires camelCase (`locationId`, `contactId`, `pipelineId`,
  `pipelineStageId`, `assignedTo`). Fix all five, including the required
  `locationId`.
- Critical: `ghl_create_opportunity`/`ghl_update_opportunity`'s `customFields` items
  use `{id, value}` — spec requires `{id, fieldValue}`. Fix both.
- Critical: `ghl_upsert_opportunity` missing required `followers`,
  `isRemoveAllFollowers`, `followersActionType`; treats `contactId` as
  required/central when it isn't a field in the real `UpsertOpportunityDto` at all —
  investigate the real upsert-matching semantics directly from the spec and correct
  the tool's field set and description accordingly.
- Minor: `ghl_update_opportunity_status` missing optional `lostReasonId`. Add it.

**payments.ts:**
- Important: `ghl_get_orders`/`ghl_get_transactions`/`ghl_get_subscriptions` use
  `page` for pagination — spec only supports `limit`/`offset`. Fix all three.
- Important: `ghl_get_orders`'s `status` enum is fabricated
  (`["pending","confirmed","cancelled","failed","refunded"]`) — the spec's real
  enum-constrained field is `paymentStatus` with
  `["paid","unpaid","refunded","partially_paid"]`. Fix the field name and enum.
- Critical: `ghl_create_coupon`'s `discount` should be `discountValue`;
  `discountType` enum has invalid `"fixed"` (spec: `"amount"`); `startDate` wrongly
  optional (spec requires it). Fix all three.
- Critical: `ghl_create_invoice` missing required `businessDetails`,
  `contactDetails`, `issueDate`, `sentTo`, `liveMode`; sends nonexistent `contactId`
  (spec wants `contactDetails: {id,name,phoneNo,email}`); `discount` wrongly
  optional; item fields `unitAmount`/`quantity` should be `amount`/`qty`. Fix all.
- Critical: `ghl_send_invoice`'s `action` enum is invalid
  (`["send","resend"]`) — real enum is
  `["sms_and_email","send_manually","email","sms"]`. Fix.
- Critical: `ghl_record_invoice_payment` never sends required `altId`/`altType`;
  `paymentMethod` should be `mode`; enum has invalid `check`/`credit_card` (spec:
  `cash,card,cheque,bank_transfer,other`); `notes` wrongly optional; structured
  `card`/`cheque` objects entirely missing. Fix all.

**phone_numbers.ts:**
- Important: `ghl_search_available_phone_numbers` — spec marks `firstPart`,
  `lastPart`, `anywhere`, `numberTypes`, `smsEnabled`, `mmsEnabled`, `voiceEnabled`,
  `countryCode` all required; code makes all but `countryCode` optional. Fix.
- Critical: `ghl_purchase_phone_number` missing 10 of 11 required fields
  (`phoneNumber`, `addressSid`, `bundleSid`, `countryCode`, `numberType`,
  `paymentIntentId`, `stripeAccountId`, `paymentMethodId`, `locality`, `region`,
  `fingerprintId`, `skipLocationKYC` — only `countryCode` currently present). Add
  the missing 10.

### Task 3: `templates.ts`, `social.ts` (Phase 1's original 4 tools, not the Phase 2e social_planner_*.ts files), `emails.ts`, `forms.ts`, `funnels.ts`, `surveys.ts`

**templates.ts:**
- Critical: `ghl_create_template`/`ghl_update_template` target
  `POST`/`PUT /locations/{locationId}/templates`, which don't exist anywhere in the
  spec (v3 or legacy) — only `GET`/`DELETE` exist. Remove both tools (there is no
  real endpoint to fix them to point at — this is a genuine "cannot be built" case
  like `saas.ts`/`marketplace.ts`/`oauth.ts` from earlier phases, not a
  wrong-field-name bug). Update `tests/server.test.ts`'s manifest and README/
  CHANGELOG's "Not yet covered" callout to document this exclusion instead of
  silently removing coverage that was never real. Confirm this conclusion is
  actually still correct by re-sweeping the full v3 AND legacy spec directories for
  any `POST`/`PUT` on this path before removing — this exact question was
  investigated exhaustively in this project's history (the "I don't believe you!"
  skepticism check from early in this session) and confirmed correct; still, verify
  fresh rather than trusting old notes blindly.

**social.ts (the 4 original Phase 1 tools — NOT the Phase 2e social_planner_*.ts
files, which were already verified clean in this audit):**
- Critical: `ghl_get_social_posts`'s filter field is named `status` — real field is
  `type` (enum:
  `recent,all,scheduled,draft,failed,in_review,published,in_progress,pending,deleted`).
  Missing required `fromDate`, `toDate`, `includeUsers`. Fix all.
- Critical: `ghl_create_social_post`'s caption field `content` should be `summary`;
  `mediaUrls: string[]` should be `media: [{url,type,caption,altText}]`; schedule
  field `scheduledAt` should be `scheduleDate`; missing required `type`, `userId`.
  Fix all. (Note: this duplicates/overlaps with the 3 Critical findings already
  identified in `social_planner_posts.ts`'s sibling tools during the Phase 2e audit —
  coordinate field-name fixes so both files agree on the correct real field names.)

**emails.ts:**
- Important: `ghl_schedule_email_campaign`'s `scheduleConfig`/`rssConfig` are
  collapsed into opaque `scheduleConfigExtra`/`rssConfigExtra` JSON-string params
  instead of typed `z.object()` — read the real small (2-4 property) schemas and
  convert to proper typed objects.
- Minor: missing optional `include`, `fromName`/`fromEmail`/`userId`, `userName`,
  `abTestConfig`. Add them.

**forms.ts:**
- Important: `ghl_get_form_submissions` missing optional `q` filter param
  (contactId/name/email/phone search). Add it.

**funnels.ts:**
- Important: `ghl_get_funnels` missing optional `type`, `category`, `parentId`
  query filters. Add them.

**surveys.ts:**
- Important: `ghl_get_survey_submissions` exposes a `contactId` query param that
  doesn't exist in the real spec (only `q, surveyId, startAt, endAt, page, limit,
  locationId`) — remove it (silently ignored today).

### Task 4: `users.ts`

- Important: `ghl_create_user`/`ghl_update_user`'s `attributionReportEnabled`
  should be `attributionsReportingEnabled`; fabricated fields not in spec
  (`userCommsMgmtEnabled`, `auditLogsEnabled`, `leadSourcesEnabled`,
  `agentLeaderboardEnabled`) should be removed; ~15 real permission fields missing
  entirely (`campaignsReadOnly`, `workflowsReadOnly`, `bulkRequestsEnabled`,
  `botService`, `socialPlanner`, `bloggingEnabled`, `invoiceEnabled`,
  `affiliateManagerEnabled`, `contentAiEnabled`, `refundsEnabled`,
  `recordPaymentEnabled`, `cancelSubscriptionEnabled`, `paymentsEnabled`,
  `communitiesEnabled`, `exportPaymentsEnabled`); `scopes`/`scopesAssignedToOnly`
  absent. Fix the rename, remove the fabricated fields, add all missing real ones.
- Minor: missing `profilePhoto`, `twilioPhone`, `platformLanguage`; update tool
  missing `locationIds`/password reset fields. Add them.

### Task 5: `products.ts`, `store.ts` (Phase 2a)

**products.ts:**
- Critical: `ghl_create_product`/`ghl_update_product`'s `taxes` should be
  `z.array(z.string())` (tax-ID strings), not `z.array(z.record(z.unknown()))`. Fix.
- Critical: `ghl_update_product`'s `prices` should be `z.array(z.string())`
  (price-ID strings), not `z.array(z.record(z.unknown()))`. Fix.
- Critical: `ghl_create_product_price`/`ghl_update_product_price`'s
  `digitalDelivery` should be `z.array(z.string())`, not `z.record(z.unknown())`.
  Fix.
- Important: `ghl_create_product`/`ghl_update_product`'s `productType` should be
  `z.enum(["DIGITAL","PHYSICAL","SERVICE","PHYSICAL/DIGITAL"])`, not `z.string()`.
  Fix.
- Important: same tools' `label` should be `z.object({title: z.string(),
  startDate: z.string().optional(), endDate: z.string().optional()})` (title
  required), not `z.record()`. Fix.
- Important: same tools' `seo` should be `z.object({title: z.string().optional(),
  description: z.string().optional()})` (matching `product_collections.ts`'s
  already-correct pattern for the same shape), not `z.record()`. Fix.
- Important: `ghl_create_product_price`/`ghl_update_product_price`'s `type` should
  be `z.enum(["one_time","recurring"])`, not `z.string()`. Fix.
- Important: same tools' `recurring` (2 required props: `interval` 4-value enum,
  `intervalCount`) and `meta` (4 props, 2 enums, 3 required) should be typed
  `z.object()`s, not `z.record()`. Fix both.
- Important: `ghl_bulk_update_products`'s `price`/`compareAtPrice` should be
  `z.object({type: z.enum([...5 values...]), value: z.number()})`, not `z.record()`.
  Fix.
- Minor: `medias` items, `variants` items, price `membershipOffers` items, price
  `shippingOptions`, inventory-update `items` are small well-defined shapes
  currently left as records/loose types — type them out per their real spec shapes
  if time permits within this task; not required to block task completion if the
  Critical/Important items above are the priority.
- Important: `ghl_get_products`'s `expand`/`productIds` array-serialization: the
  spec declares these as true array query params (OpenAPI default: repeated keys),
  not the comma-joined string the code currently sends. Fixing this properly
  requires `src/client.ts`'s `ghlRequest` params type to support repeated query
  keys (currently `Record<string, string|number|boolean|undefined>` via
  `URLSearchParams.set`, which can't emit repeated keys). Add a new params
  capability to `ghlRequest` (e.g. accept `string[]` values and emit them via
  repeated `URLSearchParams.append` calls) and update `ghl_get_products` to pass
  the arrays directly instead of comma-joining. This is the only finding in the
  whole remediation that requires a `client.ts` change — implement it carefully and
  add/update tests in `tests/client.test.ts` covering repeated-key array params.

**store.ts:**
- Important: `ghl_get_available_shipping_rates`'s `source.type`/`source.subType`
  should be typed enums (15-value and 17-value respectively per the spec), not
  `z.string()`. Fix.
- Minor: `shippingOrigin.state` should be an enum (large state-code list);
  `address` in the same tool should be a typed ~7-field object instead of
  `z.record()`. Fix if time permits.

### Task 6: `proposals.ts`, `brand_boards.ts` (Phase 2b)

**proposals.ts:**
- Important: `ghl_send_proposal_document`'s `ccRecipients` should be
  `z.array(z.object({email: z.string(), id: z.string(), imageUrl: z.string(),
  contactName: z.string(), firstName: z.string(), lastName: z.string()}))` (all 6
  required per spec), not `z.array(z.record(z.unknown()))`. Fix.
- Important: same tool's `notificationSettings` should be
  `z.object({sender: z.object({fromEmail: z.string(), fromName: z.string()}),
  receive: z.object({templateId: z.string(), subject: z.string()})}).optional()`,
  not `z.record(z.unknown())`. Fix.
- Minor: `ghl_get_proposal_documents`'s `status`/`paymentStatus` should be
  `z.enum([...])` per the spec's single-value enums (verify directly whether the
  "comma separated" claim in the current description reflects real, undocumented
  API behavior before removing it — if unverifiable, keep the enum but note the
  ambiguity inline).

**brand_boards.ts:**
- Important: `ghl_create_brand_board`/`ghl_update_brand_board`'s `logos`, `colors`,
  `fonts` arrays should be typed objects per their real spec shapes (`Logo`:
  required `url,label,path`, optional `id`; `Color`: required
  `hexa,rgba,hex,rgb,label`, optional `id`; `Font`: required `font,fallback,label`,
  optional `id`), not `z.array(z.record(z.unknown()))`. Fix all three fields in both
  tools (4 occurrences total).

### Task 7: `voice_ai.ts`, `associations.ts`, `facebook_accounts.ts`, `google_campaigns.ts` (small cleanup findings across Phases 2c/2d/2f)

**voice_ai.ts:**
- Important: `ghl_create_voice_ai_agent`/`ghl_update_voice_ai_agent`'s
  `agentWorkingHours[].intervals` should be `z.object({startHour: z.number(),
  endHour: z.number(), startMinute: z.number(), endMinute: z.number()})` (all 4
  required per the real `IntervalDTO`), not `z.array(z.record())`. Fix.
- Minor: same tools' `agentWorkingHours[].dayOfTheWeek` should be
  `z.enum([1,2,3,4,5,6,7])` (or the exact real enum), not bare `z.number()`. Fix if
  time permits.

**associations.ts:**
- Minor: `ghl_get_association_relations`'s `associationIds` should follow the
  established codebase convention of `z.array(z.string())` + `.join(",")` before
  sending (matching how `products.ts`, `linkedin.ts`, `facebook_reporting.ts`
  already handle array query params), instead of `z.string().optional()`. Fix.

**facebook_accounts.ts:**
- Important: `ghl_create_facebook_page_form`'s `thankYouPage` (`ThankYouPage`:
  required `title,body,buttonText,buttonType`), `greetingCard` (`GreetingCard`:
  required `title,style,content`), `customDisclaimer` (`CustomDisclaimer`: required
  `title,body`, optional `checkboxes[]`) should all be typed `z.object()`s per their
  real spec shapes, not `z.record(z.unknown())`. This was flagged during Phase 2f's
  own final-review fix wave but explicitly left untouched at the time (out of that
  fix's declared scope) — fix it now.

**google_campaigns.ts:**
- Important: `ghl_upsert_google_campaign`'s `assets` field (`GoogleAssetsDTO`: 4
  flat/shallow properties — `calls: string[]`, `sitelinks: string[]`, `leadForm:
  string`, `images`/`businessLogo` using a shallow 4-field `GoogleAssetImageDTO`)
  should be a typed `z.object()`, not `z.record(z.string(), z.unknown())`. This was
  missed during the earlier Task 6 fix round in Phase 2f (which caught 5 sibling
  fields but not this one) — fix it now.

## Design conventions (unchanged from every prior phase)

- Fix in place — no file renames, no new files, no new tools.
- **Re-verify every finding against the live spec yourself before fixing it** — this
  document's field lists are a synthesis of 9 independent audit passes, not gospel.
  If a finding turns out to be wrong on closer inspection, say so in the task report
  and don't apply an incorrect "fix."
- TDD: update/add the failing test first (or write one if the existing test locks in
  the wrong behavior — several files' tests currently assert the *incorrect* shape,
  e.g. `products.ts`'s `taxes` test), confirm it fails against the current code,
  fix, confirm it passes.
- Every fix must be independently verified against
  `/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/*.json` (or the
  legacy spec directory without `/v3/` for any operation confirmed to need
  `GHL_VERSION_LEGACY`).
- Where a finding requires removing a tool entirely (`templates.ts`'s create/update),
  update `tests/server.test.ts`'s `expectedTools` manifest and
  `ALL_TOOLS.toHaveLength()` accordingly, and add/update the README's "Not yet
  covered" callout and CHANGELOG.
- Disclose any newly-discovered spec ambiguity or quirk with a one-line code comment,
  per established project discipline.
- Do not bump `package.json`'s version, tag, or publish.

## Testing

Every fixed file's existing `tests/tools/<module>.test.ts` gets updated to assert
the corrected field names/types/enums (several existing tests currently lock in the
wrong behavior and must be corrected, not just left passing). `products.ts`'s
`ghl_get_products` array-param fix additionally needs new coverage in
`tests/client.test.ts` for the new repeated-query-key capability in `ghlRequest`.

## Rollout

- Update `CHANGELOG.md` with a "Spec-Fidelity Remediation" entry summarizing the
  scope (24 Critical + ~35 Important + ~20 Minor findings fixed across N files),
  and noting `ghl_create_template`/`ghl_update_template`'s removal (nonexistent
  endpoints) plus the resulting tool-count change.
- `README.md`: update tool count if any tools were removed (templates.ts); extend
  "Not yet covered" if templates create/update removal warrants a note there.
- No `package.json` version bump, no tag, no publish — requires explicit human
  approval.
