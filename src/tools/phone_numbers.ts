import { z } from "zod";
import { ghlRequest, formatError, GHLConfig } from "../client.js";

export const phoneNumberTools = [
  {
    name: "ghl_get_phone_numbers",
    description: "List all purchased phone numbers in the location.",
    inputSchema: z.object({
      limit: z.number().optional().default(25),
      skip: z.number().optional().default(0),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", "/phone-number/", {
          token: config.token,
          params: {
            locationId: config.locationId,
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
    name: "ghl_search_available_phone_numbers",
    description:
      "Search for available phone numbers to purchase. Filter by area code, country, or number type.",
    inputSchema: z.object({
      areaCode: z.string().optional().describe("3-digit area code to search within"),
      countryCode: z
        .string()
        .optional()
        .default("CA")
        .describe("ISO 2-letter country code (CA = Canada, US = United States)"),
      type: z
        .enum(["local", "tollfree", "mobile"])
        .optional()
        .default("local")
        .describe("Phone number type"),
      limit: z.number().optional().default(10),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", "/phone-number/search", {
          token: config.token,
          params: {
            locationId: config.locationId,
            areaCode: args.areaCode as string | undefined,
            countryCode: args.countryCode as string | undefined,
            type: args.type as string | undefined,
            limit: args.limit as number | undefined,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_purchase_phone_number",
    description:
      "Purchase a phone number for the location. Use ghl_search_available_phone_numbers first to find a number.",
    inputSchema: z.object({
      phoneNumber: z
        .string()
        .describe("Phone number to purchase in E.164 format (e.g. +16135550100)"),
    }),
    handler: async (args: { phoneNumber: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("POST", "/phone-number/", {
          token: config.token,
          body: { locationId: config.locationId, phoneNumber: args.phoneNumber },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_release_phone_number",
    description: "Release (cancel) a purchased phone number from the location.",
    inputSchema: z.object({
      phoneNumberId: z.string().describe("Phone number ID to release (from ghl_get_phone_numbers)"),
    }),
    handler: async (args: { phoneNumberId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "DELETE",
          `/phone-number/${args.phoneNumberId}`,
          { token: config.token }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_update_phone_number",
    description: "Update settings for a purchased phone number (e.g. assign to a user, set call forwarding).",
    inputSchema: z.object({
      phoneNumberId: z.string().describe("Phone number ID to update"),
      assignedTo: z.string().optional().describe("User ID to assign the number to"),
      callForwardingEnabled: z.boolean().optional(),
      callForwardingNumber: z.string().optional().describe("Number to forward calls to"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      const { phoneNumberId, ...updateData } = args as { phoneNumberId: string } & Record<string, unknown>;
      try {
        const result = await ghlRequest(
          "PUT",
          `/phone-number/${phoneNumberId}`,
          { token: config.token, body: { ...updateData, locationId: config.locationId } }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
];
