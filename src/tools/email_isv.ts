import { z } from "zod";
import { ghlRequest, formatError, GHLConfig, GHL_VERSION_V3 } from "../client.js";

export const emailIsvTools = [
  {
    name: "ghl_verify_email",
    description: "Verify email address or contact for deliverability and risk assessment.",
    inputSchema: z.object({
      type: z
        .enum(["email", "contact"])
        .describe("Email Verification type: 'email' for email address or 'contact' for contact ID"),
      verify: z
        .string()
        .describe("Email verification recipient (email address or contactId)"),
    }),
    handler: async (
      args: {
        type: "email" | "contact";
        verify: string;
      },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest(
          "POST",
          "/email/verify",
          {
            token: config.token,
            version: GHL_VERSION_V3,
            body: {
              type: args.type,
              verify: args.verify,
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
