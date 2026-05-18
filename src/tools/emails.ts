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
        const result = await ghlRequest("GET", "/emails/builder/templates", {
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
          `/emails/builder/templates/${args.templateId}`,
          { token: config.token, params: { locationId: config.locationId } }
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
      "Create a new email marketing template using the GHL email builder. Provide name and raw HTML. Returns the created template ID which can then be referenced in workflow Send Email actions.",
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
        .describe("Email preview/snippet text shown in the inbox before the email is opened"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("POST", "/emails/builder/templates", {
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
    name: "ghl_update_email_builder_template",
    description: "Update an existing email builder template's name or HTML content.",
    inputSchema: z.object({
      templateId: z.string().describe("Template ID to update"),
      name: z.string().optional(),
      html: z.string().optional().describe("Updated HTML content"),
      previewText: z.string().optional(),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      const { templateId, ...updateData } = args as { templateId: string } & Record<string, unknown>;
      try {
        const result = await ghlRequest(
          "PUT",
          `/emails/builder/templates/${templateId}`,
          {
            token: config.token,
            body: { ...updateData, locationId: config.locationId },
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
          `/emails/builder/templates/${args.templateId}`,
          { token: config.token, params: { locationId: config.locationId } }
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
      "List all email marketing campaigns (broadcasts/drip campaigns) in the location.",
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
        const result = await ghlRequest("GET", "/emails/campaigns", {
          token: config.token,
          params: {
            locationId: config.locationId,
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
    description: "Get details of a single email campaign by ID.",
    inputSchema: z.object({
      campaignId: z.string(),
    }),
    handler: async (args: { campaignId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "GET",
          `/emails/campaigns/${args.campaignId}`,
          { token: config.token, params: { locationId: config.locationId } }
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
      "Create a new email marketing campaign (broadcast). Requires a template ID from ghl_create_email_builder_template or ghl_get_email_builder_templates.",
    inputSchema: z.object({
      name: z.string().describe("Campaign name"),
      subject: z.string().describe("Email subject line"),
      templateId: z
        .string()
        .describe("Email builder template ID to use as the campaign body"),
      fromName: z.string().optional().describe("Sender display name"),
      fromEmail: z.string().optional().describe("Sender email address"),
      replyToEmail: z.string().optional(),
      scheduledAt: z
        .string()
        .optional()
        .describe("ISO 8601 datetime to send the campaign. Omit to save as draft."),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("POST", "/emails/campaigns", {
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
    name: "ghl_delete_email_campaign",
    description: "Delete an email campaign by ID.",
    inputSchema: z.object({
      campaignId: z.string(),
    }),
    handler: async (args: { campaignId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "DELETE",
          `/emails/campaigns/${args.campaignId}`,
          { token: config.token }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
];
