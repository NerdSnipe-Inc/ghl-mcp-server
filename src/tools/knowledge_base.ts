/**
 * GHL Knowledge Base, FAQ, and Web Crawler tools
 *
 * OpenAPI spec: https://github.com/GoHighLevel/highlevel-api-docs/blob/main/apps/knowledge-base.json
 *
 * Three exported arrays register under distinct sections in index.ts:
 *   - knowledgeBaseTools — CRUD for knowledge base containers
 *   - faqTools           — CRUD for FAQ question/answer pairs
 *   - crawlerTools       — Web crawler: discover, train, manage trained URLs
 */

import { z } from "zod";
import { ghlRequest, formatError, GHLConfig } from "../client.js";

// ── Knowledge Base CRUD ───────────────────────────────────────────────────────

export const knowledgeBaseTools = [
  {
    name: "ghl_list_knowledge_bases",
    description:
      "List all knowledge bases for the location with cursor-based pagination. Returns KB name, ID, and creation date.",
    inputSchema: z.object({
      query: z
        .string()
        .optional()
        .describe("Search query to filter knowledge bases by name"),
      limit: z
        .number()
        .optional()
        .default(20)
        .describe("Maximum number of results to return (default 20)"),
      lastKnowledgeBaseId: z
        .string()
        .optional()
        .describe(
          "ID of the last knowledge base from the previous page — use for cursor pagination"
        ),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", "/knowledge-bases/", {
          token: config.token,
          params: {
            locationId: config.locationId,
            query: args.query as string | undefined,
            limit: args.limit as number | undefined,
            lastKnowledgeBaseId: args.lastKnowledgeBaseId as
              | string
              | undefined,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },

  {
    name: "ghl_get_knowledge_base",
    description:
      "Get a single knowledge base by ID. Returns full details including kbMetadata counts (FAQs, URLs, rich text, files).",
    inputSchema: z.object({
      knowledgeBaseId: z
        .string()
        .describe("The knowledge base ID to retrieve"),
    }),
    handler: async (
      args: { knowledgeBaseId: string },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest(
          "GET",
          `/knowledge-bases/${args.knowledgeBaseId}`,
          { token: config.token }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },

  {
    name: "ghl_create_knowledge_base",
    description:
      "Create a new knowledge base for the location. Max 15 knowledge bases per location. Returns the created KB object.",
    inputSchema: z.object({
      name: z.string().describe("Name for the new knowledge base"),
      description: z
        .string()
        .optional()
        .describe("Optional description for the knowledge base"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("POST", "/knowledge-bases/", {
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
    name: "ghl_update_knowledge_base",
    description:
      "Update the name or description of an existing knowledge base. Returns { success: true } on success.",
    inputSchema: z.object({
      knowledgeBaseId: z
        .string()
        .describe("The knowledge base ID to update"),
      name: z
        .string()
        .optional()
        .describe("New name for the knowledge base"),
      description: z
        .string()
        .optional()
        .describe("New description for the knowledge base"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      const { knowledgeBaseId, ...fields } = args as {
        knowledgeBaseId: string;
      } & Record<string, unknown>;
      try {
        const result = await ghlRequest(
          "PUT",
          `/knowledge-bases/${knowledgeBaseId}`,
          { token: config.token, body: fields }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },

  {
    name: "ghl_delete_knowledge_base",
    description:
      "Permanently delete a knowledge base and all its content (FAQs, trained URLs, etc.). Returns { success: true } on success.",
    inputSchema: z.object({
      knowledgeBaseId: z
        .string()
        .describe("The knowledge base ID to delete"),
    }),
    handler: async (
      args: { knowledgeBaseId: string },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest(
          "DELETE",
          `/knowledge-bases/${args.knowledgeBaseId}`,
          { token: config.token }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
];

// ── FAQ CRUD ──────────────────────────────────────────────────────────────────

export const faqTools = [
  {
    name: "ghl_list_faqs",
    description:
      "List all FAQ question/answer pairs for a knowledge base with cursor-based pagination. Returns count, hasMore, lastFaqId for next page.",
    inputSchema: z.object({
      knowledgeBaseId: z
        .string()
        .describe("Knowledge base ID to fetch FAQs from"),
      limit: z
        .number()
        .optional()
        .default(10)
        .describe("Max FAQs to return per page (default 10)"),
      lastFaqId: z
        .string()
        .optional()
        .describe(
          "Last FAQ ID from the previous page — pass to get the next page (cursor pagination)"
        ),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", "/knowledge-bases/faqs", {
          token: config.token,
          params: {
            locationId: config.locationId,
            knowledgeBaseId: args.knowledgeBaseId as string,
            limit: args.limit as number | undefined,
            lastFaqId: args.lastFaqId as string | undefined,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },

  {
    name: "ghl_create_faq",
    description:
      "Create a new FAQ question and answer inside a knowledge base. Returns the created FAQ object with its ID.",
    inputSchema: z.object({
      knowledgeBaseId: z
        .string()
        .describe("Knowledge base ID to add the FAQ to"),
      question: z.string().describe("The FAQ question text"),
      answer: z.string().describe("The FAQ answer text"),
    }),
    handler: async (
      args: {
        knowledgeBaseId: string;
        question: string;
        answer: string;
      },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest("POST", "/knowledge-bases/faqs", {
          token: config.token,
          body: {
            locationId: config.locationId,
            knowledgeBaseId: args.knowledgeBaseId,
            question: args.question,
            answer: args.answer,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },

  {
    name: "ghl_update_faq",
    description:
      "Update the question and answer of an existing FAQ. Both question and answer are required by the API. Returns { success: true }.",
    inputSchema: z.object({
      faqId: z.string().describe("The FAQ ID to update"),
      question: z.string().describe("Updated question text"),
      answer: z.string().describe("Updated answer text"),
    }),
    handler: async (
      args: { faqId: string; question: string; answer: string },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest(
          "PUT",
          `/knowledge-bases/faqs/${args.faqId}`,
          {
            token: config.token,
            body: { question: args.question, answer: args.answer },
          }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },

  {
    name: "ghl_delete_faq",
    description:
      "Permanently delete an FAQ from a knowledge base by FAQ ID. Returns { success: true } on success.",
    inputSchema: z.object({
      faqId: z.string().describe("The FAQ ID to delete"),
    }),
    handler: async (args: { faqId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "DELETE",
          `/knowledge-bases/faqs/${args.faqId}`,
          { token: config.token }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
];

// ── Web Crawler ───────────────────────────────────────────────────────────────

export const crawlerTools = [
  {
    name: "ghl_list_crawler_urls",
    description:
      "List all trained page links for a knowledge base. Supports page/pageLength pagination and URL filtering. Use to get urlIds for training or deletion.",
    inputSchema: z.object({
      knowledgeBaseId: z.string().describe("Knowledge base ID"),
      page: z
        .number()
        .optional()
        .default(1)
        .describe("Page number (default 1)"),
      pageLength: z
        .number()
        .optional()
        .default(20)
        .describe("Records per page (default 20)"),
      query: z
        .string()
        .optional()
        .describe("Filter results by URL substring"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", "/knowledge-bases/crawler", {
          token: config.token,
          params: {
            locationId: config.locationId,
            knowledgeBaseId: args.knowledgeBaseId as string,
            page: args.page as number | undefined,
            pageLength: args.pageLength as number | undefined,
            query: args.query as string | undefined,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },

  {
    name: "ghl_discover_website",
    description:
      "Start crawling a website to discover pages for AI training. Returns an operationId — use ghl_get_crawler_status to track progress, then ghl_train_crawler_urls to ingest.",
    inputSchema: z.object({
      knowledgeBaseId: z
        .string()
        .describe("Knowledge base ID to add discovered pages to"),
      url: z.string().describe("Website URL to start crawling from"),
      option: z
        .enum(["Exact", "Path", "Domain"])
        .describe(
          "Crawl scope: Exact = this URL only; Path = this path and sub-paths; Domain = entire domain"
        ),
    }),
    handler: async (
      args: { knowledgeBaseId: string; url: string; option: string },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest("POST", "/knowledge-bases/crawler", {
          token: config.token,
          body: {
            locationId: config.locationId,
            knowledgeBaseId: args.knowledgeBaseId,
            url: args.url,
            option: args.option,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },

  {
    name: "ghl_get_crawler_status",
    description:
      "Check the status of a website crawling operation. Returns aggregate status counts (Pending, Successful, Failed, etc.) and per-URL details.",
    inputSchema: z.object({
      knowledgeBaseId: z.string().describe("Knowledge base ID"),
      operationId: z
        .string()
        .describe(
          "Operation ID returned from ghl_discover_website — identifies the crawl job"
        ),
    }),
    handler: async (
      args: { knowledgeBaseId: string; operationId: string },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest(
          "GET",
          "/knowledge-bases/crawler/status",
          {
            token: config.token,
            params: {
              locationId: config.locationId,
              knowledgeBaseId: args.knowledgeBaseId,
              operationId: args.operationId,
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
    name: "ghl_train_crawler_urls",
    description:
      "Ingest a set of discovered page URLs into the knowledge base for AI training. Use urlIds from ghl_list_crawler_urls. Returns { success: true } when training starts.",
    inputSchema: z.object({
      knowledgeBaseId: z.string().describe("Knowledge base ID"),
      operationId: z
        .string()
        .describe("Operation ID from ghl_discover_website"),
      urlIds: z
        .array(z.string())
        .describe(
          "Array of URL IDs to train (retrieve IDs via ghl_list_crawler_urls)"
        ),
    }),
    handler: async (
      args: {
        knowledgeBaseId: string;
        operationId: string;
        urlIds: string[];
      },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest(
          "POST",
          "/knowledge-bases/crawler/train",
          {
            token: config.token,
            body: {
              locationId: config.locationId,
              knowledgeBaseId: args.knowledgeBaseId,
              operationId: args.operationId,
              urlIds: args.urlIds,
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
    name: "ghl_delete_crawler_urls",
    description:
      "Remove trained page URLs from a knowledge base. Use urlIds from ghl_list_crawler_urls. Returns { success: true } on success.",
    inputSchema: z.object({
      knowledgeBaseId: z.string().describe("Knowledge base ID"),
      urlIds: z
        .array(z.string())
        .describe(
          "Array of trained URL IDs to remove (retrieve IDs via ghl_list_crawler_urls)"
        ),
    }),
    handler: async (
      args: { knowledgeBaseId: string; urlIds: string[] },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest(
          "DELETE",
          "/knowledge-bases/crawler",
          {
            token: config.token,
            body: {
              locationId: config.locationId,
              knowledgeBaseId: args.knowledgeBaseId,
              urlIds: args.urlIds,
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
