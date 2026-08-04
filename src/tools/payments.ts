import { z } from "zod";
import { ghlRequest, formatError, GHLConfig, GHL_VERSION_V3 } from "../client.js";

export const paymentTools = [
  // --- Orders ---
  {
    name: "ghl_get_orders",
    description: "Get payment orders in the location.",
    inputSchema: z.object({
      contactId: z.string().optional().describe("Filter by contact"),
      // Spec: the only enum-constrained order filter is paymentStatus, not a
      // generic "status" field.
      paymentStatus: z.enum(["paid", "unpaid", "refunded", "partially_paid"]).optional(),
      limit: z.number().optional().default(20),
      offset: z.number().optional().default(0),
      startAt: z.string().optional().describe("Start date filter ISO 8601"),
      endAt: z.string().optional().describe("End date filter ISO 8601"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", "/payments/orders", {
          token: config.token,
          version: GHL_VERSION_V3,
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
          version: GHL_VERSION_V3,
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
      offset: z.number().optional().default(0),
      startAt: z.string().optional(),
      endAt: z.string().optional(),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", "/payments/transactions", {
          token: config.token,
          version: GHL_VERSION_V3,
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
      offset: z.number().optional().default(0),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", "/payments/subscriptions", {
          token: config.token,
          version: GHL_VERSION_V3,
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
          version: GHL_VERSION_V3,
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
      // Spec (CreateCouponParams): "amount", not "fixed".
      discountType: z.enum(["percentage", "amount"]),
      discountValue: z.number().describe("Discount value (% or $ amount)"),
      startDate: z.string().describe("Coupon validity start date, YYYY-MM-DDTHH:mm:ssZ (required by spec)"),
      endDate: z.string().optional().describe("Coupon expiry date ISO 8601"),
      usageLimit: z.number().optional().describe("Max number of times coupon can be used"),
      productIds: z.array(z.string()).optional().describe("Restrict to specific product IDs"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("POST", "/payments/coupon", {
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
          version: GHL_VERSION_V3,
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
    name: "ghl_create_invoice",
    description: "Create a new invoice. Sends contactDetails (not a bare contactId) per the spec.",
    inputSchema: z.object({
      name: z.string().describe("Invoice name/title"),
      currency: z.string().describe("Currency code, e.g. USD"),
      businessDetails: z
        .object({
          logoUrl: z.string().optional(),
          name: z.string().optional(),
          phoneNo: z.string().optional(),
          address: z.record(z.unknown()).optional(),
          website: z.string().optional(),
          customValues: z.array(z.string()).optional(),
        })
        .describe("Business details shown on the invoice (required by spec)"),
      contactDetails: z
        .object({
          id: z.string().describe("Contact ID"),
          name: z.string(),
          phoneNo: z.string(),
          email: z.string().email(),
          companyName: z.string().optional(),
          address: z.record(z.unknown()).optional(),
        })
        .describe(
          "Contact to send the invoice to — spec uses a structured contactDetails object, not a bare contactId"
        ),
      dueDate: z.string().optional().describe("Due date, YYYY-MM-DD"),
      issueDate: z.string().describe("Issue date, YYYY-MM-DD (required by spec)"),
      items: z
        .array(
          z.object({
            name: z.string(),
            description: z.string().optional(),
            currency: z.string(),
            qty: z.number().describe("Quantity"),
            amount: z.number().describe("Line item amount"),
          })
        )
        .describe("Invoice line items"),
      discount: z
        .object({
          type: z.enum(["percentage", "fixed"]),
          value: z.number().optional().default(0),
        })
        .describe("Discount for the invoice (required by spec)"),
      sentTo: z
        .object({
          email: z.array(z.string()).describe("Recipient email addresses (required)"),
          emailCc: z.array(z.string()).optional(),
          emailBcc: z.array(z.string()).optional(),
          phoneNo: z.array(z.string()).optional(),
        })
        .describe("Recipients for the invoice (required by spec)"),
      liveMode: z.boolean().describe("Use live payment mode (false = test mode; required by spec)"),
      title: z.string().optional(),
      invoiceNumber: z.string().optional(),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("POST", "/invoices/", {
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
    name: "ghl_send_invoice",
    description: "Send an invoice to the contact.",
    inputSchema: z.object({
      invoiceId: z.string(),
      userId: z.string().describe("User ID of the sender"),
      action: z.enum(["sms_and_email", "send_manually", "email", "sms"]),
      liveMode: z.boolean().describe("Use live payment mode (false = test mode; required by spec)"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      const { invoiceId, ...sendData } = args as { invoiceId: string } & Record<string, unknown>;
      try {
        const result = await ghlRequest("POST", `/invoices/${invoiceId}/send`, {
          token: config.token,
          version: GHL_VERSION_V3,
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
          version: GHL_VERSION_V3,
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
      // Spec (RecordPaymentDto): field is `mode`, not `paymentMethod`; enum is
      // cash/card/cheque/bank_transfer/other (no "check" or "credit_card").
      mode: z.enum(["cash", "card", "cheque", "bank_transfer", "other"]),
      notes: z.string().describe("Note recorded with the transaction (required by spec)"),
      // Spec marks `card` and `cheque` as required alongside every mode, which
      // doesn't make business sense (e.g. mode=cash shouldn't need card details).
      // We treat them as optional and expect callers to supply the one matching
      // `mode`.
      card: z
        .object({ brand: z.string(), last4: z.string() })
        .optional()
        .describe("Card details — relevant when mode is 'card'"),
      cheque: z
        .object({ number: z.string() })
        .optional()
        .describe("Cheque number — relevant when mode is 'cheque'"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      const { invoiceId, ...paymentData } = args as { invoiceId: string } & Record<string, unknown>;
      try {
        const result = await ghlRequest("POST", `/invoices/${invoiceId}/record-payment`, {
          token: config.token,
          version: GHL_VERSION_V3,
          body: { ...paymentData, altId: config.locationId, altType: "location" },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
];
