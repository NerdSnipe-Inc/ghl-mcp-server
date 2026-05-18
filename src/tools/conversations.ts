import { z } from "zod";
import { ghlRequest, formatError, GHLConfig } from "../client.js";

export const conversationTools = [
  {
    name: "ghl_search_conversations",
    description:
      "Search conversations in the GHL location. Filter by contact, status, type, or date.",
    inputSchema: z.object({
      contactId: z.string().optional().describe("Filter by contact ID"),
      query: z.string().optional().describe("Search query"),
      status: z
        .enum(["all", "read", "unread", "starred", "recents"])
        .optional()
        .default("all"),
      limit: z.number().optional().default(20),
      lastMessageType: z
        .enum(["TYPE_CALL", "TYPE_SMS", "TYPE_EMAIL", "TYPE_FACEBOOK", "TYPE_INSTAGRAM"])
        .optional()
        .describe("Filter by last message channel type"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", "/conversations/search", {
          token: config.token,
          params: {
            locationId: config.locationId,
            contactId: args.contactId as string | undefined,
            query: args.query as string | undefined,
            status: args.status as string | undefined,
            limit: args.limit as number | undefined,
            lastMessageType: args.lastMessageType as string | undefined,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_conversation",
    description: "Get a conversation by ID with metadata.",
    inputSchema: z.object({
      conversationId: z.string(),
    }),
    handler: async (args: { conversationId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", `/conversations/${args.conversationId}`, {
          token: config.token,
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_create_conversation",
    description: "Create a new conversation thread for a contact.",
    inputSchema: z.object({
      contactId: z.string(),
    }),
    handler: async (args: { contactId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("POST", "/conversations/", {
          token: config.token,
          body: { contactId: args.contactId, locationId: config.locationId },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_messages",
    description: "Get messages in a conversation.",
    inputSchema: z.object({
      conversationId: z.string(),
      limit: z.number().optional().default(20),
      lastMessageId: z.string().optional().describe("Cursor for pagination"),
    }),
    handler: async (
      args: { conversationId: string; limit?: number; lastMessageId?: string },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest(
          "GET",
          `/conversations/${args.conversationId}/messages`,
          {
            token: config.token,
            params: { limit: args.limit, lastMessageId: args.lastMessageId },
          }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_send_message",
    description:
      "Send a message to a contact via SMS, email, WhatsApp, or other channel. This is the primary tool for outbound communication.",
    inputSchema: z.object({
      contactId: z.string().describe("The contact to message"),
      type: z
        .enum([
          "SMS",
          "Email",
          "WhatsApp",
          "GMB",
          "IG",
          "FB",
          "Custom",
          "Live_Chat",
          "Call",
        ])
        .describe("Message channel type"),
      message: z.string().describe("Message body text"),
      subject: z.string().optional().describe("Email subject (required for Email type)"),
      html: z.string().optional().describe("HTML body for email"),
      fromName: z.string().optional().describe("Sender name override"),
      fromNumber: z.string().optional().describe("Sender phone number override"),
      scheduledTimestamp: z
        .number()
        .optional()
        .describe("Unix timestamp (seconds) to schedule message"),
      attachments: z
        .array(z.string())
        .optional()
        .describe("Array of attachment URLs"),
      conversationProviderId: z.string().optional(),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("POST", "/conversations/messages", {
          token: config.token,
          body: { ...args, locationId: config.locationId },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_send_email",
    description: "Send an email within an existing conversation.",
    inputSchema: z.object({
      conversationId: z.string(),
      subject: z.string(),
      body: z.string().describe("Plain text body"),
      html: z.string().optional().describe("HTML body"),
      to: z.array(z.string()).describe("Recipient email addresses"),
      from: z.string().optional().describe("Sender email"),
      fromName: z.string().optional(),
      cc: z.array(z.string()).optional(),
      bcc: z.array(z.string()).optional(),
      replyToMessageId: z.string().optional().describe("Reply to a specific message"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      const { conversationId, ...emailData } = args as {
        conversationId: string;
      } & Record<string, unknown>;
      try {
        const result = await ghlRequest(
          "POST",
          `/conversations/${conversationId}/messages/email`,
          {
            token: config.token,
            body: emailData,
          }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_update_message_status",
    description: "Mark a message as read or update its delivery status.",
    inputSchema: z.object({
      messageId: z.string(),
      status: z
        .enum(["read", "unread", "delivered", "pending", "failed"])
        .describe("New message status"),
    }),
    handler: async (args: { messageId: string; status: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "PUT",
          `/conversations/messages/${args.messageId}/status`,
          {
            token: config.token,
            body: { status: args.status },
          }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_cancel_scheduled_message",
    description: "Cancel a scheduled (future) message before it is sent.",
    inputSchema: z.object({
      messageId: z.string().describe("ID of the scheduled message to cancel"),
    }),
    handler: async (args: { messageId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "DELETE",
          `/conversations/messages/${args.messageId}/schedule`,
          { token: config.token }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_add_inbound_message",
    description: "Inject an inbound message into GHL (simulates receiving a message).",
    inputSchema: z.object({
      type: z.enum(["SMS", "Email", "WhatsApp"]),
      message: z.string(),
      contactId: z.string(),
      conversationId: z.string().optional(),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("POST", "/conversations/messages/inbound", {
          token: config.token,
          body: { ...args, locationId: config.locationId },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
];
