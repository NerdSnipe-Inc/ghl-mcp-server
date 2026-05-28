import { z } from "zod";
import { ghlRequest, formatError, GHLConfig } from "../client.js";

export const paymentTools = [
  // --- Orders ---
  {
    name: "ghl_get_orders",
    description: "Get payment orders in the location.",
    inputSchema: z.object({
      contactId: z.string().optional().describe("Filter by contact"),
      status: z
        .enum(["pending", "confirmed", "cancelled", "failed", "refunded"])
        .optional(),
      limit: z.number().optional().default(20),
      page: z.number().optional().default(1),
      startAt: z.string().optional().describe("Start date filter ISO 8601"),
      endAt: z.string().optional().describe("End date filter ISO 8601"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", "/payments/orders", {
          token: config.token,
          params: { altId: config.locationId, altType: "location", ...args as Record<string, string | number | boolean | undefined> },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_order",
    description: "Get a specific order by ID.",
    inputSchema: z.object({
      orderId: z.string(),
    }),
    handler: async (args: { orderId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", `/payments/orders/${args.orderId}`, {
          token: config.token,
          params: { altId: config.locationId, altType: "location" },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  // --- Transactions ---
  {
    name: "ghl_get_transactions",
    description: "Get payment transactions in the location.",
    inputSchema: z.object({
      contactId: z.string().optional(),
      limit: z.number().optional().default(20),
      page: z.number().optional().default(1),
      startAt: z.string().optional(),
      endAt: z.string().optional(),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", "/payments/transactions", {
          token: config.token,
          params: { altId: config.locationId, altType: "location", ...args as Record<string, string | number | boolean | undefined> },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  // --- Subscriptions ---
  {
    name: "ghl_get_subscriptions",
    description: "Get active subscriptions in the location.",
    inputSchema: z.object({
      contactId: z.string().optional(),
      limit: z.number().optional().default(20),
      page: z.number().optional().default(1),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", "/payments/subscriptions", {
          token: config.token,
          params: { altId: config.locationId, altType: "location", ...args as Record<string, string | number | boolean | undefined> },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  // --- Coupons ---
  {
    name: "ghl_get_coupons",
    description: "Get discount coupons in the location.",
    inputSchema: z.object({
      limit: z.number().optional().default(20),
      offset: z.number().optional().default(0),
      status: z.string().optional().describe("Filter by coupon status"),
      search: z.string().optional().describe("Search by coupon name or code"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", "/payments/coupon/list", {
          token: config.token,
          params: {
            altId: config.locationId,
            altType: "location",
            limit: args.limit as number | undefined,
            offset: args.offset as number | undefined,
            status: args.status as string | undefined,
            search: args.search as string | undefined,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_create_coupon",
    description: "Create a discount coupon.",
    inputSchema: z.object({
      name: z.string(),
      code: z.string().describe("Coupon code (e.g. SAVE20)"),
      discountType: z.enum(["percentage", "fixed"]),
      discount: z.number().describe("Discount value (% or $ amount)"),
      startDate: z.string().optional().describe("Coupon validity start date ISO 8601"),
      endDate: z.string().optional().describe("Coupon expiry date ISO 8601"),
      usageLimit: z.number().optional().describe("Max number of times coupon can be used"),
      productIds: z.array(z.string()).optional().describe("Restrict to specific product IDs"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("POST", "/payments/coupon", {
          token: config.token,
          body: { ...args, altId: config.locationId, altType: "location" },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
];

export const invoiceTools = [
  {
    name: "ghl_get_invoices",
    description: "Get invoices in the location.",
    inputSchema: z.object({
      contactId: z.string().optional().describe("Filter by contact"),
      status: z
        .enum(["draft", "sent", "paid", "void", "overdue", "partially_paid"])
        .optional(),
      limit: z.number().optional().default(20),
      offset: z.number().optional().default(0),
      search: z.string().optional(),
      startAt: z.string().optional(),
      endAt: z.string().optional(),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", "/invoices/", {
          token: config.token,
          params: {
            altId: config.locationId,
            altType: "location",
            contactId: args.contactId as string | undefined,
            status: args.status as string | undefined,
            limit: args.limit as number | undefined,
            offset: args.offset as number | undefined,
            search: args.search as string | undefined,
            startAt: args.startAt as string | undefined,
            endAt: args.endAt as string | undefined,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_invoice",
    description: "Get a specific invoice by ID.",
    inputSchema: z.object({
      invoiceId: z.string(),
    }),
    handler: async (args: { invoiceId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", `/invoices/${args.invoiceId}`, {
          token: config.token,
          params: { altId: config.locationId, altType: "location" },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_create_invoice",
    description: "Create a new invoice for a contact.",
    inputSchema: z.object({
      contactId: z.string(),
      name: z.string().describe("Invoice name/title"),
      currency: z.string().optional().default("USD"),
      dueDate: z.string().optional().describe("ISO 8601 due date"),
      items: z
        .array(
          z.object({
            name: z.string(),
            description: z.string().optional(),
            quantity: z.number().default(1),
            unitAmount: z.number().describe("Price per unit in cents"),
          })
        )
        .describe("Invoice line items"),
      discount: z
        .object({
          type: z.enum(["percentage", "fixed"]),
          value: z.number(),
        })
        .optional(),
      title: z.string().optional(),
      invoiceNumber: z.string().optional(),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("POST", "/invoices/", {
          token: config.token,
          body: { ...args, altId: config.locationId, altType: "location" },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_send_invoice",
    description: "Send an invoice to the contact via email.",
    inputSchema: z.object({
      invoiceId: z.string(),
      userId: z.string().describe("User ID of the sender"),
      action: z.enum(["send", "resend"]).optional().default("send"),
      liveMode: z.boolean().optional().default(true).describe("Use live payment mode (false = test mode)"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      const { invoiceId, ...sendData } = args as { invoiceId: string } & Record<string, unknown>;
      try {
        const result = await ghlRequest("POST", `/invoices/${invoiceId}/send`, {
          token: config.token,
          body: { altId: config.locationId, altType: "location", ...sendData },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_void_invoice",
    description: "Void (cancel) an invoice.",
    inputSchema: z.object({
      invoiceId: z.string(),
    }),
    handler: async (args: { invoiceId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("POST", `/invoices/${args.invoiceId}/void`, {
          token: config.token,
          body: { altId: config.locationId, altType: "location" },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_record_invoice_payment",
    description: "Record a manual payment against an invoice.",
    inputSchema: z.object({
      invoiceId: z.string(),
      amount: z.number().describe("Payment amount in cents"),
      paymentMethod: z
        .enum(["cash", "check", "credit_card", "bank_transfer", "other"])
        .optional(),
      notes: z.string().optional(),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      const { invoiceId, ...paymentData } = args as { invoiceId: string } & Record<string, unknown>;
      try {
        const result = await ghlRequest("POST", `/invoices/${invoiceId}/record-payment`, {
          token: config.token,
          body: paymentData,
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
];
