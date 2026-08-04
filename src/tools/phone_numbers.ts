import { z } from "zod";
import { ghlRequest, formatError, GHLConfig, GHL_VERSION_V3, GHL_VERSION_LEGACY } from "../client.js";

export const phoneNumberTools = [
  {
    name: "ghl_get_phone_numbers",
    description: "List all purchased/active phone numbers in the location.",
    inputSchema: z.object({
      pageSize: z.number().optional().describe("Number of results per page"),
      page: z.number().optional().describe("Page number"),
      searchFilter: z.string().optional().describe("Filter by phone number or label"),
      skipNumberPool: z.boolean().optional().describe("Skip number pool results"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "GET",
          `/phone-system/numbers/location/${config.locationId}`,
          {
            token: config.token,
            version: GHL_VERSION_V3,
            params: {
              pageSize: args.pageSize as number | undefined,
              page: args.page as number | undefined,
              searchFilter: args.searchFilter as string | undefined,
              skipNumberPool: args.skipNumberPool as boolean | undefined,
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
    name: "ghl_search_available_phone_numbers",
    description:
      "Search for available phone numbers to purchase. All filters below are required by the spec.",
    // Spec (GET .../available): firstPart, lastPart, anywhere, numberTypes,
    // smsEnabled, mmsEnabled, voiceEnabled, and countryCode are ALL required
    // query params — none are optional despite intuitively reading like filters.
    inputSchema: z.object({
      countryCode: z.string().describe("ISO 2-letter country code (e.g. CA, US)"),
      numberTypes: z
        .string()
        .describe("Comma-separated phone number type(s), e.g. \"local\" or \"tollFree,mobile,local\""),
      firstPart: z.string().describe("Beginning of the phone number to match"),
      lastPart: z.string().describe("Ending of the phone number to match"),
      // Spec's OpenAPI schema declares `anywhere` as type "string" with an example
      // of "825" — that example looks like a copy/paste leftover from the
      // adjacent `lastPart` param, and the description ("are the numbers required
      // anywhere in phone number") clearly describes a yes/no flag. We keep this
      // as a boolean, matching the pre-existing tool design and `smsEnabled`/etc.
      anywhere: z.boolean().describe("Match digits anywhere in number"),
      smsEnabled: z.boolean().describe("Requested numbers must have SMS capability"),
      mmsEnabled: z.boolean().describe("Requested numbers must have MMS capability"),
      voiceEnabled: z.boolean().describe("Requested numbers must have voice capability"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "GET",
          `/phone-system/numbers/location/${config.locationId}/available`,
          {
            token: config.token,
            version: GHL_VERSION_V3,
            params: {
              countryCode: args.countryCode as string,
              numberTypes: args.numberTypes as string,
              firstPart: args.firstPart as string,
              lastPart: args.lastPart as string,
              anywhere: args.anywhere as boolean,
              smsEnabled: args.smsEnabled as boolean,
              mmsEnabled: args.mmsEnabled as boolean,
              voiceEnabled: args.voiceEnabled as boolean,
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
    name: "ghl_purchase_phone_number",
    description:
      "Purchase a phone number for the location. All fields below are required by the spec " +
      "(Twilio address/bundle SIDs, Stripe payment details, and locality info).",
    inputSchema: z.object({
      phoneNumber: z
        .string()
        .describe("Phone number to purchase in E.164 format (e.g. +16135550100)"),
      addressSid: z.string().describe("Twilio address SID"),
      bundleSid: z.string().describe("Twilio bundle SID"),
      countryCode: z.string().describe("Country for which the phone number is being requested"),
      // Spec's OpenAPI schema declares `numberType` as type "object" but its
      // example is a plain string ("local") consistent with numberTypes above —
      // we treat it as a string.
      numberType: z.string().describe("Type of phone number to purchase, e.g. local, tollFree"),
      paymentIntentId: z.string().describe("Stripe payment intent ID"),
      stripeAccountId: z.string().describe("Stripe account ID"),
      paymentMethodId: z.string().describe("Stripe registered payment method ID"),
      locality: z.string().describe("Locality of the user in which the number is being purchased"),
      region: z.string().describe("Region of the user in which the number is being purchased"),
      fingerprintId: z.string().describe("Unique request ID for this purchase request"),
      skipLocationKYC: z
        .boolean()
        .describe("Skip location-level KYC verification if agency-level compliance is already verified"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "POST",
          `/phone-system/numbers/location/${config.locationId}/purchase`,
          {
            token: config.token,
            version: GHL_VERSION_V3,
            body: args,
          }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_release_phone_number",
    description:
      "Release (delete) a purchased phone number from the location.",
    inputSchema: z.object({
      numberId: z.string().describe("The phone number ID to release"),
    }),
    handler: async (args: { numberId: string }, config: GHLConfig) => {
      try {
        // Undocumented in both v2 (apps/phone-system.json) and v3 (apps/v3/phone-system-v3.json) specs — version unverified; staying on legacy to preserve pre-migration behavior rather than guessing forward.
        const result = await ghlRequest(
          "DELETE",
          `/phone-system/numbers/location/${config.locationId}/${args.numberId}`,
          { token: config.token, version: GHL_VERSION_LEGACY }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_update_phone_number",
    description:
      "Update settings for a phone number (friendly name, call forwarding, etc.).",
    inputSchema: z.object({
      numberId: z.string().describe("The phone number ID to update"),
      friendlyName: z.string().optional().describe("Display label for the number"),
      callForwardingNumber: z
        .string()
        .optional()
        .describe("Number to forward calls to in E.164 format"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        // Undocumented in both v2 (apps/phone-system.json) and v3 (apps/v3/phone-system-v3.json) specs — version unverified; staying on legacy to preserve pre-migration behavior rather than guessing forward.
        const result = await ghlRequest(
          "PUT",
          `/phone-system/numbers/location/${config.locationId}/${args.numberId as string}`,
          {
            token: config.token,
            version: GHL_VERSION_LEGACY,
            body: {
              ...(args.friendlyName !== undefined ? { friendlyName: args.friendlyName } : {}),
              ...(args.callForwardingNumber !== undefined ? { callForwardingNumber: args.callForwardingNumber } : {}),
            },
          }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
];
