# GHL API v3 Migration — Phase 2c: AI/Communication Resource Coverage

**Status:** Approved for planning
**Scope:** Add tool coverage for the AI/Communication domain group: `conversation-ai`,
`voice-ai`, `chat-widget`, `agent-studio`. Third of five Phase 2 sub-phases (2a
Commerce done → 2b Marketing/Content done → **2c AI/Communication** → 2d Platform/Org →
2e ad-publishing).

## Background

Same pattern as 2a/2b: these four resources have zero tool coverage today. Unlike prior
sub-phases, all four are genuinely location-scoped and reachable with this server's
location-scoped PIT token — no exclusions needed this time. 42 raw operations, minus 3
explicitly-deprecated `agent-studio` duplicates = 39 operations, mapping to roughly
36-39 tools.

## Non-goals

- `agent-studio`'s 3 `GET/GET/POST /agent-studio/public-api/agents...` operations are
  explicitly marked `"Deprecated"` in their spec summaries — do not build tools for
  these; use the 8 non-deprecated `agent-studio/agent...` operations instead.
- No changes to Phase 1 / Phase 1 follow-ups / Phase 2a / Phase 2b modules.
- No new resources outside the four named above.

## Design conventions (unchanged from Phase 2a/2b)

- `ghl_<verb>_<noun>` naming, Zod `inputSchema`, `handler(args, config)` pattern, every
  `ghlRequest` call uses `version: GHL_VERSION_V3`.
- **Read the real schema before writing each tool.**
- `config.locationId` threading varies per-endpoint — verify per-operation. Note:
  `POST /conversation-ai/agents` (design research already found) has **no** `locationId`
  parameter anywhere (not body, not query) — the location is apparently inferred from
  the auth token itself for this endpoint. Verify this holds for the other
  `conversation-ai` operations too, and don't force-inject a `locationId` field where
  the real spec doesn't ask for one.
- **Disclose malformed/ambiguous upstream spec fields with a one-line code comment**
  inline as you write the tool (established discipline from 2a/2b — Phase 2b's final
  review flagged `proposals.ts` for partially skipping this; keep doing it consistently).
- File-per-resource, add each new tool array to `ALL_TOOLS` in `src/index.ts`, update
  `tests/server.test.ts`'s per-module `toHaveLength()`, the total, and the
  `expectedTools` manifest array (keep it accurate — this has been a recurring source of
  drift across all three prior sub-phases at least once).
- TDD throughout.

## File / tool breakdown

### `src/tools/conversation_ai.ts` (new) — 12 operations

- `ghl_create_conversation_ai_agent` — `POST /conversation-ai/agents` (required:
  `name`, `personality`, `goal`, `instructions` — no `locationId` param at all, verify
  and don't inject one)
- `ghl_search_conversation_ai_agents` — `GET /conversation-ai/agents/search`
- `ghl_get_conversation_ai_agent` — `GET /conversation-ai/agents/{agentId}`
- `ghl_update_conversation_ai_agent` — `PUT /conversation-ai/agents/{agentId}`
- `ghl_delete_conversation_ai_agent` — `DELETE /conversation-ai/agents/{agentId}`
- `ghl_attach_conversation_ai_action` — `POST /conversation-ai/agents/{agentId}/actions`
- `ghl_list_conversation_ai_agent_actions` — `GET /conversation-ai/agents/{agentId}/actions/list`
- `ghl_get_conversation_ai_agent_action` — `GET /conversation-ai/agents/{agentId}/actions/{actionId}`
- `ghl_update_conversation_ai_agent_action` — `PUT /conversation-ai/agents/{agentId}/actions/{actionId}`
- `ghl_remove_conversation_ai_agent_action` — `DELETE /conversation-ai/agents/{agentId}/actions/{actionId}`
- `ghl_update_conversation_ai_followup_settings` — `PATCH /conversation-ai/agents/{agentId}/followup-settings`
- `ghl_get_conversation_ai_generation` — `GET /conversation-ai/generations`

### `src/tools/voice_ai.ts` (new) — 11 operations

- Agent actions: `ghl_create_voice_ai_action`, `ghl_update_voice_ai_action`,
  `ghl_get_voice_ai_action`, `ghl_delete_voice_ai_action` (4 ops, all under
  `/voice-ai/actions...`)
- Agents: `ghl_create_voice_ai_agent` (required: `locationId` only — verify the rest are
  genuinely optional, this is another large-optional-field-set case like Phase 2b's
  blog/custom-menu creates, don't under-implement it),
  `ghl_get_voice_ai_agents`, `ghl_update_voice_ai_agent` (PATCH), `ghl_get_voice_ai_agent`,
  `ghl_delete_voice_ai_agent` (5 ops)
- Dashboard: `ghl_get_voice_ai_call_logs`, `ghl_get_voice_ai_call_log` (2 ops)

### `src/tools/chat_widget.ts` (new) — 8 operations

- `ghl_create_chat_widget` — `POST /chat-widget/` (required: `version`, `chatType`,
  `name`, `locationId`)
- `ghl_clone_chat_widget` — `POST /chat-widget/clone`
- `ghl_get_chat_widget` — `GET /chat-widget/data/{locationId}/{id}`
- `ghl_update_chat_widget` — `PUT /chat-widget/data/{locationId}/{id}`
- `ghl_patch_chat_widget` — `PATCH /chat-widget/data/{locationId}/{id}` (verify how this
  differs from `PUT` — if functionally redundant given a full-replace PUT already
  exists, still build both since the spec exposes both, but note the distinction in
  each tool's description)
- `ghl_list_chat_widgets` — `GET /chat-widget/list`
- `ghl_get_chat_widget_config` — `GET /chat-widget/public/config/{id}` (note: "public"
  in the path — verify whether this needs the same auth as other endpoints or is
  genuinely a public/unauthenticated-shape endpoint; if it doesn't need a token, still
  wire it the same way as everything else for consistency, just note it in the
  description)
- `ghl_delete_chat_widget` — `DELETE /chat-widget/{locationId}/{id}`

### `src/tools/agent_studio.ts` (new) — 8 operations (excludes 3 deprecated)

- `ghl_create_agent_studio_agent` — `POST /agent-studio/agent` (required: `locationId`,
  `status`, `version`)
- `ghl_list_agent_studio_agents` — `GET /agent-studio/agent`
- `ghl_get_agent_studio_agent` — `GET /agent-studio/agent/{agentId}`
- `ghl_update_agent_studio_agent_metadata` — `PATCH /agent-studio/agent/{agentId}`
- `ghl_delete_agent_studio_agent` — `DELETE /agent-studio/agent/{agentId}`
- `ghl_update_agent_studio_agent_version` — `PATCH /agent-studio/agent/versions/{versionId}`
  (distinct from the metadata-update above — this updates the versioned agent
  definition itself, e.g. `nodes`/`edges`; verify and describe the distinction clearly)
- `ghl_publish_agent_studio_agent` — `POST /agent-studio/agent/versions/{versionId}/publish`
- `ghl_execute_agent_studio_agent` — `POST /agent-studio/agent/{agentId}/execute`

`nodes`/`edges` (agent-studio's workflow graph definition) are almost certainly complex
nested structures — model permissively (`z.array(z.record(z.unknown()))` or similar)
per the established Phase 2a/2b precedent for deeply nested bodies, don't attempt to
fully type out a workflow graph schema.

## Testing

Every new file gets a corresponding `tests/tools/<module>.test.ts` written test-first,
following the established pattern: `getTool` helper, `mockFetchSuccess`/
`mockFetchError`, `parseLastFetchCall`, assert `method`/`pathname`/`params`/`body`/
`headers.Version` per tool, plus an error-path test per tool.

## Rollout

- No new environment variables.
- Update `CHANGELOG.md` with a "Phase 2c — AI/Communication" entry.
- `README.md`: bump tool count, add category-table rows. No new "not yet covered"
  exclusions this phase.
- No `package.json` version bump, no tag, no publish — requires explicit human approval.
