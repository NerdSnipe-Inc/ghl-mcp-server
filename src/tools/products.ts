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
      expand: z.array(z.string()).optional().describe("Related entities to expand, e.g. ['tax','stripe','paypal']"),
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
            expand: args.expand as string[] | undefined,
            productIds: args.productIds as string[] | undefined,
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
      productType: z.enum(["DIGITAL", "PHYSICAL", "SERVICE", "PHYSICAL/DIGITAL"]).describe("Product type"),
      description: z.string().optional(),
      image: z.string().optional().describe("Product image URL"),
      statementDescriptor: z.string().optional(),
      availableInStore: z.boolean().optional(),
      medias: z
        .array(
          z.object({
            id: z.string().optional().describe("Media ID"),
            title: z.string().optional().describe("Media file title"),
            url: z.string().describe("URL where the media file is stored"),
            type: z.enum(["image", "video"]).describe("Media type"),
            isFeatured: z.boolean().optional().describe("Whether the media is featured"),
            priceIds: z.array(z.string()).optional().describe("Price IDs the media is assigned to"),
          })
        )
        .optional()
        .describe("Array of media objects"),
      variants: z
        .array(
          z.object({
            id: z.string().optional().describe("Variant ID"),
            name: z.string().describe("Variant name, e.g. Size"),
            options: z
              .array(
                z.object({
                  id: z.string().optional().describe("Option ID"),
                  name: z.string().describe("Option name, e.g. XL"),
                })
              )
              .describe("Array of options for the variant"),
          })
        )
        .optional()
        .describe("Array of variant objects"),
      collectionIds: z.array(z.string()).optional().describe("Category/collection IDs"),
      isTaxesEnabled: z.boolean().optional(),
      taxes: z.array(z.string()).optional().describe("List of tax IDs attached to the product"),
      automaticTaxCategoryId: z.string().optional(),
      isLabelEnabled: z.boolean().optional(),
      label: z
        .object({
          title: z.string().describe("Product label content"),
          startDate: z.string().optional().describe("Start date, YYYY-MM-DDTHH:mm:ssZ"),
          endDate: z.string().optional().describe("End date, YYYY-MM-DDTHH:mm:ssZ"),
        })
        .optional()
        .describe("Product label details"),
      slug: z.string().optional(),
      seo: z
        .object({
          title: z.string().optional().describe("SEO title"),
          description: z.string().optional().describe("SEO description"),
        })
        .optional()
        .describe("SEO metadata for the product"),
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
      productType: z.enum(["DIGITAL", "PHYSICAL", "SERVICE", "PHYSICAL/DIGITAL"]).describe("Product type"),
      description: z.string().optional(),
      image: z.string().optional().describe("Product image URL"),
      statementDescriptor: z.string().optional(),
      availableInStore: z.boolean().optional(),
      medias: z
        .array(
          z.object({
            id: z.string().optional().describe("Media ID"),
            title: z.string().optional().describe("Media file title"),
            url: z.string().describe("URL where the media file is stored"),
            type: z.enum(["image", "video"]).describe("Media type"),
            isFeatured: z.boolean().optional().describe("Whether the media is featured"),
            priceIds: z.array(z.string()).optional().describe("Price IDs the media is assigned to"),
          })
        )
        .optional()
        .describe("Array of media objects"),
      variants: z
        .array(
          z.object({
            id: z.string().optional().describe("Variant ID"),
            name: z.string().describe("Variant name, e.g. Size"),
            options: z
              .array(
                z.object({
                  id: z.string().optional().describe("Option ID"),
                  name: z.string().describe("Option name, e.g. XL"),
                })
              )
              .describe("Array of options for the variant"),
          })
        )
        .optional()
        .describe("Array of variant objects"),
      collectionIds: z.array(z.string()).optional().describe("Category/collection IDs"),
      isTaxesEnabled: z.boolean().optional(),
      taxes: z.array(z.string()).optional().describe("List of tax IDs attached to the product"),
      automaticTaxCategoryId: z.string().optional(),
      isLabelEnabled: z.boolean().optional(),
      label: z
        .object({
          title: z.string().describe("Product label content"),
          startDate: z.string().optional().describe("Start date, YYYY-MM-DDTHH:mm:ssZ"),
          endDate: z.string().optional().describe("End date, YYYY-MM-DDTHH:mm:ssZ"),
        })
        .optional()
        .describe("Product label details"),
      slug: z.string().optional(),
      seo: z
        .object({
          title: z.string().optional().describe("SEO title"),
          description: z.string().optional().describe("SEO description"),
        })
        .optional()
        .describe("SEO metadata for the product"),
      taxInclusive: z.boolean().optional(),
      prices: z.array(z.string()).optional().describe("List of price IDs for the product"),
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
      productIds: z.array(z.string()).min(1).describe("Array of product IDs to update"),
      filters: z.record(z.unknown()).optional().describe("Filters to apply when selecting all matching products"),
      price: z
        .object({
          type: z
            .enum([
              "INCREASE_BY_AMOUNT",
              "REDUCE_BY_AMOUNT",
              "SET_NEW_PRICE",
              "INCREASE_BY_PERCENTAGE",
              "REDUCE_BY_PERCENTAGE",
            ])
            .describe("Type of price update"),
          value: z.number().describe("Value to update (amount or percentage based on type)"),
          roundToWhole: z.boolean().optional().describe("Round to nearest whole number"),
        })
        .optional()
        .describe("Price update configuration"),
      compareAtPrice: z
        .object({
          type: z
            .enum([
              "INCREASE_BY_AMOUNT",
              "REDUCE_BY_AMOUNT",
              "SET_NEW_PRICE",
              "INCREASE_BY_PERCENTAGE",
              "REDUCE_BY_PERCENTAGE",
            ])
            .describe("Type of price update"),
          value: z.number().describe("Value to update (amount or percentage based on type)"),
          roundToWhole: z.boolean().optional().describe("Round to nearest whole number"),
        })
        .optional()
        .describe("Compare-at price update configuration"),
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
      type: z.enum(["one_time", "recurring"]).describe("Price type"),
      currency: z.string().describe("Currency code, e.g. USD"),
      amount: z.number().describe("Price amount"),
      recurring: z
        .object({
          interval: z.enum(["day", "month", "week", "year"]).describe("Recurrence interval"),
          intervalCount: z.number().describe("Number of intervals between each occurrence"),
        })
        .optional()
        .describe("Recurring billing configuration (if type is recurring)"),
      description: z.string().optional(),
      membershipOffers: z
        .array(
          z.object({
            label: z.string().describe("Membership offer label"),
            value: z.string().describe("Membership offer value"),
            _id: z.string().describe("Membership offer ID"),
          })
        )
        .optional()
        .describe("Array of membership offer objects"),
      trialPeriod: z.number().optional().describe("Trial period in days"),
      totalCycles: z.number().optional().describe("Total number of billing cycles"),
      setupFee: z.number().optional().describe("One-time setup fee"),
      variantOptionIds: z.array(z.string()).optional().describe("Variant option IDs this price applies to"),
      compareAtPrice: z.number().optional().describe("Compare-at (original/strikethrough) price"),
      userId: z.string().optional().describe("User ID creating the price"),
      meta: z
        .object({
          source: z.enum(["stripe", "woocommerce", "shopify"]).describe("Source of the price"),
          sourceId: z.string().optional().describe("ID of the source the price was imported from"),
          stripePriceId: z.string().describe("Stripe price ID associated with the price"),
          internalSource: z
            .enum(["agency_plan", "funnel", "membership", "communities", "gokollab", "calendar"])
            .describe("Internal source of the price"),
        })
        .optional()
        .describe("Additional metadata associated with the price"),
      trackInventory: z.boolean().optional(),
      availableQuantity: z.number().optional().describe("Available inventory quantity"),
      allowOutOfStockPurchases: z.boolean().optional(),
      sku: z.string().optional(),
      shippingOptions: z
        .object({
          weight: z
            .object({
              value: z.number().describe("Actual weight of the product"),
              unit: z.enum(["kg", "lb", "g", "oz"]).describe("Weight unit"),
            })
            .optional()
            .describe("Weight options of the product"),
          dimensions: z
            .object({
              height: z.number().describe("Height"),
              width: z.number().describe("Width"),
              length: z.number().describe("Length"),
              unit: z.enum(["cm", "in", "m"]).describe("Dimension unit"),
            })
            .optional()
            .describe("Dimensions of the product"),
        })
        .optional()
        .describe("Shipping options of the price"),
      isDigitalProduct: z.boolean().optional(),
      digitalDelivery: z.array(z.string()).optional().describe("Digital delivery options"),
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
      type: z.enum(["one_time", "recurring"]).describe("Price type"),
      currency: z.string().describe("Currency code, e.g. USD"),
      amount: z.number().describe("Price amount"),
      recurring: z
        .object({
          interval: z.enum(["day", "month", "week", "year"]).describe("Recurrence interval"),
          intervalCount: z.number().describe("Number of intervals between each occurrence"),
        })
        .optional()
        .describe("Recurring billing configuration (if type is recurring)"),
      description: z.string().optional(),
      membershipOffers: z
        .array(
          z.object({
            label: z.string().describe("Membership offer label"),
            value: z.string().describe("Membership offer value"),
            _id: z.string().describe("Membership offer ID"),
          })
        )
        .optional()
        .describe("Array of membership offer objects"),
      trialPeriod: z.number().optional().describe("Trial period in days"),
      totalCycles: z.number().optional().describe("Total number of billing cycles"),
      setupFee: z.number().optional().describe("One-time setup fee"),
      variantOptionIds: z.array(z.string()).optional().describe("Variant option IDs this price applies to"),
      compareAtPrice: z.number().optional().describe("Compare-at (original/strikethrough) price"),
      userId: z.string().optional().describe("User ID updating the price"),
      meta: z
        .object({
          source: z.enum(["stripe", "woocommerce", "shopify"]).describe("Source of the price"),
          sourceId: z.string().optional().describe("ID of the source the price was imported from"),
          stripePriceId: z.string().describe("Stripe price ID associated with the price"),
          internalSource: z
            .enum(["agency_plan", "funnel", "membership", "communities", "gokollab", "calendar"])
            .describe("Internal source of the price"),
        })
        .optional()
        .describe("Additional metadata associated with the price"),
      trackInventory: z.boolean().optional(),
      availableQuantity: z.number().optional().describe("Available inventory quantity"),
      allowOutOfStockPurchases: z.boolean().optional(),
      sku: z.string().optional(),
      shippingOptions: z
        .object({
          weight: z
            .object({
              value: z.number().describe("Actual weight of the product"),
              unit: z.enum(["kg", "lb", "g", "oz"]).describe("Weight unit"),
            })
            .optional()
            .describe("Weight options of the product"),
          dimensions: z
            .object({
              height: z.number().describe("Height"),
              width: z.number().describe("Width"),
              length: z.number().describe("Length"),
              unit: z.enum(["cm", "in", "m"]).describe("Dimension unit"),
            })
            .optional()
            .describe("Dimensions of the product"),
        })
        .optional()
        .describe("Shipping options of the price"),
      isDigitalProduct: z.boolean().optional(),
      digitalDelivery: z.array(z.string()).optional().describe("Digital delivery options"),
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
        .array(
          z.object({
            priceId: z.string().describe("Price ID, in MongoDB ID format"),
            availableQuantity: z.number().optional().describe("Available quantity of the item"),
            allowOutOfStockPurchases: z
              .boolean()
              .optional()
              .describe("Whether to continue selling the item when out of stock"),
          })
        )
        .describe("Array of inventory items to update"),
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
