# GHL API v3 Full Spec-Fidelity Remediation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all 79 request-schema-vs-real-spec mismatches (24 Critical, ~35
Important, ~20 Minor) found by a full-project audit of all 404 MCP tools, across 7
task groups covering ~30 files. Response handling was independently confirmed clean
project-wide (every handler is a verbatim `JSON.stringify(result)` passthrough) — no
response-side work is needed.

**Architecture:** Fix existing tools in place — no new files, no new tools (except
removing 2 tools in `templates.ts` that target nonexistent endpoints). Every fix
corrects a Zod `inputSchema` field (name, type, enum, required/optional status) to
match the real v3 OpenAPI spec, or (for `products.ts`'s array-query-param finding)
adds a small new capability to `src/client.ts`.

**Tech Stack:** TypeScript, Zod, Vitest, Node.js (existing stack — no new
dependencies).

## Global Constraints

- **The authoritative, exhaustive findings list is
  `docs/superpowers/specs/2026-08-04-v3-full-spec-remediation-design.md`** — each
  task below tells you which section of that doc to read. That doc's field-by-field
  breakdown is the requirement; this plan file is the execution wrapper around it.
- **Re-verify every finding against the live spec yourself before fixing it.** The
  design spec's field lists synthesize 9 independent audit passes — treat them as a
  strong starting hypothesis, not gospel. If a finding turns out wrong on closer
  inspection (e.g. the spec actually does support the current shape), say so in your
  report and don't apply an incorrect "fix." If a finding turns out to UNDERSTATE the
  problem (more fields are wrong than listed), fix the full scope you find, not just
  what's listed.
- v3 OpenAPI specs: `/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/*.json`.
  Legacy v2 specs (for any operation confirmed to need `GHL_VERSION_LEGACY`):
  `/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/*.json` (no `/v3/`).
- TDD: for each fix, first check whether the existing test locks in the WRONG
  behavior (several do — e.g. a test asserting `taxes` sends `[{id: 'tax1'}]` when
  the correct shape is `['tax1']`). If so, fix the test to assert the correct
  behavior first (confirm it now fails against the current code), then fix the
  implementation (confirm the test passes). If no test covers the field at all, add
  one.
- Small well-defined nested objects (2-6 properties, especially with their own
  required fields or enums) get proper `z.object()` typing, not `z.record()`. This
  exact pattern has recurred across almost every task in this plan — get it right
  per-field by reading the real referenced schema, don't guess from field name alone.
- Where a finding requires removing a tool (`templates.ts`'s create/update — verified
  nonexistent endpoints), update `tests/server.test.ts`'s `expectedTools` manifest
  and `ALL_TOOLS.toHaveLength()`, and note it in the final task's README/CHANGELOG
  update.
- **Disclose spec ambiguities or quirks with a one-line code comment** as you
  encounter them — several findings above are already-known quirks with existing
  comments; don't remove those comments, extend them if the fix changes the
  surrounding code.
- Each task commits its own fixes; run the affected module's test file plus
  `tests/server.test.ts` (if the manifest changed) after each file's fix.
- Do not bump `package.json`'s version, tag, or publish.

---

## Task 1: `contacts.ts`, `calendars.ts`, `conversations.ts`, `custom_fields.ts`, `custom_values.ts`

**Files:**
- Modify: `src/tools/contacts.ts`, `src/tools/calendars.ts`,
  `src/tools/conversations.ts`, `src/tools/custom_fields.ts`,
  `src/tools/custom_values.ts`
- Modify: `tests/tools/contacts.test.ts`, `tests/tools/calendars.test.ts`,
  `tests/tools/conversations.test.ts`, `tests/tools/custom_fields.test.ts`,
  `tests/tools/custom_values.test.ts`
- Reference: **Read "Task 1" in
  `docs/superpowers/specs/2026-08-04-v3-full-spec-remediation-design.md` in full** —
  it lists every finding for these 5 files with the exact field names/types/enums to
  fix. This is your requirements document; the summary below is just an index.

**Interfaces:** No signature changes to exported tool arrays (`contactsTools`,
`calendarsTools`, `conversationsTools`, `customFieldsTools`, `customValuesTools`) —
same tool names, same array shapes, only internal Zod schema corrections. Exception:
verify whether `ghl_get_contacts` is removed or repointed per the design spec's
instructions (this is the one tool-identity decision in this task).

This is the highest-Critical-density task in the whole plan (11 Critical findings
across these 5 files: 2 in contacts.ts, 2 in calendars.ts, 3 in conversations.ts, 2
in custom_fields.ts, 1 in custom_values.ts, plus `ghl_send_message`'s enum fix).

- [ ] **Step 1: Read the design spec's Task 1 section and the real schemas**

Read `docs/superpowers/specs/2026-08-04-v3-full-spec-remediation-design.md`'s "Task
1" section in full. For each finding, independently verify against the real spec
before fixing — e.g.:

```bash
python3 -c "
import json
f = json.load(open('/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/contacts-v3.json'))
# check paths for GET /contacts/ (should not exist), and POST /contacts/search's body shape
for p, methods in f.get('paths', {}).items():
    if '/contacts' in p and p.count('/') <= 2:
        print(p, list(methods.keys()))
"
```
Adjust the spec filename/path checks per finding (contacts-v3.json, calendars-v3.json
or calendar-v3.json — check the actual filename, conversations-v3.json,
locations-v3.json for custom_fields.ts/custom_values.ts).

- [ ] **Step 2: Fix `contacts.ts`**

Address every finding in the design spec's Task 1 → contacts.ts section. Update
`tests/tools/contacts.test.ts` first for each field (confirm RED against current
code), then fix, then confirm GREEN.

- [ ] **Step 3: Run contacts tests**

Run: `npx vitest run tests/tools/contacts.test.ts`
Expected: PASS.

- [ ] **Step 4: Commit contacts.ts**

```bash
git add src/tools/contacts.ts tests/tools/contacts.test.ts
git commit -m "fix(contacts): correct field names, add missing spec fields, fix nonexistent-endpoint tool"
```

- [ ] **Step 5: Fix `calendars.ts`**

Address every finding in the design spec's Task 1 → calendars.ts section.

- [ ] **Step 6: Run calendars tests, commit**

Run: `npx vitest run tests/tools/calendars.test.ts` — expect PASS, then:
```bash
git add src/tools/calendars.ts tests/tools/calendars.test.ts
git commit -m "fix(calendars): correct meetingLocationType enum, notes->description, add missing fields"
```

- [ ] **Step 7: Fix `conversations.ts`**

Address every finding in the design spec's Task 1 → conversations.ts section,
including the `subType`/`status` required-field investigation on `ghl_send_message`
(verify directly whether the spec's `required` array genuinely includes them before
deciding whether to add them or disclose the ambiguity).

- [ ] **Step 8: Run conversations tests, commit**

Run: `npx vitest run tests/tools/conversations.test.ts` — expect PASS, then:
```bash
git add src/tools/conversations.ts tests/tools/conversations.test.ts
git commit -m "fix(conversations): add missing required fields, correct enums, expand search filters"
```

- [ ] **Step 9: Fix `custom_fields.ts`**

Address every finding in the design spec's Task 1 → custom_fields.ts section.

- [ ] **Step 10: Run custom_fields tests, commit**

Run: `npx vitest run tests/tools/custom_fields.test.ts` — expect PASS, then:
```bash
git add src/tools/custom_fields.ts tests/tools/custom_fields.test.ts
git commit -m "fix(custom-fields): options->picklistOptions, required name, add missing fields"
```

- [ ] **Step 11: Fix `custom_values.ts`**

Address the finding in the design spec's Task 1 → custom_values.ts section.

- [ ] **Step 12: Run custom_values tests, commit**

Run: `npx vitest run tests/tools/custom_values.test.ts` — expect PASS, then:
```bash
git add src/tools/custom_values.ts tests/tools/custom_values.test.ts
git commit -m "fix(custom-values): require name and value on update"
```

- [ ] **Step 13: Run the full suite to confirm no regressions**

Run: `npx vitest run` and `npm run typecheck` — expect PASS/clean.

---

## Task 2: `opportunities.ts`, `payments.ts`, `phone_numbers.ts`

**Files:**
- Modify: `src/tools/opportunities.ts`, `src/tools/payments.ts`,
  `src/tools/phone_numbers.ts`
- Modify: `tests/tools/opportunities.test.ts`, `tests/tools/payments.test.ts`,
  `tests/tools/phone_numbers.test.ts`
- Reference: **Read "Task 2" in
  `docs/superpowers/specs/2026-08-04-v3-full-spec-remediation-design.md` in full.**

This task has the highest concentration of Critical findings of any single file
(`payments.ts` alone has 5 Critical findings across 4 tools).

- [ ] **Step 1: Read the design spec's Task 2 section and the real schemas**

Independently verify each finding against `opportunities-v3.json`, `payments-v3.json`
(and `invoices-v3.json` if invoices live in a separate file — check), and
`phone-system-v3.json` (or whatever the real filename is — check the spec
directory).

- [ ] **Step 2: Fix `opportunities.ts`**

Address every finding in the design spec's Task 2 → opportunities.ts section, TDD
throughout (fix test first where it locks in wrong behavior, then implementation).

- [ ] **Step 3: Run opportunities tests, commit**

Run: `npx vitest run tests/tools/opportunities.test.ts` — expect PASS, then:
```bash
git add src/tools/opportunities.ts tests/tools/opportunities.test.ts
git commit -m "fix(opportunities): camelCase search params, fieldValue naming, upsert required fields"
```

- [ ] **Step 4: Fix `payments.ts`**

Address every finding in the design spec's Task 2 → payments.ts section (pagination
params, coupon/invoice/send-invoice/record-payment field names and enums).

- [ ] **Step 5: Run payments tests, commit**

Run: `npx vitest run tests/tools/payments.test.ts` — expect PASS, then:
```bash
git add src/tools/payments.ts tests/tools/payments.test.ts
git commit -m "fix(payments): correct coupon/invoice/payment field names, enums, and required fields"
```

- [ ] **Step 6: Fix `phone_numbers.ts`**

Address every finding in the design spec's Task 2 → phone_numbers.ts section.

- [ ] **Step 7: Run phone_numbers tests, commit**

Run: `npx vitest run tests/tools/phone_numbers.test.ts` — expect PASS, then:
```bash
git add src/tools/phone_numbers.ts tests/tools/phone_numbers.test.ts
git commit -m "fix(phone-numbers): require all real search/purchase fields"
```

- [ ] **Step 8: Run the full suite to confirm no regressions**

Run: `npx vitest run` and `npm run typecheck` — expect PASS/clean.

---

## Task 3: `templates.ts`, `social.ts`, `emails.ts`, `forms.ts`, `funnels.ts`, `surveys.ts`

**Files:**
- Modify: `src/tools/templates.ts`, `src/tools/social.ts`, `src/tools/emails.ts`,
  `src/tools/forms.ts`, `src/tools/funnels.ts`, `src/tools/surveys.ts`
- Modify: `tests/tools/templates.test.ts`, `tests/tools/social.test.ts`,
  `tests/tools/emails.test.ts`, `tests/tools/forms.test.ts`,
  `tests/tools/funnels.test.ts`, `tests/tools/surveys.test.ts`
- Modify: `tests/server.test.ts` (if `templates.ts` loses tools — see Step 2)
- Reference: **Read "Task 3" in
  `docs/superpowers/specs/2026-08-04-v3-full-spec-remediation-design.md` in full.**

- [ ] **Step 1: Read the design spec's Task 3 section**

- [ ] **Step 2: Re-verify and fix `templates.ts`**

Before removing `ghl_create_template`/`ghl_update_template`, re-sweep the full v3
AND legacy spec directories yourself for any `POST`/`PUT` on
`/locations/{locationId}/templates` (or any templates-related path) to confirm they
genuinely don't exist:

```bash
grep -rl "templates" /Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/*.json /Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/*.json 2>/dev/null | while read f; do
  python3 -c "
import json
d = json.load(open('$f'))
for p, m in d.get('paths', {}).items():
    if 'template' in p.lower():
        print('$f', p, list(m.keys()))
"
done
```

If confirmed, remove both tools from `src/tools/templates.ts`. Update
`tests/tools/templates.test.ts` to remove their test blocks. Update
`tests/server.test.ts`: remove the two tool names from `expectedTools`, decrement
`toHaveLength()` in both places, decrement `ALL_TOOLS` total, decrement the
per-module `toHaveLength()` assertion for templates. Note the new total for later
tasks/the final task to reconcile.

- [ ] **Step 3: Run templates + server tests, commit**

Run: `npx vitest run tests/tools/templates.test.ts tests/server.test.ts` — expect
PASS, then:
```bash
git add src/tools/templates.ts tests/tools/templates.test.ts tests/server.test.ts
git commit -m "fix(templates): remove create/update tools targeting nonexistent endpoints"
```

- [ ] **Step 4: Fix `social.ts`**

Address the two Critical findings in the design spec's Task 3 → social.ts section
(`ghl_get_social_posts`'s filter field, `ghl_create_social_post`'s field names).
Note the design spec's cross-reference to `social_planner_posts.ts` — ensure the
corrected field names here agree with what's already correct in that sibling file
(read `src/tools/social_planner_posts.ts` for the confirmed-correct real field names
if useful as a cross-check, but do not modify that file — it was already verified
clean in the same audit).

- [ ] **Step 5: Run social tests, commit**

Run: `npx vitest run tests/tools/social.test.ts` — expect PASS, then:
```bash
git add src/tools/social.ts tests/tools/social.test.ts
git commit -m "fix(social): correct post-list filter field and create-post field names"
```

- [ ] **Step 6: Fix `emails.ts`, `forms.ts`, `funnels.ts`, `surveys.ts`**

Address each file's findings from the design spec's Task 3 section in turn, TDD
throughout, one commit per file:

```bash
git add src/tools/emails.ts tests/tools/emails.test.ts
git commit -m "fix(emails): type scheduleConfig/rssConfig properly, add missing optional fields"

git add src/tools/forms.ts tests/tools/forms.test.ts
git commit -m "fix(forms): add missing submission-search filter param"

git add src/tools/funnels.ts tests/tools/funnels.test.ts
git commit -m "fix(funnels): add missing query filters"

git add src/tools/surveys.ts tests/tools/surveys.test.ts
git commit -m "fix(surveys): remove nonexistent contactId param"
```

- [ ] **Step 7: Run the full suite to confirm no regressions**

Run: `npx vitest run` and `npm run typecheck` — expect PASS/clean.

---

## Task 4: `users.ts`

**Files:**
- Modify: `src/tools/users.ts`
- Modify: `tests/tools/users.test.ts`
- Reference: **Read "Task 4" in
  `docs/superpowers/specs/2026-08-04-v3-full-spec-remediation-design.md` in full.**

- [ ] **Step 1: Read the design spec's Task 4 section and the real `users-v3.json`
  schema**

```bash
python3 -c "
import json
f = json.load(open('/Users/nerdsnipe/WebstormProjects/highlevel-api-docs/apps/v3/users-v3.json'))
schemas = f['components']['schemas']
for name in schemas:
    if 'permission' in name.lower() or 'user' in name.lower():
        print(name)
"
```
Find the real `CreateUserDto`/`UpdateUserDto` (or equivalent) and their nested
permissions object; enumerate every real permission field name exactly.

- [ ] **Step 2: Fix `ghl_create_user`/`ghl_update_user`**

Rename `attributionReportEnabled` → `attributionsReportingEnabled`. Remove the 4
fabricated fields (`userCommsMgmtEnabled`, `auditLogsEnabled`, `leadSourcesEnabled`,
`agentLeaderboardEnabled`). Add the ~15 missing real permission fields plus
`scopes`/`scopesAssignedToOnly`, and the Minor fields (`profilePhoto`,
`twilioPhone`, `platformLanguage`, `locationIds`, password-reset fields on update) —
verify every field name and type against the real schema directly, the design spec
lists them but confirm exact spelling/type from the spec itself.

- [ ] **Step 3: Run users tests**

Update `tests/tools/users.test.ts` to cover the renamed/added/removed fields (TDD:
confirm RED against current code first where feasible, then fix, confirm GREEN).

Run: `npx vitest run tests/tools/users.test.ts`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/tools/users.ts tests/tools/users.test.ts
git commit -m "fix(users): correct permission field names, add missing real fields, remove fabricated ones"
```

- [ ] **Step 5: Run the full suite to confirm no regressions**

Run: `npx vitest run` and `npm run typecheck` — expect PASS/clean.

---

## Task 5: `products.ts`, `store.ts`, and `src/client.ts` (array query params)

**Files:**
- Modify: `src/tools/products.ts`, `src/tools/store.ts`, `src/client.ts`
- Modify: `tests/tools/products.test.ts`, `tests/tools/store.test.ts`,
  `tests/client.test.ts`
- Reference: **Read "Task 5" in
  `docs/superpowers/specs/2026-08-04-v3-full-spec-remediation-design.md` in full.**

This is the only task in the whole plan that touches `src/client.ts`.

- [ ] **Step 1: Read the design spec's Task 5 section and the real
  `products-v3.json`/`store-v3.json` schemas**

- [ ] **Step 2: Add repeated-key array query param support to `src/client.ts`**

Read `src/client.ts`'s current `ghlRequest` function and its `params` handling
(`URLSearchParams.set` per key). Extend the `params` option's type to also accept
`string[]` values, and when a value is an array, use `URLSearchParams.append` once
per element instead of `.set`. Write a failing test in `tests/client.test.ts` first
asserting that passing `params: { productIds: ['a', 'b'] }` produces a URL with
`productIds=a&productIds=b` (repeated keys), confirm RED, implement, confirm GREEN.
Do not change behavior for scalar (non-array) param values — this must be additive,
not a breaking change to every other tool's existing `params` usage.

- [ ] **Step 3: Run client tests, commit**

Run: `npx vitest run tests/client.test.ts` — expect PASS, then:
```bash
git add src/client.ts tests/client.test.ts
git commit -m "feat(client): support repeated-key array query params in ghlRequest"
```

- [ ] **Step 4: Fix `products.ts`**

Address every finding in the design spec's Task 5 → products.ts section: `taxes`,
`prices`, `digitalDelivery` type fixes (Critical); `productType`, `label`, `seo`,
price `type`, `recurring`, `meta`, bulk-update `price`/`compareAtPrice` typing
(Important); update `ghl_get_products` to pass `expand`/`productIds` as real arrays
to the new client capability from Step 2 instead of comma-joining. Fix the Minor
items (`medias`, `variants`, `membershipOffers`, `shippingOptions`, inventory
`items`) if time permits after the Critical/Important items are done.

- [ ] **Step 5: Run products tests, commit**

Run: `npx vitest run tests/tools/products.test.ts` — expect PASS (note: several
existing tests assert the WRONG shape today, e.g. `taxes: [{id:'tax1'}]` — fix these
test assertions as part of this step, don't just make new code pass old wrong
tests), then:
```bash
git add src/tools/products.ts tests/tools/products.test.ts
git commit -m "fix(products): correct array/object field types, enums, and array query param serialization"
```

- [ ] **Step 6: Fix `store.ts`**

Address the findings in the design spec's Task 5 → store.ts section.

- [ ] **Step 7: Run store tests, commit**

Run: `npx vitest run tests/tools/store.test.ts` — expect PASS, then:
```bash
git add src/tools/store.ts tests/tools/store.test.ts
git commit -m "fix(store): type shipping-rate source enums"
```

- [ ] **Step 8: Run the full suite to confirm no regressions**

Run: `npx vitest run` and `npm run typecheck` — expect PASS/clean.

---

## Task 6: `proposals.ts`, `brand_boards.ts`

**Files:**
- Modify: `src/tools/proposals.ts`, `src/tools/brand_boards.ts`
- Modify: `tests/tools/proposals.test.ts`, `tests/tools/brand_boards.test.ts`
- Reference: **Read "Task 6" in
  `docs/superpowers/specs/2026-08-04-v3-full-spec-remediation-design.md` in full.**

- [ ] **Step 1: Read the design spec's Task 6 section and the real
  `proposals-v3.json`/`brand-boards-v3.json` schemas**

- [ ] **Step 2: Fix `proposals.ts`**

Address `ccRecipients`, `notificationSettings` (Important), and `status`/
`paymentStatus` enum typing (Minor) per the design spec.

- [ ] **Step 3: Run proposals tests, commit**

Run: `npx vitest run tests/tools/proposals.test.ts` — expect PASS, then:
```bash
git add src/tools/proposals.ts tests/tools/proposals.test.ts
git commit -m "fix(proposals): type ccRecipients and notificationSettings, enum document/payment status"
```

- [ ] **Step 4: Fix `brand_boards.ts`**

Address `logos`/`colors`/`fonts` typing on both create and update tools per the
design spec (4 occurrences total across 2 tools).

- [ ] **Step 5: Run brand_boards tests, commit**

Run: `npx vitest run tests/tools/brand_boards.test.ts` — expect PASS, then:
```bash
git add src/tools/brand_boards.ts tests/tools/brand_boards.test.ts
git commit -m "fix(brand-boards): type logos/colors/fonts as proper objects"
```

- [ ] **Step 6: Run the full suite to confirm no regressions**

Run: `npx vitest run` and `npm run typecheck` — expect PASS/clean.

---

## Task 7: `voice_ai.ts`, `associations.ts`, `facebook_accounts.ts`, `google_campaigns.ts`

**Files:**
- Modify: `src/tools/voice_ai.ts`, `src/tools/associations.ts`,
  `src/tools/facebook_accounts.ts`, `src/tools/google_campaigns.ts`
- Modify: `tests/tools/voice_ai.test.ts`, `tests/tools/associations.test.ts`,
  `tests/tools/facebook_accounts.test.ts`, `tests/tools/google_campaigns.test.ts`
- Reference: **Read "Task 7" in
  `docs/superpowers/specs/2026-08-04-v3-full-spec-remediation-design.md` in full.**

Smaller cleanup items — the last of the recurring "small object flattened to
z.record()" pattern findings from the audit, plus one Minor array-param convention
fix.

- [ ] **Step 1: Read the design spec's Task 7 section and the real spec schemas**

`voice-ai-v3.json`'s `IntervalDTO`, `associations-v3.json`'s
`GET /associations/relations/{recordId}` `associationIds` param,
`ad-publishing-v3.json`'s `ThankYouPage`/`GreetingCard`/`CustomDisclaimer` (Facebook)
and `GoogleAssetsDTO` (Google).

- [ ] **Step 2: Fix `voice_ai.ts`**

Type `agentWorkingHours[].intervals` as a proper `z.object()` per the design spec.
Fix `dayOfTheWeek` enum if time permits.

- [ ] **Step 3: Run voice_ai tests, commit**

Run: `npx vitest run tests/tools/voice_ai.test.ts` — expect PASS, then:
```bash
git add src/tools/voice_ai.ts tests/tools/voice_ai.test.ts
git commit -m "fix(voice-ai): type agentWorkingHours intervals as proper object"
```

- [ ] **Step 4: Fix `associations.ts`**

Fix `ghl_get_association_relations`'s `associationIds` per the design spec.

- [ ] **Step 5: Run associations tests, commit**

Run: `npx vitest run tests/tools/associations.test.ts` — expect PASS, then:
```bash
git add src/tools/associations.ts tests/tools/associations.test.ts
git commit -m "fix(associations): array-typed associationIds matching codebase convention"
```

- [ ] **Step 6: Fix `facebook_accounts.ts`**

Type `thankYouPage`, `greetingCard`, `customDisclaimer` on
`ghl_create_facebook_page_form` per the design spec.

- [ ] **Step 7: Run facebook_accounts tests, commit**

Run: `npx vitest run tests/tools/facebook_accounts.test.ts` — expect PASS, then:
```bash
git add src/tools/facebook_accounts.ts tests/tools/facebook_accounts.test.ts
git commit -m "fix(facebook): type thankYouPage/greetingCard/customDisclaimer as proper objects"
```

- [ ] **Step 8: Fix `google_campaigns.ts`**

Type `assets` on `ghl_upsert_google_campaign` per the design spec.

- [ ] **Step 9: Run google_campaigns tests, commit**

Run: `npx vitest run tests/tools/google_campaigns.test.ts` — expect PASS, then:
```bash
git add src/tools/google_campaigns.ts tests/tools/google_campaigns.test.ts
git commit -m "fix(google): type campaign assets field as proper object"
```

- [ ] **Step 10: Run the full suite to confirm no regressions**

Run: `npx vitest run` and `npm run typecheck` — expect PASS/clean.

---

## Task 8: Final verification, README, and CHANGELOG

**Files:**
- Modify: `README.md`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Full-repo typecheck**

Run: `npm run typecheck`
Expected: PASS with zero errors.

- [ ] **Step 2: Full test suite**

Run: `npm test` (or `npx vitest run`)
Expected: PASS, all suites green. Read the actual final tool count from
`tests/server.test.ts` (should be 404 - 2 = 402 if `templates.ts`'s two tools were
removed in Task 3 — confirm against the live assertion, don't assume).

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: succeeds with no errors.

- [ ] **Step 4: Update README.md**

- Update the tool count (intro + "All N Tools" heading) to the actual final total if
  it changed (templates.ts tool removal).
- Update the `### Templates` Full Reference section to remove the two deleted
  tools' rows if present.
- Add a one-line note to the existing "Not yet covered" callout for
  `ghl_create_template`/`ghl_update_template`'s removal (nonexistent v3/legacy
  endpoints), matching the style of the existing `saas`/`marketplace`/`companies`/
  `snapshots`/`oauth` entries.
- No other README structural changes needed — this remediation didn't add/rename any
  other tools, only corrected internal schemas.

- [ ] **Step 5: Update CHANGELOG.md**

Add a "Spec-Fidelity Remediation" entry (not tied to a specific Phase number, since
this cuts across all of them) summarizing: the audit that triggered it (full
404-tool review against live v3 specs), the finding counts (24 Critical + ~35
Important + ~20 Minor), the file list touched, the `templates.ts` tool removal and
why, and the one `src/client.ts` capability addition (repeated-key array query
params). Emphasize that response handling was confirmed clean project-wide (no
changes needed there).

- [ ] **Step 6: Commit**

```bash
git add README.md CHANGELOG.md
git commit -m "docs: update README and changelog for spec-fidelity remediation"
```

**Do not bump `package.json`'s version or tag/publish.** Stop here and report completion.
