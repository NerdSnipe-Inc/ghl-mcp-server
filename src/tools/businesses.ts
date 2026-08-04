import { z } from "zod";
import { ghlRequest, formatError, GHLConfig, GHL_VERSION_V3 } from "../client.js";

export const businessesTools = [
  {
    name: "ghl_get_businesses",
    description: "List businesses for a location.",
    inputSchema: z.object({
      limit: z.number().optional().describe("Max results"),
      skip: z.number().optional().describe("Results to skip"),
    }),
    handler: async (args: { limit?: number; skip?: number }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", "/businesses/", {
          token: config.token,
          version: GHL_VERSION_V3,
          params: {
            locationId: config.locationId,
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
    name: "ghl_get_business",
    description: "Get a specific business by ID.",
    inputSchema: z.object({
      businessId: z.string().describe("The business ID"),
    }),
    handler: async (args: { businessId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", `/businesses/${args.businessId}`, {
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
    name: "ghl_create_business",
    description:
      "Create a new business. Required fields: name. Optional fields: phone, email, website, address, city, postalCode, state, country, description.",
    inputSchema: z.object({
      name: z.string().describe("Business name"),
      phone: z.string().optional().describe("Business phone number"),
      email: z.string().optional().describe("Business email address"),
      website: z.string().optional().describe("Business website URL"),
      address: z.string().optional().describe("Business street address"),
      city: z.string().optional().describe("Business city"),
      postalCode: z.string().optional().describe("Business postal code"),
      state: z.string().optional().describe("Business state"),
      country: z.string().optional().describe("Business country"),
      description: z.string().optional().describe("Business description"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("POST", "/businesses/", {
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
    name: "ghl_update_business",
    description:
      "Update an existing business. All fields (name, phone, email, website, address, city, postalCode, state, country, description) are optional.",
    inputSchema: z.object({
      businessId: z.string().describe("The business ID to update"),
      name: z.string().optional().describe("Business name"),
      phone: z.string().optional().describe("Business phone number"),
      email: z.string().optional().describe("Business email address"),
      website: z.string().optional().describe("Business website URL"),
      address: z.string().optional().describe("Business street address"),
      city: z.string().optional().describe("Business city"),
      postalCode: z.string().optional().describe("Business postal code"),
      state: z.string().optional().describe("Business state"),
      country: z.string().optional().describe("Business country"),
      description: z.string().optional().describe("Business description"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      const { businessId, ...fields } = args as { businessId: string } & Record<string, unknown>;
      try {
        const result = await ghlRequest("PUT", `/businesses/${businessId}`, {
          token: config.token,
          version: GHL_VERSION_V3,
          body: fields,
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_delete_business",
    description: "Delete a business.",
    inputSchema: z.object({
      businessId: z.string().describe("The business ID to delete"),
    }),
    handler: async (args: { businessId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("DELETE", `/businesses/${args.businessId}`, {
          token: config.token,
          version: GHL_VERSION_V3,
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
];
