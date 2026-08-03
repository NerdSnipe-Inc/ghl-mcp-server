# Changelog

## Unreleased — v3 migration

User-visible contract changes introduced by the GHL API v3 migration:

- `ghl_create_email_campaign` now creates a draft only (no `subject`/`scheduledAt` in one call), and requires `userId`.
- `ghl_get_email_builder_templates`'s `sortByDate` param was renamed to `sortOrder` (old param name is now silently ignored — pass `sortOrder` instead), and the default `limit` changed from 25 to 10.
- `ghl_update_user` still accepts an `email` field in its input but v3 silently ignores it server-side (GHL deprecated updating email this way) — the call will succeed but the email won't change.
