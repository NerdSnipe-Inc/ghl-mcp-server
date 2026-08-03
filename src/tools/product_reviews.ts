import { z } from "zod";
import { ghlRequest, formatError, GHLConfig, GHL_VERSION_V3 } from "../client.js";

export const productReviewTools = [
  {
    name: "ghl_get_product_reviews",
    description:
      "List product reviews for the store. Supports filtering by rating, date range, product, store, and pagination/sorting.",
    inputSchema: z.object({
      limit: z.number().optional().describe("Max results"),
      offset: z.number().optional().describe("Results to skip"),
      sortField: z.enum(["createdAt", "rating"]).optional().describe("Field to sort by"),
      sortOrder: z.enum(["asc", "desc"]).optional().describe("Sort order"),
      rating: z.number().optional().describe("Filter by rating"),
      startDate: z.string().optional().describe("Start date for filtering reviews (ISO 8601)"),
      endDate: z.string().optional().describe("End date for filtering reviews (ISO 8601)"),
      productId: z.string().optional().describe("Comma-separated list of product IDs"),
      storeId: z.string().optional().describe("Comma-separated list of store IDs"),
    }),
    handler: async (
      args: {
        limit?: number;
        offset?: number;
        sortField?: string;
        sortOrder?: string;
        rating?: number;
        startDate?: string;
        endDate?: string;
        productId?: string;
        storeId?: string;
      },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest("GET", "/products/reviews", {
          token: config.token,
          version: GHL_VERSION_V3,
          params: {
            altId: config.locationId,
            altType: "location",
            limit: args.limit,
            offset: args.offset,
            sortField: args.sortField,
            sortOrder: args.sortOrder,
            rating: args.rating,
            startDate: args.startDate,
            endDate: args.endDate,
            productId: args.productId,
            storeId: args.storeId,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_product_review_count",
    description: "Fetch a count of product reviews grouped by status, with optional filters.",
    inputSchema: z.object({
      rating: z.number().optional().describe("Filter by rating"),
      startDate: z.string().optional().describe("Start date for filtering reviews (ISO 8601)"),
      endDate: z.string().optional().describe("End date for filtering reviews (ISO 8601)"),
      productId: z.string().optional().describe("Comma-separated list of product IDs"),
      storeId: z.string().optional().describe("Comma-separated list of store IDs"),
    }),
    handler: async (
      args: {
        rating?: number;
        startDate?: string;
        endDate?: string;
        productId?: string;
        storeId?: string;
      },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest("GET", "/products/reviews/count", {
          token: config.token,
          version: GHL_VERSION_V3,
          params: {
            altId: config.locationId,
            altType: "location",
            rating: args.rating,
            startDate: args.startDate,
            endDate: args.endDate,
            productId: args.productId,
            storeId: args.storeId,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_bulk_update_product_reviews",
    description: "Update one or multiple product reviews at once (e.g. status).",
    inputSchema: z.object({
      reviews: z
        .array(
          z.object({
            reviewId: z.string().describe("Review ID"),
            productId: z.string().describe("Product ID"),
            storeId: z.string().describe("Store ID"),
          })
        )
        .describe("Array of reviews to update"),
      status: z.string().describe("Status to apply to the reviews (e.g. approved)"),
    }),
    handler: async (
      args: { reviews: Array<{ reviewId: string; productId: string; storeId: string }>; status: string },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest("POST", "/products/reviews/bulk-update", {
          token: config.token,
          version: GHL_VERSION_V3,
          body: {
            altId: config.locationId,
            altType: "location",
            reviews: args.reviews,
            status: args.status,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_update_product_review",
    description: "Update the status, reply, rating, or content of a single product review.",
    inputSchema: z.object({
      reviewId: z.string().describe("The review ID to update"),
      productId: z.string().describe("Product ID the review belongs to"),
      status: z.string().describe("Status of the review (e.g. approved)"),
      reply: z
        .array(
          z.object({
            headline: z.string().describe("Headline of the reply"),
            comment: z.string().describe("Detailed reply content"),
            user: z.record(z.unknown()).describe("User giving the reply"),
          })
        )
        .optional()
        .describe("Reply/replies to the review"),
      rating: z.number().optional().describe("Rating of the product"),
      headline: z.string().optional().describe("Headline of the review"),
      detail: z.string().optional().describe("Detailed review text"),
    }),
    handler: async (
      args: {
        reviewId: string;
        productId: string;
        status: string;
        reply?: Array<{ headline: string; comment: string; user: Record<string, unknown> }>;
        rating?: number;
        headline?: string;
        detail?: string;
      },
      config: GHLConfig
    ) => {
      const { reviewId, ...fields } = args;
      try {
        const result = await ghlRequest("PUT", `/products/reviews/${reviewId}`, {
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
    name: "ghl_delete_product_review",
    description: "Delete a specific product review.",
    inputSchema: z.object({
      reviewId: z.string().describe("The review ID to delete"),
      productId: z.string().describe("Product ID the review belongs to"),
    }),
    handler: async (args: { reviewId: string; productId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("DELETE", `/products/reviews/${args.reviewId}`, {
          token: config.token,
          version: GHL_VERSION_V3,
          params: {
            altId: config.locationId,
            altType: "location",
            productId: args.productId,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
];
