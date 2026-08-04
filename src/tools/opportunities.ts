import { z } from "zod";
import { ghlRequest, formatError, GHLConfig, GHL_VERSION_V3 } from "../client.js";

// Spec: CreateDtoV3/UpdateOpportunityDtoV3 customFields items are one of several
// typed field variants (customFieldsInputStringSchemaV3, ...ArraySchemaV3,
// ...ObjectSchemaV3) that all share {id?, key?, fieldValue}. `fieldValue` is the
// spec's field name — NOT `value`.
const customFieldSchema = z.object({
  id: z.string().optional().describe("Custom field ID (pass id or key)"),
  key: z.string().optional().describe("Custom field key (pass id or key)"),
  fieldValue: z
    .union([z.string(), z.number(), z.array(z.string()), z.record(z.unknown())])
    .optional()
    .describe("Value for the custom field"),
});

export const opportunityTools = [
  {
    name: "ghl_get_pipelines",
    description: "Get all pipelines and their stages in the GHL location.",
    inputSchema: z.object({}),
    handler: async (_args: Record<string, never>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", "/opportunities/pipelines", {
          token: config.token,
          version: GHL_VERSION_V3,
          params: { locationId: config.locationId },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_search_opportunities",
    description:
      "Search opportunities in the pipeline. Filter by contact, stage, pipeline, status, or assigned user.",
    inputSchema: z.object({
      query: z.string().optional().describe("Search query"),
      contactId: z.string().optional().describe("Filter by contact ID"),
      pipelineId: z.string().optional().describe("Filter by pipeline ID"),
      pipelineStageId: z.string().optional().describe("Filter by stage ID"),
      assignedTo: z.string().optional().describe("Filter by assigned user ID"),
      status: z
        .enum(["open", "won", "lost", "abandoned", "all"])
        .optional()
        .default("all"),
      limit: z.number().optional().default(20),
      page: z.number().optional().default(1),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", "/opportunities/search", {
          token: config.token,
          version: GHL_VERSION_V3,
          params: {
            locationId: config.locationId,
            q: args.query as string | undefined,
            contactId: args.contactId as string | undefined,
            pipelineId: args.pipelineId as string | undefined,
            pipelineStageId: args.pipelineStageId as string | undefined,
            assignedTo: args.assignedTo as string | undefined,
            status: args.status as string | undefined,
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
  {
    name: "ghl_get_opportunity",
    description: "Get a specific opportunity by ID.",
    inputSchema: z.object({
      opportunityId: z.string(),
    }),
    handler: async (args: { opportunityId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", `/opportunities/${args.opportunityId}`, {
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
    name: "ghl_create_opportunity",
    description: "Create a new opportunity/deal in a pipeline.",
    inputSchema: z.object({
      pipelineId: z.string().describe("Pipeline to place the opportunity in"),
      pipelineStageId: z.string().describe("Initial stage ID"),
      contactId: z.string().describe("Contact this opportunity belongs to"),
      name: z.string().describe("Opportunity name/title"),
      status: z
        .enum(["open", "won", "lost", "abandoned"])
        .optional()
        .default("open"),
      monetaryValue: z.number().optional().describe("Deal value in dollars"),
      assignedTo: z.string().optional().describe("User ID to assign to"),
      source: z.string().optional(),
      customFields: z
        .array(customFieldSchema)
        .optional()
        .describe("Custom field values [{id, fieldValue}]"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("POST", "/opportunities/", {
          token: config.token,
          version: GHL_VERSION_V3,
          body: { ...args, locationId: config.locationId },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_update_opportunity",
    description: "Update an opportunity — move to a new stage, update value, reassign, etc.",
    inputSchema: z.object({
      opportunityId: z.string(),
      pipelineId: z.string().optional(),
      pipelineStageId: z.string().optional().describe("Move to this stage"),
      name: z.string().optional(),
      status: z.enum(["open", "won", "lost", "abandoned"]).optional(),
      monetaryValue: z.number().optional(),
      assignedTo: z.string().optional(),
      source: z.string().optional(),
      customFields: z
        .array(customFieldSchema)
        .optional()
        .describe("Custom field values [{id, fieldValue}]"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      const { opportunityId, ...updateData } = args as {
        opportunityId: string;
      } & Record<string, unknown>;
      try {
        const result = await ghlRequest("PUT", `/opportunities/${opportunityId}`, {
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
    name: "ghl_update_opportunity_status",
    description: "Quickly update only the status of an opportunity (open/won/lost/abandoned).",
    inputSchema: z.object({
      opportunityId: z.string(),
      status: z.enum(["open", "won", "lost", "abandoned"]),
      lostReasonId: z.string().optional().describe("Lost reason ID (relevant when status is 'lost')"),
    }),
    handler: async (
      args: { opportunityId: string; status: string; lostReasonId?: string },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest(
          "PUT",
          `/opportunities/${args.opportunityId}/status`,
          {
            token: config.token,
            version: GHL_VERSION_V3,
            body: { status: args.status, lostReasonId: args.lostReasonId },
          }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_upsert_opportunity",
    description:
      "Create or update an opportunity. Pass the opportunity `id` to target an existing " +
      "opportunity for update; if omitted, a new opportunity is created. " +
      "Note: the real UpsertOpportunityDto has no `contactId` field — despite " +
      "GHL's public docs describing contactId-based upsert matching, the spec's " +
      "actual matching key is the opportunity `id`. `followers` (array of user IDs) " +
      "is required; its spec description confusingly says \"contactId\" but its " +
      "type/name make clear it is the followers list, not the linked contact.",
    inputSchema: z.object({
      id: z.string().optional().describe("Opportunity ID — pass to update an existing opportunity"),
      pipelineId: z.string(),
      pipelineStageId: z.string().optional(),
      name: z.string(),
      status: z.enum(["open", "won", "lost", "abandoned"]).optional().default("open"),
      monetaryValue: z.number().optional(),
      assignedTo: z.string().optional(),
      followers: z
        .array(z.string())
        .describe(
          "Array of user IDs following this opportunity (required by spec; despite its " +
            "spec description saying \"contactId\", this is not the linked contact)"
        ),
      isRemoveAllFollowers: z.boolean().describe("Whether to remove all existing followers"),
      followersActionType: z
        .enum(["add", "remove"])
        .describe("Whether to add or remove the given followers"),
      forecastExpectedCloseDate: z.string().optional().describe("Expected close date"),
      forecastProbability: z.number().optional(),
      lostReasonId: z.string().optional(),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("POST", "/opportunities/upsert", {
          token: config.token,
          version: GHL_VERSION_V3,
          body: { ...args, locationId: config.locationId },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_delete_opportunity",
    description: "Delete an opportunity permanently.",
    inputSchema: z.object({
      opportunityId: z.string(),
    }),
    handler: async (args: { opportunityId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("DELETE", `/opportunities/${args.opportunityId}`, {
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
