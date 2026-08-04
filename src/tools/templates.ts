import { z } from "zod";
import { ghlRequest, formatError, GHLConfig, GHL_VERSION_V3 } from "../client.js";

/**
 * Location Templates — quick-reply style SMS/email/WhatsApp templates.
 *
 * These are the simple templates stored under Settings → Templates in GHL.
 * They can be referenced in workflow Send Email/SMS actions.
 *
 * For full visual/HTML email marketing templates used in campaigns,
 * see emails.ts (ghl_create_email_builder_template).
 *
 * v3 status (confirmed via a full sweep of every file in apps/v3/ AND the
 * legacy apps/*.json tree, re-verified during the 2026-08-04 remediation):
 * GET and DELETE map cleanly to v3 (/locations/{locationId}/templates[/{id}]).
 * GET requires an `originId` query param — defaulted here to
 * config.locationId, matching how "origin" is used elsewhere in GHL's API
 * for location-native (non-integration) resources. There is NO POST/PUT for
 * this exact path (/locations/{locationId}/templates) anywhere in the spec
 * tree — v3 or legacy. (There IS a POST on the differently-shaped
 * /emails/locations/{locationId}/templates path, but that's the email
 * marketing/builder-template resource, already covered by emails.ts's
 * ghl_create_email_builder_template — not this simple quick-reply resource.)
 * ghl_create_template/ghl_update_template have therefore been removed: there
 * is no real endpoint to point them at, matching the "cannot be built" cases
 * documented for saas.ts/marketplace.ts/oauth.ts in earlier remediation
 * phases.
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
      originId: z
        .string()
        .optional()
        .describe("Origin ID to scope templates to. Defaults to the location itself if omitted."),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", `/locations/${config.locationId}/templates`, {
          token: config.token,
          version: GHL_VERSION_V3,
          params: {
            type: args.type as string | undefined,
            limit: args.limit as number | undefined,
            skip: args.skip as number | undefined,
            originId: (args.originId as string | undefined) ?? config.locationId,
          },
        });
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
          { token: config.token, version: GHL_VERSION_V3 }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
];
