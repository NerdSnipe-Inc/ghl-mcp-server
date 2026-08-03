import { z } from "zod";
import { ghlRequest, formatError, GHLConfig, GHL_VERSION_V3 } from "../client.js";

export const storeTools = [
  {
    name: "ghl_get_shipping_carriers",
    description: "List shipping carriers configured for the store.",
    inputSchema: z.object({}),
    handler: async (_args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", "/store/shipping-carrier", {
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
  {
    name: "ghl_create_shipping_carrier",
    description: "Create a new shipping carrier for the store.",
    inputSchema: z.object({
      name: z.string().describe("Name of the shipping carrier"),
      callbackUrl: z
        .string()
        .describe("The URL endpoint that CRM needs to retrieve shipping rates from"),
      services: z
        .array(
          z.object({
            name: z.string().describe("Name of the shipping carrier service"),
            value: z.string().describe("Value of the shipping carrier service"),
          })
        )
        .optional()
        .describe("An array of available shipping carrier services"),
      allowsMultipleServiceSelection: z
        .boolean()
        .optional()
        .describe("Whether the seller can choose multiple services while creating shipping"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("POST", "/store/shipping-carrier", {
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
    name: "ghl_get_shipping_carrier",
    description: "Get details of a single shipping carrier by ID.",
    inputSchema: z.object({
      shippingCarrierId: z.string().describe("The shipping carrier ID"),
    }),
    handler: async (args: { shippingCarrierId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "GET",
          `/store/shipping-carrier/${args.shippingCarrierId}`,
          {
            token: config.token,
            version: GHL_VERSION_V3,
            params: { altId: config.locationId, altType: "location" },
          }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_update_shipping_carrier",
    description: "Update an existing shipping carrier.",
    inputSchema: z.object({
      shippingCarrierId: z.string().describe("The shipping carrier ID"),
      name: z.string().optional().describe("Name of the shipping carrier"),
      callbackUrl: z
        .string()
        .optional()
        .describe("The URL endpoint that CRM needs to retrieve shipping rates from"),
      services: z
        .array(
          z.object({
            name: z.string().describe("Name of the shipping carrier service"),
            value: z.string().describe("Value of the shipping carrier service"),
          })
        )
        .optional()
        .describe("An array of available shipping carrier services"),
      allowsMultipleServiceSelection: z
        .boolean()
        .optional()
        .describe("Whether the seller can choose multiple services while creating shipping"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const { shippingCarrierId, ...body } = args as { shippingCarrierId: string } & Record<
          string,
          unknown
        >;
        const result = await ghlRequest("PUT", `/store/shipping-carrier/${shippingCarrierId}`, {
          token: config.token,
          version: GHL_VERSION_V3,
          body: { ...body, altId: config.locationId, altType: "location" },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_delete_shipping_carrier",
    description: "Delete a shipping carrier from the store.",
    inputSchema: z.object({
      shippingCarrierId: z.string().describe("The shipping carrier ID"),
    }),
    handler: async (args: { shippingCarrierId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "DELETE",
          `/store/shipping-carrier/${args.shippingCarrierId}`,
          {
            token: config.token,
            version: GHL_VERSION_V3,
            params: { altId: config.locationId, altType: "location" },
          }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_shipping_zones",
    description: "List shipping zones configured for the store. Supports pagination.",
    inputSchema: z.object({
      limit: z.number().optional().describe("Max results"),
      offset: z.number().optional().describe("Results to skip"),
      withShippingRate: z
        .boolean()
        .optional()
        .describe("Whether to include shipping rates for each zone"),
    }),
    handler: async (
      args: { limit?: number; offset?: number; withShippingRate?: boolean },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest("GET", "/store/shipping-zone", {
          token: config.token,
          version: GHL_VERSION_V3,
          params: {
            altId: config.locationId,
            altType: "location",
            limit: args.limit,
            offset: args.offset,
            withShippingRate: args.withShippingRate,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_create_shipping_zone",
    description: "Create a new shipping zone for the store.",
    inputSchema: z.object({
      name: z.string().describe("Name of the shipping zone"),
      countries: z
        .array(
          z.object({
            code: z.string().describe("Country code, e.g. US, CA"),
            states: z
              .array(z.object({ code: z.string().describe("State code, e.g. CA, NY") }))
              .optional()
              .describe(
                "List of states that are available. If empty, all states in the country are available."
              ),
          })
        )
        .describe("List of countries that are available in this shipping zone"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("POST", "/store/shipping-zone", {
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
    name: "ghl_get_shipping_zone",
    description: "Get details of a single shipping zone by ID.",
    inputSchema: z.object({
      shippingZoneId: z.string().describe("The shipping zone ID"),
      withShippingRate: z
        .boolean()
        .optional()
        .describe("Whether to include shipping rates for the zone"),
    }),
    handler: async (
      args: { shippingZoneId: string; withShippingRate?: boolean },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest("GET", `/store/shipping-zone/${args.shippingZoneId}`, {
          token: config.token,
          version: GHL_VERSION_V3,
          params: {
            altId: config.locationId,
            altType: "location",
            withShippingRate: args.withShippingRate,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_update_shipping_zone",
    description: "Update an existing shipping zone.",
    inputSchema: z.object({
      shippingZoneId: z.string().describe("The shipping zone ID"),
      name: z.string().optional().describe("Name of the shipping zone"),
      countries: z
        .array(
          z.object({
            code: z.string().describe("Country code, e.g. US, CA"),
            states: z
              .array(z.object({ code: z.string().describe("State code, e.g. CA, NY") }))
              .optional()
              .describe(
                "List of states that are available. If empty, all states in the country are available."
              ),
          })
        )
        .optional()
        .describe("List of countries that are available in this shipping zone"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const { shippingZoneId, ...body } = args as { shippingZoneId: string } & Record<
          string,
          unknown
        >;
        const result = await ghlRequest("PUT", `/store/shipping-zone/${shippingZoneId}`, {
          token: config.token,
          version: GHL_VERSION_V3,
          body: { ...body, altId: config.locationId, altType: "location" },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_delete_shipping_zone",
    description: "Delete a shipping zone from the store.",
    inputSchema: z.object({
      shippingZoneId: z.string().describe("The shipping zone ID"),
    }),
    handler: async (args: { shippingZoneId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "DELETE",
          `/store/shipping-zone/${args.shippingZoneId}`,
          {
            token: config.token,
            version: GHL_VERSION_V3,
            params: { altId: config.locationId, altType: "location" },
          }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_available_shipping_rates",
    description:
      "Compute the available shipping rates for an order based on destination, weight, amount, and products.",
    inputSchema: z.object({
      country: z.string().describe("Country code of the customer, e.g. US"),
      address: z
        .record(z.unknown())
        .optional()
        .describe("Address of the customer (ContactAddress shape)"),
      amountAvailable: z
        .boolean()
        .optional()
        .describe(
          "Set true to skip backend calculation of order amount when totalOrderAmount is already provided"
        ),
      totalOrderAmount: z.number().describe("The total order amount (min: 0.01)"),
      weightAvailable: z
        .boolean()
        .optional()
        .describe(
          "Set true when the weight is already calculated and should not be recalculated"
        ),
      totalOrderWeight: z
        .number()
        .describe("Estimated weight of the order in kg(s)"),
      source: z
        .object({
          type: z.string().describe("Source of order, e.g. website, funnel, manual"),
          subType: z.string().optional().describe("Source subtype of order, e.g. store"),
        })
        .describe("Source of the order"),
      products: z
        .array(
          z.object({
            id: z.string().describe("Price ID of the product"),
            qty: z.number().describe("Quantity"),
          })
        )
        .describe("An array of price IDs and quantities"),
      couponCode: z.string().optional().describe("Coupon code"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("POST", "/store/shipping-zone/shipping-rates", {
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
];
