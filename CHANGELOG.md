# Changelog

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
