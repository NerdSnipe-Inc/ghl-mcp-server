import { z } from "zod";
import { ghlRequest, formatError, GHLConfig, GHL_VERSION_V3 } from "../client.js";

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
      // Full spec enum from conversations-v3.json GET /conversations/search's
      // lastMessageType parameter.
      lastMessageType: z
        .enum([
          "TYPE_CALL",
          "TYPE_SMS",
          "TYPE_RCS",
          "TYPE_EMAIL",
          "TYPE_SMS_REVIEW_REQUEST",
          "TYPE_WEBCHAT",
          "TYPE_SMS_NO_SHOW_REQUEST",
          "TYPE_CAMPAIGN_SMS",
          "TYPE_CAMPAIGN_CALL",
          "TYPE_CAMPAIGN_EMAIL",
          "TYPE_CAMPAIGN_VOICEMAIL",
          "TYPE_FACEBOOK",
          "TYPE_CAMPAIGN_FACEBOOK",
          "TYPE_CAMPAIGN_MANUAL_CALL",
          "TYPE_CAMPAIGN_MANUAL_SMS",
          "TYPE_GMB",
          "TYPE_CAMPAIGN_GMB",
          "TYPE_REVIEW",
          "TYPE_INSTAGRAM",
          "TYPE_WHATSAPP",
          "TYPE_CUSTOM_SMS",
          "TYPE_CUSTOM_EMAIL",
          "TYPE_CUSTOM_PROVIDER_SMS",
          "TYPE_CUSTOM_PROVIDER_EMAIL",
          "TYPE_IVR_CALL",
          "TYPE_ACTIVITY_CONTACT",
          "TYPE_ACTIVITY_INVOICE",
          "TYPE_ACTIVITY_PAYMENT",
          "TYPE_ACTIVITY_OPPORTUNITY",
          "TYPE_LIVE_CHAT",
          "TYPE_LIVE_CHAT_INFO_MESSAGE",
          "TYPE_ACTIVITY_APPOINTMENT",
          "TYPE_FACEBOOK_COMMENT",
          "TYPE_INSTAGRAM_COMMENT",
          "TYPE_CUSTOM_CALL",
          "TYPE_INTERNAL_COMMENT",
          "TYPE_ACTIVITY_EMPLOYEE_ACTION_LOG",
          "TYPE_TIKTOK",
          "TYPE_TIKTOK_COMMENT",
          "TYPE_ACTIVITY_WHATSAPP",
          "TYPE_FORM_SUBMISSION",
          "TYPE_SMS_REACTION",
        ])
        .optional()
        .describe("Filter by last message channel type"),
      assignedTo: z.string().optional().describe("Comma-separated user IDs to filter by assignee"),
      followers: z.string().optional().describe("Comma-separated user IDs to filter by followers"),
      mentions: z.string().optional().describe("Comma-separated user IDs to filter by mentions"),
      sort: z.enum(["asc", "desc"]).optional().describe("Sort direction"),
      sortBy: z
        .enum(["last_manual_message_date", "last_message_date", "score_profile", "overdue_at", "due_at"])
        .optional()
        .describe("Field to sort by"),
      startAfterDate: z.union([z.string(), z.number()]).optional().describe("Cursor for pagination"),
      id: z.string().optional().describe("Filter by conversation ID"),
      lastMessageAction: z.enum(["automated", "manual"]).optional(),
      lastMessageDirection: z.enum(["inbound", "outbound"]).optional(),
      sortScoreProfile: z.string().optional().describe("Score profile ID used for sorting"),
      scoreProfile: z.string().optional().describe("Score profile ID to filter by"),
      scoreProfileMin: z.number().optional().describe("Minimum score profile value"),
      scoreProfileMax: z.number().optional().describe("Maximum score profile value"),
      startDate: z.number().optional().describe("Start timestamp in milliseconds"),
      endDate: z.number().optional().describe("End timestamp in milliseconds"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", "/conversations/search", {
          token: config.token,
          version: GHL_VERSION_V3,
          params: {
            locationId: config.locationId,
            contactId: args.contactId as string | undefined,
            query: args.query as string | undefined,
            status: args.status as string | undefined,
            limit: args.limit as number | undefined,
            lastMessageType: args.lastMessageType as string | undefined,
            assignedTo: args.assignedTo as string | undefined,
            followers: args.followers as string | undefined,
            mentions: args.mentions as string | undefined,
            sort: args.sort as string | undefined,
            sortBy: args.sortBy as string | undefined,
            startAfterDate: args.startAfterDate as string | number | undefined,
            id: args.id as string | undefined,
            lastMessageAction: args.lastMessageAction as string | undefined,
            lastMessageDirection: args.lastMessageDirection as string | undefined,
            sortScoreProfile: args.sortScoreProfile as string | undefined,
            scoreProfile: args.scoreProfile as string | undefined,
            scoreProfileMin: args.scoreProfileMin as number | undefined,
            scoreProfileMax: args.scoreProfileMax as number | undefined,
            startDate: args.startDate as number | undefined,
            endDate: args.endDate as number | undefined,
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
          version: GHL_VERSION_V3,
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
          version: GHL_VERSION_V3,
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
            version: GHL_VERSION_V3,
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
      // Spec (SendMessageBodyDto): real enum is SMS, RCS, Email, WhatsApp, IG, FB,
      // Custom, Live_Chat, TIKTOK — GMB/Call are not valid here.
      type: z
        .enum(["SMS", "RCS", "Email", "WhatsApp", "IG", "FB", "Custom", "Live_Chat", "TIKTOK"])
        .describe("Message channel type"),
      message: z.string().describe("Message body text"),
      subject: z.string().optional().describe("Email subject (required for Email type)"),
      html: z.string().optional().describe("HTML body for email"),
      fromNumber: z.string().optional().describe("Sender phone number override"),
      toNumber: z.string().optional().describe("Recipient phone number for outbound messages"),
      scheduledTimestamp: z
        .number()
        .optional()
        .describe("Unix timestamp (seconds) to schedule message"),
      attachments: z
        .array(z.string())
        .optional()
        .describe("Array of attachment URLs"),
      conversationProviderId: z.string().optional(),
      appointmentId: z.string().optional().describe("ID of the associated appointment"),
      templateId: z.string().optional().describe("ID of message template"),
      threadId: z
        .string()
        .optional()
        .describe("ID of message thread (for email, the message ID containing the thread)"),
      customSubtypeId: z
        .string()
        .optional()
        .describe("Custom subtype ID for email unsubscription preferences (email only)"),
      emailReplyMode: z.enum(["reply", "reply_all"]).optional(),
      forward: z
        .object({
          isForwarded: z.boolean().optional(),
          forwardWholeThread: z.boolean().optional(),
          messageId: z.string().optional(),
          emailMessageId: z.string().optional(),
          toEmail: z.string().optional(),
          recipientContactId: z.string().optional(),
        })
        .optional()
        .describe("Forwarding configuration for emails"),
      usesNativeSchedulingAi: z
        .boolean()
        .optional()
        .describe("Whether the scheduled email uses native AI for email scheduling"),
      optimizationPeriod: z
        .enum(["24h", "48h", "72h"])
        .optional()
        .describe("Send-time optimization period"),
      // Spec note: SendMessageBodyDto's `required` array lists `subType` and
      // `status` as required. Investigation suggests this is a spec-documentation
      // artifact rather than a real client-supplied requirement: `subType`'s
      // schema is typed "object" with an example that's a copy of `type`'s
      // description/example ("Email"), and `status` ("delivered"/"failed"/
      // "pending"/"read") describes a *delivery* status — something a client
      // sending a message cannot know in advance, which reads like a field that
      // belongs on the response DTO, not the request. We do NOT make these
      // required to avoid breaking every legitimate call; they're exposed as
      // optional passthrough fields with this discrepancy disclosed here rather
      // than guessed at.
      subType: z.unknown().optional().describe("Spec marks this required; see code comment above"),
      status: z
        .enum(["delivered", "failed", "pending", "read"])
        .optional()
        .describe("Spec marks this required; see code comment above"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("POST", "/conversations/messages", {
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
    name: "ghl_send_email",
    description:
      "Send an email to a contact. Creates or continues the contact's email conversation thread.",
    inputSchema: z.object({
      contactId: z.string().describe("The contact to email"),
      subject: z.string(),
      message: z
        .string()
        .optional()
        .describe("Plain text body (fallback for non-HTML clients)"),
      html: z.string().optional().describe("HTML body"),
      emailFrom: z.string().optional().describe("Sender email address"),
      emailTo: z
        .string()
        .optional()
        .describe("Recipient email address, if different from the contact's primary email"),
      emailCc: z.array(z.string()).optional(),
      emailBcc: z.array(z.string()).optional(),
      attachments: z.array(z.string()).optional().describe("Array of attachment URLs"),
      replyMessageId: z.string().optional().describe("Reply to a specific message"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("POST", "/conversations/messages", {
          token: config.token,
          version: GHL_VERSION_V3,
          body: { ...args, type: "Email", locationId: config.locationId },
        });
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
        .enum(["delivered", "failed", "pending", "read"])
        .describe("New message status"),
    }),
    handler: async (args: { messageId: string; status: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "PUT",
          `/conversations/messages/${args.messageId}/status`,
          {
            token: config.token,
            version: GHL_VERSION_V3,
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
          { token: config.token, version: GHL_VERSION_V3 }
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
      // Spec (ProcessMessageBodyDto) full type enum.
      type: z.enum([
        "SMS",
        "RCS",
        "Email",
        "WhatsApp",
        "GMB",
        "IG",
        "FB",
        "Custom",
        "WebChat",
        "Live_Chat",
        "Call",
        "IVR_Call",
        "Campaign_Call",
        "Campaign_VoiceMail",
        "TIKTOK",
        "ALL_IN_ONE_CHAT",
        "FORM_SUBMISSION",
      ]),
      message: z.string(),
      contactId: z.string(),
      // Spec: conversationId and conversationProviderId are both required.
      conversationId: z.string(),
      conversationProviderId: z.string(),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("POST", "/conversations/messages/inbound", {
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
];
