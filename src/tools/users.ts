import { z } from "zod";
import { ghlRequest, formatError, GHLConfig, GHL_VERSION_V3 } from "../client.js";

// v3 (apps/v3/users-v3.json) requires an agency-level `companyId` on
// /users/search and POST /users/ that GHLConfig doesn't carry directly.
// We derive it by looking up the location first (GET /locations/{locationId}
// returns `location.companyId`), then use it in the subsequent v3 call.
// A location's companyId is immutable for the process's lifetime, so the
// result is memoized per locationId to avoid a redundant API call (and
// point of failure) on every users tool invocation.
const companyIdCache = new Map<string, string>();

async function getCompanyId(config: GHLConfig): Promise<string> {
  const cached = companyIdCache.get(config.locationId);
  if (cached) return cached;
  const result = await ghlRequest<{ location: { companyId: string } }>(
    "GET",
    `/locations/${config.locationId}`,
    { token: config.token, version: GHL_VERSION_V3 }
  );
  companyIdCache.set(config.locationId, result.location.companyId);
  return result.location.companyId;
}

/** Test-only escape hatch: clears the module-level companyId cache so each
 * test can assert on a fresh location lookup. Not used by production code. */
export function __resetCompanyIdCacheForTests(): void {
  companyIdCache.clear();
}

// Field names/set verified directly against users-v3.json's PermissionsDto
// (components.schemas.PermissionsDto). userCommsMgmtEnabled, auditLogsEnabled,
// leadSourcesEnabled, and agentLeaderboardEnabled do not exist in that schema
// and have been removed; attributionReportEnabled was a misspelling of the
// real attributionsReportingEnabled field.
const permissionsSchema = z
  .object({
    campaignsEnabled: z.boolean().optional(),
    campaignsReadOnly: z.boolean().optional(),
    contactsEnabled: z.boolean().optional(),
    workflowsEnabled: z.boolean().optional(),
    workflowsReadOnly: z.boolean().optional(),
    triggersEnabled: z.boolean().optional(),
    funnelsEnabled: z.boolean().optional(),
    websitesEnabled: z.boolean().optional(),
    opportunitiesEnabled: z.boolean().optional(),
    dashboardStatsEnabled: z.boolean().optional(),
    bulkRequestsEnabled: z.boolean().optional(),
    appointmentsEnabled: z.boolean().optional(),
    reviewsEnabled: z.boolean().optional(),
    onlineListingsEnabled: z.boolean().optional(),
    phoneCallEnabled: z.boolean().optional(),
    conversationsEnabled: z.boolean().optional(),
    assignedDataOnly: z.boolean().optional(),
    adwordsReportingEnabled: z.boolean().optional(),
    membershipEnabled: z.boolean().optional(),
    facebookAdsReportingEnabled: z.boolean().optional(),
    attributionsReportingEnabled: z.boolean().optional(),
    settingsEnabled: z.boolean().optional(),
    tagsEnabled: z.boolean().optional(),
    leadValueEnabled: z.boolean().optional(),
    marketingEnabled: z.boolean().optional(),
    agentReportingEnabled: z.boolean().optional(),
    botService: z.boolean().optional(),
    socialPlanner: z.boolean().optional(),
    bloggingEnabled: z.boolean().optional(),
    invoiceEnabled: z.boolean().optional(),
    affiliateManagerEnabled: z.boolean().optional(),
    contentAiEnabled: z.boolean().optional(),
    refundsEnabled: z.boolean().optional(),
    recordPaymentEnabled: z.boolean().optional(),
    cancelSubscriptionEnabled: z.boolean().optional(),
    paymentsEnabled: z.boolean().optional(),
    communitiesEnabled: z.boolean().optional(),
    exportPaymentsEnabled: z.boolean().optional(),
  })
  .optional()
  .describe("Granular permission flags");

// scopes/scopesAssignedToOnly accept an array of scope strings from a large
// fixed enum (200+ values) defined in users-v3.json's CreateUserDto/UpdateUserDto.
// Validated as a generic string array here rather than duplicating the full
// enum, to avoid the schema silently drifting out of sync with the spec.
const scopesSchema = z
  .array(z.string())
  .optional()
  .describe(
    "Scopes to enable for the user, e.g. ['contacts.write', 'campaigns.readonly']. Only scopes passed are enabled; passing an empty array disables all scopes."
  );

const scopesAssignedToOnlySchema = z
  .array(z.string())
  .optional()
  .describe(
    "Assigned-only scopes to enable for the user. Only scopes passed are enabled; passing an empty array disables all assigned scopes."
  );

export const userTools = [
  {
    name: "ghl_get_users",
    description: "List all team members in the GHL location. Resolves the account's company ID via a location lookup first.",
    inputSchema: z.object({
      limit: z.number().optional().describe("Max results"),
      skip: z.number().optional().describe("Number of results to skip"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const companyId = await getCompanyId(config);
        const result = await ghlRequest("GET", "/users/search", {
          token: config.token,
          version: GHL_VERSION_V3,
          params: {
            companyId,
            locationId: config.locationId,
            limit: args.limit as number | undefined,
            skip: args.skip as number | undefined,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_search_users",
    description: "Search team members by name or email. Resolves the account's company ID via a location lookup first.",
    inputSchema: z.object({
      query: z.string().optional().describe("Search query"),
    }),
    handler: async (args: { query?: string }, config: GHLConfig) => {
      try {
        const companyId = await getCompanyId(config);
        const result = await ghlRequest("GET", "/users/search", {
          token: config.token,
          version: GHL_VERSION_V3,
          params: { companyId, locationId: config.locationId, query: args.query },
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
          version: GHL_VERSION_V3,
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_create_user",
    description: "Create a new team member in the location. Resolves the account's company ID via a location lookup first.",
    inputSchema: z.object({
      firstName: z.string(),
      lastName: z.string(),
      email: z.string().email(),
      password: z
        .string()
        .describe(
          "Min 12 characters, at least one uppercase, one lowercase, one number, one special character"
        ),
      type: z
        .enum(["account", "agency"])
        .default("account")
        .describe("account for sub-account users, agency for agency-level users"),
      role: z.enum(["admin", "user"]).optional().default("user"),
      locationIds: z
        .array(z.string())
        .optional()
        .describe("Location IDs to assign the user to. Defaults to the current location if omitted."),
      phone: z.string().optional().describe("E.164 format preferred, e.g. +16135550100"),
      permissions: permissionsSchema,
      scopes: scopesSchema,
      scopesAssignedToOnly: scopesAssignedToOnlySchema,
      profilePhoto: z.string().optional().describe("URL of the user profile photo"),
      twilioPhone: z
        .record(z.string())
        .optional()
        .describe(
          "Per-location inbound Twilio number in E.164 format, keyed by location id"
        ),
      platformLanguage: z
        .enum(["en_US", "es", "fr_CA", "fr_FR", "nl", "de", "pt_PT", "pt_BR", "it", "sv", "da", "fi", "no"])
        .optional()
        .describe("Platform language preference for the user"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const companyId = await getCompanyId(config);
        const result = await ghlRequest("POST", "/users/", {
          token: config.token,
          version: GHL_VERSION_V3,
          body: {
            ...args,
            companyId,
            locationIds: (args.locationIds as string[] | undefined) ?? [config.locationId],
          },
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
      email: z.string().email().optional().describe("Note: ignored by the v3 API — GHL deprecated updating email via this endpoint; the call succeeds but email will not change."),
      password: z
        .string()
        .optional()
        .describe(
          "New password. Min 12 characters, at least one uppercase, one lowercase, one number, one special character"
        ),
      phone: z.string().optional(),
      type: z
        .enum(["account", "agency"])
        .optional()
        .describe("account for sub-account users, agency for agency-level users"),
      role: z.enum(["admin", "user"]).optional(),
      companyId: z.string().optional().describe("Company/Agency ID. Required for agency-level access"),
      locationIds: z
        .array(z.string())
        .optional()
        .describe("Sub-account location IDs the user should have access to"),
      permissions: permissionsSchema,
      scopes: scopesSchema,
      scopesAssignedToOnly: scopesAssignedToOnlySchema,
      profilePhoto: z.string().optional().describe("URL of the user profile photo"),
      twilioPhone: z
        .record(z.string())
        .optional()
        .describe(
          "Per-location inbound Twilio number in E.164 format, keyed by location id"
        ),
      platformLanguage: z
        .enum(["en_US", "es", "fr_CA", "fr_FR", "nl", "de", "pt_PT", "pt_BR", "it", "sv", "da", "fi", "no"])
        .optional()
        .describe("Platform language preference for the user"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      const { userId, ...updateData } = args as { userId: string } & Record<string, unknown>;
      try {
        const result = await ghlRequest("PUT", `/users/${userId}`, {
          token: config.token,
          version: GHL_VERSION_V3,
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
          version: GHL_VERSION_V3,
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
];
