import { z } from "zod";
import { ghlRequest, formatError, GHLConfig, GHL_VERSION_V3 } from "../client.js";

// Communication channels the Conversation AI agent can operate on.
const CHANNEL_ENUM = ["IG", "FB", "SMS", "WebChat", "WhatsApp", "Live_Chat"] as const;
// Action types available for a Conversation AI agent action.
const ACTION_TYPE_ENUM = [
  "triggerWorkflow",
  "updateContactField",
  "appointmentBooking",
  "stopBot",
  "humanHandOver",
  "advancedFollowup",
  "transferBot",
] as const;

export const conversationAiTools = [
  {
    name: "ghl_create_conversation_ai_agent",
    description:
      "Create a new Conversation AI agent. Requires name, personality, goal, and instructions. " +
      // Confirmed directly against conversation-ai-v3.json: this endpoint has NO locationId
      // parameter anywhere (not body, not query) — the location is inferred from the auth token.
      "NOTE: unlike most tools in this codebase, no locationId is sent — the upstream API infers it from the auth token.",
    inputSchema: z.object({
      name: z.string().describe("Name of the agent"),
      personality: z.string().describe("Personality traits of the agent"),
      goal: z.string().describe("The goal of the agent"),
      instructions: z.string().describe("Instructions for the agent"),
      businessName: z.string().optional().describe("Name of the business the agent represents"),
      mode: z
        .enum(["off", "suggestive", "auto-pilot"])
        .optional()
        .describe("Mode of operation (default: off)"),
      channels: z
        .array(z.enum(CHANNEL_ENUM))
        .optional()
        .describe("Communication channels the agent can operate on"),
      isPrimary: z.boolean().optional().describe("Whether this agent is the primary agent"),
      waitTime: z
        .number()
        .optional()
        .describe("Wait time before agent responds (max 5 for minutes, 300 for seconds)"),
      waitTimeUnit: z.enum(["minutes", "seconds"]).optional().describe("Unit for wait time"),
      sleepEnabled: z
        .boolean()
        .optional()
        .describe("Whether sleep functionality is enabled (deprecated by upstream API)"),
      sleepTime: z
        .number()
        .optional()
        .describe("Duration of sleep period, required if sleepEnabled is true"),
      sleepTimeUnit: z
        .enum(["hours", "minutes", "seconds"])
        .optional()
        .describe("Unit of sleep time, required if sleepEnabled is true"),
      autoPilotMaxMessages: z
        .number()
        .optional()
        .describe("Max messages in auto-pilot mode before requiring human intervention (max 100, min 1)"),
      knowledgeBaseIds: z
        .array(z.string())
        .optional()
        .describe("Array of knowledge base IDs associated with this agent"),
      respondToImages: z.boolean().optional().describe("Allow agent to respond to images"),
      respondToAudio: z.boolean().optional().describe("Allow agent to respond to audio"),
      sleepOnManualMessage: z
        .boolean()
        .optional()
        .describe("Enable sleep when a manual outbound message is sent"),
      sleepOnWorkflowMessage: z
        .boolean()
        .optional()
        .describe("Enable sleep when a workflow outbound message is sent"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        // No locationId in the body — see NOTE above.
        const result = await ghlRequest("POST", "/conversation-ai/agents", {
          token: config.token,
          version: GHL_VERSION_V3,
          body: { ...args },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_search_conversation_ai_agents",
    description: "Search Conversation AI agents. All parameters are optional.",
    inputSchema: z.object({
      startAfter: z
        .string()
        .optional()
        .describe("Agent ID to start after (pagination cursor); omit for the first page"),
      limit: z.number().optional().describe("Records per page"),
      query: z
        .string()
        .optional()
        .describe("Search query on agent name; must be provided in lowercase"),
    }),
    handler: async (
      args: { startAfter?: string; limit?: number; query?: string },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest("GET", "/conversation-ai/agents/search", {
          token: config.token,
          version: GHL_VERSION_V3,
          params: {
            startAfter: args.startAfter,
            limit: args.limit,
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
    name: "ghl_get_conversation_ai_agent",
    description: "Get a Conversation AI agent by ID.",
    inputSchema: z.object({
      agentId: z.string().describe("The Conversation AI agent ID"),
    }),
    handler: async (args: { agentId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", `/conversation-ai/agents/${args.agentId}`, {
          token: config.token,
          version: GHL_VERSION_V3,
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_update_conversation_ai_agent",
    description:
      // Confirmed directly against conversation-ai-v3.json: autoPilotMaxMessages is the only
      // required body field on this endpoint (an upstream spec oddity — everything else that's
      // required on create becomes optional here) and there is no locationId parameter.
      "Update a Conversation AI agent. Only autoPilotMaxMessages is required by the upstream API " +
      "(all other fields, including name/personality/goal/instructions, are optional on update).",
    inputSchema: z.object({
      agentId: z.string().describe("The Conversation AI agent ID"),
      autoPilotMaxMessages: z
        .number()
        .describe("Max messages in auto-pilot mode before requiring human intervention (max 100, min 1)"),
      name: z.string().optional().describe("Name of the agent"),
      businessName: z.string().optional().describe("Name of the business the agent represents"),
      mode: z
        .enum(["off", "suggestive", "auto-pilot"])
        .optional()
        .describe("Mode of operation, required if primary is enabled"),
      channels: z
        .array(z.enum(CHANNEL_ENUM))
        .optional()
        .describe("Channels the agent can use"),
      isPrimary: z.boolean().optional().describe("Whether this agent is the primary agent"),
      waitTime: z
        .number()
        .optional()
        .describe("Wait time before agent responds (max 5 for minutes, 300 for seconds)"),
      waitTimeUnit: z.enum(["minutes", "seconds"]).optional().describe("Unit for wait time"),
      sleepEnabled: z
        .boolean()
        .optional()
        .describe("Whether sleep functionality is enabled (deprecated by upstream API)"),
      sleepTime: z
        .number()
        .optional()
        .describe("Duration of sleep period, required if sleepEnabled is true"),
      sleepTimeUnit: z
        .enum(["hours", "minutes", "seconds"])
        .optional()
        .describe("Unit of sleep time, required if sleepEnabled is true"),
      personality: z.string().optional().describe("Personality traits of the agent"),
      goal: z.string().optional().describe("The goal of the agent"),
      instructions: z.string().optional().describe("Instructions for the agent"),
      knowledgeBaseIds: z
        .array(z.string())
        .optional()
        .describe("Array of knowledge base IDs associated with this agent"),
      respondToImages: z.boolean().optional().describe("Allow agent to respond to images"),
      respondToAudio: z.boolean().optional().describe("Allow agent to respond to audio"),
      sleepOnManualMessage: z
        .boolean()
        .optional()
        .describe("Enable sleep when a manual outbound message is sent"),
      sleepOnWorkflowMessage: z
        .boolean()
        .optional()
        .describe("Enable sleep when a workflow outbound message is sent"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      const { agentId, ...fields } = args as { agentId: string } & Record<string, unknown>;
      try {
        const result = await ghlRequest("PUT", `/conversation-ai/agents/${agentId}`, {
          token: config.token,
          version: GHL_VERSION_V3,
          body: { ...fields },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_delete_conversation_ai_agent",
    description: "Delete a Conversation AI agent by ID.",
    inputSchema: z.object({
      agentId: z.string().describe("The Conversation AI agent ID"),
    }),
    handler: async (args: { agentId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("DELETE", `/conversation-ai/agents/${args.agentId}`, {
          token: config.token,
          version: GHL_VERSION_V3,
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_attach_conversation_ai_action",
    description:
      "Attach a new action to a Conversation AI agent. The `details` shape depends on `type` " +
      // Upstream spec declares `details` as a oneOf across 7 different DTOs keyed by `type`
      // (triggerWorkflowDto, updateContactFieldDto, appointmentBookingDto, stopBotDto,
      // humanHandOverDto, advancedFollowupDto, transferBotDto) — typed permissively here.
      "(triggerWorkflow, updateContactField, appointmentBooking, stopBot, humanHandOver, advancedFollowup, transferBot) — pass the fields for the matching action type as an object.",
    inputSchema: z.object({
      agentId: z.string().describe("The Conversation AI agent ID"),
      type: z.enum(ACTION_TYPE_ENUM).describe("Type of the action"),
      name: z.string().describe("Name of the action"),
      details: z
        .record(z.string(), z.unknown())
        .describe("Action-specific details object; shape depends on type"),
    }),
    handler: async (
      args: { agentId: string; type: string; name: string; details: Record<string, unknown> },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest(
          "POST",
          `/conversation-ai/agents/${args.agentId}/actions`,
          {
            token: config.token,
            version: GHL_VERSION_V3,
            body: { type: args.type, name: args.name, details: args.details },
          }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_list_conversation_ai_agent_actions",
    description: "List all actions attached to a Conversation AI agent.",
    inputSchema: z.object({
      agentId: z.string().describe("The Conversation AI agent ID"),
    }),
    handler: async (args: { agentId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "GET",
          `/conversation-ai/agents/${args.agentId}/actions/list`,
          {
            token: config.token,
            version: GHL_VERSION_V3,
          }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_conversation_ai_agent_action",
    description: "Get a single action attached to a Conversation AI agent.",
    inputSchema: z.object({
      agentId: z.string().describe("The Conversation AI agent ID"),
      actionId: z.string().describe("The action ID"),
    }),
    handler: async (args: { agentId: string; actionId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "GET",
          `/conversation-ai/agents/${args.agentId}/actions/${args.actionId}`,
          {
            token: config.token,
            version: GHL_VERSION_V3,
          }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_update_conversation_ai_agent_action",
    description:
      "Update an existing action attached to a Conversation AI agent. Requires type, name, and details " +
      "(the full replacement set) — details shape depends on type, typed permissively here.",
    inputSchema: z.object({
      agentId: z.string().describe("The Conversation AI agent ID"),
      actionId: z.string().describe("The action ID"),
      type: z.enum(ACTION_TYPE_ENUM).describe("Type of the action"),
      name: z.string().describe("Name of the action"),
      details: z
        .record(z.string(), z.unknown())
        .describe("Action-specific details object; shape depends on type"),
    }),
    handler: async (
      args: {
        agentId: string;
        actionId: string;
        type: string;
        name: string;
        details: Record<string, unknown>;
      },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest(
          "PUT",
          `/conversation-ai/agents/${args.agentId}/actions/${args.actionId}`,
          {
            token: config.token,
            version: GHL_VERSION_V3,
            body: { type: args.type, name: args.name, details: args.details },
          }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_remove_conversation_ai_agent_action",
    description: "Remove an action from a Conversation AI agent.",
    inputSchema: z.object({
      agentId: z.string().describe("The Conversation AI agent ID"),
      actionId: z.string().describe("The action ID"),
    }),
    handler: async (args: { agentId: string; actionId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "DELETE",
          `/conversation-ai/agents/${args.agentId}/actions/${args.actionId}`,
          {
            token: config.token,
            version: GHL_VERSION_V3,
          }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_update_conversation_ai_followup_settings",
    description: "Update the followup settings for a Conversation AI agent.",
    inputSchema: z.object({
      agentId: z.string().describe("The Conversation AI agent ID"),
      actionIds: z.array(z.string()).describe("Action IDs this followup settings update applies to"),
      followupSettings: z
        .object({
          dynamicChannelSwitching: z
            .boolean()
            .describe("Whether to dynamically switch channels for followups"),
          followUpHours: z
            .boolean()
            .optional()
            .describe("Whether to respect working hours for followups"),
          // Nested WorkingHours/Interval items typed permissively — not load-bearing beyond
          // pass-through to the upstream API.
          workingHours: z
            .array(z.record(z.string(), z.unknown()))
            .optional()
            .describe("Working hours configuration for followups"),
          timezoneToUse: z
            .enum(["contact", "business"])
            .optional()
            .describe("Timezone to use for followups"),
        })
        .describe("Additional settings for followup behavior"),
    }),
    handler: async (
      args: {
        agentId: string;
        actionIds: string[];
        followupSettings: Record<string, unknown>;
      },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest(
          "PATCH",
          `/conversation-ai/agents/${args.agentId}/followup-settings`,
          {
            token: config.token,
            version: GHL_VERSION_V3,
            body: { actionIds: args.actionIds, followupSettings: args.followupSettings },
          }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_conversation_ai_generation",
    description: "Get an AI-generated message for a conversation or workflow message.",
    inputSchema: z.object({
      messageId: z.string().describe("The message ID"),
      source: z.enum(["conversation", "workflow"]).describe("Source of the message"),
    }),
    handler: async (args: { messageId: string; source: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", "/conversation-ai/generations", {
          token: config.token,
          version: GHL_VERSION_V3,
          params: {
            messageId: args.messageId,
            source: args.source,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
];
