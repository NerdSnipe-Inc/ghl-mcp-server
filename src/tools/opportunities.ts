import { z } from "zod";
import { ghlRequest, formatError, GHLConfig } from "../client.js";

export const opportunityTools = [
  {
    name: "ghl_get_pipelines",
    description: "Get all pipelines and their stages in the GHL location.",
    inputSchema: z.object({}),
    handler: async (_args: Record<string, never>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", "/opportunities/pipelines", {
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
          params: {
            location_id: config.locationId,
            q: args.query as string | undefined,
            contact_id: args.contactId as string | undefined,
            pipeline_id: args.pipelineId as string | undefined,
            pipeline_stage_id: args.pipelineStageId as string | undefined,
            assigned_to: args.assignedTo as string | undefined,
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
        .array(z.object({ id: z.string(), value: z.string() }))
        .optional(),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("POST", "/opportunities/", {
          token: config.token,
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
        .array(z.object({ id: z.string(), value: z.string() }))
        .optional(),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      const { opportunityId, ...updateData } = args as {
        opportunityId: string;
      } & Record<string, unknown>;
      try {
        const result = await ghlRequest("PUT", `/opportunities/${opportunityId}`, {
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
    name: "ghl_update_opportunity_status",
    description: "Quickly update only the status of an opportunity (open/won/lost/abandoned).",
    inputSchema: z.object({
      opportunityId: z.string(),
      status: z.enum(["open", "won", "lost", "abandoned"]),
    }),
    handler: async (
      args: { opportunityId: string; status: string },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest(
          "PUT",
          `/opportunities/${args.opportunityId}/status`,
          {
            token: config.token,
            body: { status: args.status },
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
    description: "Create or update an opportunity matched by contact and pipeline.",
    inputSchema: z.object({
      pipelineId: z.string(),
      pipelineStageId: z.string(),
      contactId: z.string(),
      name: z.string(),
      status: z.enum(["open", "won", "lost", "abandoned"]).optional().default("open"),
      monetaryValue: z.number().optional(),
      assignedTo: z.string().optional(),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("POST", "/opportunities/upsert", {
          token: config.token,
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
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
];
