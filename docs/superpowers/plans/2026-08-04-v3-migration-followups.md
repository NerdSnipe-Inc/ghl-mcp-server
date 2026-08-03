# GHL API v3 Migration — Phase 1 Follow-ups Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close all 5 items deferred out of Phase 1 of the GHL API v3 migration: fix the pre-existing `ghl_send_email` bug, add a `ghl_schedule_email_campaign` tool, and fully (or maximally) migrate `custom_fields.ts`, `templates.ts`, and `users.ts` to v3.

**Architecture:** No `client.ts` changes needed — `version: GHL_VERSION_V3` / `GHL_VERSION_LEGACY` already exist. Each task is a scoped edit to one tool module plus its test file, following the exact patterns established in Phase 1 (see `src/tools/contacts.ts` for the general shape, `src/tools/emails.ts` for the optional-field body-construction pattern used with `...(x ? {...} : {})`).

**Tech Stack:** TypeScript, Zod, Vitest, Node.js (existing stack — no new dependencies).

## Global Constraints

- Spec: `docs/superpowers/specs/2026-08-04-v3-migration-followups-design.md` — read it before starting if you haven't.
- Never remove a tool. Where v3 genuinely has no equivalent (confirmed via a full sweep of every file in `/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/`, not just the resource whose name matches), keep `version: GHL_VERSION_LEGACY` with an accurate disclosure comment.
- v3 OpenAPI specs: `/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/<resource>-v3.json`. v2 originals: `/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/<resource>.json`.
- Vitest here does not type-check (esbuild transform only) — `npx vitest run tests/tools/<module>.test.ts` is a valid per-task gate; full `npm run typecheck` and `npm test` are the final task's gate.
- Tool naming convention (`ghl_` prefix, snake_case) and the "update `tests/server.test.ts` `toHaveLength()` when adding a tool" rule from `_DEV_NOTES.md` apply to Task 2 (the only task adding a genuinely new tool).
- Do not bump `package.json`'s version, tag, or publish — requires explicit human approval outside this plan's scope.

---

## Task 1: Fix `ghl_send_email` (conversations.ts)

**Files:**
- Modify: `src/tools/conversations.ts`
- Modify: `tests/tools/conversations.test.ts`
- Reference: `/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/conversations-v3.json` (`SendMessageBodyDto` schema, path `/conversations/messages`)

**Interfaces:**
- Consumes: `ghlRequest`, `GHL_VERSION_V3` from `../client.js` (already imported in this file).

The current `ghl_send_email` tool (lines 154-188 of `src/tools/conversations.ts`) calls
`POST /conversations/${conversationId}/messages/email` — this path does not exist in any
GHL spec, v2 or v3. Fix it to call the same endpoint `ghl_send_message` already uses
(`POST /conversations/messages`, line 143) with `type: "Email"` in the body, per
`SendMessageBodyDto`.

- [ ] **Step 1: Read the real request schema**

```bash
python3 -c "
import json
f = json.load(open('/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/conversations-v3.json'))
schemas = f['components']['schemas']
s = schemas['SendMessageBodyDto']
print('required:', s.get('required'))
for k, v in s['properties'].items():
    print(' ', k, v.get('type'), '-', v.get('description'))
"
```

Confirm the exact field names for an email send: expect `type` (enum including
`"Email"`), `contactId`, `emailFrom`, `emailTo`, `emailCc`, `emailBcc`, `html`, `message`
(plain-text fallback), `subject`, `attachments`, `threadId`/`replyMessageId`. There is no
`conversationId` field in this body — email sends on this endpoint are addressed by
`contactId`, not `conversationId` (the endpoint infers/creates the conversation).

- [ ] **Step 2: Update the failing test first**

In `tests/tools/conversations.test.ts`, find the `describe('ghl_send_email', ...)` block
(or equivalent). Rewrite its assertions to expect:
- `call.method === 'POST'`
- `call.pathname === '/conversations/messages'`
- `call.headers.Version === GHL_VERSION_V3` (should already be asserted if this test
  followed Phase 1's pattern — keep it)
- `call.body.type === 'Email'`
- `call.body.contactId` equals whatever the test passes as `contactId`
- other body fields (`emailFrom`/`emailTo`/`emailCc`/`emailBcc`/`html`/`subject`) map to
  the tool's corresponding input args

Since the tool's public input schema changes shape (adding `contactId`, since the
endpoint no longer takes a `conversationId`), update the test's input args to pass
`contactId` instead of `conversationId`. Keep an error-path test (401/422/etc.) as
before.

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx vitest run tests/tools/conversations.test.ts`
Expected: FAIL on the `ghl_send_email` tests (wrong path/body currently).

- [ ] **Step 4: Rewrite the implementation**

In `src/tools/conversations.ts`, rewrite the `ghl_send_email` tool:

```ts
{
  name: "ghl_send_email",
  description: "Send an email to a contact. Creates or continues the contact's email conversation thread.",
  inputSchema: z.object({
    contactId: z.string().describe("The contact to email"),
    subject: z.string(),
    message: z.string().optional().describe("Plain text body (fallback for non-HTML clients)"),
    html: z.string().optional().describe("HTML body"),
    emailFrom: z.string().optional().describe("Sender email address"),
    emailTo: z.string().optional().describe("Recipient email address, if different from the contact's primary email"),
    emailCc: z.array(z.string()).optional(),
    emailBcc: z.array(z.string()).optional(),
    attachments: z.array(z.string()).optional().describe("Array of attachment URLs"),
    replyMessageId: z.string().optional().describe("Reply to a specific message"),
  }),
  handler: async (args: Record<string, unknown>, config: GHLConfig) => {
    try {
      const result = await ghlRequest("POST", "/conversations/messages", {
        token: config.token,
        version: GHL_VERSION_V3,
        body: { ...args, type: "Email", locationId: config.locationId },
      });
      return JSON.stringify(result, null, 2);
    } catch (e) {
      return formatError(e);
    }
  },
},
```

Adjust field names to whatever Step 1's real schema confirmed if it differs from this
sketch (e.g. if the schema doesn't accept `locationId` in this body, drop it — check
whether `ghl_send_message`, the sibling tool immediately above, includes `locationId` in
its body already as a reference point).

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run tests/tools/conversations.test.ts`
Expected: PASS (all cases).

- [ ] **Step 6: Commit**

```bash
git add src/tools/conversations.ts tests/tools/conversations.test.ts
git commit -m "fix(conversations): repoint ghl_send_email at the real v3 endpoint"
```

---

## Task 2: Add `ghl_schedule_email_campaign` tool

**Files:**
- Modify: `src/tools/emails.ts`
- Modify: `tests/tools/emails.test.ts`
- Modify: `tests/server.test.ts`
- Modify: `README.md`
- Reference: `/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/emails-v3.json` (`ScheduleCampaignPublicV2BodyDto` and its nested schemas)

**Interfaces:**
- Consumes: `ghlRequest`, `GHL_VERSION_V3`, `campaignsPath(locationId)` (already defined
  at the top of `src/tools/emails.ts`, line 23) from the same file.
- Produces: a new tool `ghl_schedule_email_campaign` added to the `emailCampaignTools`
  array (this array is imported by `src/index.ts` and `tests/server.test.ts` by name —
  do not rename it).

- [ ] **Step 1: Read the real request schema**

```bash
python3 -c "
import json
f = json.load(open('/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/emails-v3.json'))
schemas = f['components']['schemas']
for name in ['ScheduleCampaignPublicV2BodyDto', 'ScheduleCampaignEmailMetaPublicV2Dto', 'ScheduleCampaignRecipientsPublicV2Dto', 'ScheduleCampaignScheduleConfigPublicV2Dto']:
    s = schemas.get(name)
    if not s: continue
    print('===', name, '===')
    print(' required:', s.get('required'))
    for k, v in s.get('properties', {}).items():
        print(' ', k, v.get('type'), '-', v.get('description'))
"
```

Confirm exactly: top-level required = `scheduleType`, `timeZone`, `userId`, `emailMeta`,
`recipients`; `emailMeta` needs `subject` (and optionally `fromName`/`fromEmail`);
`recipients` needs either `contactIds` (array) or a `filter`; `scheduleConfig` required
unless `scheduleType === "rss"` (then `rssConfig` required instead).

- [ ] **Step 2: Write the failing test first**

In `tests/tools/emails.test.ts`, add a new `describe('ghl_schedule_email_campaign', ...)`
block (place it near the other `emailCampaignTools` describe blocks). Following this
file's existing pattern (`getTool` helper, `mockFetchSuccess`/`mockFetchError`,
`parseLastFetchCall`, `expectSuccess`/`expectError`):

- Success test: call the tool with `campaignId`, `scheduleType: "immediate"`, `timeZone`,
  `userId`, `subject`, `recipients: { contactIds: [...] }` (matching whatever input shape
  you design in Step 4 — write the test against the shape you intend to build, then keep
  them in sync in Step 6). Assert:
  - `call.method === 'POST'`
  - `call.pathname === '/emails/locations/<locationId>/campaigns/emails/<campaignId>/schedule'`
  - `call.headers.Version === GHL_VERSION_V3`
  - `call.body.scheduleType === 'immediate'`
  - `call.body.emailMeta.subject` equals the passed subject
  - `call.body.recipients.contactIds` equals the passed array
- Error-path test: `mockFetchError(422, ...)`, assert `expectError(result, 422)`.

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx vitest run tests/tools/emails.test.ts`
Expected: FAIL — `ghl_schedule_email_campaign` tool doesn't exist yet.

- [ ] **Step 4: Design and add the tool**

Add to `emailCampaignTools` (in `src/tools/emails.ts`, after `ghl_create_email_campaign`
and before `ghl_delete_email_campaign`, or after `ghl_delete_email_campaign` — either
position is fine, keep related create/schedule tools adjacent if that reads better):

```ts
{
  name: "ghl_schedule_email_campaign",
  description:
    "Schedule (or immediately send) a draft email campaign created via ghl_create_email_campaign. Sets the subject line, sender, and recipients, and triggers the send.",
  inputSchema: z.object({
    campaignId: z.string().describe("Campaign ID to schedule (from ghl_create_email_campaign)"),
    scheduleType: z
      .enum(["immediate", "scheduled", "batch", "rss", "smart_send"])
      .default("immediate")
      .describe("How to schedule the campaign"),
    timeZone: z.string().default("UTC").describe("IANA timezone, e.g. America/New_York"),
    userId: z.string().describe("GHL user ID performing this action (required by the API)"),
    subject: z.string().describe("Email subject line"),
    fromName: z.string().optional().describe("Sender display name"),
    fromEmail: z.string().optional().describe("Sender email address"),
    contactIds: z
      .array(z.string())
      .optional()
      .describe("Explicit list of contact IDs to send to. Provide this or filterJson, not both."),
    filterJson: z
      .string()
      .optional()
      .describe("JSON-encoded recipient filter (advanced — use contactIds for the common case)"),
    sendAt: z
      .string()
      .optional()
      .describe("ISO datetime to send at — required when scheduleType is 'scheduled'"),
  }),
  handler: async (args: Record<string, unknown>, config: GHLConfig) => {
    try {
      const scheduleType = (args.scheduleType as string | undefined) ?? "immediate";
      const recipients = args.contactIds
        ? { type: "contact", contactIds: args.contactIds }
        : args.filterJson
        ? { type: "contact", filter: JSON.parse(args.filterJson as string) }
        : undefined;
      const result = await ghlRequest(
        "POST",
        `${campaignsPath(config.locationId)}/${args.campaignId}/schedule`,
        {
          token: config.token,
          version: GHL_VERSION_V3,
          body: {
            scheduleType,
            timeZone: (args.timeZone as string | undefined) ?? "UTC",
            userId: args.userId,
            emailMeta: {
              subject: args.subject,
              ...(args.fromName ? { fromName: args.fromName } : {}),
              ...(args.fromEmail ? { fromEmail: args.fromEmail } : {}),
            },
            ...(recipients ? { recipients } : {}),
            ...(scheduleType !== "rss" && args.sendAt
              ? { scheduleConfig: { sendAt: args.sendAt } }
              : {}),
          },
        }
      );
      return JSON.stringify(result, null, 2);
    } catch (e) {
      return formatError(e);
    }
  },
},
```

Adjust field names/shape to match whatever Step 1's real schema confirmed if this sketch
differs (particularly `ScheduleCampaignRecipientsPublicV2Dto`'s and
`ScheduleCampaignScheduleConfigPublicV2Dto`'s exact property names — verify `filter`
vs. a different key name, and `sendAt`'s exact expected format from the schema's
`example`).

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run tests/tools/emails.test.ts`
Expected: PASS (all cases, including the new ones). Adjust Step 2's test to match Step
4's final field names if they diverged from the initial sketch.

- [ ] **Step 6: Update tool-count bookkeeping**

In `tests/server.test.ts`:
- Line ~65: `expect(ALL_TOOLS).toHaveLength(127)` → `128`.
- Line ~119: `expect(emailCampaignTools).toHaveLength(4)` → `5`.

In `README.md`:
- Line 26: `**127 tools**` → `**128 tools**`.
- Add a new row to the tools table (near line 341, after the `ghl_create_email_campaign`
  row) for `ghl_schedule_email_campaign` describing what it does.
- Update line 341's `ghl_create_email_campaign` description to drop the now-inaccurate
  "scheduling/sending requires a separate step not yet implemented as a tool" clause
  (it's implemented now) — replace with something like "pair with
  `ghl_schedule_email_campaign` to set the subject, recipients, and send time."
- Line 36 (category table, "Email Marketing" row): append ", scheduling" to the
  description if it reads naturally.

Run `npx vitest run tests/server.test.ts` to confirm the count assertions pass.

- [ ] **Step 7: Commit**

```bash
git add src/tools/emails.ts tests/tools/emails.test.ts tests/server.test.ts README.md
git commit -m "feat(emails): add ghl_schedule_email_campaign tool"
```

---

## Task 3: `custom_fields.ts` full v3 migration

**Files:**
- Modify: `src/tools/custom_fields.ts`
- Modify: `tests/tools/custom_fields.test.ts`
- Reference: `/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/locations-v3.json` (NOT `custom-fields-v3.json` — that file covers a different, Custom-Objects-only resource)

**Interfaces:**
- Consumes: `ghlRequest`, `GHL_VERSION_V3` from `../client.js` (module currently imports
  `GHL_VERSION_LEGACY` only — swap the import).

All 4 call sites in `src/tools/custom_fields.ts` already call the exact v3 paths (verified
during design: `GET/POST /locations/{locationId}/customFields`,
`GET/PUT/DELETE /locations/{locationId}/customFields/{id}` — this module currently only
implements list/create/update/delete, matching 4 of those 5 v3 operations). No path or
body changes needed — this is a pure header swap.

- [ ] **Step 1: Verify the spec match yourself**

```bash
python3 -c "
import json
f = json.load(open('/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/locations-v3.json'))
for p in ['/locations/{locationId}/customFields', '/locations/{locationId}/customFields/{id}']:
    for m, op in f['paths'][p].items():
        if m in ('get', 'post', 'put', 'delete'):
            print(m.upper(), p)
"
```

Confirm this prints `GET`/`POST` for the first path and `GET`/`PUT`/`DELETE` for the
second — matching this module's 4 existing call sites (list=GET, create=POST,
update=PUT, delete=DELETE) exactly, same paths as v2.

- [ ] **Step 2: Update the failing tests first**

In `tests/tools/custom_fields.test.ts`, change the `GHL_VERSION_LEGACY` import to
`GHL_VERSION_V3`, and update all `expect(call.headers.Version).toBe(GHL_VERSION_LEGACY)`
assertions (8 tests from Phase 1, one per tool's success path — 4 tools) to
`GHL_VERSION_V3`.

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npx vitest run tests/tools/custom_fields.test.ts`
Expected: FAIL on the `Version` header assertions (implementation still sends legacy).

- [ ] **Step 4: Migrate the implementation**

In `src/tools/custom_fields.ts`:
1. Change the import from `GHL_VERSION_LEGACY` to `GHL_VERSION_V3`.
2. Delete the module-level disclosure comment (lines 4-7 — it was based on the wrong
   spec file and no longer applies).
3. Change all 4 `version: GHL_VERSION_LEGACY` occurrences to `version: GHL_VERSION_V3`.

No other changes — paths, params, and body shapes are unchanged.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run tests/tools/custom_fields.test.ts`
Expected: PASS (all 8 tests).

- [ ] **Step 6: Commit**

```bash
git add src/tools/custom_fields.ts tests/tools/custom_fields.test.ts
git commit -m "feat(custom_fields): complete v3 migration — real spec was in locations-v3.json"
```

---

## Task 4: `templates.ts` partial v3 migration

**Files:**
- Modify: `src/tools/templates.ts`
- Modify: `tests/tools/templates.test.ts`
- Reference: `/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/locations-v3.json`

**Interfaces:**
- Consumes: `ghlRequest`, `GHL_VERSION_V3`, `GHL_VERSION_LEGACY` from `../client.js`
  (already imported).

Only `ghl_get_templates` changes in this task. `ghl_delete_template` is already on v3
from Phase 1 (untouched). `ghl_create_template`/`ghl_update_template` stay on
`GHL_VERSION_LEGACY` permanently — only their disclosure comment gets rewritten to be
unambiguous that this was confirmed via an exhaustive search, not a gap in research.

- [ ] **Step 1: Write the failing test first**

In `tests/tools/templates.test.ts`, find the `ghl_get_templates` describe block. Update
its primary test to:
- Assert `call.headers.Version === GHL_VERSION_V3` (currently asserts
  `GHL_VERSION_LEGACY` — change the import too if needed).
- Assert `call.params.originId` equals `config.locationId` (`TEST_CONFIG.locationId`)
  when the tool is called without an explicit `originId` arg.

Add a second test case: call the tool with an explicit `originId` arg and assert
`call.params.originId` equals that explicit value (not the location ID) — this verifies
the override path.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/tools/templates.test.ts`
Expected: FAIL (implementation still sends legacy version, no `originId` param at all).

- [ ] **Step 3: Migrate `ghl_get_templates`**

In `src/tools/templates.ts`, update the `ghl_get_templates` tool:

```ts
{
  name: "ghl_get_templates",
  description:
    "List SMS/email/WhatsApp templates in the location. These are the quick-reply-style templates under Settings → Templates.",
  inputSchema: z.object({
    type: z.enum(["sms", "email", "whatsapp"]).optional().describe("Filter by template type"),
    limit: z.number().optional().default(25),
    skip: z.number().optional().default(0),
    originId: z
      .string()
      .optional()
      .describe("Origin ID to scope templates to. Defaults to the location itself if omitted."),
  }),
  handler: async (args: Record<string, unknown>, config: GHLConfig) => {
    try {
      const result = await ghlRequest("GET", `/locations/${config.locationId}/templates`, {
        token: config.token,
        version: GHL_VERSION_V3,
        params: {
          type: args.type as string | undefined,
          limit: args.limit as number | undefined,
          skip: args.skip as number | undefined,
          originId: (args.originId as string | undefined) ?? config.locationId,
        },
      });
      return JSON.stringify(result, null, 2);
    } catch (e) {
      return formatError(e);
    }
  },
},
```

- [ ] **Step 4: Rewrite the module disclosure comment**

Update the module-level comment (top of `src/tools/templates.ts`) to reflect the
corrected, final state:

```ts
/**
 * Location Templates — quick-reply style SMS/email/WhatsApp templates.
 *
 * These are the simple templates stored under Settings → Templates in GHL.
 * They can be referenced in workflow Send Email/SMS actions.
 *
 * For full visual/HTML email marketing templates used in campaigns,
 * see emails.ts (ghl_create_email_builder_template).
 *
 * v3 status (confirmed via a full sweep of every file in apps/v3/, not just
 * locations-v3.json): GET and DELETE map cleanly to v3
 * (/locations/{locationId}/templates[/{id}]). GET requires an `originId`
 * query param — defaulted here to config.locationId, matching how "origin"
 * is used elsewhere in GHL's API for location-native (non-integration)
 * resources. There is no v3 POST/PUT for this path anywhere in the spec
 * tree — ghl_create_template/ghl_update_template stay on GHL_VERSION_LEGACY
 * permanently until GHL ships one. See apps/locations.json for the v2 shape
 * those two calls still use.
 */
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run tests/tools/templates.test.ts`
Expected: PASS (all tests, including the two `ghl_get_templates` cases from Step 1).

- [ ] **Step 6: Commit**

```bash
git add src/tools/templates.ts tests/tools/templates.test.ts
git commit -m "feat(templates): migrate ghl_get_templates to v3 with originId default"
```

---

## Task 5: `users.ts` migration

**Files:**
- Modify: `src/tools/users.ts`
- Modify: `tests/tools/users.test.ts`
- Reference: `/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/users-v3.json`, `/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/locations-v3.json` (for `location.companyId`)

**Interfaces:**
- Consumes: `ghlRequest`, `GHL_VERSION_V3` from `../client.js` (drop the
  `GHL_VERSION_LEGACY` import — no longer used in this file after this task).
- Produces: a small internal helper `getCompanyId(config: GHLConfig): Promise<string>`
  used by `ghl_get_users`, `ghl_search_users`, and `ghl_create_user`.

`ghl_get_user`/`ghl_update_user`/`ghl_delete_user` are already v3 from Phase 1 — do not
touch them in this task.

- [ ] **Step 1: Confirm the real schemas**

```bash
python3 -c "
import json
f = json.load(open('/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/users-v3.json'))
op = f['paths']['/users/search']['get']
for p in op.get('parameters', []):
    print(p.get('name'), p.get('required'), p.get('in'))
print('---create---')
schemas = f['components']['schemas']
s = schemas[f['paths']['/users/']['post']['requestBody']['content']['application/json']['schema']['\$ref'].split('/')[-1]]
print('required:', s.get('required'))
"
```

Confirm: `/users/search` requires `companyId` (query, required) and accepts optional
`query`, `locationId`, `limit`, `skip`. Create (`POST /users/`) requires `companyId`,
`email`, `password`, `type`, `role`, `locationIds`, `firstName`, `lastName`.

- [ ] **Step 2: Write the failing tests first**

In `tests/tools/users.test.ts`:

For `ghl_get_users` and `ghl_search_users`, these tools now make **two** sequential
`fetch` calls (location lookup, then search). Update `mockFetchSuccess` usage to a
sequenced mock — check how `tests/helpers.ts`'s `mockFetchSuccess` works and either call
`vi.fn()` directly with `.mockResolvedValueOnce(...)` twice (once for the location
response shaped `{ location: { companyId: 'company-abc' } }`, once for the search
response), or use whatever multi-call mocking pattern this codebase already uses
elsewhere (check if any existing test in the repo mocks two sequential calls — if none
does, write it directly with `vi.fn().mockResolvedValueOnce(...).mockResolvedValueOnce(...)`
following `tests/helpers.ts`'s `mockFetchSuccess` shape for each resolved value). Assert:
- First call: `GET /locations/<locationId>` with `Version: v3`.
- Second call: `GET /users/search` with `Version: v3`, `params.companyId ===
  'company-abc'`, `params.locationId === TEST_CONFIG.locationId`.
- For `ghl_get_users`: `params.query` is undefined (list-all semantics).
- For `ghl_search_users`: `params.query` equals whatever the test passes.

For `ghl_create_user`, update its test to pass the new required args (`password`,
`type`, `role`, `locationIds`) and mock two sequential calls (location lookup, then
create). Assert the second call's body includes `companyId` (from the mocked location
response), `password`, `type`, `role`, `locationIds`, plus the existing
`email`/`firstName`/`lastName`, and `Version: v3`.

Keep error-path tests for all three (can mock just the location-lookup call failing, or
the second call failing — cover at least one).

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npx vitest run tests/tools/users.test.ts`
Expected: FAIL (implementation still single-call, legacy version, old required fields).

- [ ] **Step 4: Add the `getCompanyId` helper and migrate the three tools**

In `src/tools/users.ts`, add near the top (after imports, before `permissionsSchema`):

```ts
async function getCompanyId(config: GHLConfig): Promise<string> {
  const result = await ghlRequest<{ location: { companyId: string } }>(
    "GET",
    `/locations/${config.locationId}`,
    { token: config.token, version: GHL_VERSION_V3 }
  );
  return result.location.companyId;
}
```

Update `ghl_get_users`:

```ts
{
  name: "ghl_get_users",
  description: "List all team members in the GHL location.",
  inputSchema: z.object({
    limit: z.number().optional().describe("Max results"),
    skip: z.number().optional().describe("Number of results to skip"),
  }),
  handler: async (args: Record<string, unknown>, config: GHLConfig) => {
    try {
      const companyId = await getCompanyId(config);
      const result = await ghlRequest("GET", "/users/search", {
        token: config.token,
        version: GHL_VERSION_V3,
        params: {
          companyId,
          locationId: config.locationId,
          limit: args.limit as number | undefined,
          skip: args.skip as number | undefined,
        },
      });
      return JSON.stringify(result, null, 2);
    } catch (e) {
      return formatError(e);
    }
  },
},
```

Update `ghl_search_users` the same way, adding `query: args.query` to `params`.

Update `ghl_create_user`:

```ts
{
  name: "ghl_create_user",
  description: "Create a new team member in the location.",
  inputSchema: z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email(),
    password: z
      .string()
      .describe(
        "Min 12 characters, at least one uppercase, one lowercase, one number, one special character"
      ),
    type: z.enum(["account", "agency"]).default("account").describe("account for sub-account users, agency for agency-level users"),
    role: z.enum(["admin", "user"]).optional().default("user"),
    locationIds: z
      .array(z.string())
      .optional()
      .describe("Location IDs to assign the user to. Defaults to the current location if omitted."),
    phone: z.string().optional().describe("E.164 format preferred, e.g. +16135550100"),
    permissions: permissionsSchema,
  }),
  handler: async (args: Record<string, unknown>, config: GHLConfig) => {
    try {
      const companyId = await getCompanyId(config);
      const result = await ghlRequest("POST", "/users/", {
        token: config.token,
        version: GHL_VERSION_V3,
        body: {
          ...args,
          companyId,
          locationIds: (args.locationIds as string[] | undefined) ?? [config.locationId],
        },
      });
      return JSON.stringify(result, null, 2);
    } catch (e) {
      return formatError(e);
    }
  },
},
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run tests/tools/users.test.ts`
Expected: PASS (all tests).

- [ ] **Step 6: Commit**

```bash
git add src/tools/users.ts tests/tools/users.test.ts
git commit -m "feat(users): migrate get/search/create to v3 via derived companyId"
```

---

## Task 6: Final verification and changelog

**Files:**
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Full-repo typecheck**

Run: `npm run typecheck`
Expected: PASS with zero errors.

- [ ] **Step 2: Full test suite**

Run: `npm test` (or `npx vitest run`)
Expected: PASS, all suites green. Expect 128 tools now (was 127), and additional tests
from Tasks 1-5.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: succeeds with no errors.

- [ ] **Step 4: Grep for any remaining unjustified legacy version usage**

```bash
grep -rn 'GHL_VERSION_LEGACY' src/
```

Expected hits: only `src/client.ts` (the constant definition) and
`src/tools/templates.ts` (2 call sites: `ghl_create_template`, `ghl_update_template`,
with the rewritten disclosure comment from Task 4). `custom_fields.ts` and `users.ts`
should have **zero** hits now. If any other file has an unjustified hit, treat it as
unfinished work and fix it in this task.

- [ ] **Step 5: Update CHANGELOG.md**

Add a new entry above the existing "v3 migration" section (or in the same "Unreleased"
section if still present) summarizing:
- `ghl_send_email` now calls the real v3 endpoint (was calling a path that never
  existed in any GHL API version).
- New `ghl_schedule_email_campaign` tool — pairs with `ghl_create_email_campaign` to
  restore the create→schedule flow.
- `custom_fields.ts` fully migrated to v3 (Phase 1's initial migration had looked at the
  wrong spec file).
- `templates.ts`'s `ghl_get_templates` migrated to v3 with a new optional `originId`
  parameter (defaults to the location ID); create/update remain on the legacy API
  version because v3 has no equivalent endpoint yet.
- `users.ts`'s `ghl_get_users`/`ghl_search_users`/`ghl_create_user` migrated to v3;
  `ghl_create_user` now requires `password`, `type`, and accepts `locationIds`.

- [ ] **Step 6: Commit**

```bash
git add CHANGELOG.md
git commit -m "docs: update changelog for Phase 1 follow-ups"
```

**Do not bump `package.json`'s version or tag/publish** — that requires explicit human
approval per this project's deployment-approval rule. Stop here and report completion.
