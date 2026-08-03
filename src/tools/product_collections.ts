import { z } from "zod";
import { ghlRequest, formatError, GHLConfig, GHL_VERSION_V3 } from "../client.js";

export const productCollectionTools = [
  {
    name: "ghl_get_product_collections",
    description: "List product collections in the store catalog. Supports filtering by name and pagination.",
    inputSchema: z.object({
      limit: z.number().optional().describe("Max results"),
      offset: z.number().optional().describe("Results to skip"),
      collectionIds: z.string().optional().describe("Comma-separated collection IDs to filter by"),
      name: z.string().optional().describe("Filter by collection name"),
    }),
    handler: async (
      args: { limit?: number; offset?: number; collectionIds?: string; name?: string },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest("GET", "/products/collections", {
          token: config.token,
          version: GHL_VERSION_V3,
          params: {
            altId: config.locationId,
            altType: "location",
            limit: args.limit,
            offset: args.offset,
            collectionIds: args.collectionIds,
            name: args.name,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_product_collection",
    description: "Get details of a single product collection by ID.",
    inputSchema: z.object({
      collectionId: z.string().describe("The product collection ID"),
    }),
    handler: async (args: { collectionId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", `/products/collections/${args.collectionId}`, {
          token: config.token,
          version: GHL_VERSION_V3,
          params: { altId: config.locationId },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_create_product_collection",
    description: "Create a new product collection.",
    inputSchema: z.object({
      name: z.string().describe("Name of the product collection"),
      slug: z.string().describe("Slug of the product collection, used for navigation"),
      collectionId: z.string().optional().describe("Custom Mongo ID to assign to the collection"),
      image: z.string().optional().describe("URL of the image to display as the collection thumbnail"),
      seo: z
        .object({
          title: z.string().optional().describe("SEO preview title"),
          description: z.string().optional().describe("SEO preview description"),
        })
        .optional()
        .describe("SEO metadata for the collection"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("POST", "/products/collections", {
          token: config.token,
          version: GHL_VERSION_V3,
          body: { ...args, altId: config.locationId, altType: "location" },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_update_product_collection",
    description: "Update an existing product collection.",
    inputSchema: z.object({
      collectionId: z.string().describe("The product collection ID to update"),
      name: z.string().optional().describe("Name of the product collection"),
      slug: z.string().optional().describe("Slug of the product collection, used for navigation"),
      image: z.string().optional().describe("URL of the image to display as the collection thumbnail"),
      seo: z
        .object({
          title: z.string().optional().describe("SEO preview title"),
          description: z.string().optional().describe("SEO preview description"),
        })
        .optional()
        .describe("SEO metadata for the collection"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      const { collectionId, ...fields } = args as { collectionId: string } & Record<string, unknown>;
      try {
        const result = await ghlRequest("PUT", `/products/collections/${collectionId}`, {
          token: config.token,
          version: GHL_VERSION_V3,
          body: { ...fields, altId: config.locationId, altType: "location" },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_delete_product_collection",
    description: "Delete a product collection.",
    inputSchema: z.object({
      collectionId: z.string().describe("The product collection ID to delete"),
    }),
    handler: async (args: { collectionId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("DELETE", `/products/collections/${args.collectionId}`, {
          token: config.token,
          version: GHL_VERSION_V3,
          params: { altId: config.locationId, altType: "location" },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
];
