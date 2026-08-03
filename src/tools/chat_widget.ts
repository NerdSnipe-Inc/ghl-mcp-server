import { z } from "zod";
import { ghlRequest, formatError, GHLConfig, GHL_VERSION_V3 } from "../client.js";

// Chat type accepted by CreateWidgetDTO / UpdateWidgetDTO (create/update/patch bodies).
const CHAT_WIDGET_BODY_CHAT_TYPE_ENUM = ["liveChat", "emailChat"] as const;

// Chat type filter accepted by GET /chat-widget/list, plus the virtual umbrella
// "webChat" (maps to facebookChat/emailChat/instagramChat/waChat).
const CHAT_WIDGET_LIST_CHAT_TYPE_ENUM = [
  "liveChat",
  "waChat",
  "emailChat",
  "allInOneChat",
  "voiceAiChat",
  "facebookChat",
  "instagramChat",
  "webChat",
] as const;

// excludeChatType filter on GET /chat-widget/list — same set minus the "webChat" umbrella.
const CHAT_WIDGET_EXCLUDE_CHAT_TYPE_ENUM = [
  "liveChat",
  "waChat",
  "emailChat",
  "allInOneChat",
  "voiceAiChat",
  "facebookChat",
  "instagramChat",
] as const;

// WidgetSettingsDTO has dozens of nested optional fields (theme, dimensions, advanceSettings,
// acknowledgementDetails, etc.) — typed permissively here as a free-form object rather than
// fully modeling every nested schema.
const settingsField = z
  .record(z.string(), z.unknown())
  .optional()
  .describe(
    "Widget display/behavior settings (WidgetSettingsDTO) — theme, messages, branding, " +
      "dimensions, advanced settings, etc. Shape is permissive; see GHL docs for full field list."
  );

export const chatWidgetTools = [
  {
    name: "ghl_create_chat_widget",
    description:
      "Create a new chat widget for the sub-account. Requires version, chatType, and name; " +
      "locationId is taken from the connected sub-account.",
    inputSchema: z.object({
      version: z.number().describe("Widget schema version, e.g. 2"),
      chatType: z.enum(CHAT_WIDGET_BODY_CHAT_TYPE_ENUM).describe("Chat type for the widget"),
      name: z.string().describe("Name of the chat widget"),
      deleted: z.boolean().optional().describe("Whether the widget is deleted"),
      default: z.boolean().optional().describe("Whether this is the default widget"),
      settings: settingsField,
    }),
    handler: async (
      args: {
        version: number;
        chatType: string;
        name: string;
        deleted?: boolean;
        default?: boolean;
        settings?: Record<string, unknown>;
      },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest("POST", "/chat-widget/", {
          token: config.token,
          version: GHL_VERSION_V3,
          body: {
            version: args.version,
            chatType: args.chatType,
            name: args.name,
            locationId: config.locationId,
            deleted: args.deleted,
            default: args.default,
            settings: args.settings,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_clone_chat_widget",
    description:
      "Create a copy of an existing chat widget in the same sub-account. Requires chatWidgetId; " +
      "locationId is taken from the connected sub-account.",
    inputSchema: z.object({
      chatWidgetId: z.string().describe("ID of the chat widget to clone"),
      name: z.string().optional().describe("Name for the cloned widget"),
    }),
    handler: async (args: { chatWidgetId: string; name?: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("POST", "/chat-widget/clone", {
          token: config.token,
          version: GHL_VERSION_V3,
          body: {
            locationId: config.locationId,
            chatWidgetId: args.chatWidgetId,
            name: args.name,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_chat_widget",
    description: "Get a single chat widget by ID.",
    inputSchema: z.object({
      id: z.string().describe("The chat widget ID"),
    }),
    handler: async (args: { id: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "GET",
          `/chat-widget/data/${config.locationId}/${args.id}`,
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
    name: "ghl_update_chat_widget",
    description:
      "Full update of a chat widget resource (PUT). All fields optional per upstream schema. " +
      "Note: the upstream spec's UpdateWidgetDTO is byte-identical between PUT and PATCH " +
      "(same optional properties, no required array on either) — implemented as-is; either " +
      "this tool or ghl_patch_chat_widget can be used interchangeably.",
    inputSchema: z.object({
      id: z.string().describe("The chat widget ID"),
      version: z.number().optional().describe("Widget schema version, e.g. 2"),
      chatType: z.enum(CHAT_WIDGET_BODY_CHAT_TYPE_ENUM).optional().describe("Chat type for the widget"),
      name: z.string().optional().describe("Name of the chat widget"),
      default: z.boolean().optional().describe("Whether this is the default widget"),
      settings: settingsField,
    }),
    handler: async (
      args: {
        id: string;
        version?: number;
        chatType?: string;
        name?: string;
        default?: boolean;
        settings?: Record<string, unknown>;
      },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest(
          "PUT",
          `/chat-widget/data/${config.locationId}/${args.id}`,
          {
            token: config.token,
            version: GHL_VERSION_V3,
            body: {
              version: args.version,
              chatType: args.chatType,
              name: args.name,
              default: args.default,
              settings: args.settings,
            },
          }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_patch_chat_widget",
    description:
      "Partial update of a chat widget resource (PATCH). All fields optional. " +
      "Note: the upstream spec's UpdateWidgetDTO is byte-identical between PUT and PATCH " +
      "(same optional properties, no required array on either) — implemented as-is; either " +
      "this tool or ghl_update_chat_widget can be used interchangeably.",
    inputSchema: z.object({
      id: z.string().describe("The chat widget ID"),
      version: z.number().optional().describe("Widget schema version, e.g. 2"),
      chatType: z.enum(CHAT_WIDGET_BODY_CHAT_TYPE_ENUM).optional().describe("Chat type for the widget"),
      name: z.string().optional().describe("Name of the chat widget"),
      default: z.boolean().optional().describe("Whether this is the default widget"),
      settings: settingsField,
    }),
    handler: async (
      args: {
        id: string;
        version?: number;
        chatType?: string;
        name?: string;
        default?: boolean;
        settings?: Record<string, unknown>;
      },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest(
          "PATCH",
          `/chat-widget/data/${config.locationId}/${args.id}`,
          {
            token: config.token,
            version: GHL_VERSION_V3,
            body: {
              version: args.version,
              chatType: args.chatType,
              name: args.name,
              default: args.default,
              settings: args.settings,
            },
          }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_list_chat_widgets",
    description:
      "List chat widgets for the sub-account with pagination and optional filters. " +
      "locationId is taken from the connected sub-account; offset/limit are required by the API.",
    inputSchema: z.object({
      offset: z.number().describe("Pagination offset"),
      limit: z.number().describe("Pagination limit"),
      chatType: z
        .enum(CHAT_WIDGET_LIST_CHAT_TYPE_ENUM)
        .optional()
        .describe(
          'Filter by chat type. Supports normal types plus the virtual umbrella "webChat" ' +
            "(maps to facebookChat/emailChat/instagramChat/waChat)."
        ),
      excludeChatType: z
        .enum(CHAT_WIDGET_EXCLUDE_CHAT_TYPE_ENUM)
        .optional()
        .describe("Exclude widgets of this chat type"),
      voiceAiAgentId: z.string().optional().describe("Filter by voice AI agent ID"),
      allInOneChatTypes: z
        .enum(CHAT_WIDGET_LIST_CHAT_TYPE_ENUM)
        .optional()
        .describe(
          'All-in-one chat type to filter by. Only applies when chatType is "allInOneChat". ' +
            'Supports normal types plus the virtual umbrella "webChat".'
        ),
    }),
    handler: async (
      args: {
        offset: number;
        limit: number;
        chatType?: string;
        excludeChatType?: string;
        voiceAiAgentId?: string;
        allInOneChatTypes?: string;
      },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest("GET", "/chat-widget/list", {
          token: config.token,
          version: GHL_VERSION_V3,
          params: {
            locationId: config.locationId,
            offset: args.offset,
            limit: args.limit,
            chatType: args.chatType,
            excludeChatType: args.excludeChatType,
            voiceAiAgentId: args.voiceAiAgentId,
            allInOneChatTypes: args.allInOneChatTypes,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_chat_widget_config",
    description:
      'Get widget display configuration by ID. Despite the "public" path segment ' +
      "(/chat-widget/public/config/{id}), this is wired the same way as every other " +
      "endpoint here — via the authenticated GHL client.",
    inputSchema: z.object({
      id: z.string().describe("The chat widget ID"),
      version: z.string().optional().describe('Config version to fetch, e.g. "3". Default: "2"'),
    }),
    handler: async (args: { id: string; version?: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", `/chat-widget/public/config/${args.id}`, {
          token: config.token,
          version: GHL_VERSION_V3,
          params: { version: args.version },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_delete_chat_widget",
    description:
      "Soft-delete a chat widget. If it was the default, another widget may be promoted.",
    inputSchema: z.object({
      id: z.string().describe("The chat widget ID"),
    }),
    handler: async (args: { id: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "DELETE",
          `/chat-widget/${config.locationId}/${args.id}`,
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
];
