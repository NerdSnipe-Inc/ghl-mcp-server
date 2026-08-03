import { z } from "zod";
import { ghlRequest, formatError, GHLConfig, GHL_VERSION_V3 } from "../client.js";

// Language codes accepted by the voice AI agent, per VoiceAILanguage schema.
const VOICE_AI_LANGUAGE_ENUM = [
  "en-US",
  "pt-BR",
  "es",
  "fr",
  "de",
  "it",
  "nl-NL",
  "multi",
] as const;
// Tolerance level for caller response delays, per PatienceLevel schema.
const PATIENCE_LEVEL_ENUM = ["low", "medium", "high"] as const;
// Action types for a Voice AI action (create/update/get/delete/dashboard filter).
const VOICE_AI_ACTION_TYPE_ENUM = [
  "CALL_TRANSFER",
  "DATA_EXTRACTION",
  "IN_CALL_DATA_EXTRACTION",
  "WORKFLOW_TRIGGER",
  "SMS",
  "APPOINTMENT_BOOKING",
  "CUSTOM_ACTION",
  "KNOWLEDGE_BASE",
] as const;

// Shared agent configuration fields, used by both create (POST /voice-ai/agents) and
// update (PATCH /voice-ai/agents/{agentId}) — all optional on both endpoints per spec
// (create additionally requires locationId, injected from config, not exposed here).
const agentConfigFields = {
  agentName: z
    .string()
    .optional()
    .describe('Display name for the agent, 1-40 chars. Default: "My Agent {random 3 digit number}"'),
  businessName: z
    .string()
    .optional()
    .describe("Name of the business this agent represents. Default: location name"),
  welcomeMessage: z
    .string()
    .optional()
    .describe("Initial greeting spoken when the agent answers calls. Default: auto generated"),
  agentPrompt: z
    .string()
    .optional()
    .describe("Custom instructions defining the agent's behavior and personality"),
  voiceId: z
    .string()
    .optional()
    .describe("Identifier for the speech synthesis voice. Default: auto generated"),
  language: z
    .enum(VOICE_AI_LANGUAGE_ENUM)
    .optional()
    .describe('Language code for the agent\'s speech and understanding. Default: "en-US"'),
  patienceLevel: z
    .enum(PATIENCE_LEVEL_ENUM)
    .optional()
    .describe('Tolerance level for caller response delays. Default: "high"'),
  maxCallDuration: z
    .number()
    .optional()
    .describe("Maximum call duration in seconds, 180-900 (3-15 min). Default: 300"),
  sendUserIdleReminders: z
    .boolean()
    .optional()
    .describe("Enables automatic reminders when callers are silent. Default: true"),
  reminderAfterIdleTimeSeconds: z
    .number()
    .optional()
    .describe("Seconds to wait before sending idle reminders, 1-20. Default: 8"),
  inboundNumber: z
    .string()
    .optional()
    .describe("Phone number for receiving inbound calls to this agent"),
  numberPoolId: z
    .string()
    .optional()
    .describe("Identifier for the number pool managing phone number allocation"),
  callEndWorkflowIds: z
    .array(z.string())
    .optional()
    .describe("Array of workflow IDs to trigger automatically when calls end (max 10)"),
  sendPostCallNotificationTo: z
    .object({
      admins: z
        .boolean()
        .describe("Enables post-call notifications to all admin users. Default: true"),
      allUsers: z
        .boolean()
        .describe("Enables post-call notifications to all users. Default: false"),
      contactAssignedUser: z
        .boolean()
        .describe("Enables post-call notifications to the user assigned to the contact"),
      specificUsers: z.array(z.string()).describe("Specific user IDs to receive notifications"),
      customEmails: z.array(z.string()).describe("Custom email addresses to receive notifications"),
    })
    .optional()
    .describe("Configuration for post-call email notifications to various recipients"),
  agentWorkingHours: z
    .array(
      z.object({
        dayOfTheWeek: z
          .number()
          .describe("Day of week for this configuration (Monday=1 to Sunday=7)"),
        intervals: z
          .array(z.record(z.string(), z.unknown()))
          .describe("Time intervals when the agent is available on this day"),
      })
    )
    .optional()
    .describe("Time intervals defining when the agent accepts calls, by day of week. Default: [] (24/7)"),
  timezone: z
    .string()
    .optional()
    .describe("IANA timezone identifier affecting working hours and scheduling. Default: location timezone"),
  isAgentAsBackupDisabled: z
    .boolean()
    .optional()
    .describe("Prevents this agent from being used as a fallback option. Default: false"),
  translation: z
    .object({
      enabled: z
        .boolean()
        .describe("Enables language translation for agent conversations. Default: false"),
      language: z
        .string()
        .optional()
        .describe('Target language code for translation (e.g. "es"); required if enabled'),
    })
    .optional()
    .describe(
      "Translation settings. Rules: enabled can only be true if agent language isn't en-US; " +
        "when enabled, language must be the agent's language or en-US and is required."
    ),
};

export const voiceAiTools = [
  {
    name: "ghl_create_voice_ai_action",
    description:
      "Create a new Voice AI action attached to an agent. Requires agentId, actionType, name, " +
      "and actionParameters (shape depends on actionType, typed permissively here).",
    inputSchema: z.object({
      agentId: z.string().describe("Agent ID to attach the action to"),
      actionType: z.enum(VOICE_AI_ACTION_TYPE_ENUM).describe("Type of action"),
      name: z.string().describe("Human-readable name for this action"),
      actionParameters: z
        .record(z.string(), z.unknown())
        .describe("Action parameters; shape varies by actionType"),
    }),
    handler: async (
      args: {
        agentId: string;
        actionType: string;
        name: string;
        actionParameters: Record<string, unknown>;
      },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest("POST", "/voice-ai/actions", {
          token: config.token,
          version: GHL_VERSION_V3,
          body: {
            agentId: args.agentId,
            locationId: config.locationId,
            actionType: args.actionType,
            name: args.name,
            actionParameters: args.actionParameters,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_update_voice_ai_action",
    description:
      "Update a Voice AI action. The upstream API requires the full replacement set: agentId, " +
      "actionType, name, and actionParameters (shape depends on actionType, typed permissively here).",
    inputSchema: z.object({
      actionId: z.string().describe("The Voice AI action ID"),
      agentId: z.string().describe("Agent ID this action is attached to"),
      actionType: z.enum(VOICE_AI_ACTION_TYPE_ENUM).describe("Type of action"),
      name: z.string().describe("Human-readable name for this action"),
      actionParameters: z
        .record(z.string(), z.unknown())
        .describe("Action parameters; shape varies by actionType"),
    }),
    handler: async (
      args: {
        actionId: string;
        agentId: string;
        actionType: string;
        name: string;
        actionParameters: Record<string, unknown>;
      },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest("PUT", `/voice-ai/actions/${args.actionId}`, {
          token: config.token,
          version: GHL_VERSION_V3,
          body: {
            agentId: args.agentId,
            locationId: config.locationId,
            actionType: args.actionType,
            name: args.name,
            actionParameters: args.actionParameters,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_voice_ai_action",
    description: "Get a single Voice AI action by ID.",
    inputSchema: z.object({
      actionId: z.string().describe("The Voice AI action ID"),
    }),
    handler: async (args: { actionId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", `/voice-ai/actions/${args.actionId}`, {
          token: config.token,
          version: GHL_VERSION_V3,
          params: { locationId: config.locationId },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_delete_voice_ai_action",
    description:
      // Confirmed against voice-ai-v3.json: DELETE requires both locationId AND agentId as
      // required query params (unlike GET, which only requires locationId).
      "Delete a Voice AI action. Requires the agentId it's attached to (in addition to the action ID).",
    inputSchema: z.object({
      actionId: z.string().describe("The Voice AI action ID"),
      agentId: z.string().describe("Agent ID this action is attached to"),
    }),
    handler: async (args: { actionId: string; agentId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("DELETE", `/voice-ai/actions/${args.actionId}`, {
          token: config.token,
          version: GHL_VERSION_V3,
          params: { locationId: config.locationId, agentId: args.agentId },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_create_voice_ai_agent",
    description:
      "Create a new Voice AI agent. Only locationId (injected automatically) is required by " +
      "the upstream API; all other fields are optional configuration for the agent.",
    inputSchema: z.object(agentConfigFields),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("POST", "/voice-ai/agents", {
          token: config.token,
          version: GHL_VERSION_V3,
          body: { ...args, locationId: config.locationId },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_voice_ai_agents",
    description: "List Voice AI agents for the location. All parameters besides locationId are optional.",
    inputSchema: z.object({
      page: z.number().optional().describe("Page number (1-5000, default 1)"),
      pageSize: z.number().optional().describe("Records per page (1-50, default 10)"),
      query: z.string().optional().describe("Search query on agent name"),
    }),
    handler: async (
      args: { page?: number; pageSize?: number; query?: string },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest("GET", "/voice-ai/agents", {
          token: config.token,
          version: GHL_VERSION_V3,
          params: {
            locationId: config.locationId,
            page: args.page,
            pageSize: args.pageSize,
            query: args.query,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_update_voice_ai_agent",
    description: "Update a Voice AI agent's configuration. All fields besides agentId are optional.",
    inputSchema: z.object({
      agentId: z.string().describe("The Voice AI agent ID"),
      ...agentConfigFields,
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      const { agentId, ...fields } = args as { agentId: string } & Record<string, unknown>;
      try {
        const result = await ghlRequest("PATCH", `/voice-ai/agents/${agentId}`, {
          token: config.token,
          version: GHL_VERSION_V3,
          params: { locationId: config.locationId },
          body: { ...fields },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_voice_ai_agent",
    description: "Get a Voice AI agent by ID.",
    inputSchema: z.object({
      agentId: z.string().describe("The Voice AI agent ID"),
    }),
    handler: async (args: { agentId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", `/voice-ai/agents/${args.agentId}`, {
          token: config.token,
          version: GHL_VERSION_V3,
          params: { locationId: config.locationId },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_delete_voice_ai_agent",
    description: "Delete a Voice AI agent by ID.",
    inputSchema: z.object({
      agentId: z.string().describe("The Voice AI agent ID"),
    }),
    handler: async (args: { agentId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("DELETE", `/voice-ai/agents/${args.agentId}`, {
          token: config.token,
          version: GHL_VERSION_V3,
          params: { locationId: config.locationId },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_voice_ai_call_logs",
    description:
      "Get the Voice AI call-log dashboard for the location, with optional filters and pagination. " +
      "actionType and contactId may be a single value or a comma-separated list of values.",
    inputSchema: z.object({
      agentId: z.string().optional().describe("Filter by agent ID"),
      contactId: z.string().optional().describe("Filter by contact ID (comma-separated list supported)"),
      callType: z.enum(["LIVE", "TRIAL"]).optional().describe("Filter by call type"),
      startDate: z.number().optional().describe("Filter by start date (epoch millis)"),
      endDate: z.number().optional().describe("Filter by end date (epoch millis)"),
      actionType: z
        .string()
        .optional()
        .describe(
          "Filter by action type(s): CALL_TRANSFER, DATA_EXTRACTION, IN_CALL_DATA_EXTRACTION, " +
            "WORKFLOW_TRIGGER, SMS, APPOINTMENT_BOOKING, CUSTOM_ACTION, KNOWLEDGE_BASE " +
            "(comma-separated list supported)"
        ),
      sortBy: z.enum(["duration", "createdAt"]).optional().describe("Field to sort by"),
      sort: z.enum(["ascend", "descend"]).optional().describe("Sort direction"),
      page: z.number().optional().describe("Page number (default 1)"),
      pageSize: z.number().optional().describe("Records per page (default 10)"),
    }),
    handler: async (
      args: {
        agentId?: string;
        contactId?: string;
        callType?: string;
        startDate?: number;
        endDate?: number;
        actionType?: string;
        sortBy?: string;
        sort?: string;
        page?: number;
        pageSize?: number;
      },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest("GET", "/voice-ai/dashboard/call-logs", {
          token: config.token,
          version: GHL_VERSION_V3,
          params: {
            locationId: config.locationId,
            agentId: args.agentId,
            contactId: args.contactId,
            callType: args.callType,
            startDate: args.startDate,
            endDate: args.endDate,
            actionType: args.actionType,
            sortBy: args.sortBy,
            sort: args.sort,
            page: args.page,
            pageSize: args.pageSize,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_voice_ai_call_log",
    description: "Get a single Voice AI call log entry by call ID.",
    inputSchema: z.object({
      callId: z.string().describe("The call ID"),
    }),
    handler: async (args: { callId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", `/voice-ai/dashboard/call-logs/${args.callId}`, {
          token: config.token,
          version: GHL_VERSION_V3,
          params: { locationId: config.locationId },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
];
