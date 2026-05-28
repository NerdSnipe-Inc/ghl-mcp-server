import { z } from "zod";
import { ghlRequest, formatError, GHLConfig } from "../client.js";

/**
 * Email Builder / Marketing Email tools
 *
 * These operate on GHL's email marketing system — the visual-builder templates
 * that appear under Marketing → Emails in the GHL UI. They are separate from
 * the simple Location Templates (ghl_create_template / ghl_get_templates).
 *
 * Email builder templates are what you reference when setting up a "Send Email"
 * action inside a workflow and selecting a pre-designed template.
 */

export const emailBuilderTools = [
  {
    name: "ghl_get_email_builder_templates",
    description:
      "List email marketing / builder templates for the location. These are the visual-editor templates used in Marketing → Emails and referenced by workflow Send Email actions.",
    inputSchema: z.object({
      limit: z.number().optional().default(25),
      offset: z.number().optional().default(0),
      sortByDate: z
        .enum(["asc", "desc"])
        .optional()
        .default("desc")
        .describe("Sort by creation date"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", "/emails/builder", {
          token: config.token,
          params: {
            locationId: config.locationId,
            limit: args.limit as number | undefined,
            offset: args.offset as number | undefined,
            sortByDate: args.sortByDate as string | undefined,
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
          `/emails/builder/${config.locationId}/${args.templateId}`,
          { token: config.token }
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
      "Create a new HTML email template in GHL Marketing → Emails. Handles both the skeleton creation and HTML content upload in one call. Returns the template ID for use in workflows.",
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
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        // Step 1 — create the empty template skeleton
        const created = await ghlRequest<{ redirect: string; traceId: string }>(
          "POST",
          "/emails/builder",
          {
            token: config.token,
            body: {
              locationId: config.locationId,
              type: "html",
              title: args.name,
              name: args.name,
              isPlainText: false,
            },
          }
        );
        const templateId = created.redirect;

        // Step 2 — push HTML content into the template
        const updated = await ghlRequest(
          "POST",
          "/emails/builder/data",
          {
            token: config.token,
            body: {
              locationId: config.locationId,
              templateId,
              updatedBy: config.locationId,
              dnd: { elements: [], attrs: {}, templateSettings: {} },
              html: args.html,
              editorType: "html",
              ...(args.previewText ? { previewText: args.previewText } : {}),
            },
          }
        );

        return JSON.stringify({ templateId, created, updated }, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_update_email_builder_template",
    description: "Update an existing email builder template's HTML content.",
    inputSchema: z.object({
      templateId: z.string().describe("Template ID to update"),
      html: z.string().describe("Updated HTML content"),
      previewText: z.string().optional(),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "POST",
          "/emails/builder/data",
          {
            token: config.token,
            body: {
              locationId: config.locationId,
              templateId: args.templateId,
              updatedBy: config.locationId,
              dnd: { elements: [], attrs: {}, templateSettings: {} },
              html: args.html,
              editorType: "html",
              ...(args.previewText ? { previewText: args.previewText } : {}),
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
          `/emails/builder/${config.locationId}/${args.templateId}`,
          { token: config.token }
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
    description:
      "List email marketing campaigns in the location via the schedule endpoint.",
    inputSchema: z.object({
      status: z
        .enum(["draft", "scheduled", "sent", "all"])
        .optional()
        .default("all"),
      limit: z.number().optional().default(25),
      offset: z.number().optional().default(0),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", "/emails/schedule", {
          token: config.token,
          params: {
            locationId: config.locationId,
            campaignsOnly: true,
            status: args.status as string | undefined,
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
          `/emails/schedule/${args.campaignId}`,
          { token: config.token }
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
      "Create a new email marketing campaign (scheduled send) using an existing email builder template.",
    inputSchema: z.object({
      name: z.string().describe("Campaign display name"),
      templateId: z.string().describe("Email builder template ID to use"),
      subject: z.string().describe("Email subject line"),
      scheduledAt: z
        .string()
        .optional()
        .describe("ISO 8601 datetime to schedule the send (e.g. 2025-06-01T10:00:00Z)"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("POST", "/emails/schedule", {
          token: config.token,
          body: {
            locationId: config.locationId,
            name: args.name,
            templateId: args.templateId,
            subject: args.subject,
            ...(args.scheduledAt ? { scheduledAt: args.scheduledAt } : {}),
          },
        });
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
          `/emails/schedule/${args.campaignId}`,
          { token: config.token }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
];
