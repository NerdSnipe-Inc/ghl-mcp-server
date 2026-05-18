import { z } from "zod";
import { ghlRequest, formatError, GHLConfig } from "../client.js";

export const surveyTools = [
  {
    name: "ghl_get_surveys",
    description: "List all surveys created in the location.",
    inputSchema: z.object({
      limit: z.number().optional().default(25),
      skip: z.number().optional().default(0),
      type: z.string().optional().describe("Filter by survey type"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", "/surveys/", {
          token: config.token,
          params: {
            locationId: config.locationId,
            limit: args.limit as number | undefined,
            skip: args.skip as number | undefined,
            type: args.type as string | undefined,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_survey_submissions",
    description:
      "Get survey submissions — optionally filter by survey, contact, or date range.",
    inputSchema: z.object({
      surveyId: z.string().optional().describe("Filter by survey ID"),
      contactId: z.string().optional().describe("Filter by contact ID"),
      startAt: z.string().optional().describe("Start date ISO 8601"),
      endAt: z.string().optional().describe("End date ISO 8601"),
      limit: z.number().optional().default(25),
      page: z.number().optional().default(1),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", "/surveys/submissions", {
          token: config.token,
          params: {
            locationId: config.locationId,
            surveyId: args.surveyId as string | undefined,
            contactId: args.contactId as string | undefined,
            startAt: args.startAt as string | undefined,
            endAt: args.endAt as string | undefined,
            limit: args.limit as number | undefined,
            page: args.page as number | undefined,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
];
