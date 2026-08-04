import { z } from "zod";
import { ghlRequest, formatError, GHLConfig, GHL_VERSION_LEGACY } from "../client.js";

// Spec quirk: like facebook_*.ts and google_*.ts, every operation in this file declares
// its `Version` header as a fixed single-value enum of the legacy date "2021-07-28" —
// verified directly against ad-publishing-v3.json for all 16 operations below. None of
// these is the sole GHL_VERSION_V3 exception (Facebook's publishing-progress endpoint),
// so GHL_VERSION_LEGACY is used throughout.

// Spec quirk: `POST /ad-publishing/linkedin/integration` (CreateLinkedinIntegrationDTO)
// requires all five body fields — locationId, adAccountId, adAccountName, currencyCode,
// organizationId — verified directly (no optional fields on this schema).

// Spec quirk: `PUT /ad-publishing/linkedin/ads` (AdCampaignGroupDataDTO) is a genuine
// upsert with no ID in the path; only `locationId` is required. `budget` resolves to
// `LinkedInBudgetDTO`, a shallow 4-field schema (budgetType enum, amount,
// scheduleStartDate, scheduleEndDate) — modeled as a proper z.object. `adCampaigns`
// resolves to an array of `AdCampaignDTO`, which nests further into `AudienceDTO`
// (geoLocations[], targetAudience), `UnitCostDTO`, and `ads[]` (`LinkedInAdDTO`, which
// itself nests `media[]`) — a genuinely deep/wide multi-level $ref chain, so it is
// modeled permissively as z.array(z.record()) per established precedent (see
// google_campaigns.ts `audience`/`assets`/`adGroups`). `meta` is a free-form object on
// both `AdCampaignGroupDataDTO` and `AdCampaignDTO` — modeled as z.record().
// Named `ghl_upsert_linkedin_campaign` per the upsert-naming precedent set in
// facebook_campaigns.ts (`ghl_upsert_facebook_campaign`).

// Spec quirk: `POST /ad-publishing/linkedin/{accountId}/form` (LinkedInCreateLeadFormBodyDTO)
// requires owner, creationLocale, name, state, content. `owner` resolves to
// `SponsoredAccountOwnerDTO` (1 required field) and `creationLocale` resolves to
// `CreationLocaleDTO` (2 required fields) — both shallow, modeled as proper z.object.
// `hiddenFields` resolves to an array of `HiddenFieldDTO` (2 required fields, shallow) —
// modeled as z.array(z.object()). `content` resolves to `LeadFormContentDTO`, which nests
// `questions[]` (`LeadFormQuestionDTO`), `description`/`headline` (`LocalizedStringDTO`),
// and `postSubmissionInfo`/`legalInfo` — a deep/dynamic multi-level chain, so it is
// modeled permissively as z.record() per the same precedent as `adCampaigns` above.

// Spec quirk: `GET /ad-publishing/linkedin/reporting/campaign-group/{campaignGroupId}`
// declares `campaignGroupId` as both a required path param AND a duplicate optional
// query param — verified directly, this is a spec inconsistency. We surface a single
// `campaignGroupId` tool argument and use it only for the path; the redundant query
// duplicate is omitted.

// Spec quirk: `GET /ad-publishing/linkedin/targeting/search` declares two overlapping
// optional string query params, `query` and `q` — verified directly, no distinguishing
// description differentiates their purpose beyond "Search query" vs "Query parameter".
// Both are surfaced as separate optional tool arguments since the spec offers no basis
// to collapse them.

const REPORTING_FIELDS = [
  "clicks",
  "oneClickLeads",
  "costInLocalCurrency",
  "impressions",
  "costInUsd",
  "ctr",
  "cpc",
  "cpm",
  "cpl",
  "externalWebsitePostClickConversions",
  "conversionRate",
] as const;

export const linkedinTools = [
  {
    name: "ghl_get_linkedin_ad_account",
    description: "Get a connected LinkedIn ad account. Required fields: adAccountId.",
    inputSchema: z.object({
      adAccountId: z.string().describe("The LinkedIn ad account ID"),
    }),
    handler: async (args: { adAccountId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", "/ad-publishing/linkedin/ad-account", {
          token: config.token,
          version: GHL_VERSION_LEGACY,
          params: { locationId: config.locationId, adAccountId: args.adAccountId },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_delete_linkedin_ad_account",
    description: "Delete a connected LinkedIn ad account. Required fields: adAccountId.",
    inputSchema: z.object({
      adAccountId: z.string().describe("The LinkedIn ad account ID to delete"),
    }),
    handler: async (args: { adAccountId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("DELETE", "/ad-publishing/linkedin/ad-account", {
          token: config.token,
          version: GHL_VERSION_LEGACY,
          params: { locationId: config.locationId, adAccountId: args.adAccountId },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_linkedin_ad_accounts",
    description: "List connected LinkedIn ad accounts for the location. Optional: isDraft.",
    inputSchema: z.object({
      isDraft: z.boolean().optional().describe("Whether to fetch draft versions"),
    }),
    handler: async (args: { isDraft?: boolean }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", "/ad-publishing/linkedin/ad-accounts", {
          token: config.token,
          version: GHL_VERSION_LEGACY,
          params: { locationId: config.locationId, isDraft: args.isDraft },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_create_linkedin_integration",
    description:
      "Create a LinkedIn ad account integration for the location. Required fields: adAccountId, adAccountName, currencyCode, organizationId.",
    inputSchema: z.object({
      adAccountId: z.string().describe("LinkedIn ad account ID"),
      adAccountName: z.string().describe("LinkedIn ad account name"),
      currencyCode: z.string().describe("Ad account currency code (e.g. USD)"),
      organizationId: z.string().describe("LinkedIn organization ID"),
    }),
    handler: async (
      args: { adAccountId: string; adAccountName: string; currencyCode: string; organizationId: string },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest("POST", "/ad-publishing/linkedin/integration", {
          token: config.token,
          version: GHL_VERSION_LEGACY,
          body: { ...args, locationId: config.locationId },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_linkedin_integration",
    description: "Get the LinkedIn ad account integration for the location. Optional: isDraft.",
    inputSchema: z.object({
      isDraft: z.boolean().optional().describe("Whether to fetch the draft version"),
    }),
    handler: async (args: { isDraft?: boolean }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", "/ad-publishing/linkedin/integration", {
          token: config.token,
          version: GHL_VERSION_LEGACY,
          params: { locationId: config.locationId, isDraft: args.isDraft },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_linkedin_me",
    description: "Get the authenticated LinkedIn member profile for the location's integration.",
    inputSchema: z.object({}),
    handler: async (_args: Record<string, never>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", "/ad-publishing/linkedin/me", {
          token: config.token,
          version: GHL_VERSION_LEGACY,
          params: { locationId: config.locationId },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_upsert_linkedin_campaign",
    description:
      "Create or update a LinkedIn ad campaign group. Pass adCampaignGroupId to update an existing campaign group, or omit it to create a new one. Optional: name, objectiveType (LEAD_GENERATION, WEBSITE_VISIT), adBudgetOptimization (MAXIMUM_DELIVERY, COST_CAP), budget, adCampaigns, linkedInAdAccountId, publishingStatus (DRAFT, SCHEDULED, PUBLISHED, PUBLISHING, FAILED, IN_REVIEW, PAUSED, ARCHIVED, WITH_ISSUES, REJECTED), meta.",
    inputSchema: z.object({
      adCampaignGroupId: z
        .string()
        .optional()
        .describe("LinkedIn campaign group resource ID — provide to update, omit to create"),
      name: z.string().optional().describe("Campaign group name"),
      objectiveType: z
        .enum(["LEAD_GENERATION", "WEBSITE_VISIT"])
        .optional()
        .describe("Campaign group objective"),
      adBudgetOptimization: z
        .enum(["MAXIMUM_DELIVERY", "COST_CAP"])
        .optional()
        .describe("Ad budget optimization mode"),
      budget: z
        .object({
          budgetType: z.enum(["DAILY", "LIFETIME"]).optional().describe("Budget type"),
          amount: z.number().optional().describe("Budget amount (currency minor units)"),
          scheduleStartDate: z.string().optional().describe("Schedule start date (ISO 8601)"),
          scheduleEndDate: z.string().optional().describe("Schedule end date (ISO 8601)"),
        })
        .optional()
        .describe("Campaign group budget"),
      adCampaigns: z
        .array(z.record(z.string(), z.unknown()))
        .optional()
        .describe("Child ad campaigns (permissive — see AdCampaignDTO for full shape)"),
      linkedInAdAccountId: z.string().optional().describe("LinkedIn ad account identifier"),
      publishingStatus: z
        .enum([
          "DRAFT",
          "SCHEDULED",
          "PUBLISHED",
          "PUBLISHING",
          "FAILED",
          "IN_REVIEW",
          "PAUSED",
          "ARCHIVED",
          "WITH_ISSUES",
          "REJECTED",
        ])
        .optional()
        .describe("Publishing status"),
      meta: z.record(z.string(), z.unknown()).optional().describe("Additional metadata"),
    }),
    handler: async (
      args: {
        adCampaignGroupId?: string;
        name?: string;
        objectiveType?: "LEAD_GENERATION" | "WEBSITE_VISIT";
        adBudgetOptimization?: "MAXIMUM_DELIVERY" | "COST_CAP";
        budget?: {
          budgetType?: "DAILY" | "LIFETIME";
          amount?: number;
          scheduleStartDate?: string;
          scheduleEndDate?: string;
        };
        adCampaigns?: Record<string, unknown>[];
        linkedInAdAccountId?: string;
        publishingStatus?:
          | "DRAFT"
          | "SCHEDULED"
          | "PUBLISHED"
          | "PUBLISHING"
          | "FAILED"
          | "IN_REVIEW"
          | "PAUSED"
          | "ARCHIVED"
          | "WITH_ISSUES"
          | "REJECTED";
        meta?: Record<string, unknown>;
      },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest("PUT", "/ad-publishing/linkedin/ads", {
          token: config.token,
          version: GHL_VERSION_LEGACY,
          body: { ...args, locationId: config.locationId },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_linkedin_campaign",
    description: "Get a single LinkedIn ad campaign group by ID. Required fields: adId. Optional: isDraft.",
    inputSchema: z.object({
      adId: z.string().describe("The LinkedIn ad (campaign group) ID"),
      isDraft: z.boolean().optional().describe("Whether to fetch the draft version"),
    }),
    handler: async (args: { adId: string; isDraft?: boolean }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", `/ad-publishing/linkedin/ads/${args.adId}`, {
          token: config.token,
          version: GHL_VERSION_LEGACY,
          params: { locationId: config.locationId, isDraft: args.isDraft },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_publish_linkedin_campaign",
    description: "Publish a LinkedIn ad campaign group to LinkedIn. Required fields: adId.",
    inputSchema: z.object({
      adId: z.string().describe("The LinkedIn ad (campaign group) ID to publish"),
    }),
    handler: async (args: { adId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "POST",
          `/ad-publishing/linkedin/ads/${args.adId}/publish`,
          {
            token: config.token,
            version: GHL_VERSION_LEGACY,
            body: { locationId: config.locationId },
          }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_update_linkedin_ad_status",
    description:
      "Update the status of a LinkedIn ad entity. Required fields: adId, operationType (PAUSED, ARCHIVED, RESUME), type (adGroup, adCampaign, ad). Optional: isDraft.",
    inputSchema: z.object({
      adId: z.string().describe("The LinkedIn ad entity ID"),
      operationType: z.enum(["PAUSED", "ARCHIVED", "RESUME"]).describe("Status operation to apply"),
      type: z.enum(["adGroup", "adCampaign", "ad"]).describe("Entity type the status update targets"),
      isDraft: z.boolean().optional().describe("Whether to target the draft version"),
    }),
    handler: async (
      args: { adId: string; operationType: "PAUSED" | "ARCHIVED" | "RESUME"; type: "adGroup" | "adCampaign" | "ad"; isDraft?: boolean },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest("PATCH", `/ad-publishing/linkedin/${args.adId}/status`, {
          token: config.token,
          version: GHL_VERSION_LEGACY,
          params: { locationId: config.locationId, isDraft: args.isDraft },
          body: { operationType: args.operationType, type: args.type },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_create_linkedin_lead_form",
    description:
      "Create a LinkedIn lead-gen form for an ad account. Required fields: accountId, owner, creationLocale, name, state (PUBLISHED), content. Optional: hiddenFields, isDraft.",
    inputSchema: z.object({
      accountId: z.string().describe("The LinkedIn ad account ID to create the form under"),
      owner: z
        .object({
          sponsoredAccount: z.string().describe("Sponsored account URN"),
        })
        .describe("Form owner"),
      creationLocale: z
        .object({
          country: z.string().describe("Country code"),
          language: z.string().describe("Language code"),
        })
        .describe("Creation locale"),
      name: z.string().describe("Form name"),
      state: z.enum(["PUBLISHED"]).describe("Form state"),
      content: z
        .record(z.string(), z.unknown())
        .describe("Form content (permissive — see LeadFormContentDTO for full shape)"),
      hiddenFields: z
        .array(
          z.object({
            name: z.string().describe("Field name"),
            value: z.string().describe("Field value"),
          })
        )
        .optional()
        .describe("Hidden fields"),
      isDraft: z.boolean().optional().describe("Whether to create as a draft"),
    }),
    handler: async (
      args: {
        accountId: string;
        owner: { sponsoredAccount: string };
        creationLocale: { country: string; language: string };
        name: string;
        state: "PUBLISHED";
        content: Record<string, unknown>;
        hiddenFields?: { name: string; value: string }[];
        isDraft?: boolean;
      },
      config: GHLConfig
    ) => {
      try {
        const { accountId, isDraft, ...body } = args;
        const result = await ghlRequest("POST", `/ad-publishing/linkedin/${accountId}/form`, {
          token: config.token,
          version: GHL_VERSION_LEGACY,
          params: { locationId: config.locationId, isDraft },
          body,
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_linkedin_lead_forms",
    description:
      "List LinkedIn lead-gen forms for an ad account. Required fields: accountId. Optional: isDraft.",
    inputSchema: z.object({
      accountId: z.string().describe("The LinkedIn ad account ID"),
      isDraft: z.boolean().optional().describe("Whether to fetch draft versions"),
    }),
    handler: async (args: { accountId: string; isDraft?: boolean }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", `/ad-publishing/linkedin/${args.accountId}/forms`, {
          token: config.token,
          version: GHL_VERSION_LEGACY,
          params: { locationId: config.locationId, isDraft: args.isDraft },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_linkedin_reporting",
    description:
      "Get LinkedIn ad reporting analytics. Required fields: startDate, endDate. Optional: pivot (ACCOUNT, CAMPAIGN, CAMPAIGN_GROUP, CREATIVE), groupBy (day, month, year), entityUrns, fields.",
    inputSchema: z.object({
      startDate: z.string().describe("Start date in yyyy-mm-dd format"),
      endDate: z.string().describe("End date in yyyy-mm-dd format"),
      pivot: z
        .enum(["ACCOUNT", "CAMPAIGN", "CAMPAIGN_GROUP", "CREATIVE"])
        .optional()
        .describe("Analytics pivot type"),
      groupBy: z.enum(["day", "month", "year"]).optional().describe("Time granularity for analytics"),
      entityUrns: z.string().optional().describe("Comma-separated list of entity URNs"),
      fields: z.array(z.enum(REPORTING_FIELDS)).optional().describe("Reporting fields to include"),
    }),
    handler: async (
      args: {
        startDate: string;
        endDate: string;
        pivot?: "ACCOUNT" | "CAMPAIGN" | "CAMPAIGN_GROUP" | "CREATIVE";
        groupBy?: "day" | "month" | "year";
        entityUrns?: string;
        fields?: (typeof REPORTING_FIELDS)[number][];
      },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest("GET", "/ad-publishing/linkedin/reporting", {
          token: config.token,
          version: GHL_VERSION_LEGACY,
          params: {
            locationId: config.locationId,
            startDate: args.startDate,
            endDate: args.endDate,
            pivot: args.pivot,
            groupBy: args.groupBy,
            entityUrns: args.entityUrns,
            fields: args.fields?.join(","),
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_linkedin_campaign_group_reporting",
    description:
      "Get LinkedIn ad reporting analytics for a specific campaign group. Required fields: campaignGroupId, startDate, endDate. Optional: fields.",
    inputSchema: z.object({
      campaignGroupId: z.string().describe("The LinkedIn campaign group ID"),
      startDate: z.string().describe("Start date in yyyy-mm-dd format"),
      endDate: z.string().describe("End date in yyyy-mm-dd format"),
      fields: z.array(z.enum(REPORTING_FIELDS)).optional().describe("Reporting fields to include"),
    }),
    handler: async (
      args: {
        campaignGroupId: string;
        startDate: string;
        endDate: string;
        fields?: (typeof REPORTING_FIELDS)[number][];
      },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest(
          "GET",
          `/ad-publishing/linkedin/reporting/campaign-group/${args.campaignGroupId}`,
          {
            token: config.token,
            version: GHL_VERSION_LEGACY,
            params: {
              locationId: config.locationId,
              startDate: args.startDate,
              endDate: args.endDate,
              fields: args.fields?.join(","),
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
    name: "ghl_get_linkedin_reporting_list",
    description:
      "Get a LinkedIn reporting list for a campaign within a campaign group. Required fields: listType, campaignId, campaignGroupId, startDate, endDate. Optional: fields.",
    inputSchema: z.object({
      listType: z.string().describe("List type (e.g. campaigns)"),
      campaignId: z.string().describe("The LinkedIn campaign ID"),
      campaignGroupId: z.string().describe("The LinkedIn campaign group ID"),
      startDate: z.string().describe("Start date in yyyy-mm-dd format"),
      endDate: z.string().describe("End date in yyyy-mm-dd format"),
      fields: z.array(z.enum(REPORTING_FIELDS)).optional().describe("Reporting fields to include"),
    }),
    handler: async (
      args: {
        listType: string;
        campaignId: string;
        campaignGroupId: string;
        startDate: string;
        endDate: string;
        fields?: (typeof REPORTING_FIELDS)[number][];
      },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest("GET", "/ad-publishing/linkedin/reporting/list", {
          token: config.token,
          version: GHL_VERSION_LEGACY,
          params: {
            locationId: config.locationId,
            listType: args.listType,
            campaignId: args.campaignId,
            campaignGroupId: args.campaignGroupId,
            startDate: args.startDate,
            endDate: args.endDate,
            fields: args.fields?.join(","),
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_search_linkedin_targeting",
    description:
      "Search LinkedIn targeting facets (e.g. locations, industries, job titles). Required fields: facet. Optional: query, q.",
    inputSchema: z.object({
      facet: z.string().describe("Targeting facet to search (e.g. locations)"),
      query: z.string().optional().describe("Search query"),
      q: z.string().optional().describe("Query parameter"),
    }),
    handler: async (args: { facet: string; query?: string; q?: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", "/ad-publishing/linkedin/targeting/search", {
          token: config.token,
          version: GHL_VERSION_LEGACY,
          params: {
            locationId: config.locationId,
            facet: args.facet,
            query: args.query,
            q: args.q,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
];
