import { z } from "zod";
import { ghlRequest, formatError, GHLConfig, GHL_VERSION_V3 } from "../client.js";

// Agent status enum shared by create/metadata-update operations.
const AGENT_STATUS_ENUM = ["active", "inactive", "archived"] as const;

// version.nodes / version.edges / *Variables arrays are complex, deeply-nested
// workflow-graph structures (node configs, LLM prompts, branching edges, etc.).
// Modeled permissively as z.record(z.unknown()) items rather than fully typed,
// matching Phase 2a/2b precedent for deeply nested bodies.
const workflowGraphField = z
  .array(z.record(z.string(), z.unknown()))
  .optional();

export const agentStudioTools = [
  {
    name: "ghl_create_agent_studio_agent",
    description:
      "Create a new Agent Studio agent with an initial staging version. Requires status and " +
      "version (an object describing the initial workflow — versionName, nodes, edges, " +
      "variables, etc.); locationId is taken from the connected sub-account.",
    inputSchema: z.object({
      name: z.string().optional().describe("Name of the agent"),
      description: z.string().optional().describe("Description of the agent"),
      agencyId: z.string().optional().describe("Agency ID"),
      authorId: z.string().optional().describe("Author ID"),
      authorName: z.string().optional().describe("Author name"),
      authorEmail: z.string().optional().describe("Author email"),
      status: z.enum(AGENT_STATUS_ENUM).describe("Status of the agent"),
      version: z
        .record(z.string(), z.unknown())
        .describe(
          "Version data for the agent's initial workflow, including nodes, edges, and " +
            "configuration (e.g. { versionName, description, nodes, edges, uiNodes, uiEdges, " +
            "globalVariables, inputVariables, runtimeVariables, scopes }). Shape is permissive."
        ),
    }),
    handler: async (
      args: {
        name?: string;
        description?: string;
        agencyId?: string;
        authorId?: string;
        authorName?: string;
        authorEmail?: string;
        status: string;
        version: Record<string, unknown>;
      },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest("POST", "/agent-studio/agent", {
          token: config.token,
          version: GHL_VERSION_V3,
          body: {
            locationId: config.locationId,
            name: args.name,
            description: args.description,
            agencyId: args.agencyId,
            authorId: args.authorId,
            authorName: args.authorName,
            authorEmail: args.authorEmail,
            status: args.status,
            version: args.version,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_list_agent_studio_agents",
    description:
      "List Agent Studio agents for the connected sub-account, with pagination. Optionally " +
      "filter to only agents with a published production version via isPublished.",
    inputSchema: z.object({
      limit: z.number().describe("Pagination limit"),
      offset: z.number().describe("Pagination offset"),
      isPublished: z
        .boolean()
        .optional()
        .describe("If true, return only agents with a published production version"),
    }),
    handler: async (
      args: { limit: number; offset: number; isPublished?: boolean },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest("GET", "/agent-studio/agent", {
          token: config.token,
          version: GHL_VERSION_V3,
          params: {
            locationId: config.locationId,
            limit: args.limit,
            offset: args.offset,
            isPublished: args.isPublished,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_agent_studio_agent",
    description:
      "Get a single Agent Studio agent by ID, including all its non-deleted versions " +
      "(draft, staging, production). Agent must have active status.",
    inputSchema: z.object({
      agentId: z.string().describe("The agent ID"),
    }),
    handler: async (args: { agentId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "GET",
          `/agent-studio/agent/${args.agentId}`,
          {
            token: config.token,
            version: GHL_VERSION_V3,
            params: { locationId: config.locationId },
          }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_update_agent_studio_agent_metadata",
    description:
      "Update an Agent Studio agent's top-level METADATA — name, description, and/or status. " +
      "Does NOT touch the agent's workflow definition (nodes/edges/variables); to update the " +
      "workflow itself, use ghl_update_agent_studio_agent_version instead.",
    inputSchema: z.object({
      agentId: z.string().describe("The agent ID"),
      name: z.string().optional().describe("Name of the agent"),
      description: z.string().optional().describe("Description of the agent"),
      status: z.enum(AGENT_STATUS_ENUM).optional().describe("Status of the agent"),
    }),
    handler: async (
      args: { agentId: string; name?: string; description?: string; status?: string },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest(
          "PATCH",
          `/agent-studio/agent/${args.agentId}`,
          {
            token: config.token,
            version: GHL_VERSION_V3,
            body: {
              locationId: config.locationId,
              name: args.name,
              description: args.description,
              status: args.status,
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
    name: "ghl_delete_agent_studio_agent",
    description: "Delete an Agent Studio agent and all of its versions.",
    inputSchema: z.object({
      agentId: z.string().describe("The agent ID"),
    }),
    handler: async (args: { agentId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "DELETE",
          `/agent-studio/agent/${args.agentId}`,
          {
            token: config.token,
            version: GHL_VERSION_V3,
            params: { locationId: config.locationId },
          }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_update_agent_studio_agent_version",
    description:
      "Update an Agent Studio agent VERSION's workflow definition — nodes, edges, global/" +
      "input/runtime variables, and global config. This is the WORKFLOW-GRAPH update, distinct " +
      "from ghl_update_agent_studio_agent_metadata (which only updates name/description/status " +
      "and does not touch the workflow). Provide the complete nodes/edges arrays including " +
      "unchanged items — this is a full replace of those fields, not a merge.",
    inputSchema: z.object({
      versionId: z.string().describe("The agent version ID"),
      versionName: z.string().optional().describe("Version name"),
      description: z.string().optional().describe("Description of the version"),
      nodes: workflowGraphField.describe(
        "Complete array of workflow nodes (start/LLM/etc.). Provide all nodes including " +
          "unchanged ones. Complex nested structure — modeled permissively."
      ),
      edges: workflowGraphField.describe(
        "Complete array of edges connecting the nodes. Provide all edges including unchanged " +
          "ones. Complex nested structure — modeled permissively."
      ),
      globalVariables: workflowGraphField.describe(
        "Global variables accessible throughout the agent workflow."
      ),
      inputVariables: workflowGraphField.describe(
        "Input variables required from the user at execution time."
      ),
      runtimeVariables: workflowGraphField.describe(
        "Runtime variables generated during agent execution."
      ),
      globalConfig: z
        .record(z.string(), z.unknown())
        .optional()
        .describe("Global configuration including prompts and settings."),
      userId: z.string().optional().describe("User ID performing the update"),
      userName: z.string().optional().describe("User name performing the update"),
    }),
    handler: async (
      args: {
        versionId: string;
        versionName?: string;
        description?: string;
        nodes?: Record<string, unknown>[];
        edges?: Record<string, unknown>[];
        globalVariables?: Record<string, unknown>[];
        inputVariables?: Record<string, unknown>[];
        runtimeVariables?: Record<string, unknown>[];
        globalConfig?: Record<string, unknown>;
        userId?: string;
        userName?: string;
      },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest(
          "PATCH",
          `/agent-studio/agent/versions/${args.versionId}`,
          {
            token: config.token,
            version: GHL_VERSION_V3,
            body: {
              locationId: config.locationId,
              versionName: args.versionName,
              description: args.description,
              nodes: args.nodes,
              edges: args.edges,
              globalVariables: args.globalVariables,
              inputVariables: args.inputVariables,
              runtimeVariables: args.runtimeVariables,
              globalConfig: args.globalConfig,
              userId: args.userId,
              userName: args.userName,
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
    name: "ghl_publish_agent_studio_agent",
    description:
      "Promote an Agent Studio draft version to production, publishing it. A new draft " +
      "version is created afterward for future edits.",
    inputSchema: z.object({
      versionId: z.string().describe("The draft version ID to promote"),
      userId: z.string().optional().describe("User ID performing the promotion"),
      userName: z.string().optional().describe("User name performing the promotion"),
      userEmail: z.string().optional().describe("User email performing the promotion"),
    }),
    handler: async (
      args: { versionId: string; userId?: string; userName?: string; userEmail?: string },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest(
          "POST",
          `/agent-studio/agent/versions/${args.versionId}/publish`,
          {
            token: config.token,
            version: GHL_VERSION_V3,
            body: {
              locationId: config.locationId,
              userId: args.userId,
              userName: args.userName,
              userEmail: args.userEmail,
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
    name: "ghl_execute_agent_studio_agent",
    description:
      "Execute an Agent Studio agent and get a non-streaming JSON response. For the first " +
      "message in a new session, omit executionId; the response returns one to use for " +
      "subsequent messages in the same session, preserving conversation context.",
    inputSchema: z.object({
      agentId: z.string().describe("The agent ID to execute"),
      message: z.string().describe("Message to send to the agent"),
      executionId: z
        .string()
        .optional()
        .describe(
          "Session identifier from a previous response. Omit for the first message in a new " +
            "session; include it on follow-ups to maintain conversation context."
        ),
      inputVariables: z
        .record(z.string(), z.unknown())
        .optional()
        .describe("Input variables to pass to the agent, matching its configured input variables."),
      versionId: z
        .string()
        .optional()
        .describe(
          "Published version ID to execute. Defaults to the latest published production version."
        ),
      attachments: z
        .array(
          z.object({
            type: z.string().describe("Type of attachment"),
            imageUrl: z.string().describe("URL of the image attachment"),
          })
        )
        .optional()
        .describe("Attachments for the message"),
      contactId: z
        .string()
        .optional()
        .describe("Contact ID to associate with this execution; hydrates contact data for the agent."),
    }),
    handler: async (
      args: {
        agentId: string;
        message: string;
        executionId?: string;
        inputVariables?: Record<string, unknown>;
        versionId?: string;
        attachments?: { type: string; imageUrl: string }[];
        contactId?: string;
      },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest(
          "POST",
          `/agent-studio/agent/${args.agentId}/execute`,
          {
            token: config.token,
            version: GHL_VERSION_V3,
            body: {
              message: args.message,
              executionId: args.executionId,
              inputVariables: args.inputVariables,
              versionId: args.versionId,
              attachments: args.attachments,
              locationId: config.locationId,
              contactId: args.contactId,
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
