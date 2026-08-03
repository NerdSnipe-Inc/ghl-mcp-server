import { z } from "zod";
import { ghlRequest, formatError, GHLConfig, GHL_VERSION_V3 } from "../client.js";

export const productStoreTools = [
  {
    name: "ghl_set_product_store_visibility",
    description:
      "Include or exclude products from a store's product listing. Note: storeId identifies the store/funnel that displays products (e.g. a funnel-based storefront) — not the location ID.",
    inputSchema: z.object({
      storeId: z.string().describe("Store ID (the store/funnel that displays products, not the location ID)"),
      action: z.enum(["include", "exclude"]).describe("Whether to include or exclude the products from the store"),
      productIds: z.array(z.string()).describe("Array of product IDs to include or exclude"),
    }),
    handler: async (
      args: { storeId: string; action: "include" | "exclude"; productIds: string[] },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest("POST", `/products/store/${args.storeId}`, {
          token: config.token,
          version: GHL_VERSION_V3,
          body: {
            altId: config.locationId,
            altType: "location",
            action: args.action,
            productIds: args.productIds,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_update_product_store_priority",
    description:
      "Set the display priority (ordering) of products in a store. Note: storeId identifies the store/funnel that displays products, not the location ID.",
    inputSchema: z.object({
      storeId: z.string().describe("Store ID (the store/funnel that displays products, not the location ID)"),
      products: z
        .array(z.array(z.union([z.string(), z.number()])))
        .describe(
          "Array of products with their display priorities, e.g. [[productId, priority], ...]"
        ),
    }),
    handler: async (
      args: { storeId: string; products: Array<Array<string | number>> },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest("POST", `/products/store/${args.storeId}/priority`, {
          token: config.token,
          version: GHL_VERSION_V3,
          body: {
            altId: config.locationId,
            altType: "location",
            products: args.products,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_product_store_stats",
    description:
      "Fetch the total number of products, number included in the store, and number excluded from the store, with optional search and collection filters. Note: storeId identifies the store/funnel that displays products, not the location ID.",
    inputSchema: z.object({
      storeId: z.string().describe("Store ID (the store/funnel that displays products, not the location ID)"),
      search: z.string().optional().describe("Filter by product name"),
      collectionIds: z.string().optional().describe("Comma-separated list of product collection IDs to filter by"),
    }),
    handler: async (
      args: { storeId: string; search?: string; collectionIds?: string },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest("GET", `/products/store/${args.storeId}/stats`, {
          token: config.token,
          version: GHL_VERSION_V3,
          params: {
            altId: config.locationId,
            altType: "location",
            search: args.search,
            collectionIds: args.collectionIds,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
];
