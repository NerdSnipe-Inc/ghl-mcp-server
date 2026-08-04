import { z } from "zod";
import { ghlRequest, formatError, GHLConfig, GHL_VERSION_V3 } from "../client.js";

const PLATFORM_ENUM = [
  "google",
  "facebook",
  "instagram",
  "linkedin",
  "tiktok",
  "tiktok-business",
  "youtube",
  "pinterest",
  "threads",
  "bluesky",
] as const;

export const socialPlannerAccountsTools = [
  {
    name: "ghl_start_social_oauth",
    description:
      "Step 1 of 3 in the OAuth account-connection flow: start OAuth for a social platform. " +
      "This returns a URL meant to be opened in a browser window (not called via a plain HTTP " +
      "client) so the user can authenticate with the platform; the OAuth window then posts back " +
      "an accountId used for Step 2 (ghl_get_social_oauth_accounts) and Step 3 " +
      "(ghl_connect_social_oauth_account). Required: platform, userId. Optional: page, reconnect. " +
      "Not to be confused with ghl_set_social_accounts, which associates accounts with an " +
      "already-uploaded CSV import job, not the OAuth flow.",
    inputSchema: z.object({
      platform: z.enum(PLATFORM_ENUM).describe("Social platform to start OAuth for (bluesky is not supported and will error)"),
      userId: z.string().describe("The user ID initiating the OAuth flow"),
      page: z.string().optional().describe("Page context to return to after OAuth completes"),
      reconnect: z.string().optional().describe("Account ID(s) being reconnected, if this is a reconnect flow"),
    }),
    handler: async (
      args: { platform: string; userId: string; page?: string; reconnect?: string },
      config: GHLConfig
    ) => {
      const { platform, ...query } = args;
      try {
        const result = await ghlRequest(
          "GET",
          `/social-media-posting/oauth/${platform}/start`,
          {
            token: config.token,
            version: GHL_VERSION_V3,
            params: { locationId: config.locationId, ...query },
          }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_social_oauth_accounts",
    description:
      "Step 2 of 3 in the OAuth account-connection flow: after the user completes OAuth " +
      "(ghl_start_social_oauth), list the pages/channels/locations available to connect for the " +
      "given platform and accountId returned by Step 1. Use the result to pick the account/page " +
      "to connect via ghl_connect_social_oauth_account (Step 3). Required: platform, accountId. " +
      "Optional: search.",
    inputSchema: z.object({
      platform: z.enum(PLATFORM_ENUM).describe("Social platform"),
      accountId: z.string().describe("The accountId returned from Step 1 (ghl_start_social_oauth)"),
      search: z.string().optional().describe("Search query to filter available accounts/pages"),
    }),
    handler: async (
      args: { platform: string; accountId: string; search?: string },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest(
          "GET",
          `/social-media-posting/oauth/${config.locationId}/${args.platform}/accounts/${args.accountId}`,
          {
            token: config.token,
            version: GHL_VERSION_V3,
            params: { search: args.search },
          }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_connect_social_oauth_account",
    description:
      "Step 3 of 3 in the OAuth account-connection flow: connect the account/page selected in " +
      "Step 2 (ghl_get_social_oauth_accounts) to this location. The request body shape varies by " +
      "platform. Facebook/Instagram/LinkedIn/TikTok/YouTube/Pinterest use type, originId, name, " +
      "avatar; Google Business Profile uses nested location and account objects instead. Required: " +
      "platform, accountId, plus the platform-specific body fields above.",
    inputSchema: z.object({
      platform: z.enum(PLATFORM_ENUM).describe("Social platform"),
      accountId: z.string().describe("The accountId returned from Step 1 to attach"),
      type: z.string().optional().describe("Account type, e.g. 'page' (Facebook/Instagram/LinkedIn)"),
      originId: z.string().optional().describe("Platform-native ID of the page/channel/account being connected"),
      name: z.string().optional().describe("Display name of the account/page being connected"),
      avatar: z.string().optional().describe("Avatar/profile image URL"),
      location: z
        .object({
          name: z.string().optional(),
          title: z.string().optional(),
          storeCode: z.string().optional(),
          isVerified: z.string().optional(),
        })
        .optional()
        .describe("Google Business Profile location object (Google platform only)"),
      account: z
        .object({
          name: z.string().optional(),
          accountName: z.string().optional(),
          type: z.string().optional(),
          verificationState: z.string().optional(),
          vettedState: z.string().optional(),
        })
        .optional()
        .describe("Google Business Profile account object (Google platform only)"),
    }),
    handler: async (
      args: { platform: string; accountId: string } & Record<string, unknown>,
      config: GHLConfig
    ) => {
      const { platform, accountId, ...body } = args;
      try {
        const result = await ghlRequest(
          "POST",
          `/social-media-posting/oauth/${config.locationId}/${platform}/accounts/${accountId}`,
          {
            token: config.token,
            version: GHL_VERSION_V3,
            body,
          }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_delete_social_account",
    description:
      "Delete a connected social media account (and remove it from its group). Required: id. " +
      "Optional: companyId, userId.",
    inputSchema: z.object({
      id: z.string().describe("The connected account ID to delete"),
      companyId: z.string().optional().describe("Company ID (agency-level context)"),
      userId: z.string().optional().describe("User ID performing the deletion"),
    }),
    handler: async (
      args: { id: string; companyId?: string; userId?: string },
      config: GHLConfig
    ) => {
      const { id, ...query } = args;
      try {
        const result = await ghlRequest(
          "DELETE",
          `/social-media-posting/${config.locationId}/accounts/${id}`,
          {
            token: config.token,
            version: GHL_VERSION_V3,
            params: { ...query },
          }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_set_social_accounts",
    description:
      "Associate connected social accounts with an already-uploaded CSV bulk-import job (the CSV " +
      "upload itself is a separate flow, not covered by this tool) so the platform knows which " +
      "accounts to publish the CSV's posts to. This is NOT the OAuth account-connection flow — " +
      "use ghl_start_social_oauth / ghl_get_social_oauth_accounts / ghl_connect_social_oauth_account " +
      "to connect a new account. Required: accountIds, filePath, rowsCount, fileName, userId. " +
      "Optional: approver, csvFileType.",
    inputSchema: z.object({
      accountIds: z.array(z.string()).describe("Connected account IDs to publish the CSV's posts to"),
      filePath: z.string().describe("Path of the already-uploaded CSV file"),
      rowsCount: z.number().describe("Number of rows in the uploaded CSV"),
      fileName: z.string().describe("Name of the uploaded CSV file"),
      userId: z.string().describe("User ID performing the import"),
      approver: z.string().optional().describe("User ID required to approve posts from this import"),
      csvFileType: z.string().optional().describe("CSV file type/template identifier"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "POST",
          `/social-media-posting/${config.locationId}/set-accounts`,
          {
            token: config.token,
            version: GHL_VERSION_V3,
            body: { ...args },
          }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_social_categories",
    description:
      "List social media categories for this location, with optional search and pagination. " +
      "Optional: searchText, limit, skip.",
    inputSchema: z.object({
      searchText: z.string().optional().describe("Search query to filter categories"),
      // NOTE: upstream spec types `limit`/`skip` as query-string `string`, not `number`,
      // for this operation (inconsistent with other list endpoints in this same spec file).
      // We accept numbers here for a consistent tool interface; ghlRequest stringifies them.
      limit: z.number().optional().describe("Max results to return"),
      skip: z.number().optional().describe("Number of results to skip (pagination)"),
    }),
    handler: async (
      args: { searchText?: string; limit?: number; skip?: number },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest(
          "GET",
          `/social-media-posting/${config.locationId}/categories`,
          {
            token: config.token,
            version: GHL_VERSION_V3,
            params: { ...args },
          }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_social_category",
    description: "Get a single social media category by ID. Required: id.",
    inputSchema: z.object({
      id: z.string().describe("The category ID"),
    }),
    handler: async (args: { id: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "GET",
          `/social-media-posting/${config.locationId}/categories/${args.id}`,
          {
            token: config.token,
            version: GHL_VERSION_V3,
          }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_social_tags",
    description:
      "List social media tags for this location, with optional search and pagination. " +
      "Optional: searchText, limit, skip.",
    inputSchema: z.object({
      searchText: z.string().optional().describe("Search query to filter tags"),
      // NOTE: same upstream spec quirk as ghl_get_social_categories — `limit`/`skip` are typed
      // as query-string `string` in the spec; we accept numbers for interface consistency.
      limit: z.number().optional().describe("Max results to return"),
      skip: z.number().optional().describe("Number of results to skip (pagination)"),
    }),
    handler: async (
      args: { searchText?: string; limit?: number; skip?: number },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest(
          "GET",
          `/social-media-posting/${config.locationId}/tags`,
          {
            token: config.token,
            version: GHL_VERSION_V3,
            params: { ...args },
          }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_social_tags_by_ids",
    description: "Get multiple social media tags by their IDs. Required: tagIds.",
    inputSchema: z.object({
      tagIds: z.array(z.string()).describe("Tag IDs to fetch"),
    }),
    handler: async (args: { tagIds: string[] }, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "POST",
          `/social-media-posting/${config.locationId}/tags/details`,
          {
            token: config.token,
            version: GHL_VERSION_V3,
            body: { tagIds: args.tagIds },
          }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
];
