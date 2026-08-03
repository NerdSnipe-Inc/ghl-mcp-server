import { z } from "zod";
import { ghlRequest, formatError, GHLConfig, GHL_VERSION_V3 } from "../client.js";

export const productTools = [
  // --- Products ---
  {
    name: "ghl_get_products",
    description: "List products in the store catalog. Supports search, filtering, and pagination.",
    inputSchema: z.object({
      limit: z.number().optional().describe("Max results"),
      offset: z.number().optional().describe("Results to skip"),
      search: z.string().optional().describe("Search by product name"),
      collectionIds: z.string().optional().describe("Comma-separated collection IDs to filter by"),
      collectionSlug: z.string().optional().describe("Filter by collection slug"),
      expand: z.array(z.string()).optional().describe("Related fields to expand, e.g. ['variants','medias']"),
      productIds: z.array(z.string()).optional().describe("Specific product IDs to fetch"),
      storeId: z.string().optional().describe("Filter by store ID"),
      includedInStore: z.boolean().optional().describe("Filter by whether product is included in the store"),
      availableInStore: z.boolean().optional().describe("Filter by store availability"),
      sortOrder: z.enum(["asc", "desc"]).optional().describe("Sort order"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", "/products/", {
          token: config.token,
          version: GHL_VERSION_V3,
          params: {
            locationId: config.locationId,
            limit: args.limit as number | undefined,
            offset: args.offset as number | undefined,
            search: args.search as string | undefined,
            collectionIds: args.collectionIds as string | undefined,
            collectionSlug: args.collectionSlug as string | undefined,
            expand: (args.expand as string[] | undefined)?.join(","),
            productIds: (args.productIds as string[] | undefined)?.join(","),
            storeId: args.storeId as string | undefined,
            includedInStore: args.includedInStore as boolean | undefined,
            availableInStore: args.availableInStore as boolean | undefined,
            sortOrder: args.sortOrder as string | undefined,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_product",
    description: "Get a single product by ID.",
    inputSchema: z.object({
      productId: z.string().describe("The product ID"),
      sendWishlistStatus: z.boolean().optional().describe("Include wishlist status in the response"),
    }),
    handler: async (args: { productId: string; sendWishlistStatus?: boolean }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", `/products/${args.productId}`, {
          token: config.token,
          version: GHL_VERSION_V3,
          params: {
            locationId: config.locationId,
            sendWishlistStatus: args.sendWishlistStatus,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_create_product",
    description: "Create a new product in the store catalog.",
    inputSchema: z.object({
      name: z.string().describe("Product name"),
      productType: z.string().describe("Product type, e.g. PHYSICAL, DIGITAL, SERVICE"),
      description: z.string().optional(),
      image: z.string().optional().describe("Product image URL"),
      statementDescriptor: z.string().optional(),
      availableInStore: z.boolean().optional(),
      medias: z.array(z.record(z.unknown())).optional().describe("Array of media objects"),
      variants: z.array(z.record(z.unknown())).optional().describe("Array of variant option objects"),
      collectionIds: z.array(z.string()).optional().describe("Category/collection IDs"),
      isTaxesEnabled: z.boolean().optional(),
      taxes: z.array(z.record(z.unknown())).optional().describe("Array of tax objects"),
      automaticTaxCategoryId: z.string().optional(),
      isLabelEnabled: z.boolean().optional(),
      label: z.record(z.unknown()).optional().describe("Product label object"),
      slug: z.string().optional(),
      seo: z.record(z.unknown()).optional().describe("SEO metadata object"),
      taxInclusive: z.boolean().optional(),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("POST", "/products/", {
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
    name: "ghl_update_product",
    description: "Update an existing product. Provide the full replacement set of fields (name/productType required by the API).",
    inputSchema: z.object({
      productId: z.string().describe("The product ID to update"),
      name: z.string().describe("Product name"),
      productType: z.string().describe("Product type, e.g. PHYSICAL, DIGITAL, SERVICE"),
      description: z.string().optional(),
      image: z.string().optional().describe("Product image URL"),
      statementDescriptor: z.string().optional(),
      availableInStore: z.boolean().optional(),
      medias: z.array(z.record(z.unknown())).optional().describe("Array of media objects"),
      variants: z.array(z.record(z.unknown())).optional().describe("Array of variant option objects"),
      collectionIds: z.array(z.string()).optional().describe("Category/collection IDs"),
      isTaxesEnabled: z.boolean().optional(),
      taxes: z.array(z.record(z.unknown())).optional().describe("Array of tax objects"),
      automaticTaxCategoryId: z.string().optional(),
      isLabelEnabled: z.boolean().optional(),
      label: z.record(z.unknown()).optional().describe("Product label object"),
      slug: z.string().optional(),
      seo: z.record(z.unknown()).optional().describe("SEO metadata object"),
      taxInclusive: z.boolean().optional(),
      prices: z.array(z.record(z.unknown())).optional().describe("Array of price objects"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      const { productId, ...fields } = args as { productId: string } & Record<string, unknown>;
      try {
        const result = await ghlRequest("PUT", `/products/${productId}`, {
          token: config.token,
          version: GHL_VERSION_V3,
          body: { ...fields, locationId: config.locationId },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_delete_product",
    description: "Delete a product from the store catalog.",
    inputSchema: z.object({
      productId: z.string().describe("The product ID to delete"),
      sendWishlistStatus: z.boolean().optional().describe("Include wishlist status in the response"),
    }),
    handler: async (args: { productId: string; sendWishlistStatus?: boolean }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("DELETE", `/products/${args.productId}`, {
          token: config.token,
          version: GHL_VERSION_V3,
          params: {
            locationId: config.locationId,
            sendWishlistStatus: args.sendWishlistStatus,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  // --- Bulk operations ---
  {
    name: "ghl_bulk_update_products",
    description:
      "Bulk update products: change price, compare-at price, availability, collections, or currency, or bulk-delete, across a set of product IDs (or filtered selection).",
    inputSchema: z.object({
      type: z
        .enum([
          "bulk-update-price",
          "bulk-update-availability",
          "bulk-update-product-collection",
          "bulk-delete-products",
          "bulk-update-currency",
        ])
        .describe("Type of bulk update operation"),
      productIds: z.array(z.string()).describe("Array of product IDs to update"),
      filters: z.record(z.unknown()).optional().describe("Filters to apply when selecting all matching products"),
      price: z.record(z.unknown()).optional().describe("Price update configuration"),
      compareAtPrice: z.record(z.unknown()).optional().describe("Compare-at price update configuration"),
      availability: z.boolean().optional().describe("New availability status"),
      collectionIds: z.array(z.string()).optional().describe("Array of collection IDs"),
      currency: z.string().optional().describe("Currency code, e.g. USD"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("POST", "/products/bulk-update", {
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
    name: "ghl_bulk_edit_product_prices",
    description: "Bulk edit prices across multiple products in a single request.",
    inputSchema: z.object({
      products: z
        .array(z.record(z.unknown()))
        .describe("Array of products with their price edits, e.g. [{ productId, prices: [...] }]"),
    }),
    handler: async (args: { products: Record<string, unknown>[] }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("POST", "/products/bulk-update/edit", {
          token: config.token,
          version: GHL_VERSION_V3,
          body: { altId: config.locationId, altType: "location", products: args.products },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  // --- Prices ---
  {
    name: "ghl_get_product_prices",
    description: "List prices for a product.",
    inputSchema: z.object({
      productId: z.string().describe("The product ID"),
      limit: z.number().optional().describe("Max results"),
      offset: z.number().optional().describe("Results to skip"),
      ids: z.string().optional().describe("Comma-separated price IDs to filter by"),
    }),
    handler: async (
      args: { productId: string; limit?: number; offset?: number; ids?: string },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest("GET", `/products/${args.productId}/price`, {
          token: config.token,
          version: GHL_VERSION_V3,
          params: {
            locationId: config.locationId,
            limit: args.limit,
            offset: args.offset,
            ids: args.ids,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_product_price",
    description: "Get a single price for a product by price ID.",
    inputSchema: z.object({
      productId: z.string().describe("The product ID"),
      priceId: z.string().describe("The price ID"),
    }),
    handler: async (args: { productId: string; priceId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", `/products/${args.productId}/price/${args.priceId}`, {
          token: config.token,
          version: GHL_VERSION_V3,
          params: { locationId: config.locationId },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_create_product_price",
    description: "Create a new price for a product.",
    inputSchema: z.object({
      productId: z.string().describe("The product ID to create the price under"),
      name: z.string().describe("Price name"),
      type: z.string().describe("Price type, e.g. one_time, recurring"),
      currency: z.string().describe("Currency code, e.g. USD"),
      amount: z.number().describe("Price amount"),
      recurring: z.record(z.unknown()).optional().describe("Recurring billing configuration"),
      description: z.string().optional(),
      membershipOffers: z.array(z.record(z.unknown())).optional().describe("Array of membership offer objects"),
      trialPeriod: z.number().optional().describe("Trial period in days"),
      totalCycles: z.number().optional().describe("Total number of billing cycles"),
      setupFee: z.number().optional().describe("One-time setup fee"),
      variantOptionIds: z.array(z.string()).optional().describe("Variant option IDs this price applies to"),
      compareAtPrice: z.number().optional().describe("Compare-at (original/strikethrough) price"),
      userId: z.string().optional().describe("User ID creating the price"),
      meta: z.record(z.unknown()).optional().describe("Arbitrary metadata object"),
      trackInventory: z.boolean().optional(),
      availableQuantity: z.number().optional().describe("Available inventory quantity"),
      allowOutOfStockPurchases: z.boolean().optional(),
      sku: z.string().optional(),
      shippingOptions: z.record(z.unknown()).optional().describe("Shipping configuration object"),
      isDigitalProduct: z.boolean().optional(),
      digitalDelivery: z.record(z.unknown()).optional().describe("Digital delivery configuration object"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      const { productId, ...fields } = args as { productId: string } & Record<string, unknown>;
      try {
        const result = await ghlRequest("POST", `/products/${productId}/price`, {
          token: config.token,
          version: GHL_VERSION_V3,
          body: { ...fields, locationId: config.locationId },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_update_product_price",
    description: "Update an existing price for a product. Provide the full replacement set of fields (name/type/currency/amount required by the API).",
    inputSchema: z.object({
      productId: z.string().describe("The product ID"),
      priceId: z.string().describe("The price ID to update"),
      name: z.string().describe("Price name"),
      type: z.string().describe("Price type, e.g. one_time, recurring"),
      currency: z.string().describe("Currency code, e.g. USD"),
      amount: z.number().describe("Price amount"),
      recurring: z.record(z.unknown()).optional().describe("Recurring billing configuration"),
      description: z.string().optional(),
      membershipOffers: z.array(z.record(z.unknown())).optional().describe("Array of membership offer objects"),
      trialPeriod: z.number().optional().describe("Trial period in days"),
      totalCycles: z.number().optional().describe("Total number of billing cycles"),
      setupFee: z.number().optional().describe("One-time setup fee"),
      variantOptionIds: z.array(z.string()).optional().describe("Variant option IDs this price applies to"),
      compareAtPrice: z.number().optional().describe("Compare-at (original/strikethrough) price"),
      userId: z.string().optional().describe("User ID updating the price"),
      meta: z.record(z.unknown()).optional().describe("Arbitrary metadata object"),
      trackInventory: z.boolean().optional(),
      availableQuantity: z.number().optional().describe("Available inventory quantity"),
      allowOutOfStockPurchases: z.boolean().optional(),
      sku: z.string().optional(),
      shippingOptions: z.record(z.unknown()).optional().describe("Shipping configuration object"),
      isDigitalProduct: z.boolean().optional(),
      digitalDelivery: z.record(z.unknown()).optional().describe("Digital delivery configuration object"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      const { productId, priceId, ...fields } = args as
        { productId: string; priceId: string } & Record<string, unknown>;
      try {
        const result = await ghlRequest("PUT", `/products/${productId}/price/${priceId}`, {
          token: config.token,
          version: GHL_VERSION_V3,
          body: { ...fields, locationId: config.locationId },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_delete_product_price",
    description: "Delete a price from a product.",
    inputSchema: z.object({
      productId: z.string().describe("The product ID"),
      priceId: z.string().describe("The price ID to delete"),
    }),
    handler: async (args: { productId: string; priceId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("DELETE", `/products/${args.productId}/price/${args.priceId}`, {
          token: config.token,
          version: GHL_VERSION_V3,
          params: { locationId: config.locationId },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  // --- Inventory ---
  {
    name: "ghl_get_product_inventory",
    description: "List inventory levels for products/price variants in the location.",
    inputSchema: z.object({
      limit: z.number().optional().describe("Max results"),
      offset: z.number().optional().describe("Results to skip"),
      search: z.string().optional().describe("Search by product name"),
    }),
    handler: async (args: { limit?: number; offset?: number; search?: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", "/products/inventory", {
          token: config.token,
          version: GHL_VERSION_V3,
          params: {
            altId: config.locationId,
            altType: "location",
            limit: args.limit,
            offset: args.offset,
            search: args.search,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_update_product_inventory",
    description: "Bulk update inventory quantities for a set of product price variants.",
    inputSchema: z.object({
      items: z
        .array(z.record(z.unknown()))
        .describe("Array of inventory items to update, e.g. [{ priceId, productId, availableQuantity }]"),
    }),
    handler: async (args: { items: Record<string, unknown>[] }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("POST", "/products/inventory", {
          token: config.token,
          version: GHL_VERSION_V3,
          body: { altId: config.locationId, altType: "location", items: args.items },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
];
