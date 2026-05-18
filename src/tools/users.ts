import { z } from "zod";
import { ghlRequest, formatError, GHLConfig } from "../client.js";

const permissionsSchema = z
  .object({
    campaignsEnabled: z.boolean().optional(),
    contactsEnabled: z.boolean().optional(),
    workflowsEnabled: z.boolean().optional(),
    triggersEnabled: z.boolean().optional(),
    funnelsEnabled: z.boolean().optional(),
    websitesEnabled: z.boolean().optional(),
    opportunitiesEnabled: z.boolean().optional(),
    dashboardStatsEnabled: z.boolean().optional(),
    leadValueEnabled: z.boolean().optional(),
    marketingEnabled: z.boolean().optional(),
    agentReportingEnabled: z.boolean().optional(),
    userCommsMgmtEnabled: z.boolean().optional(),
    auditLogsEnabled: z.boolean().optional(),
    settingsEnabled: z.boolean().optional(),
    tagsEnabled: z.boolean().optional(),
    leadSourcesEnabled: z.boolean().optional(),
    appointmentsEnabled: z.boolean().optional(),
    reviewsEnabled: z.boolean().optional(),
    onlineListingsEnabled: z.boolean().optional(),
    phoneCallEnabled: z.boolean().optional(),
    conversationsEnabled: z.boolean().optional(),
    assignedDataOnly: z.boolean().optional(),
    adwordsReportingEnabled: z.boolean().optional(),
    membershipEnabled: z.boolean().optional(),
    facebookAdsReportingEnabled: z.boolean().optional(),
    attributionReportEnabled: z.boolean().optional(),
    agentLeaderboardEnabled: z.boolean().optional(),
  })
  .optional()
  .describe("Granular permission flags");

export const userTools = [
  {
    name: "ghl_get_users",
    description: "List all team members in the GHL location.",
    inputSchema: z.object({}),
    handler: async (_args: Record<string, never>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", "/users/", {
          token: config.token,
          params: { locationId: config.locationId },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_search_users",
    description: "Search team members by name or email.",
    inputSchema: z.object({
      query: z.string().optional().describe("Search query"),
    }),
    handler: async (args: { query?: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", "/users/search", {
          token: config.token,
          params: { locationId: config.locationId, query: args.query },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_user",
    description: "Get a single team member by their user ID.",
    inputSchema: z.object({
      userId: z.string().describe("User ID"),
    }),
    handler: async (args: { userId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", `/users/${args.userId}`, {
          token: config.token,
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_create_user",
    description: "Create a new team member in the location.",
    inputSchema: z.object({
      firstName: z.string(),
      lastName: z.string(),
      email: z.string().email(),
      phone: z.string().optional().describe("E.164 format preferred, e.g. +16135550100"),
      role: z.enum(["admin", "user"]).optional().default("user"),
      permissions: permissionsSchema,
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("POST", "/users/", {
          token: config.token,
          body: { ...args, locationId: config.locationId, type: "account" },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_update_user",
    description: "Update an existing team member. Only provide fields you want to change.",
    inputSchema: z.object({
      userId: z.string().describe("User ID to update"),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      role: z.enum(["admin", "user"]).optional(),
      permissions: permissionsSchema,
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      const { userId, ...updateData } = args as { userId: string } & Record<string, unknown>;
      try {
        const result = await ghlRequest("PUT", `/users/${userId}`, {
          token: config.token,
          body: updateData,
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_delete_user",
    description: "Remove a team member from the location.",
    inputSchema: z.object({
      userId: z.string().describe("User ID to delete"),
    }),
    handler: async (args: { userId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("DELETE", `/users/${args.userId}`, {
          token: config.token,
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
];
