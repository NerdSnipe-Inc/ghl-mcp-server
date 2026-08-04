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
            // Spec types this "number" with a malformed enum — the real API expects a string.
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
            // Spec types this "number" with a malformed enum — the real API expects a string.
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
      // Spec types this "string" with a copy-pasted country-code enum, but the description is boolean semantics — the real API expects a boolean.
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
          type: z
            .enum([
              "funnel",
              "website",
              "invoice",
              "calendar",
              "text2Pay",
              "document_contracts",
              "membership",
              "mobile_app",
              "communities",
              "point_of_sale",
              "manual",
              "form",
              "survey",
              "payment_link",
              "external",
            ])
            .describe("Source of order"),
          subType: z
            .enum([
              "one_step_order_form",
              "two_step_order_form",
              "upsell",
              "tap_to_pay",
              "card_payment",
              "store",
              "contact_view",
              "email_campaign",
              "payments_dashboard",
              "shopify",
              "subscription_view",
              "store_upsell",
              "woocommerce",
              "service",
              "meeting",
              "imported_csv",
              "qr_code",
            ])
            .optional()
            .describe("Source subtype of order"),
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
  {
    name: "ghl_get_shipping_rates",
    description: "List shipping rates for a shipping zone. Supports pagination.",
    inputSchema: z.object({
      shippingZoneId: z.string().describe("The shipping zone ID"),
      limit: z.number().optional().describe("Max results"),
      offset: z.number().optional().describe("Results to skip"),
    }),
    handler: async (
      args: { shippingZoneId: string; limit?: number; offset?: number },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest(
          "GET",
          `/store/shipping-zone/${args.shippingZoneId}/shipping-rate`,
          {
            token: config.token,
            version: GHL_VERSION_V3,
            params: {
              altId: config.locationId,
              altType: "location",
              limit: args.limit,
              offset: args.offset,
            },
          }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_create_shipping_rate",
    description: "Create a new shipping rate for a shipping zone.",
    inputSchema: z.object({
      shippingZoneId: z.string().describe("The shipping zone ID"),
      name: z.string().describe("Name of the shipping rate"),
      description: z.string().optional().describe("Delivery description"),
      currency: z.string().describe("The currency of the amount of the rate / handling fee"),
      amount: z
        .number()
        .describe(
          "The amount of the shipping rate if it is a normal rate (0 means free). Fixed handling fee if it is a carrier rate (added to the carrier rate)."
        ),
      conditionType: z
        .enum(["none", "price", "weight"])
        .describe("Type of condition to provide the conditional pricing"),
      minCondition: z
        .number()
        .describe("Minimum condition for applying this price. Set 0 or null if there is no minimum"),
      maxCondition: z
        .number()
        .describe("Maximum condition for applying this price. Set 0 or null if there is no maximum"),
      isCarrierRate: z.boolean().optional().describe("Whether this is a carrier rate"),
      shippingCarrierId: z.string().describe("Shipping carrier id"),
      percentageOfRateFee: z
        .number()
        .optional()
        .describe("Percentage of rate fee if it is a carrier rate"),
      shippingCarrierServices: z
        .array(
          z.object({
            name: z.string().describe("Name of the shipping carrier service"),
            value: z.string().describe("Value of the shipping carrier service"),
          })
        )
        .optional()
        .describe("An array of available shipping carrier services"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const { shippingZoneId, ...body } = args as { shippingZoneId: string } & Record<
          string,
          unknown
        >;
        const result = await ghlRequest(
          "POST",
          `/store/shipping-zone/${shippingZoneId}/shipping-rate`,
          {
            token: config.token,
            version: GHL_VERSION_V3,
            body: { ...body, altId: config.locationId, altType: "location" },
          }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_shipping_rate",
    description: "Get details of a single shipping rate by ID.",
    inputSchema: z.object({
      shippingZoneId: z.string().describe("The shipping zone ID"),
      shippingRateId: z.string().describe("The shipping rate ID"),
    }),
    handler: async (
      args: { shippingZoneId: string; shippingRateId: string },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest(
          "GET",
          `/store/shipping-zone/${args.shippingZoneId}/shipping-rate/${args.shippingRateId}`,
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
    name: "ghl_update_shipping_rate",
    description: "Update an existing shipping rate.",
    inputSchema: z.object({
      shippingZoneId: z.string().describe("The shipping zone ID"),
      shippingRateId: z.string().describe("The shipping rate ID"),
      name: z.string().optional().describe("Name of the shipping rate"),
      description: z.string().optional().describe("Delivery description"),
      currency: z
        .string()
        .optional()
        .describe("The currency of the amount of the rate / handling fee"),
      amount: z
        .number()
        .optional()
        .describe(
          "The amount of the shipping rate if it is a normal rate (0 means free). Fixed handling fee if it is a carrier rate (added to the carrier rate)."
        ),
      conditionType: z
        .enum(["none", "price", "weight"])
        .optional()
        .describe("Type of condition to provide the conditional pricing"),
      minCondition: z
        .number()
        .optional()
        .describe("Minimum condition for applying this price. Set 0 or null if there is no minimum"),
      maxCondition: z
        .number()
        .optional()
        .describe("Maximum condition for applying this price. Set 0 or null if there is no maximum"),
      isCarrierRate: z.boolean().optional().describe("Whether this is a carrier rate"),
      shippingCarrierId: z.string().optional().describe("Shipping carrier id"),
      percentageOfRateFee: z
        .number()
        .optional()
        .describe("Percentage of rate fee if it is a carrier rate"),
      shippingCarrierServices: z
        .array(
          z.object({
            name: z.string().describe("Name of the shipping carrier service"),
            value: z.string().describe("Value of the shipping carrier service"),
          })
        )
        .optional()
        .describe("An array of available shipping carrier services"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const { shippingZoneId, shippingRateId, ...body } = args as {
          shippingZoneId: string;
          shippingRateId: string;
        } & Record<string, unknown>;
        const result = await ghlRequest(
          "PUT",
          `/store/shipping-zone/${shippingZoneId}/shipping-rate/${shippingRateId}`,
          {
            token: config.token,
            version: GHL_VERSION_V3,
            body: { ...body, altId: config.locationId, altType: "location" },
          }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_delete_shipping_rate",
    description: "Delete a shipping rate from a shipping zone.",
    inputSchema: z.object({
      shippingZoneId: z.string().describe("The shipping zone ID"),
      shippingRateId: z.string().describe("The shipping rate ID"),
    }),
    handler: async (
      args: { shippingZoneId: string; shippingRateId: string },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest(
          "DELETE",
          `/store/shipping-zone/${args.shippingZoneId}/shipping-rate/${args.shippingRateId}`,
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
    name: "ghl_get_store_settings",
    description: "Get the store settings (shipping origin, order notification emails).",
    inputSchema: z.object({}),
    handler: async (_args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", "/store/store-setting", {
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
    name: "ghl_update_store_settings",
    description:
      "Create or update the store settings (shipping origin, order notification emails). Upserts — creates settings if none exist yet, otherwise updates them.",
    inputSchema: z.object({
      shippingOrigin: z
        .object({
          name: z.string().describe("Name of the store / company"),
          // Spec types this "number" with a malformed nested-array enum of country codes — the real API expects a string.
          country: z.string().describe("Country code, e.g. US"),
          state: z.string().optional().describe("State code, e.g. CA"),
          city: z.string().describe("City name"),
          street1: z.string().describe("Street address line 1"),
          street2: z.string().optional().describe("Street address line 2"),
          zip: z.string().describe("Zip code"),
          phone: z.string().optional().describe("Business phone number"),
          email: z.string().optional().describe("Email"),
        })
        .describe("Shipping origin address"),
      storeOrderNotification: z
        .object({
          enabled: z.boolean().describe("Whether store order notification is enabled"),
          subject: z.string().describe("Store order email subject"),
          emailTemplateId: z.string().describe("Email template ID"),
          defaultEmailTemplateId: z.string().describe("Default email template ID"),
        })
        .optional()
        .describe("Store order notification email settings"),
      storeOrderFulfillmentNotification: z
        .object({
          enabled: z
            .boolean()
            .describe("Whether store order fulfillment notification is enabled"),
          subject: z.string().describe("Store order fulfillment email subject"),
          emailTemplateId: z.string().describe("Email template ID"),
          defaultEmailTemplateId: z.string().describe("Default email template ID"),
        })
        .optional()
        .describe("Store order fulfillment notification email settings"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("POST", "/store/store-setting", {
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
