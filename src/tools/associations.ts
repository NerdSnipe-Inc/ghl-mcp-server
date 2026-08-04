import { z } from "zod";
import { ghlRequest, formatError, GHLConfig, GHL_VERSION_V3 } from "../client.js";

export const associationsTools = [
  {
    name: "ghl_create_association_relation",
    description:
      "Create a relation between two records for an association. Required fields: associationId, firstRecordId, secondRecordId.",
    inputSchema: z.object({
      associationId: z.string().describe("The association ID"),
      firstRecordId: z.string().describe("The first record ID"),
      secondRecordId: z.string().describe("The second record ID"),
    }),
    handler: async (
      args: { associationId: string; firstRecordId: string; secondRecordId: string },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest("POST", "/associations/relations", {
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
    name: "ghl_get_association_relations",
    description:
      "List relations for a record. Required fields: recordId, skip, limit. Optional: associationIds (comma-separated).",
    inputSchema: z.object({
      recordId: z.string().describe("The record ID"),
      skip: z.number().describe("Number of results to skip"),
      limit: z.number().describe("Max results to return"),
      associationIds: z.string().optional().describe("Comma-separated list of association IDs to filter by"),
    }),
    handler: async (
      args: { recordId: string; skip: number; limit: number; associationIds?: string },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest("GET", `/associations/relations/${args.recordId}`, {
          token: config.token,
          version: GHL_VERSION_V3,
          params: {
            locationId: config.locationId,
            skip: args.skip,
            limit: args.limit,
            associationIds: args.associationIds,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_delete_association_relation",
    description: "Delete a relation between two records.",
    inputSchema: z.object({
      relationId: z.string().describe("The relation ID to delete"),
    }),
    handler: async (args: { relationId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("DELETE", `/associations/relations/${args.relationId}`, {
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
    name: "ghl_get_association_by_key",
    description: "Get an association by its key name.",
    inputSchema: z.object({
      key_name: z.string().describe("The association key name"),
    }),
    handler: async (args: { key_name: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", `/associations/key/${args.key_name}`, {
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
    name: "ghl_get_association_by_object_key",
    description: "Get an association by its object key.",
    inputSchema: z.object({
      // Spec quirk: the OpenAPI spec marks both the `objectKey` path param and the
      // `locationId` query param as required=False for this endpoint, which is unusual
      // for a path segment (path params are normally always required). objectKey is
      // still required here since a path segment cannot meaningfully be omitted at the
      // HTTP layer regardless of what the spec's `required` flag says.
      objectKey: z.string().describe("The object key"),
    }),
    handler: async (args: { objectKey: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", `/associations/objectKey/${args.objectKey}`, {
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
    name: "ghl_create_association",
    description:
      "Create a new association. Required fields: key, firstObjectLabel, firstObjectKey, secondObjectLabel, secondObjectKey.",
    inputSchema: z.object({
      key: z.string().describe("The association key"),
      firstObjectLabel: z.string().describe("Label for the first object"),
      firstObjectKey: z.string().describe("Key for the first object"),
      secondObjectLabel: z.string().describe("Label for the second object"),
      secondObjectKey: z.string().describe("Key for the second object"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("POST", "/associations/", {
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
    name: "ghl_get_association",
    description: "Get a specific association by ID.",
    inputSchema: z.object({
      associationId: z.string().describe("The association ID"),
    }),
    handler: async (args: { associationId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", `/associations/${args.associationId}`, {
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
    name: "ghl_update_association",
    description:
      // Spec quirk: UpdateAssociationReqDto only exposes firstObjectLabel and
      // secondObjectLabel — the association's key/objectKey fields are not
      // updatable via this endpoint per the spec.
      "Update an association's object labels. Required fields: firstObjectLabel, secondObjectLabel.",
    inputSchema: z.object({
      associationId: z.string().describe("The association ID to update"),
      firstObjectLabel: z.string().describe("Label for the first object"),
      secondObjectLabel: z.string().describe("Label for the second object"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      const { associationId, ...fields } = args as { associationId: string } & Record<string, unknown>;
      try {
        const result = await ghlRequest("PUT", `/associations/${associationId}`, {
          token: config.token,
          version: GHL_VERSION_V3,
          body: fields,
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_delete_association",
    description: "Delete an association.",
    inputSchema: z.object({
      associationId: z.string().describe("The association ID to delete"),
    }),
    handler: async (args: { associationId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("DELETE", `/associations/${args.associationId}`, {
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
    name: "ghl_list_associations",
    description: "List associations for a location. Required fields: skip, limit.",
    inputSchema: z.object({
      skip: z.number().describe("Number of results to skip"),
      limit: z.number().describe("Max results to return"),
    }),
    handler: async (args: { skip: number; limit: number }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", "/associations/", {
          token: config.token,
          version: GHL_VERSION_V3,
          params: {
            locationId: config.locationId,
            skip: args.skip,
            limit: args.limit,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
];
