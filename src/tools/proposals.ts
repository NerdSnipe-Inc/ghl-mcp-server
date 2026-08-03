import { z } from "zod";
import { ghlRequest, formatError, GHLConfig, GHL_VERSION_V3 } from "../client.js";

export const proposalTools = [
  {
    name: "ghl_get_proposal_documents",
    description:
      "List proposal/estimate documents for the location. Supports filtering by status, payment status, date range, and search query.",
    inputSchema: z.object({
      status: z
        .string()
        .optional()
        .describe(
          "Document status, comma separated: draft, sent, viewed, completed, accepted"
        ),
      paymentStatus: z
        .string()
        .optional()
        .describe("Payment status, comma separated: waiting_for_payment, paid, no_payment"),
      limit: z.number().optional().describe("Max results"),
      skip: z.number().optional().describe("Results to skip"),
      query: z.string().optional().describe("Search string"),
      dateFrom: z
        .string()
        .optional()
        .describe("Date start from (ISO 8601). Must be provided together with dateTo"),
      dateTo: z
        .string()
        .optional()
        .describe("Date to (ISO 8601). Must be provided together with dateFrom"),
    }),
    handler: async (
      args: {
        status?: string;
        paymentStatus?: string;
        limit?: number;
        skip?: number;
        query?: string;
        dateFrom?: string;
        dateTo?: string;
      },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest("GET", "/proposals/document", {
          token: config.token,
          version: GHL_VERSION_V3,
          params: {
            locationId: config.locationId,
            status: args.status,
            paymentStatus: args.paymentStatus,
            limit: args.limit,
            skip: args.skip,
            query: args.query,
            dateFrom: args.dateFrom,
            dateTo: args.dateTo,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_send_proposal_document",
    description: "Send a proposal/estimate document to a client.",
    inputSchema: z.object({
      documentId: z.string().describe("Document Id"),
      sentBy: z.string().describe("User Id of the sender"),
      documentName: z.string().optional().describe("Document Name"),
      medium: z.enum(["link", "email"]).optional().describe("Medium to be used for sending the document"),
      ccRecipients: z
        .array(z.record(z.unknown()))
        .optional()
        .describe("CC recipients for the document"),
      notificationSettings: z
        .record(z.unknown())
        .optional()
        .describe("Notification settings (sender and receive email config)"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("POST", "/proposals/document/send", {
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
    name: "ghl_get_proposal_templates",
    description:
      "List proposal/estimate document templates for the location. Supports filtering by type, name, date range, and public document scope.",
    inputSchema: z.object({
      dateFrom: z.string().optional().describe("Date start from (ISO 8601)"),
      dateTo: z.string().optional().describe("Date to (ISO 8601)"),
      type: z
        .string()
        .optional()
        .describe("Comma-separated template types: proposal, estimate, contentLibrary"),
      name: z.string().optional().describe("Template Name"),
      isPublicDocument: z
        .boolean()
        .optional()
        .describe("If the docForm is a DocForm"),
      userId: z.string().optional().describe("User Id, required when isPublicDocument is true"),
      limit: z.string().optional().describe("Limit"),
      skip: z.string().optional().describe("Skip"),
    }),
    handler: async (
      args: {
        dateFrom?: string;
        dateTo?: string;
        type?: string;
        name?: string;
        isPublicDocument?: boolean;
        userId?: string;
        limit?: string;
        skip?: string;
      },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest("GET", "/proposals/templates", {
          token: config.token,
          version: GHL_VERSION_V3,
          params: {
            locationId: config.locationId,
            dateFrom: args.dateFrom,
            dateTo: args.dateTo,
            type: args.type,
            name: args.name,
            isPublicDocument: args.isPublicDocument,
            userId: args.userId,
            limit: args.limit,
            skip: args.skip,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_send_proposal_template",
    description: "Send a proposal/estimate document template to a client contact.",
    inputSchema: z.object({
      templateId: z.string().describe("Template Id"),
      userId: z.string().describe("User Id"),
      contactId: z.string().describe("Contact Id"),
      sendDocument: z.boolean().optional().describe("Whether to send the document"),
      opportunityId: z.string().optional().describe("Opportunity Id"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("POST", "/proposals/templates/send", {
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
