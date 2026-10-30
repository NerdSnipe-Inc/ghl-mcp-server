import { z } from "zod";
import { ghlRequest, formatError, GHLConfig, GHL_VERSION_V3 } from "../client.js";

// GHL Projects does not use locationId: it is derived from the auth token,
// so no tool in this file sends it.

const TASK_CREATE_FIELDS = {
  body: z.string().optional().describe("Task description/body"),
  startDate: z.string().optional().describe("Task start date (ISO 8601)"),
  status: z.string().optional().describe("Task status"),
  priority: z.number().min(1).max(4).optional().describe("Task priority (1-4)"),
  parentTaskId: z.string().optional().describe("Parent task ID, if this is a subtask"),
  assignees: z
    .array(z.string())
    .max(1)
    .optional()
    .describe("User IDs assigned to the task (API limit: max 1 assignee)"),
  contactId: z.string().optional().describe("Contact ID to associate with the task"),
  businessId: z.string().optional().describe("Business ID to associate with the task"),
  customFields: z.record(z.unknown()).optional().describe("Custom field values keyed by field ID"),
};

export const projectTaskTools = [
  {
    name: "ghl_get_tasks",
    description: "List the tasks in a Project list (paginated).",
    inputSchema: z.object({
      listId: z.string().describe("List ID"),
      limit: z.number().min(1).max(100).optional().describe("Maximum tasks to return (1-100)"),
      searchAfter: z.string().optional().describe("Opaque pagination cursor from a previous response"),
    }),
    handler: async (
      args: { listId: string; limit?: number; searchAfter?: string },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest("GET", `/projects/lists/${args.listId}/tasks`, {
          token: config.token,
          version: GHL_VERSION_V3,
          params: { limit: args.limit, searchAfter: args.searchAfter },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_create_task",
    description: "Create a new task in a Project list.",
    inputSchema: z.object({
      listId: z.string().describe("List ID to create the task in"),
      title: z.string().describe("Task title"),
      dueDate: z.string().describe("Task due date (ISO 8601)"),
      ...TASK_CREATE_FIELDS,
    }),
    handler: async (
      args: {
        listId: string;
        title: string;
        dueDate: string;
        body?: string;
        startDate?: string;
        status?: string;
        priority?: number;
        parentTaskId?: string;
        assignees?: string[];
        contactId?: string;
        businessId?: string;
        customFields?: Record<string, unknown>;
      },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest("POST", `/projects/lists/${args.listId}/tasks`, {
          token: config.token,
          version: GHL_VERSION_V3,
          body: {
            title: args.title,
            dueDate: args.dueDate,
            body: args.body,
            startDate: args.startDate,
            status: args.status,
            priority: args.priority,
            parentTaskId: args.parentTaskId,
            assignees: args.assignees,
            contactId: args.contactId,
            businessId: args.businessId,
            customFields: args.customFields,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_task",
    description: "Get a single Project task by ID.",
    inputSchema: z.object({
      taskId: z.string().describe("Task ID"),
    }),
    handler: async (args: { taskId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", `/projects/tasks/${args.taskId}`, {
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
    name: "ghl_update_task",
    description: "Update a Project task. Only the fields provided are changed.",
    inputSchema: z.object({
      taskId: z.string().describe("Task ID"),
      title: z.string().optional().describe("Task title"),
      dueDate: z.string().optional().describe("Task due date (ISO 8601)"),
      ...TASK_CREATE_FIELDS,
    }),
    handler: async (
      args: {
        taskId: string;
        title?: string;
        dueDate?: string;
        body?: string;
        startDate?: string;
        status?: string;
        priority?: number;
        parentTaskId?: string;
        assignees?: string[];
        contactId?: string;
        businessId?: string;
        customFields?: Record<string, unknown>;
      },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest("PATCH", `/projects/tasks/${args.taskId}`, {
          token: config.token,
          version: GHL_VERSION_V3,
          body: {
            title: args.title,
            dueDate: args.dueDate,
            body: args.body,
            startDate: args.startDate,
            status: args.status,
            priority: args.priority,
            parentTaskId: args.parentTaskId,
            assignees: args.assignees,
            contactId: args.contactId,
            businessId: args.businessId,
            customFields: args.customFields,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_delete_task",
    description: "Permanently delete a Project task.",
    inputSchema: z.object({
      taskId: z.string().describe("Task ID"),
    }),
    handler: async (args: { taskId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("DELETE", `/projects/tasks/${args.taskId}`, {
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
    name: "ghl_search_tasks",
    description: "Search Project tasks across lists with filters, sorting and a free-text query.",
    inputSchema: z.object({
      limit: z.number().min(1).max(100).describe("Maximum tasks to return (1-100)"),
      query: z.string().max(75).optional().describe("Free-text search query (max 75 characters)"),
      filters: z.array(z.unknown()).optional().describe("Filter group(s) to apply (nested shape per GHL API)"),
      listIds: z.array(z.string()).max(10).optional().describe("Restrict search to these list IDs (max 10)"),
      sort: z.array(z.unknown()).optional().describe("Sort directive(s) to apply (nested shape per GHL API)"),
      subtaskViewMode: z
        .enum(["collapsed", "expanded", "separate"])
        .optional()
        .describe("How subtasks are represented in results"),
    }),
    handler: async (
      args: {
        limit: number;
        query?: string;
        filters?: unknown[];
        listIds?: string[];
        sort?: unknown[];
        subtaskViewMode?: "collapsed" | "expanded" | "separate";
      },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest("POST", `/projects/tasks/search`, {
          token: config.token,
          version: GHL_VERSION_V3,
          body: {
            limit: args.limit,
            query: args.query,
            filters: args.filters,
            listIds: args.listIds,
            sort: args.sort,
            subtaskViewMode: args.subtaskViewMode,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_tasks_by_ids",
    description: "Fetch multiple Project tasks in a single call by their IDs.",
    inputSchema: z.object({
      ids: z.array(z.string()).min(1).max(100).describe("Task IDs to fetch (1-100 items)"),
    }),
    handler: async (args: { ids: string[] }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("POST", `/projects/tasks/batch`, {
          token: config.token,
          version: GHL_VERSION_V3,
          body: { ids: args.ids },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_task_lists",
    description: "List the Project lists a task currently belongs to.",
    inputSchema: z.object({
      taskId: z.string().describe("Task ID"),
    }),
    handler: async (args: { taskId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", `/projects/tasks/${args.taskId}/lists`, {
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
    name: "ghl_add_task_to_list",
    description: "Add an existing task to an additional Project list.",
    inputSchema: z.object({
      listId: z.string().describe("List ID to add the task to"),
      taskId: z.string().describe("Task ID"),
    }),
    handler: async (args: { listId: string; taskId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("POST", `/projects/lists/${args.listId}/tasks/${args.taskId}`, {
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
    name: "ghl_remove_task_from_list",
    description: "Remove a task from a Project list.",
    inputSchema: z.object({
      listId: z.string().describe("List ID to remove the task from"),
      taskId: z.string().describe("Task ID"),
    }),
    handler: async (args: { listId: string; taskId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("DELETE", `/projects/lists/${args.listId}/tasks/${args.taskId}`, {
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
    name: "ghl_move_task_home_list",
    description: "Move a task's home (primary) list to a different Project list.",
    inputSchema: z.object({
      taskId: z.string().describe("Task ID"),
      listId: z.string().describe("List ID to set as the task's new home list"),
    }),
    handler: async (args: { taskId: string; listId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("PUT", `/projects/tasks/${args.taskId}/home-list`, {
          token: config.token,
          version: GHL_VERSION_V3,
          body: { listId: args.listId },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
];
