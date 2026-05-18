# GoHighLevel MCP Server

> Give any AI agent — Claude, Cursor, Windsurf, or any MCP-compatible client — full access to your GoHighLevel account through natural language.

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)
[![MCP](https://img.shields.io/badge/protocol-MCP-purple)](https://modelcontextprotocol.io)
[![GoHighLevel](https://img.shields.io/badge/API-GHL%20v2-orange)](https://marketplace.gohighlevel.com/docs/)

---

## What is this?

This is a **[Model Context Protocol (MCP)](https://modelcontextprotocol.io) server** that connects your AI tools directly to your GoHighLevel (GHL) sub-account via the GHL API v2.

Once installed, you can talk to your CRM naturally:

> *"Find all contacts tagged 'cold-lead' and send them an SMS saying we have a new offer"*
> *"Book an appointment for Sarah Johnson tomorrow at 2pm on the Discovery calendar"*
> *"Move any open opportunities in Stage 1 that haven't been touched in 14 days to 'Lost'"*
> *"Create a note on John's contact record and enroll him in the cold call workflow"*

**86 tools** covering the full GHL API:

| Category                  | Tools                                                                       |
|---------------------------|-----------------------------------------------------------------------------|
| Contacts                  | CRUD, search, upsert, tags, notes, tasks, workflow enrollment, appointments |
| Conversations & Messaging | Search, send SMS/email/WhatsApp, schedule, message history                  |
| Calendars & Appointments  | List calendars, check availability, book, reschedule, block slots           |
| Opportunities / Pipeline  | Pipelines, deals, stage moves, won/lost/abandoned                           |
| Workflows & Campaigns     | List workflows and campaigns                                                |
| Location Settings         | Custom fields, custom values, tags, users, templates, forms                 |
| Payments & Invoices       | Orders, transactions, subscriptions, coupons, invoices, payments            |
| Social & Media            | Social posts, media library, trigger links                                  |

---

## Prerequisites

Before you begin, make sure you have:

- **Node.js 18 or later** — [download here](https://nodejs.org/en/download)
- **A GoHighLevel account** with sub-account access
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

### Step 1 — Clone and build

```bash
git clone https://github.com/Nerdsnipe-Inc/ghl-mcp-server.git
cd ghl-mcp-server
npm install
npm run build
```

This creates a `dist/` folder with the compiled server.

### Step 2 — Configure your credentials

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

Then open `.env` in any text editor and add your credentials:

```env
GHL_PIT_TOKEN=your_private_integration_token_here
GHL_LOCATION=your_location_id_here
```

### Step 3 — Connect to your AI tool

Pick your AI client below and follow the instructions.

---

## Connecting to AI Clients

### Claude Desktop

Open (or create) your Claude Desktop config file:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

Add the following (replace the path with wherever you cloned this repo):

```json
{
  "mcpServers": {
    "ghl": {
      "command": "node",
      "args": ["/absolute/path/to/ghl-mcp-server/dist/index.js"],
      "env": {
        "GHL_PIT_TOKEN": "your_token_here",
        "GHL_LOCATION": "your_location_id_here"
      }
    }
  }
}
```

> **Tip:** If you set up `.env` in Step 2, you can omit the `env` block entirely — the server loads `.env` automatically on startup. Passing them in the config also works and keeps everything in one place — use whichever you prefer.

Restart Claude Desktop. You should see a hammer icon (🔨) in the chat input — that means MCP tools are active.

---

### Claude Code (CLI)

Run this from your terminal to add the server to your Claude Code config:

```bash
claude mcp add ghl node /absolute/path/to/ghl-mcp-server/dist/index.js \
  -e GHL_PIT_TOKEN=your_token_here \
  -e GHL_LOCATION=your_location_id_here
```

Or add it manually to `~/.claude/mcp_servers.json` (or your project's `.mcp.json`):

```json
{
  "mcpServers": {
    "ghl": {
      "command": "node",
      "args": ["/absolute/path/to/ghl-mcp-server/dist/index.js"],
      "env": {
        "GHL_PIT_TOKEN": "your_token_here",
        "GHL_LOCATION": "your_location_id_here"
      }
    }
  }
}
```

> **Project-scoped tip:** If you use a `.mcp.json` in your project root and load credentials from `.env`, you can omit the `env` block completely and just commit the `.mcp.json` safely (no secrets in it).

**Project-scoped (recommended for teams):** Add a `.mcp.json` file in your project root so everyone on the team picks it up automatically. Add `.mcp.json` to `.gitignore` so tokens aren't committed.

---

### Cursor

1. Open Cursor Settings → **MCP** (or press `Cmd+Shift+P` → "Open MCP Settings")
2. Click **Add Server** and fill in:

```json
{
  "name": "ghl",
  "command": "node",
  "args": ["/absolute/path/to/ghl-mcp-server/dist/index.js"],
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
      "command": "node",
      "args": ["/absolute/path/to/ghl-mcp-server/dist/index.js"],
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

This server uses **stdio transport** — the standard for local MCP servers. Your client needs to:

- **Command**: `node`
- **Args**: `["/absolute/path/to/ghl-mcp-server/dist/index.js"]`
- **Env**: `GHL_PIT_TOKEN` and `GHL_LOCATION` (and optionally the workflow IDs)

Refer to your client's MCP documentation for exact config syntax.

---

## Optional: Use without building (via tsx)

If you don't want to compile TypeScript, you can run the server directly using `tsx`:

```json
{
  "command": "npx",
  "args": ["tsx", "/absolute/path/to/ghl-mcp-server/src/index.ts"]
}
```

This is slower to start but useful during development.

---

## All 86 Tools — Full Reference

### Contacts

| Tool                               | Description                                           |
|------------------------------------|-------------------------------------------------------|
| `ghl_get_contacts`                 | List/search contacts by name, email, phone, or tags   |
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
| `ghl_get_custom_values`    | List custom values (location-level variables) |
| `ghl_create_custom_value`  | Create a custom value                         |
| `ghl_update_custom_value`  | Update a custom value                         |
| `ghl_get_users`            | List all team members                         |
| `ghl_search_users`         | Search users by name or email                 |
| `ghl_get_templates`        | Get SMS/email templates                       |
| `ghl_get_forms`            | List all forms                                |
| `ghl_get_form_submissions` | Get form submissions                          |

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
│       ├── contacts.ts       # 21 contact tools
│       ├── conversations.ts  #  9 conversation & messaging tools
│       ├── calendars.ts      # 10 calendar & appointment tools
│       ├── opportunities.ts  #  8 pipeline & deal tools
│       ├── workflows.ts      #  2 workflow & campaign tools
│       ├── locations.ts      # 16 location settings tools
│       ├── payments.ts       # 12 payment & invoice tools
│       └── social.ts         #  8 social, media & trigger link tools
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

- [GoHighLevel API v2 Documentation](https://marketplace.gohighlevel.com/docs/)
- [Model Context Protocol](https://modelcontextprotocol.io)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
