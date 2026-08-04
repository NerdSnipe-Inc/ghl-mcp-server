import { z } from "zod";
import { ghlRequest, formatError, GHLConfig, GHL_VERSION_V3 } from "../client.js";

// Note: POST /objects/ (Create Custom Object schema) is intentionally not exposed
// here. Its `security` scheme is `Agency-Access`, not `bearer` — this server's
// location PIT token cannot satisfy that scheme, so the operation is unreachable.

export const objectsTools = [
  {
    name: "ghl_get_object_schema",
    description:
      "Get a custom or standard object schema by key. Required fields: key. Optional: fetchProperties.",
    inputSchema: z.object({
      key: z.string().describe("The object schema key, e.g. custom_objects.pet"),
      fetchProperties: z.boolean().optional().describe("Whether to include the object's properties in the response"),
    }),
    handler: async (args: { key: string; fetchProperties?: boolean }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", `/objects/${args.key}`, {
          token: config.token,
          version: GHL_VERSION_V3,
          params: {
            locationId: config.locationId,
            fetchProperties: args.fetchProperties,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_update_object_schema",
    description:
      "Update a custom object schema. Required fields: key, searchableProperties. Optional: labels (singular/plural), description.",
    inputSchema: z.object({
      key: z.string().describe("The object schema key to update"),
      searchableProperties: z
        .array(z.string())
        .describe(
          "Field keys to make searchable, using the format custom_objects.<object_name>.<field_key>"
        ),
      labels: z
        .object({
          singular: z.string().optional().describe("Singular display name"),
          plural: z.string().optional().describe("Plural display name"),
        })
        .optional()
        .describe("How the custom object is displayed"),
      description: z.string().optional().describe("The object's description"),
    }),
    handler: async (
      args: {
        key: string;
        searchableProperties: string[];
        labels?: { singular?: string; plural?: string };
        description?: string;
      },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest("PUT", `/objects/${args.key}`, {
          token: config.token,
          version: GHL_VERSION_V3,
          body: {
            locationId: config.locationId,
            searchableProperties: args.searchableProperties,
            labels: args.labels,
            description: args.description,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_objects",
    description: "List all objects (standard and custom) for the location.",
    inputSchema: z.object({}),
    handler: async (_args: Record<string, never>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", "/objects/", {
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
    name: "ghl_get_object_record",
    description: "Get a single custom object record by ID. Required fields: schemaKey, id.",
    inputSchema: z.object({
      // Spec quirk: unlike the sibling PUT on this same path, GET has no locationId
      // parameter anywhere (not query, not body) — do not inject one.
      schemaKey: z.string().describe("The object schema key"),
      id: z.string().describe("The record ID"),
    }),
    handler: async (args: { schemaKey: string; id: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", `/objects/${args.schemaKey}/records/${args.id}`, {
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
    name: "ghl_update_object_record",
    description: "Update a custom object record. Required fields: schemaKey, id, record.",
    inputSchema: z.object({
      schemaKey: z.string().describe("The object schema key"),
      id: z.string().describe("The record ID to update"),
      // UpdateCustomObjectRecordDto is an empty schema in the spec ({"type":"object","properties":{}})
      // — custom object records carry dynamic, per-object-schema fields with no fixed shape.
      record: z.record(z.string(), z.unknown()).describe("The record fields to update, keyed by field name"),
    }),
    handler: async (
      args: { schemaKey: string; id: string; record: Record<string, unknown> },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest("PUT", `/objects/${args.schemaKey}/records/${args.id}`, {
          token: config.token,
          version: GHL_VERSION_V3,
          params: { locationId: config.locationId },
          body: args.record,
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_delete_object_record",
    description: "Delete a custom object record. Required fields: schemaKey, id.",
    inputSchema: z.object({
      // Spec quirk: same as GET on this path — no locationId parameter anywhere.
      schemaKey: z.string().describe("The object schema key"),
      id: z.string().describe("The record ID to delete"),
    }),
    handler: async (args: { schemaKey: string; id: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("DELETE", `/objects/${args.schemaKey}/records/${args.id}`, {
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
    name: "ghl_create_object_record",
    description: "Create a new custom object record. Required fields: schemaKey, record.",
    inputSchema: z.object({
      // Spec quirk: this operation has no locationId parameter anywhere either
      // (query or body) — verified directly against the spec, don't inject one.
      schemaKey: z.string().describe("The object schema key"),
      // CreateCustomObjectRecordDto is an empty schema in the spec ({"type":"object","properties":{}})
      // — custom object records carry dynamic, per-object-schema fields with no fixed shape.
      record: z.record(z.string(), z.unknown()).describe("The record fields, keyed by field name"),
    }),
    handler: async (args: { schemaKey: string; record: Record<string, unknown> }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("POST", `/objects/${args.schemaKey}/records`, {
          token: config.token,
          version: GHL_VERSION_V3,
          body: args.record,
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_search_object_records",
    description:
      "Search custom object records. Required fields: schemaKey, page, pageLimit, query, searchAfter.",
    inputSchema: z.object({
      // Spec quirk: the OpenAPI spec marks the schemaKey path param as required=False
      // for this endpoint, which is unusual for a path segment. schemaKey is still
      // required here since a path segment cannot meaningfully be omitted at the
      // HTTP layer regardless of what the spec's `required` flag says.
      schemaKey: z.string().describe("The object schema key"),
      page: z.number().describe("Page number"),
      pageLimit: z.number().describe("Number of results per page"),
      query: z
        .string()
        .describe(
          "Search query using a searchable property, e.g. 'name:Buddy' where 'name' is a configured searchable property"
        ),
      searchAfter: z.array(z.string()).describe("Cursor values for pagination, from a prior response"),
    }),
    handler: async (
      args: { schemaKey: string; page: number; pageLimit: number; query: string; searchAfter: string[] },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest("POST", `/objects/${args.schemaKey}/records/search`, {
          token: config.token,
          version: GHL_VERSION_V3,
          body: {
            locationId: config.locationId,
            page: args.page,
            pageLimit: args.pageLimit,
            query: args.query,
            searchAfter: args.searchAfter,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
];
