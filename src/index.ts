#!/usr/bin/env node
/**
 * GoHighLevel MCP Server
 *
 * Exposes the GoHighLevel API v2 as Model Context Protocol (MCP) tools,
 * so any AI agent (Claude, Cursor, Windsurf, etc.) can interact with your
 * GHL sub-account directly.
 *
 * GitHub : https://github.com/Nerdsnipe-Inc/ghl-mcp-server
 * Docs   : https://marketplace.gohighlevel.com/docs/
 *
 * Required env vars (set in .env or your MCP client config):
 *   GHL_PIT_TOKEN  — Private Integration Token (v2)
 *   GHL_LOCATION   — Sub-account location ID
 */

import "dotenv/config";

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { getConfig, formatError } from "./client.js";

// ── Tool modules ──────────────────────────────────────────────────────────────

import { contactTools } from "./tools/contacts.js";
import { conversationTools } from "./tools/conversations.js";
import { calendarTools } from "./tools/calendars.js";
import { opportunityTools } from "./tools/opportunities.js";
import { workflowTools } from "./tools/workflows.js";

import { locationTools } from "./tools/location.js";
import { tagTools } from "./tools/tags.js";
import { customFieldTools } from "./tools/custom_fields.js";
import { customValueTools } from "./tools/custom_values.js";
import { userTools } from "./tools/users.js";
import { templateTools } from "./tools/templates.js";
import { formTools } from "./tools/forms.js";
import { surveyTools } from "./tools/surveys.js";

import { emailBuilderTools, emailCampaignTools } from "./tools/emails.js";
import { funnelTools } from "./tools/funnels.js";
import { phoneNumberTools } from "./tools/phone_numbers.js";
import { paymentTools, invoiceTools } from "./tools/payments.js";
import { socialTools, mediaTools, triggerLinkTools } from "./tools/social.js";

// ── Types ─────────────────────────────────────────────────────────────────────

type GHLConfig = {
  token: string;
  locationId: string;
};

type ToolDef = {
  name: string;
  description: string;
  inputSchema: z.ZodTypeAny;
  handler: (args: Record<string, unknown>, config: GHLConfig) => Promise<string>;
};

// ── Tool registry ─────────────────────────────────────────────────────────────

const ALL_TOOLS: ToolDef[] = [
  // CRM core
  ...contactTools,
  ...conversationTools,
  ...calendarTools,
  ...opportunityTools,
  ...workflowTools,

  // Location configuration
  ...locationTools,
  ...tagTools,
  ...customFieldTools,
  ...customValueTools,
  ...userTools,
  ...templateTools,
  ...formTools,
  ...surveyTools,

  // Marketing & content
  ...emailBuilderTools,
  ...emailCampaignTools,
  ...funnelTools,

  // Communications infrastructure
  ...phoneNumberTools,

  // Commerce
  ...paymentTools,
  ...invoiceTools,

  // Social & media
  ...socialTools,
  ...mediaTools,
  ...triggerLinkTools,
] as ToolDef[];

const toolMap = new Map<string, ToolDef>(ALL_TOOLS.map((t) => [t.name, t]));

// ── Zod → JSON Schema ─────────────────────────────────────────────────────────

function zodToJsonSchema(schema: z.ZodTypeAny): Record<string, unknown> {
  function convert(s: z.ZodTypeAny): Record<string, unknown> {
    if (s instanceof z.ZodObject) {
      const shape = s.shape as Record<string, z.ZodTypeAny>;
      const properties: Record<string, unknown> = {};
      const required: string[] = [];
      for (const [key, field] of Object.entries(shape)) {
        const converted = convert(field as z.ZodTypeAny);
        if ((field as z.ZodTypeAny).description) {
          converted.description = (field as z.ZodTypeAny).description;
        }
        properties[key] = converted;
        if (
          !(field instanceof z.ZodOptional) &&
          !(field instanceof z.ZodDefault)
        ) {
          required.push(key);
        }
      }
      return {
        type: "object",
        properties,
        ...(required.length > 0 ? { required } : {}),
      };
    }
    if (s instanceof z.ZodOptional) return convert(s.unwrap());
    if (s instanceof z.ZodDefault) return convert(s._def.innerType as z.ZodTypeAny);
    if (s instanceof z.ZodString) return { type: "string" };
    if (s instanceof z.ZodNumber) return { type: "number" };
    if (s instanceof z.ZodBoolean) return { type: "boolean" };
    if (s instanceof z.ZodArray) return { type: "array", items: convert(s.element) };
    if (s instanceof z.ZodEnum) return { type: "string", enum: s.options };
    if (s instanceof z.ZodUnion) return { oneOf: (s.options as z.ZodTypeAny[]).map(convert) };
    if (s instanceof z.ZodNever) return { not: {} };
    return { type: "string" };
  }
  const result = convert(schema);
  if (schema.description) result.description = schema.description;
  return result;
}

// ── MCP Server ────────────────────────────────────────────────────────────────

const server = new Server(
  { name: "ghl-mcp-server", version: "1.1.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, () => ({
  tools: ALL_TOOLS.map((tool) => ({
    name: tool.name,
    description: tool.description,
    inputSchema: zodToJsonSchema(tool.inputSchema),
  })),
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: rawArgs } = request.params;

  const tool = toolMap.get(name);
  if (!tool) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ error: true, message: `Unknown tool: ${name}` }),
        },
      ],
    };
  }

  let config: GHLConfig;
  try {
    config = getConfig();
  } catch (e) {
    return { content: [{ type: "text", text: formatError(e) }] };
  }

  let parsedArgs: Record<string, unknown>;
  try {
    parsedArgs = tool.inputSchema.parse(rawArgs ?? {}) as Record<string, unknown>;
  } catch (e) {
    const detail = e instanceof z.ZodError ? e.flatten() : String(e);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ error: true, message: "Invalid arguments", details: detail }),
        },
      ],
    };
  }

  const result = await tool.handler(parsedArgs, config);
  return { content: [{ type: "text", text: result }] };
});

// ── Start ─────────────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(
    `GHL MCP Server v1.1.0 running — ${ALL_TOOLS.length} tools available`
  );
}

main().catch((err) => {
  console.error("Fatal error starting GHL MCP Server:", err);
  process.exit(1);
});
