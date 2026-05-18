import { z } from "zod";
import { ghlRequest, formatError, GHLConfig } from "../client.js";

/**
 * Location Templates — quick-reply style SMS/email/WhatsApp templates.
 *
 * These are the simple templates stored under Settings → Templates in GHL.
 * They can be referenced in workflow Send Email/SMS actions.
 *
 * For full visual/HTML email marketing templates used in campaigns,
 * see emails.ts (ghl_create_email_builder_template).
 */
export const templateTools = [
  {
    name: "ghl_get_templates",
    description:
      "List SMS/email/WhatsApp templates in the location. These are the quick-reply-style templates under Settings → Templates.",
    inputSchema: z.object({
      type: z.enum(["sms", "email", "whatsapp"]).optional().describe("Filter by template type"),
      limit: z.number().optional().default(25),
      skip: z.number().optional().default(0),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", `/locations/${config.locationId}/templates`, {
          token: config.token,
          params: {
            type: args.type as string | undefined,
            limit: args.limit as number | undefined,
            skip: args.skip as number | undefined,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_create_template",
    description:
      "Create a new SMS, email, or WhatsApp template. For email, provide a subject and HTML body. Returns the created template including its ID.",
    inputSchema: z.object({
      name: z.string().describe("Template display name"),
      type: z.enum(["email", "sms", "whatsapp"]).describe("Template channel type"),
      subject: z.string().optional().describe("Subject line — required for email templates"),
      body: z.string().describe("Template body — plain text for SMS/WhatsApp, HTML for email"),
      attachments: z.array(z.string()).optional().describe("Array of attachment URLs"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("POST", `/locations/${config.locationId}/templates`, {
          token: config.token,
          body: args,
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_update_template",
    description: "Update an existing SMS/email/WhatsApp template.",
    inputSchema: z.object({
      templateId: z.string().describe("Template ID to update"),
      name: z.string().optional(),
      subject: z.string().optional(),
      body: z.string().optional(),
      attachments: z.array(z.string()).optional(),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      const { templateId, ...updateData } = args as { templateId: string } & Record<string, unknown>;
      try {
        const result = await ghlRequest(
          "PUT",
          `/locations/${config.locationId}/templates/${templateId}`,
          { token: config.token, body: updateData }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_delete_template",
    description: "Delete an SMS/email/WhatsApp template by ID.",
    inputSchema: z.object({
      templateId: z.string().describe("Template ID to delete"),
    }),
    handler: async (args: { templateId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "DELETE",
          `/locations/${config.locationId}/templates/${args.templateId}`,
          { token: config.token }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
];
