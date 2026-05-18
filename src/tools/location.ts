import { z } from "zod";
import { ghlRequest, formatError, GHLConfig } from "../client.js";

export const locationTools = [
  {
    name: "ghl_get_location",
    description: "Get details about the current GHL location/sub-account.",
    inputSchema: z.object({}),
    handler: async (_args: Record<string, never>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", `/locations/${config.locationId}`, {
          token: config.token,
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
];
