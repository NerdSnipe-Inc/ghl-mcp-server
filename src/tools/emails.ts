import { z } from "zod";
import { ghlRequest, formatError, GHLConfig, GHL_VERSION_V3 } from "../client.js";

/**
 * Email Builder / Marketing Email tools (GHL API v3)
 *
 * These operate on GHL's email marketing system — the visual-builder templates
 * and bulk email campaigns that appear under Marketing → Emails in the GHL UI.
 * They are separate from the simple Location Templates
 * (ghl_create_template / ghl_get_templates).
 *
 * v3 replaced the old `/emails/builder*` and `/emails/schedule*` families with
 * location-scoped resources:
 *   - templates → /emails/locations/{locationId}/templates
 *   - campaigns → /emails/locations/{locationId}/campaigns/emails
 *
 * Email builder templates are what you reference when setting up a "Send Email"
 * action inside a workflow and selecting a pre-designed template.
 */

const templatesPath = (locationId: string) =>
  `/emails/locations/${locationId}/templates`;
const campaignsPath = (locationId: string) =>
  `/emails/locations/${locationId}/campaigns/emails`;

// Spec: ScheduleCampaignScheduleConfigPublicV2Dto — sendAt plus 3 optional
// nested sub-objects (batch, tracking, resend) and emailPreferenceId.
const scheduleConfigSchema = z.object({
  sendAt: z
    .string()
    .optional()
    .describe(
      "Date/time to send, e.g. '2026-04-01 09:00 AM'. Required when scheduleType is 'scheduled', 'batch', or 'smart_send'. Ignored for 'immediate' and 'rss'."
    ),
  batch: z
    .object({
      batchSize: z.number().describe("Number of contacts to process per batch"),
      interval: z.number().describe("Delay between batches"),
      intervalUnit: z.enum(["minutes", "hours", "days"]).describe("Unit for the interval"),
      skipDays: z
        .array(z.enum(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]))
        .optional()
        .describe("Days to skip sending"),
      windowStart: z.string().optional().describe("Earliest time to send batches, e.g. '09:00 AM'"),
      windowEnd: z.string().optional().describe("Latest time to send batches, e.g. '05:00 PM'"),
    })
    .optional()
    .describe("Batch/drip configuration. Required when scheduleType is 'batch'."),
  tracking: z
    .object({
      clickTracking: z.boolean().optional(),
      utmTracking: z.boolean().optional(),
    })
    .optional()
    .describe("Click and UTM tracking options"),
  resend: z
    .object({
      enabled: z.boolean().optional(),
      waitHours: z.number().optional().describe("Hours to wait before resending. Required when enabled is true."),
      subject: z.string().optional().describe("Override subject line for the resend email"),
    })
    .optional()
    .describe("Auto-resend to contacts who did not open"),
  emailPreferenceId: z.string().optional().describe("Email preference type ID for categorizing this campaign"),
});

// Spec: ScheduleCampaignRssConfigPublicV2Dto — required when scheduleType is 'rss'.
const rssConfigSchema = z.object({
  name: z.string().describe("RSS schedule name"),
  rssFeedURL: z.string().describe("RSS feed URL"),
  repeatAfter: z.enum(["every_day", "every_week", "every_month"]).describe("How often to check the feed"),
  repeatAfterTime: z.string().describe("Time of day to execute, e.g. '09:00 AM'"),
  rssFeedLimit: z.number().optional().describe("Max number of RSS items per email"),
  startAtDay: z
    .enum(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"])
    .optional()
    .describe("Day of week for weekly RSS"),
  startAtMonthDay: z.string().optional().describe("Day of month for monthly RSS, e.g. '15'"),
  firstExecutionDate: z.string().optional().describe("Override first execution date/time"),
});

// Spec: ScheduleCampaignABTestConfigPublicV2Dto — can be combined with any
// scheduleType except 'rss'.
const abTestConfigSchema = z.object({
  testType: z.enum(["emailContent", "subjectLine"]).describe("What is being tested"),
  testDuration: z.number().describe("Seconds to run the test before picking a winner"),
  variationCount: z.number().describe("Number of variations"),
  testSize: z.number().describe("Percentage of contacts in the test group (0-100)"),
  winningCriteria: z.enum(["openRate", "clickRate"]).describe("How to pick the winner"),
  variations: z
    .array(
      z.object({
        subject: z.string().optional().describe("Subject line for this variation"),
        documentId: z.string().optional().describe("Template/document ID for this variation"),
      })
    )
    .describe("A/B test variations"),
});

export const emailBuilderTools = [
  {
    name: "ghl_get_email_builder_templates",
    description:
      "List email marketing / builder templates for the location. These are the visual-editor templates used in Marketing → Emails and referenced by workflow Send Email actions. Results are sorted by last-updated date.",
    inputSchema: z.object({
      limit: z.number().optional().default(10).describe("Max results (1-20)"),
      offset: z.number().optional().default(0),
      search: z.string().optional().describe("Filter templates by name"),
      sortOrder: z
        .enum(["asc", "desc"])
        .optional()
        .default("desc")
        .describe("Sort direction on last-updated date"),
      archived: z
        .boolean()
        .optional()
        .describe("Return archived templates instead of active ones"),
      folderId: z
        .string()
        .optional()
        .describe("Only return items inside this folder ('root' for top level)"),
      include: z
        .enum(["all", "templates", "folders"])
        .optional()
        .default("all")
        .describe("Restrict results to templates only, folders only, or both (default)"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", templatesPath(config.locationId), {
          token: config.token,
          version: GHL_VERSION_V3,
          params: {
            limit: args.limit as number | undefined,
            offset: args.offset as number | undefined,
            search: args.search as string | undefined,
            sortOrder: args.sortOrder as string | undefined,
            archived: args.archived as boolean | undefined,
            folderId: args.folderId as string | undefined,
            include: args.include as string | undefined,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_email_builder_template",
    description: "Get a single email builder template by ID.",
    inputSchema: z.object({
      templateId: z.string().describe("Email builder template ID"),
    }),
    handler: async (args: { templateId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "GET",
          `${templatesPath(config.locationId)}/${args.templateId}`,
          { token: config.token, version: GHL_VERSION_V3 }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_create_email_builder_template",
    description:
      "Create a new HTML email template in GHL Marketing → Emails. Name and HTML content are sent in a single call. Returns the created template (including its `id`) for use in workflows and campaigns.",
    inputSchema: z.object({
      name: z.string().describe("Template display name (shown in Marketing → Emails)"),
      html: z
        .string()
        .describe(
          "Full HTML content of the email. Use GHL merge tags like {{contact.first_name}}, {{contact.company_name}}."
        ),
      previewText: z
        .string()
        .optional()
        .describe("Preview/snippet text shown in the inbox before opening"),
      subjectLine: z.string().optional().describe("Default email subject line"),
      parentFolderId: z
        .string()
        .optional()
        .describe("Folder to create the template in"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("POST", templatesPath(config.locationId), {
          token: config.token,
          version: GHL_VERSION_V3,
          body: {
            name: args.name,
            editorType: "html",
            editorContent: args.html,
            ...(args.previewText ? { previewText: args.previewText } : {}),
            ...(args.subjectLine ? { subjectLine: args.subjectLine } : {}),
            ...(args.parentFolderId
              ? { parentFolderId: args.parentFolderId }
              : {}),
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_update_email_builder_template",
    description:
      "Update an existing email builder template. Pass `html` to replace the template's content, and/or `name`/`previewText`/`subjectLine` to update metadata only.",
    inputSchema: z.object({
      templateId: z.string().describe("Template ID to update"),
      html: z.string().optional().describe("Updated HTML content"),
      name: z.string().optional().describe("New template display name"),
      previewText: z.string().optional(),
      subjectLine: z.string().optional().describe("Default email subject line"),
      archived: z
        .boolean()
        .optional()
        .describe("Archive (true) or restore (false) the template"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "PATCH",
          `${templatesPath(config.locationId)}/${args.templateId}`,
          {
            token: config.token,
            version: GHL_VERSION_V3,
            body: {
              // editorContent and editorType must be sent together, or not at all
              ...(args.html !== undefined
                ? { editorContent: args.html, editorType: "html" }
                : {}),
              ...(args.name !== undefined ? { name: args.name } : {}),
              ...(args.previewText !== undefined
                ? { previewText: args.previewText }
                : {}),
              ...(args.subjectLine !== undefined
                ? { subjectLine: args.subjectLine }
                : {}),
              ...(args.archived !== undefined ? { archived: args.archived } : {}),
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
    name: "ghl_delete_email_builder_template",
    description: "Delete an email builder template by ID.",
    inputSchema: z.object({
      templateId: z.string().describe("Template ID to delete"),
    }),
    handler: async (args: { templateId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "DELETE",
          `${templatesPath(config.locationId)}/${args.templateId}`,
          { token: config.token, version: GHL_VERSION_V3 }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
];

export const emailCampaignTools = [
  {
    name: "ghl_get_email_campaigns",
    description: "List bulk email marketing campaigns in the location.",
    inputSchema: z.object({
      status: z
        .enum([
          "all",
          "sent",
          "failed",
          "archived",
          "draft",
          "processing",
          "scheduled",
          "cancelled",
          "paused",
        ])
        .optional()
        .default("all"),
      search: z.string().optional().describe("Filter campaigns by name"),
      limit: z.number().optional().default(10).describe("Max results (1-20)"),
      offset: z.number().optional().default(0),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", campaignsPath(config.locationId), {
          token: config.token,
          version: GHL_VERSION_V3,
          params: {
            status: args.status as string | undefined,
            search: args.search as string | undefined,
            limit: args.limit as number | undefined,
            offset: args.offset as number | undefined,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_email_campaign",
    description: "Get a single email marketing campaign by ID.",
    inputSchema: z.object({
      campaignId: z.string().describe("Campaign ID to retrieve"),
    }),
    handler: async (args: { campaignId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "GET",
          `${campaignsPath(config.locationId)}/${args.campaignId}`,
          { token: config.token, version: GHL_VERSION_V3 }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_create_email_campaign",
    description:
      "Create a draft email marketing campaign, optionally seeded from an existing email builder template. The campaign is created as a draft — subject line, recipients and send time are set later via the schedule step in the GHL UI, which this tool does not perform.",
    inputSchema: z.object({
      name: z.string().describe("Campaign display name"),
      userId: z
        .string()
        .describe("GHL user ID performing this action (required by the API)"),
      userName: z.string().optional().describe("Name of the user performing this action"),
      timeZone: z
        .string()
        .optional()
        .default("UTC")
        .describe("IANA timezone for the campaign, e.g. America/New_York"),
      templateId: z
        .string()
        .optional()
        .describe(
          "Email builder template ID to seed the campaign from. Omit to create a blank campaign."
        ),
      html: z
        .string()
        .optional()
        .describe("Initial HTML content (alternative to seeding from a template)"),
      parentFolderId: z.string().optional().describe("Folder to create the campaign in"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("POST", campaignsPath(config.locationId), {
          token: config.token,
          version: GHL_VERSION_V3,
          body: {
            name: args.name,
            editorType: "html",
            userId: args.userId,
            ...(args.userName ? { userName: args.userName } : {}),
            timeZone: (args.timeZone as string | undefined) ?? "UTC",
            ...(args.templateId ? { templateId: args.templateId } : {}),
            ...(args.html ? { editorContent: args.html } : {}),
            ...(args.parentFolderId
              ? { parentFolderId: args.parentFolderId }
              : {}),
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_schedule_email_campaign",
    description:
      "Schedule (or immediately send) a draft email campaign created via ghl_create_email_campaign. Sets the subject, sender, recipients, and send timing, and triggers the send. Pair with ghl_create_email_campaign, which only creates the draft.",
    inputSchema: z.object({
      campaignId: z.string().describe("Campaign ID to schedule (from ghl_create_email_campaign)"),
      scheduleType: z
        .enum(["immediate", "scheduled", "batch", "rss", "smart_send"])
        .optional()
        .default("immediate")
        .describe("How to schedule the campaign"),
      timeZone: z.string().optional().default("UTC").describe("IANA timezone, e.g. America/New_York"),
      userId: z.string().describe("GHL user ID performing this action (required by the API)"),
      userName: z.string().optional().describe("Name of the user performing this action"),
      subject: z.string().describe("Email subject line"),
      fromName: z.string().describe("Sender display name"),
      fromEmail: z.string().describe("Sender email address"),
      replyToAddress: z.string().optional().describe("Reply-to email address"),
      previewText: z.string().optional().describe("Preview text shown in inbox after subject"),
      attachments: z.array(z.string()).optional().describe("Attachment download URLs"),
      recipientType: z
        .enum(["contact", "tag", "segment"])
        .optional()
        .default("contact")
        .describe("Recipient selection type"),
      contactIds: z
        .array(z.string())
        .optional()
        .describe("Contact IDs to send to. Required when recipientType is 'contact'."),
      tagIds: z
        .array(z.string())
        .optional()
        .describe("Tag IDs to filter recipients by. Required when recipientType is 'tag'."),
      segment: z
        .enum([
          "engaged_last_7_days",
          "engaged_last_30_days",
          "engaged_last_60_days",
          "engaged_last_5_campaigns",
          "unengaged_last_5_campaigns",
        ])
        .optional()
        .describe("Pre-built segment. Required when recipientType is 'segment'."),
      freezeList: z
        .boolean()
        .optional()
        .describe("Freeze the contact list at schedule time — new matching contacts won't be added later"),
      sendDays: z
        .array(z.enum(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]))
        .optional()
        .describe("Days of the week to allow sending. Used for 'batch' and 'rss' scheduleTypes."),
      // Spec: ScheduleCampaignScheduleConfigPublicV2Dto. Required when scheduleType
      // is not 'rss'.
      scheduleConfig: scheduleConfigSchema
        .optional()
        .describe("Schedule configuration. Required when scheduleType is not 'rss'."),
      // Spec: ScheduleCampaignRssConfigPublicV2Dto. Required when scheduleType is 'rss'.
      rssConfig: rssConfigSchema
        .optional()
        .describe("RSS feed configuration. Required when scheduleType is 'rss'."),
      // Spec: ScheduleCampaignABTestConfigPublicV2Dto. Can be combined with any
      // scheduleType except 'rss'.
      abTestConfig: abTestConfigSchema
        .optional()
        .describe("A/B test configuration. Can be combined with any scheduleType except 'rss'."),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const scheduleType = (args.scheduleType as string | undefined) ?? "immediate";
        const recipientType = (args.recipientType as string | undefined) ?? "contact";

        const emailMeta = {
          subject: args.subject,
          fromName: args.fromName,
          fromEmail: args.fromEmail,
          ...(args.replyToAddress ? { replyToAddress: args.replyToAddress } : {}),
          ...(args.previewText ? { previewText: args.previewText } : {}),
          ...(args.attachments ? { attachments: args.attachments } : {}),
        };

        const recipients = {
          type: recipientType,
          ...(args.contactIds ? { contactIds: args.contactIds } : {}),
          ...(args.tagIds ? { tagIds: args.tagIds } : {}),
          ...(args.segment ? { segment: args.segment } : {}),
          ...(args.freezeList !== undefined ? { freezeList: args.freezeList } : {}),
        };

        const result = await ghlRequest(
          "POST",
          `${campaignsPath(config.locationId)}/${args.campaignId}/schedule`,
          {
            token: config.token,
            version: GHL_VERSION_V3,
            body: {
              scheduleType,
              timeZone: (args.timeZone as string | undefined) ?? "UTC",
              userId: args.userId,
              ...(args.userName ? { userName: args.userName } : {}),
              emailMeta,
              recipients,
              ...(args.sendDays ? { sendDays: args.sendDays } : {}),
              ...(args.scheduleConfig ? { scheduleConfig: args.scheduleConfig } : {}),
              ...(args.rssConfig ? { rssConfig: args.rssConfig } : {}),
              ...(args.abTestConfig ? { abTestConfig: args.abTestConfig } : {}),
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
    name: "ghl_delete_email_campaign",
    description: "Delete an email marketing campaign by ID.",
    inputSchema: z.object({
      campaignId: z.string().describe("Campaign ID to delete"),
    }),
    handler: async (args: { campaignId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "DELETE",
          `${campaignsPath(config.locationId)}/${args.campaignId}`,
          { token: config.token, version: GHL_VERSION_V3 }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
];
