# GoHighLevel MCP Server

> Give any AI agent — Claude, Cursor, Windsurf, or any MCP-compatible client — full access to your GoHighLevel account through natural language.

[![npm version](https://img.shields.io/npm/v/@nerdsnipe-inc/ghl-mcp-server)](https://www.npmjs.com/package/@nerdsnipe-inc/ghl-mcp-server)
[![npm downloads](https://img.shields.io/npm/dm/@nerdsnipe-inc/ghl-mcp-server)](https://www.npmjs.com/package/@nerdsnipe-inc/ghl-mcp-server)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)
[![MCP](https://img.shields.io/badge/protocol-MCP-purple)](https://modelcontextprotocol.io)
[![GoHighLevel](https://img.shields.io/badge/API-GHL%20v3-orange)](https://marketplace.gohighlevel.com/docs/)
[![MCP Badge](https://lobehub.com/badge/mcp/nerdsnipe-inc-ghl-mcp-server)](https://lobehub.com/mcp/nerdsnipe-inc-ghl-mcp-server)

---

[![Sponsor NerdSnipe-Inc](https://img.shields.io/badge/Sponsor-NerdSnipe--Inc-ea4aaa?logo=githubsponsors&logoColor=white)](https://github.com/sponsors/NerdSnipe-Inc)

> ghl-mcp-server is free and open source. If it saved you time, [sponsoring NerdSnipe Inc](https://github.com/sponsors/NerdSnipe-Inc) pays for the maintenance, bug fixes and new releases that keep it working.

## What is this?

This is a **[Model Context Protocol (MCP)](https://modelcontextprotocol.io) server** that connects your AI tools directly to your GoHighLevel (GHL) sub-account via the GHL API v3.

Once installed, you can talk to your CRM naturally:

> *"Find all contacts tagged 'cold-lead' and send them an SMS saying we have a new offer"*
> *"Book an appointment for Sarah Johnson tomorrow at 2pm on the Discovery calendar"*
> *"Move any open opportunities in Stage 1 that haven't been touched in 14 days to 'Lost'"*
> *"Create a note on John's contact record and enroll him in the cold call workflow"*

**401 tools** covering the full GHL API:

| Category                       | Tools                                                                       |
|--------------------------------|-----------------------------------------------------------------------------|
| Contacts                       | CRUD, search, upsert, tags, notes, tasks, workflow enrollment, appointments |
| Conversations & Messaging      | Search, send SMS/email/WhatsApp, schedule, message history                  |
| Calendars & Appointments       | List calendars, check availability, book, reschedule, block slots           |
| Opportunities / Pipeline       | Pipelines, deals, stage moves, won/lost/abandoned                           |
| Workflows & Campaigns          | List workflows and campaigns                                                |
| Location Settings              | Custom fields, custom values, tags, users, templates, forms, surveys        |
| Email Marketing                | Email builder templates, email campaigns, scheduling                        |
| Funnels                        | List funnels, pages, page counts                                            |
| Phone Numbers                  | List, search, purchase, update, release phone numbers                       |
| Payments & Invoices            | Orders, transactions, subscriptions, coupons, invoices, payments            |
| Social & Media                 | Social posts, media library, trigger links                                  |
| Social Planner                 | Content queues & scheduling, comment moderation, OAuth account connection, CSV bulk-import posting, post/statistics (see note below) |
| Knowledge Base, FAQs & Crawler | Create/manage knowledge bases, FAQ pairs, and AI-train websites via crawler |
| Products, Collections & Reviews | Products, prices, inventory, collections, reviews, store visibility & priority |
| Store & Shipping               | Shipping carriers, zones, rates, and store settings                        |
| Affiliates                     | List affiliates, commissions, and payouts                                  |
| Email Verification             | Single-use email address verification (deliverability check)               |
| Blogs                           | Authors, categories, sites, posts, slug checks, create/update posts        |
| Courses & Proposals             | Import courses; proposal/estimate documents and templates                  |
| Brand Boards & Voices           | Brand boards (logos/colors/fonts) and brand voices, incl. defaults         |
| Custom Menus                    | Custom menu links: list, get, create, update, delete                       |
| Conversation AI                 | CRUD conversation AI agents, attach/manage agent actions, follow-up settings, generation |
| Voice AI                        | CRUD voice AI agents & actions, call logs                                  |
| Chat Widget                     | CRUD chat widgets, clone, config, list                                     |
| Agent Studio                    | CRUD Agent Studio agents, versioning, publish, execute                     |
| Businesses                      | CRUD businesses within a location                                          |
| Associations                    | CRUD associations and association relations between records                |
| Objects                         | Get/update custom object schemas, list objects, CRUD & search object records |
| Facebook Ads                    | Ad accounts, page/Instagram/integration setup, campaigns, ad sets, ads, custom audiences, pixels, lead & conversation forms, reporting, targeting search (48 tools) |
| Google Ads                      | Ad accounts, integration, campaigns, creative assets, keyword ideas, audiences, segments, conversion actions, reporting, targeting search (31 tools) |
| LinkedIn Ads                    | Ad accounts, integration, campaign groups, lead forms, reporting, targeting search (16 tools) |

> **Not yet covered:** the following GHL API v3 resources require credentials this
> server doesn't have (agency-level or Marketplace-app-developer identity, not a
> location-scoped Private Integration Token) and are intentionally left unbuilt:
> - `saas` — agency-level SaaS mode, rebilling, wallet balances. See
>   `docs/superpowers/specs/2026-08-04-v3-phase2a-commerce-design.md`.
> - `marketplace` — app installs/uninstalls, billing-wallet charges, rebilling config.
>   See `docs/superpowers/specs/2026-08-04-v3-phase2b-marketing-design.md`.
> - `companies` — agency/company-level account details. Requires agency-level
>   credentials; this server authenticates via a location-scoped PIT token and has
>   no agency-level identity.
> - `snapshots` — agency-level snapshot push/share/status operations. Same
>   agency-only credential requirement.
> - `oauth` — Marketplace app installation/token endpoints. Requires a
>   Marketplace-app-developer identity, not a location-scoped PIT token.
>
> If you need any of these and have the right credential type, please
> [open an issue](https://github.com/NerdSnipe-Inc/ghl-mcp-server/issues) requesting it.

> **Also not covered (no credential issue — the endpoint doesn't exist):**
> `ghl_create_template`/`ghl_update_template` were removed. The v3 (and legacy)
> `/locations/{locationId}/templates` resource only exposes `GET` (list) and
> `DELETE`; no `POST`/`PUT` operation exists anywhere in the spec for creating or
> updating a template. This was verified via an exhaustive sweep of every v3 and
> legacy spec file. `ghl_get_templates`/`ghl_delete_template` remain fully
> supported.

---

## Prerequisites

Before you begin, make sure you have:

- **Node.js 18 or later** — [download here](https://nodejs.org/en/download)
- **A [GoHighLevel](https://www.gohighlevel.com/?fp_ref=nerdsnipe-inc) account** with sub-account access
- **A GHL Private Integration Token** (takes ~2 minutes to create — see below)

### How to get your GHL credentials

#### 1. Private Integration Token (GHL_PIT_TOKEN)

1. Log in to GoHighLevel and navigate to your **sub-account** (not the agency dashboard)
2. Go to **Settings → Private Integrations**
3. Click **+ Create New Integration**
4. Give it a name (e.g. `AI Agent`) and select all the scopes you want to grant
5. Click **Create** — copy the token that appears (you won't see it again)

> ⚠️ Keep this token secret. It grants full API access to your sub-account.

#### 2. Location ID (GHL_LOCATION)

Your Location ID is in the URL when you're inside your sub-account:

```
https://app.gohighlevel.com/location/XXXXXXXXXXXXXXXXXX/dashboard
                                     ^^^^^^^^^^^^^^^^^^
                                     This is your Location ID
```

---

## Installation

No build step needed. Pass your credentials directly in your AI client config and the server runs on demand.

### Quick install via package manager (recommended)

Use `npx`, `pnpm dlx`, or `bunx` to run the server without installing anything globally:

```bash
# npm / npx  (no install required)
npx @nerdsnipe-inc/ghl-mcp-server

# pnpm
pnpm dlx @nerdsnipe-inc/ghl-mcp-server

# bun
bunx @nerdsnipe-inc/ghl-mcp-server
```

Or install it globally if you prefer:

```bash
npm install -g @nerdsnipe-inc/ghl-mcp-server
# then run:
ghl-mcp-server
```

### Connect to your AI tool

Pick your AI client below and follow the instructions.

---

## Connecting to AI Clients

### Claude Desktop

Open (or create) your Claude Desktop config file:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "ghl": {
      "command": "npx",
      "args": ["-y", "@nerdsnipe-inc/ghl-mcp-server"],
      "env": {
        "GHL_PIT_TOKEN": "your_token_here",
        "GHL_LOCATION": "your_location_id_here"
      }
    }
  }
}
```

Restart Claude Desktop. You should see a hammer icon (🔨) in the chat input — that means MCP tools are active.

---

### Claude Code (CLI)

Run this from your terminal to add the server to your Claude Code config:

```bash
claude mcp add ghl npx -- -y @nerdsnipe-inc/ghl-mcp-server \
  -e GHL_PIT_TOKEN=your_token_here \
  -e GHL_LOCATION=your_location_id_here
```

Or add it manually to `~/.claude/mcp_servers.json` (or your project's `.mcp.json`):

```json
{
  "mcpServers": {
    "ghl": {
      "command": "npx",
      "args": ["-y", "@nerdsnipe-inc/ghl-mcp-server"],
      "env": {
        "GHL_PIT_TOKEN": "your_token_here",
        "GHL_LOCATION": "your_location_id_here"
      }
    }
  }
}
```

> **Project-scoped tip:** Add a `.mcp.json` in your project root so everyone on the team picks it up automatically — no local install required. Add `.mcp.json` to `.gitignore` so tokens aren't committed. If you store credentials in a `.env` file you can omit the `env` block entirely.

---

### Cursor

1. Open Cursor Settings → **MCP** (or press `Cmd+Shift+P` → "Open MCP Settings")
2. Click **Add Server** and fill in:

```json
{
  "name": "ghl",
  "command": "npx",
  "args": ["-y", "@nerdsnipe-inc/ghl-mcp-server"],
  "env": {
    "GHL_PIT_TOKEN": "your_token_here",
    "GHL_LOCATION": "your_location_id_here"
  }
}
```

3. Save and restart Cursor.

---

### Windsurf

Open `~/.codeium/windsurf/mcp_config.json` and add:

```json
{
  "mcpServers": {
    "ghl": {
      "command": "npx",
      "args": ["-y", "@nerdsnipe-inc/ghl-mcp-server"],
      "env": {
        "GHL_PIT_TOKEN": "your_token_here",
        "GHL_LOCATION": "your_location_id_here"
      }
    }
  }
}
```

---

### Any other MCP-compatible client

This server uses **stdio transport** — the standard for local MCP servers. Your client needs:

- **Command**: `npx`
- **Args**: `["-y", "@nerdsnipe-inc/ghl-mcp-server"]`
- **Env**: `GHL_PIT_TOKEN` and `GHL_LOCATION`

Refer to your client's MCP documentation for exact config syntax.

---

## Running from source (contributors)

If you've cloned the repo and want to run directly from TypeScript without a build step:

```bash
git clone https://github.com/Nerdsnipe-Inc/ghl-mcp-server.git
cd ghl-mcp-server
npm install
```

Then point your MCP client at the source via `tsx`:

```json
{
  "command": "npx",
  "args": ["tsx", "/absolute/path/to/ghl-mcp-server/src/index.ts"]
}
```

Or build first for production use:

```bash
npm run build
# then run:
node dist/index.js
```

---

## All 401 Tools — Full Reference

### Contacts

| Tool                               | Description                                           |
|------------------------------------|-------------------------------------------------------|
| `ghl_get_contact`                  | Get a single contact by ID                            |
| `ghl_create_contact`               | Create a new contact                                  |
| `ghl_update_contact`               | Update contact fields                                 |
| `ghl_upsert_contact`               | Create or update by email/phone (prevents duplicates) |
| `ghl_delete_contact`               | Permanently delete a contact                          |
| `ghl_search_contacts`              | Advanced search with filter conditions                |
| `ghl_add_contact_tags`             | Add tags to a contact                                 |
| `ghl_remove_contact_tags`          | Remove tags from a contact                            |
| `ghl_get_contact_notes`            | List all notes on a contact                           |
| `ghl_create_contact_note`          | Add a note to a contact                               |
| `ghl_update_contact_note`          | Update an existing note                               |
| `ghl_delete_contact_note`          | Delete a note                                         |
| `ghl_get_contact_tasks`            | List tasks for a contact                              |
| `ghl_create_contact_task`          | Create a task for a contact                           |
| `ghl_update_contact_task`          | Update a task (status, due date, etc.)                |
| `ghl_delete_contact_task`          | Delete a task                                         |
| `ghl_add_contact_to_workflow`      | Enroll a contact in a workflow/automation             |
| `ghl_remove_contact_from_workflow` | Remove a contact from a workflow                      |
| `ghl_get_contact_appointments`     | Get all appointments for a contact                    |

### Conversations & Messaging

| Tool                           | Description                                         |
|--------------------------------|-----------------------------------------------------|
| `ghl_search_conversations`     | Search conversations by contact, status, or channel |
| `ghl_get_conversation`         | Get a conversation by ID                            |
| `ghl_create_conversation`      | Open a new conversation thread                      |
| `ghl_get_messages`             | List messages in a conversation                     |
| `ghl_send_message`             | Send SMS, email, WhatsApp, or other channel message |
| `ghl_send_email`               | Send an email within an existing conversation       |
| `ghl_update_message_status`    | Mark messages read/unread/delivered                 |
| `ghl_cancel_scheduled_message` | Cancel a scheduled (future) message                 |
| `ghl_add_inbound_message`      | Inject an inbound message (testing/simulation)      |

### Calendars & Appointments

| Tool                        | Description                                       |
|-----------------------------|---------------------------------------------------|
| `ghl_get_calendars`         | List all calendars                                |
| `ghl_get_calendar`          | Get a calendar by ID                              |
| `ghl_get_free_slots`        | Check available appointment slots in a date range |
| `ghl_get_calendar_events`   | Get events/appointments in a date range           |
| `ghl_create_appointment`    | Book an appointment                               |
| `ghl_get_appointment`       | Get an appointment by event ID                    |
| `ghl_update_appointment`    | Reschedule, change status, or add notes           |
| `ghl_delete_calendar_event` | Delete an event or appointment                    |
| `ghl_create_block_slot`     | Block a time period on a calendar                 |
| `ghl_get_calendar_groups`   | List calendar groups                              |

### Opportunities / Pipeline

| Tool                            | Description                                         |
|---------------------------------|-----------------------------------------------------|
| `ghl_get_pipelines`             | List all pipelines and their stages                 |
| `ghl_search_opportunities`      | Search deals by contact, stage, pipeline, or status |
| `ghl_get_opportunity`           | Get a single opportunity                            |
| `ghl_create_opportunity`        | Create a new deal                                   |
| `ghl_update_opportunity`        | Update deal fields (stage, value, assignee)         |
| `ghl_update_opportunity_status` | Quickly mark a deal won/lost/abandoned              |
| `ghl_upsert_opportunity`        | Create or update a deal                             |
| `ghl_delete_opportunity`        | Delete a deal                                       |

### Workflows & Campaigns

| Tool                | Description                                       |
|---------------------|---------------------------------------------------|
| `ghl_get_workflows` | List all workflows (use to discover workflow IDs) |
| `ghl_get_campaigns` | List all campaigns                                |

> Enrolling contacts in workflows is done via `ghl_add_contact_to_workflow`.

### Email Marketing

| Tool                              | Description                                                              |
|-----------------------------------|--------------------------------------------------------------------------|
| `ghl_get_email_builder_templates` | List all email builder templates in the location                         |
| `ghl_get_email_builder_template`  | Get a single email builder template by ID                                |
| `ghl_create_email_builder_template` | Create a new email builder template with HTML content                  |
| `ghl_update_email_builder_template` | Update an existing email builder template's HTML content               |
| `ghl_delete_email_builder_template` | Delete an email builder template by ID                                 |
| `ghl_get_email_campaigns`         | List all email campaigns in the location                                 |
| `ghl_get_email_campaign`          | Get details of a single email campaign by ID                             |
| `ghl_create_email_campaign`       | Create a new email campaign as a **draft** (v3 does not accept `subject`/`scheduledAt` in this call); pair with `ghl_schedule_email_campaign` to set the subject, recipients, and send time; `userId` is required |
| `ghl_schedule_email_campaign`     | Schedule (or immediately send) a draft campaign — sets subject, sender, recipients, and send timing (`immediate`, `scheduled`, `batch`, `rss`, or `smart_send`) |
| `ghl_delete_email_campaign`       | Delete an email campaign by ID                                           |

### Funnels

| Tool                      | Description                                        |
|---------------------------|----------------------------------------------------|
| `ghl_get_funnels`         | List all funnels in the location                   |
| `ghl_get_funnel_pages`    | List all pages in a specific funnel                |
| `ghl_get_funnel_page_count` | Get the total count of pages in a funnel         |

### Phone Numbers

| Tool                             | Description                                                                   |
|----------------------------------|-------------------------------------------------------------------------------|
| `ghl_get_phone_numbers`          | List all purchased/active phone numbers in the location                       |
| `ghl_search_available_phone_numbers` | Search for available numbers to purchase (filter by area code, country, type) |
| `ghl_purchase_phone_number`      | Purchase a phone number for the location (E.164 format, e.g. `+16135550100`) |
| `ghl_update_phone_number`        | Update settings for a phone number (assignment, call forwarding)              |
| `ghl_release_phone_number`       | Release (delete) a phone number from the location                             |

### Surveys

| Tool                        | Description                                          |
|-----------------------------|------------------------------------------------------|
| `ghl_get_surveys`           | List all surveys created in the location             |
| `ghl_get_survey_submissions`| Get submissions for a survey, with optional filters  |

### Location Settings

| Tool                       | Description                                   |
|----------------------------|-----------------------------------------------|
| `ghl_get_location`         | Get location/sub-account details              |
| `ghl_get_location_tags`    | List all tags in the location                 |
| `ghl_create_location_tag`  | Create a new tag                              |
| `ghl_delete_location_tag`  | Delete a tag                                  |
| `ghl_get_custom_fields`    | List custom contact fields                    |
| `ghl_create_custom_field`  | Create a custom field                         |
| `ghl_update_custom_field`  | Update a custom field                         |
| `ghl_delete_custom_field`  | Delete a custom field                         |
| `ghl_get_custom_values`    | List custom values (location-level variables)                   |
| `ghl_create_custom_value`  | Create a custom value                                           |
| `ghl_update_custom_value`  | Update a custom value                                           |
| `ghl_delete_custom_value`  | Delete a custom value by ID                                     |
| `ghl_get_users`            | List all team members                                           |
| `ghl_search_users`         | Search users by name or email                                   |
| `ghl_get_user`             | Get a single team member by user ID                             |
| `ghl_create_user`          | Create a new team member in the location                        |
| `ghl_update_user`          | Update an existing team member                                  |
| `ghl_delete_user`          | Remove a team member from the location                          |
| `ghl_get_templates`        | List SMS/email/WhatsApp templates                               |
| `ghl_delete_template`      | Delete a template by ID                                         |
| `ghl_get_forms`            | List all forms                                                  |
| `ghl_get_form_submissions` | Get form submissions                                            |

### Payments & Invoices

| Tool                         | Description                           |
|------------------------------|---------------------------------------|
| `ghl_get_orders`             | List payment orders                   |
| `ghl_get_order`              | Get a single order                    |
| `ghl_get_transactions`       | List payment transactions             |
| `ghl_get_subscriptions`      | List active subscriptions             |
| `ghl_get_coupons`            | List coupons                          |
| `ghl_create_coupon`          | Create a discount coupon              |
| `ghl_get_invoices`           | List invoices                         |
| `ghl_get_invoice`            | Get a single invoice                  |
| `ghl_create_invoice`         | Create a new invoice                  |
| `ghl_send_invoice`           | Email an invoice to the contact       |
| `ghl_void_invoice`           | Void (cancel) an invoice              |
| `ghl_record_invoice_payment` | Record a manual payment on an invoice |

### Social & Media

> These 4 `ghl_*_social_*`/media/trigger-link tools were built in Phase 1 against a
> small slice of the `/social-media-posting/` resource. The **Social Planner**
> sections below (Phase 2e) cover the other 41 operations on that same resource —
> content queues, comment moderation, OAuth account connection, CSV bulk-import, and
> the remaining post/statistics endpoints. The two use different naming conventions
> (`social.ts` vs. `social_planner_*.ts`) because they were designed in separate
> phases; together they cover all 45 `social-planner-v3.json` operations.

| Tool                      | Description                             |
|---------------------------|-----------------------------------------|
| `ghl_get_social_accounts` | List connected social media accounts    |
| `ghl_get_social_posts`    | List scheduled or published posts       |
| `ghl_create_social_post`  | Schedule or publish a social media post |
| `ghl_delete_social_post`  | Delete a scheduled post                 |
| `ghl_get_media_files`     | List files in the media library         |
| `ghl_delete_media_file`   | Delete a file from the media library    |
| `ghl_get_trigger_links`   | List trigger links                      |
| `ghl_create_trigger_link` | Create a trigger link                   |
| `ghl_delete_trigger_link` | Delete a trigger link                   |

### Social Planner Queues

Content queue creation/configuration, queue items, edit sessions, calendar views, and slots (Phase 2e — see note above).

| Tool                              | Description                                                                        |
|------------------------------------|-------------------------------------------------------------------------------------|
| `ghl_create_social_queue`          | Create a content queue for a social media category                                 |
| `ghl_get_social_queue_categories`  | List social media categories available for creating queues                         |
| `ghl_list_social_queues`           | List content queues for the location                                               |
| `ghl_get_social_queue_calendar`    | Fetch a calendar view of queued posts                                              |
| `ghl_delete_social_queue_active_post` | Delete the currently active queue post and schedule the next one                |
| `ghl_get_social_queue`             | Get a content queue by ID                                                          |
| `ghl_update_social_queue`          | Update a content queue                                                             |
| `ghl_create_social_queue_item`     | Create a new item in a content queue                                               |
| `ghl_get_social_queue_edit_calendar` | Fetch a calendar view of an active edit session                                  |
| `ghl_discard_social_queue_edit`    | Discard an active queue edit session                                               |
| `ghl_save_social_queue_edit`       | Save an active queue edit session                                                  |
| `ghl_start_social_queue_edit`      | Start a new edit session for a content queue                                       |
| `ghl_get_social_queue_items`       | List items in a content queue                                                      |
| `ghl_delete_social_queue_item`     | Delete an item from a content queue                                                |
| `ghl_update_social_queue_item`     | Update an item in a content queue                                                  |
| `ghl_clone_social_queue_item`      | Clone an item in a content queue                                                   |
| `ghl_reset_social_queue_item`      | Reset an item in a content queue back to its original state                        |
| `ghl_get_social_queue_slots`       | List available posting slots for a content queue                                   |

### Social Planner Comments

Comment moderation on social media posts (Phase 2e — see note above).

| Tool                        | Description                                          |
|------------------------------|--------------------------------------------------------|
| `ghl_create_social_comment`  | Create a new comment on a social media post           |
| `ghl_list_social_comments`   | List comments for one or more social media posts      |
| `ghl_like_social_comment`    | Like a social media comment                            |
| `ghl_unlike_social_comment`  | Unlike a social media comment                          |

### Social Planner Accounts

OAuth account connection flow, plus account/category/tag management (Phase 2e — see note above).

| Tool                              | Description                                                                       |
|------------------------------------|--------------------------------------------------------------------------------------|
| `ghl_start_social_oauth`           | Step 1 of 3: start OAuth for a social platform                                      |
| `ghl_get_social_oauth_accounts`    | Step 2 of 3: list the pages/channels/locations available to connect                 |
| `ghl_connect_social_oauth_account` | Step 3 of 3: connect the account/page selected in step 2 to this location           |
| `ghl_delete_social_account`        | Delete a connected social media account (and remove it from its group)              |
| `ghl_set_social_accounts`          | Associate connected social accounts with an already-uploaded CSV bulk-import job    |
| `ghl_get_social_categories`        | List social media categories for this location                                     |
| `ghl_get_social_category`          | Get a single social media category by ID                                            |
| `ghl_get_social_tags`              | List social media tags for this location                                            |
| `ghl_get_social_tags_by_ids`       | Get multiple social media tags by their IDs                                         |

### Social Planner Posts

CSV bulk-import posting, remaining post operations, and statistics (Phase 2e — see note above).

| Tool                             | Description                                                                          |
|-----------------------------------|------------------------------------------------------------------------------------------|
| `ghl_upload_social_csv`           | Step 1 of the CSV bulk-import flow: upload a CSV file of social media posts             |
| `ghl_get_social_csv_upload_status`| List CSV bulk-import jobs (uploads) for this location                                   |
| `ghl_get_social_csv_post`         | Get the parsed rows/posts of a single CSV bulk-import job by ID                         |
| `ghl_finalize_social_csv`         | Finalize (commit) a CSV bulk-import job, scheduling/publishing its parsed posts          |
| `ghl_delete_social_csv`           | Delete a CSV bulk-import job entirely (all its parsed posts)                            |
| `ghl_delete_social_csv_post`      | Delete a single post row from a CSV bulk-import job                                     |
| `ghl_bulk_delete_social_posts`    | Delete multiple social media posts by ID in a single request                            |
| `ghl_get_social_post`             | Get a single social media post by ID                                                    |
| `ghl_update_social_post`          | Update an existing social media post (content, schedule, status, media, etc.)           |
| `ghl_get_social_statistics`       | Get engagement/analytics statistics for connected social accounts                       |

### Knowledge Bases

| Tool                          | Description                                                                                   |
|-------------------------------|-----------------------------------------------------------------------------------------------|
| `ghl_list_knowledge_bases`    | List all knowledge bases for the location with cursor-based pagination                        |
| `ghl_get_knowledge_base`      | Get a single knowledge base by ID — includes metadata counts (FAQs, URLs, files)             |
| `ghl_create_knowledge_base`   | Create a new knowledge base (max 15 per location)                                             |
| `ghl_update_knowledge_base`   | Update the name or description of an existing knowledge base                                  |
| `ghl_delete_knowledge_base`   | Permanently delete a knowledge base and all its content (FAQs, trained URLs, etc.)           |

### FAQs

| Tool              | Description                                                                                   |
|-------------------|-----------------------------------------------------------------------------------------------|
| `ghl_list_faqs`   | List all FAQ question/answer pairs for a knowledge base with cursor-based pagination          |
| `ghl_create_faq`  | Add a new FAQ question and answer to a knowledge base                                         |
| `ghl_update_faq`  | Update the question and answer text of an existing FAQ                                        |
| `ghl_delete_faq`  | Permanently delete an FAQ by ID                                                               |

### Web Crawler

Use the crawler to discover and ingest website pages as AI training data for a knowledge base. The typical flow is: **discover → check status → train**.

| Tool                      | Description                                                                                                          |
|---------------------------|----------------------------------------------------------------------------------------------------------------------|
| `ghl_discover_website`    | Start crawling a website to discover pages. Choose scope: `Exact` (one URL), `Path` (sub-paths), or `Domain` (all). Returns an `operationId` |
| `ghl_get_crawler_status`  | Check progress of a crawl job by `operationId` — returns per-URL status (Pending, Successful, Failed, etc.)          |
| `ghl_list_crawler_urls`   | List all trained page links for a knowledge base. Use to retrieve `urlIds` for training or deletion                  |
| `ghl_train_crawler_urls`  | Ingest discovered pages into the knowledge base for AI training using `urlIds` from the crawler                      |
| `ghl_delete_crawler_urls` | Remove previously trained page URLs from a knowledge base by `urlIds`                                                |

### Products, Collections & Reviews

| Tool                               | Description                                                    |
|-------------------------------------|------------------------------------------------------------------|
| `ghl_get_products`                 | List/search products in the location                           |
| `ghl_get_product`                  | Get a single product by ID                                     |
| `ghl_create_product`               | Create a new product                                            |
| `ghl_update_product`               | Update an existing product                                      |
| `ghl_delete_product`               | Delete a product                                                 |
| `ghl_bulk_update_products`         | Bulk-update multiple products (price, availability, etc.) — also supports bulk-delete |
| `ghl_bulk_edit_product_prices`     | Bulk-edit prices across multiple products                       |
| `ghl_get_product_prices`           | List prices for a product                                       |
| `ghl_get_product_price`            | Get a single price by ID                                        |
| `ghl_create_product_price`         | Add a new price to a product                                    |
| `ghl_update_product_price`         | Update an existing price                                        |
| `ghl_delete_product_price`         | Delete a price                                                  |
| `ghl_get_product_inventory`        | Get inventory levels for products                               |
| `ghl_update_product_inventory`     | Update inventory counts for products                            |
| `ghl_get_product_collections`      | List product collections                                        |
| `ghl_get_product_collection`       | Get a single collection by ID                                   |
| `ghl_create_product_collection`    | Create a new product collection                                 |
| `ghl_update_product_collection`    | Update a product collection                                     |
| `ghl_delete_product_collection`    | Delete a product collection                                     |
| `ghl_get_product_reviews`          | List reviews for a product                                      |
| `ghl_get_product_review_count`     | Get the total review count (with optional filters)              |
| `ghl_bulk_update_product_reviews`  | Bulk-update review status (e.g. publish/hide) across reviews     |
| `ghl_update_product_review`        | Update a single review                                          |
| `ghl_delete_product_review`        | Delete a review                                                  |
| `ghl_set_product_store_visibility` | Show/hide a product in the storefront                           |
| `ghl_update_product_store_priority`| Change a product's sort priority in the storefront               |
| `ghl_get_product_store_stats`      | Get storefront stats for products                                |

### Store & Shipping

| Tool                              | Description                                    |
|------------------------------------|-------------------------------------------------|
| `ghl_get_shipping_carriers`       | List shipping carriers configured for the store |
| `ghl_create_shipping_carrier`     | Add a new shipping carrier                      |
| `ghl_get_shipping_carrier`        | Get a single shipping carrier by ID             |
| `ghl_update_shipping_carrier`     | Update a shipping carrier                       |
| `ghl_delete_shipping_carrier`     | Delete a shipping carrier                       |
| `ghl_get_shipping_zones`          | List shipping zones                             |
| `ghl_create_shipping_zone`        | Create a new shipping zone                      |
| `ghl_get_shipping_zone`           | Get a single shipping zone by ID                |
| `ghl_update_shipping_zone`        | Update a shipping zone                          |
| `ghl_delete_shipping_zone`        | Delete a shipping zone                          |
| `ghl_get_available_shipping_rates`| Get rates available for a given shipment        |
| `ghl_get_shipping_rates`          | List configured shipping rates                  |
| `ghl_create_shipping_rate`        | Create a new shipping rate                      |
| `ghl_get_shipping_rate`           | Get a single shipping rate by ID                |
| `ghl_update_shipping_rate`        | Update a shipping rate                          |
| `ghl_delete_shipping_rate`        | Delete a shipping rate                          |
| `ghl_get_store_settings`          | Get store-wide settings                         |
| `ghl_update_store_settings`       | Update store-wide settings                      |

### Affiliates

| Tool                            | Description                          |
|----------------------------------|---------------------------------------|
| `ghl_get_affiliates`            | List affiliates in the location       |
| `ghl_get_affiliate`             | Get a single affiliate by ID          |
| `ghl_get_affiliate_commissions` | List commissions earned by affiliates |
| `ghl_get_affiliate_payouts`     | List payouts made to affiliates       |

### Email Verification

| Tool               | Description                                              |
|---------------------|------------------------------------------------------------|
| `ghl_verify_email`  | Verify an email address's deliverability (single-use ISV check) |

### Blogs

| Tool                      | Description                                                     |
|---------------------------|-------------------------------------------------------------------|
| `ghl_get_blog_authors`    | List blog authors for the location                                |
| `ghl_get_blog_categories` | List blog categories for the location                             |
| `ghl_get_blogs`           | List blog sites for the location                                  |
| `ghl_get_blog_posts`      | List posts for a blog, with search and status filtering           |
| `ghl_check_blog_url_slug` | Check whether a URL slug is already in use by another blog post   |
| `ghl_create_blog_post`    | Create a new blog post                                            |
| `ghl_update_blog_post`    | Update an existing blog post                                      |

### Courses & Proposals

| Tool                          | Description                                                        |
|-------------------------------|-----------------------------------------------------------------------|
| `ghl_import_courses`          | Import courses with lessons and modules from product objects          |
| `ghl_get_proposal_documents`  | List proposal/estimate documents, with status/date/search filtering   |
| `ghl_send_proposal_document`  | Send a proposal/estimate document to a client                         |
| `ghl_get_proposal_templates`  | List proposal/estimate document templates                             |
| `ghl_send_proposal_template`  | Send a proposal/estimate document template to a client contact        |

### Brand Boards & Voices

| Tool                          | Description                                                    |
|-------------------------------|--------------------------------------------------------------------|
| `ghl_create_brand_board`      | Create a brand board (logos, colors, fonts) — blank, from template, snapshot, or extracted from a URL |
| `ghl_get_brand_boards`        | List brand boards for the location                                 |
| `ghl_get_brand_board`         | Get a single brand board by ID                                     |
| `ghl_update_brand_board`      | Update a brand board by ID                                         |
| `ghl_delete_brand_board`      | Delete a brand board by ID                                         |
| `ghl_get_brand_voices`        | List brand voices for the location                                 |
| `ghl_create_brand_voice`      | Create a brand voice                                                |
| `ghl_get_brand_voice`         | Get a brand voice by ID                                             |
| `ghl_update_brand_voice`      | Update a brand voice by ID                                          |
| `ghl_delete_brand_voice`      | Delete a brand voice by ID                                          |
| `ghl_set_default_brand_voice` | Set a brand voice as the default for the location                   |

### Custom Menus

| Tool                     | Description                                                     |
|--------------------------|---------------------------------------------------------------------|
| `ghl_get_custom_menus`   | List custom menu links, with search, pagination, and agency filter  |
| `ghl_get_custom_menu`    | Get a single custom menu link by ID                                 |
| `ghl_create_custom_menu` | Create a custom menu link                                           |
| `ghl_update_custom_menu` | Update a custom menu link by ID                                     |
| `ghl_delete_custom_menu` | Delete a custom menu link by ID                                     |

### Conversation AI

| Tool                                              | Description                                                                |
|----------------------------------------------------|-----------------------------------------------------------------------------|
| `ghl_create_conversation_ai_agent`                 | Create a new Conversation AI agent (name, personality, goal, instructions)  |
| `ghl_search_conversation_ai_agents`                | Search Conversation AI agents by name, with pagination                      |
| `ghl_get_conversation_ai_agent`                    | Get a Conversation AI agent by ID                                           |
| `ghl_update_conversation_ai_agent`                 | Update a Conversation AI agent's configuration                              |
| `ghl_delete_conversation_ai_agent`                 | Delete a Conversation AI agent by ID                                        |
| `ghl_attach_conversation_ai_action`                | Attach a new action (workflow trigger, field update, booking, etc.) to an agent |
| `ghl_list_conversation_ai_agent_actions`           | List all actions attached to a Conversation AI agent                        |
| `ghl_get_conversation_ai_agent_action`             | Get a single action attached to a Conversation AI agent                     |
| `ghl_update_conversation_ai_agent_action`          | Update an existing action attached to a Conversation AI agent               |
| `ghl_remove_conversation_ai_agent_action`          | Remove an action from a Conversation AI agent                               |
| `ghl_update_conversation_ai_followup_settings`     | Update the follow-up settings (channel switching, working hours) for an agent |
| `ghl_get_conversation_ai_generation`               | Get an AI-generated message for a conversation or workflow message          |

### Voice AI

| Tool                            | Description                                                              |
|----------------------------------|---------------------------------------------------------------------------|
| `ghl_create_voice_ai_action`     | Create a new Voice AI action attached to an agent                        |
| `ghl_update_voice_ai_action`     | Update a Voice AI action                                                  |
| `ghl_get_voice_ai_action`        | Get a single Voice AI action by ID                                       |
| `ghl_delete_voice_ai_action`     | Delete a Voice AI action                                                  |
| `ghl_create_voice_ai_agent`      | Create a new Voice AI agent (greeting, prompt, voice, working hours, etc.) |
| `ghl_get_voice_ai_agents`        | List Voice AI agents for the location, with search and pagination        |
| `ghl_update_voice_ai_agent`      | Update a Voice AI agent's configuration                                  |
| `ghl_get_voice_ai_agent`         | Get a Voice AI agent by ID                                               |
| `ghl_delete_voice_ai_agent`      | Delete a Voice AI agent by ID                                            |
| `ghl_get_voice_ai_call_logs`     | Get the Voice AI call-log dashboard, with filters and pagination         |
| `ghl_get_voice_ai_call_log`      | Get a single Voice AI call log entry by call ID                          |

### Chat Widget

| Tool                          | Description                                                                 |
|--------------------------------|-------------------------------------------------------------------------------|
| `ghl_create_chat_widget`       | Create a new chat widget for the sub-account                                 |
| `ghl_clone_chat_widget`        | Create a copy of an existing chat widget in the same sub-account             |
| `ghl_get_chat_widget`          | Get a single chat widget by ID                                               |
| `ghl_update_chat_widget`       | Full update (PUT) of a chat widget resource                                  |
| `ghl_patch_chat_widget`        | Partial update (PATCH) of a chat widget resource                             |
| `ghl_list_chat_widgets`        | List chat widgets for the sub-account, with pagination and filters           |
| `ghl_get_chat_widget_config`   | Get a widget's display/behavior configuration by ID                          |
| `ghl_delete_chat_widget`       | Soft-delete a chat widget                                                    |

### Agent Studio

| Tool                                        | Description                                                                |
|-----------------------------------------------|-------------------------------------------------------------------------------|
| `ghl_create_agent_studio_agent`               | Create a new Agent Studio agent with an initial staging version              |
| `ghl_list_agent_studio_agents`                | List Agent Studio agents for the sub-account, with pagination                |
| `ghl_get_agent_studio_agent`                  | Get a single Agent Studio agent by ID, including its non-deleted versions    |
| `ghl_update_agent_studio_agent_metadata`      | Update an agent's top-level metadata (name, description, status)             |
| `ghl_delete_agent_studio_agent`               | Delete an Agent Studio agent and all of its versions                         |
| `ghl_update_agent_studio_agent_version`       | Update a version's workflow definition (nodes, edges, variables)             |
| `ghl_publish_agent_studio_agent`              | Promote a draft version to production, publishing it                         |
| `ghl_execute_agent_studio_agent`              | Execute an Agent Studio agent and get a non-streaming JSON response          |

### Businesses

| Tool                     | Description                                                             |
|--------------------------|--------------------------------------------------------------------------|
| `ghl_get_businesses`     | List businesses for a location                                           |
| `ghl_get_business`       | Get a specific business by ID                                            |
| `ghl_create_business`    | Create a new business                                                    |
| `ghl_update_business`    | Update an existing business                                              |
| `ghl_delete_business`    | Delete a business                                                        |

### Associations

| Tool                                  | Description                                                        |
|-----------------------------------------|-----------------------------------------------------------------------|
| `ghl_create_association_relation`      | Create a relation between two records for an association             |
| `ghl_get_association_relations`        | List relations for a record                                           |
| `ghl_delete_association_relation`      | Delete a relation between two records                                 |
| `ghl_get_association_by_key`           | Get an association by its key name                                    |
| `ghl_get_association_by_object_key`    | Get an association by its object key                                  |
| `ghl_create_association`               | Create a new association                                              |
| `ghl_get_association`                  | Get a specific association by ID                                      |
| `ghl_update_association`               | Update an association's object labels                                 |
| `ghl_delete_association`               | Delete an association                                                 |
| `ghl_list_associations`                | List associations for a location                                      |

### Objects

| Tool                            | Description                                                                |
|-----------------------------------|-------------------------------------------------------------------------------|
| `ghl_get_object_schema`          | Get a custom or standard object schema by key                                |
| `ghl_update_object_schema`       | Update a custom object schema                                                |
| `ghl_get_objects`                | List all objects (standard and custom) for the location                      |
| `ghl_get_object_record`          | Get a single custom object record by ID                                      |
| `ghl_update_object_record`       | Update a custom object record                                                |
| `ghl_delete_object_record`       | Delete a custom object record                                                |
| `ghl_create_object_record`       | Create a new custom object record                                            |
| `ghl_search_object_records`      | Search custom object records                                                 |

### Facebook Accounts

> Note: all `ad-publishing` operations hit paths under `/ad-publishing/<platform>/...`.
> Despite the `ad-publishing-v3.json` spec filename, 94 of these 95 operations declare a
> legacy `Version: 2021-07-28` header rather than a v3 header — the sole exception is
> `ghl_get_facebook_campaign_publishing_progress`, which uses `v3`. See `src/client.ts`'s
> `GHL_VERSION_LEGACY`/`GHL_VERSION_V3` and the in-file code comments in each
> `src/tools/facebook_*.ts` / `google_*.ts` / `linkedin.ts` module for details.

| Tool                                        | Description                                                                       |
|-----------------------------------------------|---------------------------------------------------------------------------------------|
| `ghl_get_facebook_ad_accounts`               | List Facebook ad accounts connected to a location                                    |
| `ghl_get_facebook_ad_account`                | Get a single Facebook ad account by ID                                               |
| `ghl_delete_facebook_ad_account`             | Delete a Facebook ad account                                                         |
| `ghl_create_facebook_integration`            | Create a Facebook ad-publishing integration for a location                           |
| `ghl_get_facebook_integration`               | Get the Facebook ad-publishing integration for a location                            |
| `ghl_delete_facebook_integration`            | Delete the Facebook ad-publishing integration for a location                         |
| `ghl_get_facebook_me`                        | Get the Facebook identity (user/page) tied to the location's integration             |
| `ghl_get_facebook_entity`                    | List Facebook ad entities (campaigns, ad sets, or ads)                               |
| `ghl_get_facebook_pages`                     | List Facebook pages available to a location                                          |
| `ghl_delete_facebook_page`                   | Disconnect a Facebook page from a location                                           |
| `ghl_set_default_facebook_page`              | Set the default Facebook page for a location                                         |
| `ghl_get_facebook_page_forms`                | List lead forms for a Facebook page                                                  |
| `ghl_create_facebook_page_form`              | Create a Facebook lead form on a page                                                |
| `ghl_get_facebook_page_instagram_accounts`   | List Instagram accounts linked to a Facebook page                                    |

### Facebook Campaigns

| Tool                                            | Description                                                                       |
|----------------------------------------------------|----------------------------------------------------------------------------------------|
| `ghl_get_facebook_campaign`                        | Get a single Facebook campaign by ID                                                  |
| `ghl_upsert_facebook_campaign`                     | Create or update a Facebook campaign — pass `id` to update, omit to create            |
| `ghl_delete_facebook_campaign`                     | Delete a Facebook campaign                                                            |
| `ghl_duplicate_facebook_campaign`                  | Duplicate a Facebook campaign                                                         |
| `ghl_pause_facebook_campaign`                      | Pause a Facebook campaign                                                             |
| `ghl_publish_facebook_campaign`                    | Publish a Facebook campaign                                                           |
| `ghl_get_facebook_campaign_publishing_progress`    | Get the publishing progress of a Facebook campaign                                    |
| `ghl_resume_facebook_campaign`                     | Resume a paused Facebook campaign                                                     |
| `ghl_upsert_facebook_adset`                        | Create or update a Facebook ad set — pass `id` to update, omit to create              |
| `ghl_delete_facebook_adset`                        | Delete a Facebook ad set                                                              |
| `ghl_duplicate_facebook_adset`                     | Duplicate a Facebook ad set                                                           |
| `ghl_pause_facebook_adset`                         | Pause a Facebook ad set                                                               |
| `ghl_resume_facebook_adset`                        | Resume a paused Facebook ad set                                                       |
| `ghl_upsert_facebook_ad`                           | Create or update a Facebook ad — pass `id` to update, omit to create                  |
| `ghl_delete_facebook_ad`                           | Delete a Facebook ad                                                                  |
| `ghl_duplicate_facebook_ad`                        | Duplicate a Facebook ad                                                               |
| `ghl_pause_facebook_ad`                            | Pause a Facebook ad                                                                   |
| `ghl_resume_facebook_ad`                           | Resume a paused Facebook ad                                                           |

### Facebook Audiences

| Tool                                              | Description                                                                       |
|-------------------------------------------------------|----------------------------------------------------------------------------------------|
| `ghl_get_facebook_custom_audiences`                   | Get Facebook custom audiences for a location                                          |
| `ghl_delete_facebook_custom_audience`                 | Delete a Facebook custom audience                                                     |
| `ghl_update_facebook_custom_audience`                 | Update a Facebook custom audience's name and description                              |
| `ghl_get_facebook_custom_audience`                    | Get a single Facebook custom audience by ID                                           |
| `ghl_add_facebook_custom_audience_member`             | Add a contact to a Facebook custom audience                                           |
| `ghl_remove_facebook_custom_audience_member`          | Remove a contact from a Facebook custom audience                                      |
| `ghl_batch_update_facebook_custom_audience_members`   | Batch add/remove members of a Facebook custom audience via CSV, smartlists, or dynamic audience |
| `ghl_get_facebook_pixels`                             | Get Facebook conversion pixels for a location                                         |
| `ghl_upsert_facebook_pixel`                           | Create or update a Facebook conversion pixel                                          |
| `ghl_get_facebook_conversation_forms`                 | Get Facebook conversation forms for a location                                        |
| `ghl_create_facebook_conversation_form`               | Create a Facebook conversation form                                                   |
| `ghl_get_facebook_lead_form`                          | Get a single Facebook lead form by ID                                                 |

### Facebook Reporting

| Tool                                    | Description                                                                       |
|----------------------------------------------|----------------------------------------------------------------------------------------|
| `ghl_get_facebook_reporting`                 | Get Facebook ad reporting data with aggregation                                       |
| `ghl_get_facebook_campaign_reporting`        | Get reporting data for a specific Facebook campaign                                   |
| `ghl_get_facebook_reporting_list`            | Get a list of Facebook reporting data (campaigns, ad sets, or ads)                    |
| `ghl_search_facebook_targeting`              | Search Facebook targeting options (interests, behaviors, demographics)                |

### Google Accounts

| Tool                             | Description                                                                       |
|---------------------------------------|----------------------------------------------------------------------------------------|
| `ghl_get_google_ad_accounts`         | List Google ad accounts connected to a location                                       |
| `ghl_get_google_ad_account`          | Get a single Google ad account by ID                                                  |
| `ghl_delete_google_ad_account`       | Delete a Google ad account                                                            |
| `ghl_create_google_integration`      | Create a Google ad-publishing integration for a location                              |
| `ghl_get_google_integration`         | Get the Google ad-publishing integration for a location                               |
| `ghl_get_google_me`                  | Get the Google identity tied to the location's integration                            |
| `ghl_get_google_entity`              | List Google ad entities (campaigns, ad groups, or ads)                                |

### Google Campaigns

| Tool                             | Description                                                                       |
|---------------------------------------|----------------------------------------------------------------------------------------|
| `ghl_upsert_google_campaign`         | Create or update a Google Ads campaign — pass `id` to update, omit to create           |
| `ghl_get_google_campaign`            | Get a single Google Ads campaign by ID                                                |
| `ghl_publish_google_campaign`        | Publish a Google Ads campaign and push it live                                        |
| `ghl_get_google_assets`              | List Google Ads creative assets                                                       |
| `ghl_upsert_google_assets`           | Create or update a Google Ads creative asset (call, sitelink, or lead form)           |
| `ghl_get_google_keyword_ideas`       | Get Google Ads keyword ideas for a target URL                                         |

### Google Audiences

| Tool                                    | Description                                                                       |
|----------------------------------------------|----------------------------------------------------------------------------------------|
| `ghl_upsert_google_audience`                 | Create or update a Google Ads audience — pass `resourceName` to update, omit to create |
| `ghl_get_google_audiences`                   | List Google Ads audiences for the location                                            |
| `ghl_get_google_audience`                    | Get a single Google Ads audience by ID                                                |
| `ghl_get_google_segments`                    | List Google Ads segments for the location                                             |
| `ghl_upsert_google_segment`                  | Create or update a Google Ads segment — pass `id` to update, omit to create            |
| `ghl_create_google_offline_user_list_job`    | Create a Google Ads offline user list upload job                                      |
| `ghl_delete_google_segment`                  | Delete a Google Ads segment                                                           |
| `ghl_get_google_segment`                     | Get a single Google Ads segment by ID                                                 |
| `ghl_get_google_conversions`                 | List Google Ads conversion actions for the location                                   |
| `ghl_upsert_google_conversion`               | Create or update a Google Ads conversion action — pass `conversionId` to update        |
| `ghl_get_google_conversion`                  | Get a single Google Ads conversion action by ID                                       |
| `ghl_delete_google_conversion`               | Delete a Google Ads conversion action                                                 |
| `ghl_get_google_conversion_goals`            | List Google Ads conversion goals for the location                                     |
| `ghl_get_google_target_interests`            | Search Google Ads target interest categories                                          |

### Google Reporting

| Tool                                | Description                                                                       |
|--------------------------------------------|----------------------------------------------------------------------------------------|
| `ghl_get_google_reporting`                 | Get Google Ads reporting data with aggregation                                        |
| `ghl_get_google_campaign_reporting`        | Get reporting data for a specific Google Ads campaign                                 |
| `ghl_get_google_reporting_list`            | Get a list of Google Ads reporting data (e.g. campaigns)                              |
| `ghl_search_google_targeting`              | Search Google Ads targeting options (e.g. geolocation)                                |

### LinkedIn

| Tool                                          | Description                                                                       |
|-----------------------------------------------------|----------------------------------------------------------------------------------------|
| `ghl_get_linkedin_ad_account`                       | Get a connected LinkedIn ad account                                                   |
| `ghl_delete_linkedin_ad_account`                    | Delete a connected LinkedIn ad account                                                |
| `ghl_get_linkedin_ad_accounts`                      | List connected LinkedIn ad accounts for the location                                  |
| `ghl_create_linkedin_integration`                   | Create a LinkedIn ad account integration for the location                             |
| `ghl_get_linkedin_integration`                      | Get the LinkedIn ad account integration for the location                              |
| `ghl_get_linkedin_me`                               | Get the authenticated LinkedIn member profile for the location's integration          |
| `ghl_upsert_linkedin_campaign`                      | Create or update a LinkedIn ad campaign group — pass `adCampaignGroupId` to update     |
| `ghl_get_linkedin_campaign`                         | Get a single LinkedIn ad campaign group by ID                                         |
| `ghl_publish_linkedin_campaign`                     | Publish a LinkedIn ad campaign group to LinkedIn                                      |
| `ghl_update_linkedin_ad_status`                     | Update the status (paused, archived, resume) of a LinkedIn ad entity                  |
| `ghl_create_linkedin_lead_form`                     | Create a LinkedIn lead-gen form for an ad account                                     |
| `ghl_get_linkedin_lead_forms`                       | List LinkedIn lead-gen forms for an ad account                                        |
| `ghl_get_linkedin_reporting`                        | Get LinkedIn ad reporting analytics                                                   |
| `ghl_get_linkedin_campaign_group_reporting`         | Get LinkedIn ad reporting analytics for a specific campaign group                     |
| `ghl_get_linkedin_reporting_list`                   | Get a LinkedIn reporting list for a campaign within a campaign group                  |
| `ghl_search_linkedin_targeting`                     | Search LinkedIn targeting facets (e.g. locations, industries, job titles)             |

---

## Example Prompts

Here are some things you can say to your AI once connected:

```
"Find all contacts tagged 'new-lead' added this week and send them a welcome SMS"

"What appointments are booked on the Discovery calendar this Friday?"

"Check Sarah Johnson's conversation history and summarize the last 5 messages"

"Create a note on contact ID abc123 saying 'Called, left voicemail' and mark the task as complete"

"Move all open opportunities in the Onboarding pipeline older than 30 days to 'Lost'"

"Book an appointment for john@example.com tomorrow at 3pm on calendar XYZ"

"Enroll contact ID abc123 in the cold call workflow"

"Show me all unpaid invoices over 30 days old"

"List all users/team members in this location"

"What workflows do we have? Show me the names and IDs"

"Create a knowledge base called 'Product FAQ' and add 5 FAQs covering our pricing, refund policy, and onboarding steps"

"Crawl https://example.com and train our support knowledge base on every page under /docs"

"List all the FAQs in our knowledge base and update any that mention the old pricing"

"Show me the status of the last website crawl and train on all successfully discovered pages"
```

---

## Environment Variables Reference

| Variable        | Required | Description                        |
|-----------------|----------|------------------------------------|
| `GHL_PIT_TOKEN` | ✅ Yes    | Your GHL Private Integration Token |
| `GHL_LOCATION`  | ✅ Yes    | Your sub-account location ID       |

That's it — just two variables. Workflow IDs, pipeline IDs, calendar IDs, and all other GHL resource identifiers are passed directly as parameters when you call the relevant tools. This keeps the server generic and usable across any project or use case.

---

## Development

```bash
# Install dependencies
npm install

# Run in development mode (no build step needed)
npm run dev

# Type-check without building
npm run typecheck

# Build for production
npm run build

# Watch mode (rebuilds on file changes)
npm run build:watch
```

### Project Structure

```
ghl-mcp-server/
├── src/
│   ├── index.ts          # MCP server entry point — registers all tools
│   ├── client.ts         # GHL HTTP client (auth, request helper, error handling)
│   └── tools/
│       ├── contacts.ts                   # 19 contact tools
│       ├── conversations.ts              #  9 conversation & messaging tools
│       ├── conversation_ai.ts            # 12 Conversation AI agent tools
│       ├── voice_ai.ts                   # 11 Voice AI agent tools
│       ├── agent_studio.ts               #  8 Agent Studio tools
│       ├── calendars.ts                  # 10 calendar & appointment tools
│       ├── opportunities.ts              #  8 pipeline & deal tools
│       ├── workflows.ts                  #  2 workflow & campaign tools
│       ├── location.ts                   #  1 location lookup tool
│       ├── tags.ts                       #  3 location tag tools
│       ├── custom_fields.ts              #  4 custom field tools
│       ├── custom_values.ts              #  4 custom value tools
│       ├── users.ts                      #  6 user tools
│       ├── templates.ts                  #  2 location template tools
│       ├── forms.ts                      #  2 form tools
│       ├── surveys.ts                    #  2 survey tools
│       ├── businesses.ts                 #  5 business tools
│       ├── objects.ts                    #  8 custom object tools
│       ├── associations.ts               # 10 association & relation tools
│       ├── custom_menus.ts               #  5 custom menu tools
│       ├── payments.ts                   # 12 payment & invoice tools
│       ├── proposals.ts                  #  4 proposal & document tools
│       ├── emails.ts                     # 10 email builder & campaign tools
│       ├── email_isv.ts                  #  1 email verification tool
│       ├── social.ts                     #  9 social posts, media & trigger link tools
│       ├── social_planner_accounts.ts    #  9 social planner account tools
│       ├── social_planner_posts.ts       # 10 social planner post tools
│       ├── social_planner_queues.ts      # 18 social planner queue tools
│       ├── social_planner_comments.ts    #  4 social planner comment tools
│       ├── blogs.ts                      #  7 blog tools
│       ├── brand_boards.ts               # 11 brand board & brand voice tools
│       ├── chat_widget.ts                #  8 chat widget tools
│       ├── courses.ts                    #  1 course import tool
│       ├── funnels.ts                    #  3 funnel tools
│       ├── phone_numbers.ts              #  5 phone number tools
│       ├── knowledge_base.ts             # 14 knowledge base, FAQ & web crawler tools
│       ├── products.ts                   # 14 product, price & inventory tools
│       ├── product_collections.ts        #  5 product collection tools
│       ├── product_reviews.ts            #  5 product review tools
│       ├── product_store.ts              #  3 storefront visibility & stats tools
│       ├── store.ts                      # 18 shipping & store settings tools
│       ├── affiliate_manager.ts          #  4 affiliate tools
│       ├── facebook_accounts.ts          # 14 Facebook Ads accounts, pages & integration tools
│       ├── facebook_campaigns.ts         # 18 Facebook Ads campaign, ad set & ad tools
│       ├── facebook_audiences.ts         # 12 Facebook Ads audience, pixel & form tools
│       ├── facebook_reporting.ts         #  4 Facebook Ads reporting & targeting tools
│       ├── google_accounts.ts            #  7 Google Ads accounts & integration tools
│       ├── google_campaigns.ts           #  6 Google Ads campaign & asset tools
│       ├── google_audiences.ts           # 14 Google Ads audience, segment & conversion tools
│       ├── google_reporting.ts           #  4 Google Ads reporting & targeting tools
│       └── linkedin.ts                   # 16 LinkedIn Ads tools
├── dist/                 # Compiled output (generated by npm run build)
├── .env.example          # Environment variable template
├── package.json
├── tsconfig.json
└── README.md
```

### Adding a new tool

1. Find the relevant module in `src/tools/`
2. Add a new entry to the exported array following the existing pattern:
   ```typescript
   {
     name: "ghl_your_tool_name",
     description: "What this tool does and when to use it",
     inputSchema: z.object({
       param: z.string().describe("Description of this parameter"),
     }),
     handler: async (args, config) => {
       try {
         const result = await ghlRequest("GET", "/your/endpoint", {
           token: config.token,
           params: { locationId: config.locationId, ...args },
         });
         return JSON.stringify(result, null, 2);
       } catch (e) {
         return formatError(e);
       }
     },
   }
   ```
3. Run `npm run typecheck` to verify no type errors
4. Submit a PR!

---

## Troubleshooting

**The server isn't showing up in my AI client**
- Make sure you ran `npm run build` and the `dist/` folder exists
- Double-check the absolute path to `dist/index.js` in your config
- Restart your AI client after changing MCP config

**Getting "GHL_PIT_TOKEN is not set" errors**
- Verify your `.env` file exists in the `ghl-mcp-server/` directory
- Or pass the env vars directly in your MCP client config (see setup instructions above)

**Getting 401 Unauthorized from the API**
- Your PIT token may have expired or been revoked — generate a new one in GHL Settings → Private Integrations
- Make sure the token is for the correct sub-account

**Getting 422 or 400 errors**
- Check the `details` field in the error response — GHL usually explains what's wrong
- Common causes: missing required fields, invalid phone number format (use E.164: `+15551234567`), invalid date format (use ISO 8601)

**Rate limit errors (429)**
- GHL enforces 100 requests per 10 seconds
- For bulk operations, add a small delay between calls or process in batches

---

## Contributing

Pull requests are welcome! Please:

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/my-new-tool`)
3. Make your changes and run `npm run typecheck`
4. Commit and push, then open a PR

When adding new tools, follow the existing patterns in `src/tools/` and keep the tool names prefixed with `ghl_`.

---

## License

MIT © [Business AI Specialist](https://nerdsnipe.cc)

---

## Related

- [GoHighLevel API Documentation](https://marketplace.gohighlevel.com/docs/)
- [Model Context Protocol](https://modelcontextprotocol.io)
- [UltraLevel](https://www.ultralevel.app) — a native macOS app for GoHighLevel. If this MCP server is how your AI agents talk to GHL, UltraLevel is how *you* do: contacts, conversations, deals, and tasks in a fast native workspace, with private on-device AI built in. Free 14-day trial.
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)

## Support this project

ghl-mcp-server is built and maintained by [NerdSnipe Inc](https://nerdsnipe.cc), a small independent studio in Ottawa. Keeping 401 tools in step with GoHighLevel's API changes is the main cost.

- [Sponsor on GitHub](https://github.com/sponsors/NerdSnipe-Inc), from $5/month or a one-time amount
- [More about what we fund](https://nerdsnipe.cc/sponsor)
