import { z } from "zod";
import { ghlRequest, formatError, GHLConfig, GHL_VERSION_V3 } from "../client.js";

export const workflowTools = [
  {
    name: "ghl_get_workflows",
    description:
      "List all workflows/automations in the GHL location. Use this to discover workflow IDs before enrolling contacts.",
    inputSchema: z.object({}),
    handler: async (_args: Record<string, never>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", "/workflows/", {
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
    name: "ghl_get_campaigns",
    description: "List all campaigns in the GHL location.",
    inputSchema: z.object({
      status: z.string().optional().describe("Filter by status (active, paused, etc.)"),
    }),
    handler: async (args: { status?: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", "/campaigns/", {
          token: config.token,
          version: GHL_VERSION_V3,
          params: { locationId: config.locationId, status: args.status },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_workflow_definition",
    description:
      "Get the full definition (steps and configuration) of a workflow, including its current version number.",
    inputSchema: z.object({
      workflowId: z.string().describe("Workflow ID"),
    }),
    handler: async (args: { workflowId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", `/workflows/${args.workflowId}/definition`, {
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
    name: "ghl_update_workflow_definition",
    description:
      "Replace a workflow's definition (steps and configuration). This replaces the entire workflow definition — any step not included in this request will be deleted. Fetch the current definition with ghl_get_workflow_definition first and send the complete updated version.",
    inputSchema: z
      .object({
        workflowId: z.string().describe("Workflow ID"),
        version: z.number().describe("Current definition version, from ghl_get_workflow_definition"),
      })
      .passthrough(),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      const { workflowId, ...body } = args as { workflowId: string } & Record<string, unknown>;
      try {
        const result = await ghlRequest("PUT", `/workflows/${workflowId}/definition`, {
          token: config.token,
          version: GHL_VERSION_V3,
          params: { locationId: config.locationId },
          body,
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_update_workflow_status",
    description: "Publish or unpublish a workflow by setting its status to published or draft.",
    inputSchema: z.object({
      workflowId: z.string().describe("Workflow ID"),
      status: z.enum(["published", "draft"]).describe("New workflow status"),
    }),
    handler: async (args: { workflowId: string; status: "published" | "draft" }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("PUT", `/workflows/${args.workflowId}/status`, {
          token: config.token,
          version: GHL_VERSION_V3,
          params: { locationId: config.locationId },
          body: { status: args.status },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_delete_workflow",
    description: "Permanently delete a workflow in the GHL location.",
    inputSchema: z.object({
      workflowId: z.string().describe("Workflow ID"),
    }),
    handler: async (args: { workflowId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("DELETE", `/workflows/${args.workflowId}`, {
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
    name: "ghl_search_workflows",
    description:
      "Search workflows in the GHL location with filters, sorting and pagination. The filters, sort, offset and searchAfter fields are passed to the API as-is.",
    inputSchema: z
      .object({
        filters: z.array(z.record(z.unknown())).optional().describe("Search filter objects"),
        sort: z.array(z.record(z.unknown())).optional().describe("Sort criteria objects"),
        offset: z.number().optional().describe("Number of results to skip"),
        searchAfter: z.array(z.unknown()).optional().describe("Sort values from the last result of the previous page"),
      })
      .passthrough(),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("POST", "/workflows/search", {
          token: config.token,
          version: GHL_VERSION_V3,
          params: { locationId: config.locationId },
          body: args,
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_workflow_step_types",
    description:
      "List the workflow step types (actions, triggers, conditions) available to build workflow definitions. Use the filters to narrow the list.",
    inputSchema: z.object({
      types: z.string().optional().describe("Filter by step type"),
      kind: z.string().optional().describe("Filter by step kind"),
      query: z.string().optional().describe("Free-text search across step types"),
      limit: z.number().optional().describe("Maximum number of results to return"),
      skip: z.number().optional().describe("Number of results to skip"),
    }),
    handler: async (
      args: { types?: string; kind?: string; query?: string; limit?: number; skip?: number },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest("GET", "/workflows/step-types", {
          token: config.token,
          version: GHL_VERSION_V3,
          params: {
            locationId: config.locationId,
            types: args.types,
            kind: args.kind,
            query: args.query,
            limit: args.limit,
            skip: args.skip,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_validate_workflow_definition",
    description:
      "Validate a workflow definition without saving it. Returns any errors found in the steps. The request body is passed to the API as-is; include workflowId to validate against an existing workflow.",
    inputSchema: z
      .object({
        workflowId: z.string().optional().describe("Existing workflow ID, if validating an update"),
      })
      .passthrough(),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("POST", "/workflows/definition/validate", {
          token: config.token,
          version: GHL_VERSION_V3,
          params: { locationId: config.locationId },
          body: args,
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_workflow_logs",
    description: "Get execution logs for a workflow, paginated.",
    inputSchema: z.object({
      workflowId: z.string().describe("Workflow ID"),
      limit: z.number().optional().describe("Maximum number of log entries to return"),
      skip: z.number().optional().describe("Number of log entries to skip"),
    }),
    handler: async (args: { workflowId: string; limit?: number; skip?: number }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", `/workflows/${args.workflowId}/logs`, {
          token: config.token,
          version: GHL_VERSION_V3,
          params: { locationId: config.locationId, limit: args.limit, skip: args.skip },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_workflow_log_statistics",
    description:
      "Get aggregated execution statistics for a workflow, grouped by a time bucket and optionally limited to a date range.",
    inputSchema: z.object({
      workflowId: z.string().describe("Workflow ID"),
      groupBy: z.string().optional().describe("Aggregation grouping (e.g. day, week)"),
      startDate: z.string().optional().describe("Start of the date range (ISO date)"),
      endDate: z.string().optional().describe("End of the date range (ISO date)"),
    }),
    handler: async (
      args: { workflowId: string; groupBy?: string; startDate?: string; endDate?: string },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest("GET", `/workflows/${args.workflowId}/logs/aggregate`, {
          token: config.token,
          version: GHL_VERSION_V3,
          params: {
            locationId: config.locationId,
            groupBy: args.groupBy,
            startDate: args.startDate,
            endDate: args.endDate,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
];
