# GHL API v3 Migration — Phase 1 Follow-ups

**Status:** Approved for planning
**Scope:** Close every item deferred out of Phase 1: one pre-existing bug fix, one new
tool, and full (or maximally complete) v3 migration for the three modules Phase 1 left
partially or fully on the legacy API version (`custom_fields.ts`, `templates.ts`,
`users.ts`).

## Background

Phase 1 (20 tasks, merged) migrated the GHL MCP server from API v2 to v3 across all 20
existing tool modules, adding real test coverage to 7 modules that had none. Its final
whole-branch review left 5 items explicitly deferred rather than guessed at. This phase
closes all 5.

Re-investigating two of the five deferred items during this phase's research surfaced a
real error in Phase 1's own conclusions: `custom_fields.ts`'s v3 endpoints were assumed to
live in `custom-fields-v3.json` (a Custom-Objects-only resource that genuinely can't
serve standard Contact custom fields) — they actually live in `locations-v3.json` at the
same path as v2 (`/locations/{locationId}/customFields`), a clean, contract-preserving
match. This was found by re-searching the full `highlevel-api-docs/apps/` tree (v2 and
v3) for every `customField`-related path rather than trusting the resource-name match
made under Phase 1's time pressure. The same broadened search was applied to
`templates.ts` and confirmed (this time correctly) that create/update genuinely have no
v3 endpoint anywhere in the spec tree.

**Lesson applied to this phase and to Phase 2:** before concluding "no v3 equivalent
exists," grep every `*.json` file in `apps/v3/` (not just the resource whose name
matches), the same way `custom_values.ts` (Task 15) and now `custom_fields.ts` were
correctly resolved. A resource's v3 endpoints are not guaranteed to live in the
similarly-named spec file.

## Goals

1. `ghl_send_email` (`src/tools/conversations.ts`) calls a real, working v3 endpoint
   instead of a path that doesn't exist in any GHL spec.
2. A new `ghl_schedule_email_campaign` tool restores the create→schedule flow that Task
   3's `emails.ts` rework left incomplete.
3. `custom_fields.ts` fully migrates to v3 (all 4 call sites), no `GHL_VERSION_LEGACY`
   remaining, no tool-contract change (paths/methods/required-fields match v2 exactly).
4. `templates.ts`: `ghl_get_templates` migrates to v3 (new optional `originId` param,
   defaulted to `config.locationId`); `ghl_delete_template` stays v3 (already migrated in
   Phase 1); `ghl_create_template`/`ghl_update_template` stay on `GHL_VERSION_LEGACY`
   **permanently** — this is documented as a real, confirmed GHL v3 API gap, not an open
   TODO. Their disclosure comments are rewritten to say so explicitly (cite the full
   grep sweep performed, so a future reader doesn't re-litigate it without also
   re-searching).
5. `users.ts` fully migrates `ghl_get_users` and `ghl_search_users` to v3 by deriving
   `companyId` internally (via `GET /locations/{locationId}`, which returns
   `location.companyId`) before calling `GET /users/search`. `ghl_create_user` migrates
   to v3 with a disclosed, real contract change: new required inputs `password`, `type`,
   `role`, `locationIds` (in addition to existing `email`/`firstName`/`lastName`).
   `ghl_get_user`/`ghl_update_user`/`ghl_delete_user` are already on v3 from Phase 1 —
   untouched here.

## Non-goals

- No new resource coverage (that's Phase 2).
- No change to `ghl_update_user`'s `email` field beyond what Phase 1's fix wave already
  added (the `.describe()` noting v3 ignores it) — GHL's API genuinely doesn't support
  updating email this way; not revisited here.

## Design detail per item

### 1. `ghl_send_email` fix

Current (broken): `POST /conversations/{conversationId}/messages/email` — this path does
not exist in v2 or v3 GHL specs.

New: `POST /conversations/messages` (already used by `ghl_send_message` in the same
file — same endpoint, different `type`). Per `conversations-v3.json`'s
`SendMessageBodyDto`: body gets `type: "Email"`, plus `conversationId`
(actually the schema uses `contactId`/`conversationProviderId` context, not a URL path
param — read the schema directly during implementation for the exact field set required
for an email send: `contactId`, `emailFrom`, `emailTo`, `emailCc`, `emailBcc`, `html`,
`subject`, `attachments`). Keep the tool's public argument names as close to current as
possible; only add/rename what the real v3 body shape forces. `version: GHL_VERSION_V3`.

### 2. `ghl_schedule_email_campaign` (new tool)

`POST /emails/locations/{locationId}/campaigns/emails/{campaignId}/schedule` — per
`emails-v3.json`'s `ScheduleCampaignPublicV2BodyDto`, required fields: `scheduleType`
(enum: `immediate`/`scheduled`/`batch`/`rss`/`smart_send`), `timeZone`, `userId`,
`emailMeta` (`subject`, `fromName`, `fromEmail`), `recipients` (`contactIds` or
`filter`). `scheduleConfig` required unless `scheduleType` is `rss` (then `rssConfig`
required instead). Design the tool's input schema to cover the common case
(`scheduleType: "immediate"` or `"scheduled"` with `scheduleConfig.sendAt`, and
`recipients.contactIds`) — z.discriminatedUnion or conditional validation for the
scheduleType-dependent required fields, following whatever pattern
`emails.ts`'s existing tools already use for similar branching (read the file first).
Add this tool to `emailCampaignTools` (same export Task 3 used), name
`ghl_schedule_email_campaign`. This is a genuinely new tool — update
`tests/server.test.ts`'s `toHaveLength()` for the emails module and total, and
`README.md`'s tool count table/header count, and `src/index.ts`'s startup log line, per
`_DEV_NOTES.md`'s "Keeping Tool Counts in Sync" section.

### 3. `custom_fields.ts` full v3 migration

All 4 existing call sites keep their exact current paths/params — only the header
changes:
- `GET /locations/{locationId}/customFields` (list) — unchanged from what the tool
  already calls.
- `POST /locations/{locationId}/customFields` (create) — body required `name`,
  `dataType` (matches current tool's required fields — verify during implementation).
- `PUT /locations/{locationId}/customFields/{id}` (update) — body required `name`.
- `DELETE /locations/{locationId}/customFields/{id}`.

This is now a straightforward `version: GHL_VERSION_LEGACY` → `version: GHL_VERSION_V3`
swap on all 4 call sites, no schema changes. Remove the disclosure comment Phase 1 added
(it was based on the wrong spec file) and the corresponding `GHL_VERSION_LEGACY`-asserting
test expectations — update them to assert `GHL_VERSION_V3`.

### 4. `templates.ts` partial v3 migration

- `ghl_get_templates`: add a new optional `originId` input param
  (`z.string().optional().describe("Origin ID to scope templates to. Defaults to the
  location itself if omitted.")`), handler passes `args.originId ?? config.locationId`
  as the `originId` query param. Migrate to `version: GHL_VERSION_V3`.
- `ghl_delete_template`: already on `GHL_VERSION_V3` from Phase 1, untouched.
- `ghl_create_template` / `ghl_update_template`: stay on `GHL_VERSION_LEGACY`. Rewrite the
  disclosure comment to state plainly this was confirmed via a full search of every file
  in `apps/v3/` (not just `locations-v3.json`) and no v3 create/update endpoint for
  `/locations/{locationId}/templates` exists anywhere as of this phase's research date —
  revisit only if GHL ships one.

### 5. `users.ts` migration

- `ghl_get_users` (list) and `ghl_search_users`: handler internally calls
  `GET /locations/{locationId}` first (reusing the same request shape as the already-v3
  `ghl_get_location` tool — do not import/call that tool directly, just replicate its
  `ghlRequest` call inline or extract a small shared helper if that reads cleaner) to read
  `response.location.companyId`, then calls `GET /users/search` with `companyId`,
  `locationId`, and (for `ghl_get_users`) no `query`/(for `ghl_search_users`) the existing
  `query` arg. Both migrate to `version: GHL_VERSION_V3`. This changes `ghl_get_users`
  from a single-request tool to a two-request tool (location lookup, then search) —
  document this in the tool's description; it's an internal implementation detail, not a
  contract change (same input args, same conceptual output).
- `ghl_create_user`: migrate to `version: GHL_VERSION_V3`. Add new required input fields
  `password` (with the v3 password-complexity requirement described in its `.describe()`:
  min 12 chars, upper/lower/number/special), `type` (enum `account`/`agency`), `role`
  (enum `admin`/`user`), `locationIds` (array of strings). Body also needs `companyId` —
  derive it the same way as `ghl_get_users` (internal location lookup) rather than adding
  it as a required user-facing arg, since the user shouldn't need to already know their
  own agency ID.
- `ghl_get_user`/`ghl_update_user`/`ghl_delete_user`: already v3 from Phase 1, untouched.

## Testing

- `ghl_send_email`: rewrite its test(s) in `tests/tools/conversations.test.ts` to assert
  the new path/body shape.
- `ghl_schedule_email_campaign`: new tests in `tests/tools/emails.test.ts` following the
  existing file's pattern — success path asserting path/method/version/body shape for at
  least one `scheduleType` branch, plus an error-path test. Update
  `tests/server.test.ts`'s email-module count.
- `custom_fields.ts`: update `tests/tools/custom_fields.test.ts`'s 8 existing tests to
  assert `GHL_VERSION_V3` instead of `GHL_VERSION_LEGACY`.
- `templates.ts`: update `tests/tools/templates.test.ts` — `ghl_get_templates`'s test(s)
  assert `GHL_VERSION_V3` and the `originId` param behavior (both explicit and
  defaulted-to-locationId cases); `ghl_create_template`/`ghl_update_template` keep
  asserting `GHL_VERSION_LEGACY`.
- `users.ts`: update `tests/tools/users.test.ts` — `ghl_get_users`/`ghl_search_users`
  tests now need to mock two sequential `fetch` calls (location lookup, then search) and
  assert both; `ghl_create_user`'s test(s) assert the new required-field body shape and
  `GHL_VERSION_V3`.
- Run `npm run typecheck` and the full suite before considering this phase done.

## Rollout

- No new environment variables, no config changes for end users.
- Update `CHANGELOG.md` (created in Phase 1's fix wave) with a new entry summarizing:
  `ghl_send_email` fix, new `ghl_schedule_email_campaign` tool, `custom_fields.ts` full
  v3 migration, `templates.ts` list migrating to v3 (with the `originId` default), and
  `users.ts`'s list/search/create migrating to v3 with `ghl_create_user`'s new required
  fields.
- No `package.json` version bump, no tag, no publish — requires explicit human approval
  per this project's global deployment-approval rule.
