/**
 * Tests for GHL Knowledge Base, FAQ, and Web Crawler tools.
 *
 * Mocks ghlRequest so no real HTTP calls are made.
 * Tests verify: correct endpoint + method, correct arg forwarding, error handling,
 * and Zod schema validation of required fields.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { z } from "zod";

// ── Mock the HTTP client ───────────────────────────────────────────────────────

vi.mock("../src/client.js", () => ({
  ghlRequest: vi.fn(),
  formatError: vi.fn((e: unknown) =>
    JSON.stringify({ error: true, message: String(e) })
  ),
  GHLApiError: class GHLApiError extends Error {
    status: number;
    statusText: string;
    body: unknown;
    endpoint: string;
    constructor(
      status: number,
      statusText: string,
      body: unknown,
      endpoint: string
    ) {
      super(`GHL API Error ${status} on ${endpoint}: ${statusText}`);
      this.status = status;
      this.statusText = statusText;
      this.body = body;
      this.endpoint = endpoint;
    }
  },
  getConfig: vi.fn(),
  GHL_BASE_URL: "https://services.leadconnectorhq.com",
  GHL_VERSION: "2021-07-28",
  buildHeaders: vi.fn(),
}));

// ── Import after mock ─────────────────────────────────────────────────────────

import { ghlRequest, formatError } from "../src/client.js";
import {
  knowledgeBaseTools,
  faqTools,
  crawlerTools,
} from "../src/tools/knowledge_base.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

const mockGhlRequest = vi.mocked(ghlRequest);
const mockFormatError = vi.mocked(formatError);
const CONFIG = { token: "test-token", locationId: "loc123" };

function findTool(
  tools: typeof knowledgeBaseTools | typeof faqTools | typeof crawlerTools,
  name: string
) {
  const tool = tools.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool not found: ${name}`);
  return tool;
}

// ── Knowledge Base tools ──────────────────────────────────────────────────────

describe("knowledgeBaseTools", () => {
  beforeEach(() => {
    mockGhlRequest.mockResolvedValue({ success: true });
  });

  describe("ghl_list_knowledge_bases", () => {
    const tool = findTool(knowledgeBaseTools, "ghl_list_knowledge_bases");

    it("calls GET /knowledge-bases/ with locationId injected from config", async () => {
      await tool.handler({ limit: 5 }, CONFIG);

      expect(mockGhlRequest).toHaveBeenCalledWith("GET", "/knowledge-bases/", {
        token: CONFIG.token,
        params: {
          locationId: CONFIG.locationId,
          query: undefined,
          limit: 5,
          lastKnowledgeBaseId: undefined,
        },
      });
    });

    it("passes optional query and lastKnowledgeBaseId through", async () => {
      await tool.handler(
        { query: "my-kb", lastKnowledgeBaseId: "kb-prev-id" },
        CONFIG
      );

      expect(mockGhlRequest).toHaveBeenCalledWith(
        "GET",
        "/knowledge-bases/",
        expect.objectContaining({
          params: expect.objectContaining({
            query: "my-kb",
            lastKnowledgeBaseId: "kb-prev-id",
          }),
        })
      );
    });

    it("returns JSON-stringified result on success", async () => {
      mockGhlRequest.mockResolvedValueOnce({ data: { knowledgeBases: [] } });
      const result = await tool.handler({}, CONFIG);
      expect(JSON.parse(result)).toEqual({ data: { knowledgeBases: [] } });
    });

    it("returns formatError output on failure", async () => {
      const err = new Error("Network error");
      mockGhlRequest.mockRejectedValueOnce(err);
      await tool.handler({}, CONFIG);
      expect(mockFormatError).toHaveBeenCalledWith(err);
    });
  });

  describe("ghl_get_knowledge_base", () => {
    const tool = findTool(knowledgeBaseTools, "ghl_get_knowledge_base");

    it("calls GET /knowledge-bases/{id} with correct path", async () => {
      await tool.handler({ knowledgeBaseId: "kb-abc" }, CONFIG);

      expect(mockGhlRequest).toHaveBeenCalledWith(
        "GET",
        "/knowledge-bases/kb-abc",
        { token: CONFIG.token }
      );
    });

    it("requires knowledgeBaseId", () => {
      expect(() => tool.inputSchema.parse({})).toThrow(z.ZodError);
    });
  });

  describe("ghl_create_knowledge_base", () => {
    const tool = findTool(knowledgeBaseTools, "ghl_create_knowledge_base");

    it("calls POST /knowledge-bases/ with name and locationId", async () => {
      await tool.handler({ name: "My KB" }, CONFIG);

      expect(mockGhlRequest).toHaveBeenCalledWith("POST", "/knowledge-bases/", {
        token: CONFIG.token,
        body: { name: "My KB", locationId: CONFIG.locationId },
      });
    });

    it("includes optional description when provided", async () => {
      await tool.handler(
        { name: "My KB", description: "A test knowledge base" },
        CONFIG
      );

      expect(mockGhlRequest).toHaveBeenCalledWith(
        "POST",
        "/knowledge-bases/",
        expect.objectContaining({
          body: expect.objectContaining({
            description: "A test knowledge base",
          }),
        })
      );
    });

    it("requires name field", () => {
      expect(() => tool.inputSchema.parse({})).toThrow(z.ZodError);
    });
  });

  describe("ghl_update_knowledge_base", () => {
    const tool = findTool(knowledgeBaseTools, "ghl_update_knowledge_base");

    it("calls PUT /knowledge-bases/{id} without knowledgeBaseId in body", async () => {
      await tool.handler(
        { knowledgeBaseId: "kb-abc", name: "Renamed KB" },
        CONFIG
      );

      expect(mockGhlRequest).toHaveBeenCalledWith(
        "PUT",
        "/knowledge-bases/kb-abc",
        {
          token: CONFIG.token,
          body: { name: "Renamed KB" },
        }
      );
    });

    it("requires knowledgeBaseId", () => {
      expect(() => tool.inputSchema.parse({})).toThrow(z.ZodError);
    });
  });

  describe("ghl_delete_knowledge_base", () => {
    const tool = findTool(knowledgeBaseTools, "ghl_delete_knowledge_base");

    it("calls DELETE /knowledge-bases/{id}", async () => {
      await tool.handler({ knowledgeBaseId: "kb-abc" }, CONFIG);

      expect(mockGhlRequest).toHaveBeenCalledWith(
        "DELETE",
        "/knowledge-bases/kb-abc",
        { token: CONFIG.token }
      );
    });

    it("requires knowledgeBaseId", () => {
      expect(() => tool.inputSchema.parse({})).toThrow(z.ZodError);
    });
  });
});

// ── FAQ tools ─────────────────────────────────────────────────────────────────

describe("faqTools", () => {
  beforeEach(() => {
    mockGhlRequest.mockResolvedValue({ success: true });
  });

  describe("ghl_list_faqs", () => {
    const tool = findTool(faqTools, "ghl_list_faqs");

    it("calls GET /knowledge-bases/faqs with required params", async () => {
      // Parse through schema first — mirrors index.ts runtime which applies Zod defaults before calling handler
      await tool.handler(tool.inputSchema.parse({ knowledgeBaseId: "kb-abc" }), CONFIG);

      expect(mockGhlRequest).toHaveBeenCalledWith(
        "GET",
        "/knowledge-bases/faqs",
        {
          token: CONFIG.token,
          params: {
            locationId: CONFIG.locationId,
            knowledgeBaseId: "kb-abc",
            limit: 10,
            lastFaqId: undefined,
          },
        }
      );
    });

    it("passes lastFaqId for cursor pagination", async () => {
      await tool.handler(
        { knowledgeBaseId: "kb-abc", lastFaqId: "faq-last" },
        CONFIG
      );

      expect(mockGhlRequest).toHaveBeenCalledWith(
        "GET",
        "/knowledge-bases/faqs",
        expect.objectContaining({
          params: expect.objectContaining({ lastFaqId: "faq-last" }),
        })
      );
    });

    it("requires knowledgeBaseId", () => {
      expect(() => tool.inputSchema.parse({})).toThrow(z.ZodError);
    });
  });

  describe("ghl_create_faq", () => {
    const tool = findTool(faqTools, "ghl_create_faq");

    it("calls POST /knowledge-bases/faqs with question, answer, and locationId", async () => {
      await tool.handler(
        {
          knowledgeBaseId: "kb-abc",
          question: "What is 1+1?",
          answer: "2",
        },
        CONFIG
      );

      expect(mockGhlRequest).toHaveBeenCalledWith(
        "POST",
        "/knowledge-bases/faqs",
        {
          token: CONFIG.token,
          body: {
            locationId: CONFIG.locationId,
            knowledgeBaseId: "kb-abc",
            question: "What is 1+1?",
            answer: "2",
          },
        }
      );
    });

    it("requires knowledgeBaseId, question, and answer", () => {
      expect(() => tool.inputSchema.parse({})).toThrow(z.ZodError);
      expect(() =>
        tool.inputSchema.parse({ knowledgeBaseId: "kb-abc", question: "Q?" })
      ).toThrow(z.ZodError);
      expect(() =>
        tool.inputSchema.parse({ knowledgeBaseId: "kb-abc", answer: "A" })
      ).toThrow(z.ZodError);
    });

    it("returns JSON result on success", async () => {
      const faqResponse = { success: true, faq: { id: "faq-1", question: "Q", answer: "A" } };
      mockGhlRequest.mockResolvedValueOnce(faqResponse);

      const result = await tool.handler(
        { knowledgeBaseId: "kb-abc", question: "Q", answer: "A" },
        CONFIG
      );

      expect(JSON.parse(result)).toEqual(faqResponse);
    });

    it("returns formatError output on API failure", async () => {
      const err = new Error("API down");
      mockGhlRequest.mockRejectedValueOnce(err);

      await tool.handler(
        { knowledgeBaseId: "kb-abc", question: "Q", answer: "A" },
        CONFIG
      );

      expect(mockFormatError).toHaveBeenCalledWith(err);
    });
  });

  describe("ghl_update_faq", () => {
    const tool = findTool(faqTools, "ghl_update_faq");

    it("calls PUT /knowledge-bases/faqs/{id} with question and answer", async () => {
      await tool.handler(
        { faqId: "faq-abc", question: "Updated Q?", answer: "Updated A" },
        CONFIG
      );

      expect(mockGhlRequest).toHaveBeenCalledWith(
        "PUT",
        "/knowledge-bases/faqs/faq-abc",
        {
          token: CONFIG.token,
          body: { question: "Updated Q?", answer: "Updated A" },
        }
      );
    });

    it("requires faqId, question, and answer", () => {
      expect(() => tool.inputSchema.parse({})).toThrow(z.ZodError);
      expect(() =>
        tool.inputSchema.parse({ faqId: "f1", question: "Q?" })
      ).toThrow(z.ZodError);
    });
  });

  describe("ghl_delete_faq", () => {
    const tool = findTool(faqTools, "ghl_delete_faq");

    it("calls DELETE /knowledge-bases/faqs/{id}", async () => {
      await tool.handler({ faqId: "faq-abc" }, CONFIG);

      expect(mockGhlRequest).toHaveBeenCalledWith(
        "DELETE",
        "/knowledge-bases/faqs/faq-abc",
        { token: CONFIG.token }
      );
    });

    it("requires faqId", () => {
      expect(() => tool.inputSchema.parse({})).toThrow(z.ZodError);
    });
  });
});

// ── Web Crawler tools ─────────────────────────────────────────────────────────

describe("crawlerTools", () => {
  beforeEach(() => {
    mockGhlRequest.mockResolvedValue({ success: true });
  });

  describe("ghl_list_crawler_urls", () => {
    const tool = findTool(crawlerTools, "ghl_list_crawler_urls");

    it("calls GET /knowledge-bases/crawler with required params", async () => {
      // Parse through schema first — mirrors index.ts runtime which applies Zod defaults before calling handler
      await tool.handler(tool.inputSchema.parse({ knowledgeBaseId: "kb-abc" }), CONFIG);

      expect(mockGhlRequest).toHaveBeenCalledWith(
        "GET",
        "/knowledge-bases/crawler",
        {
          token: CONFIG.token,
          params: {
            locationId: CONFIG.locationId,
            knowledgeBaseId: "kb-abc",
            page: 1,
            pageLength: 20,
            query: undefined,
          },
        }
      );
    });

    it("requires knowledgeBaseId", () => {
      expect(() => tool.inputSchema.parse({})).toThrow(z.ZodError);
    });
  });

  describe("ghl_discover_website", () => {
    const tool = findTool(crawlerTools, "ghl_discover_website");

    it("calls POST /knowledge-bases/crawler with correct body", async () => {
      await tool.handler(
        {
          knowledgeBaseId: "kb-abc",
          url: "https://example.com/docs",
          option: "Path",
        },
        CONFIG
      );

      expect(mockGhlRequest).toHaveBeenCalledWith(
        "POST",
        "/knowledge-bases/crawler",
        {
          token: CONFIG.token,
          body: {
            locationId: CONFIG.locationId,
            knowledgeBaseId: "kb-abc",
            url: "https://example.com/docs",
            option: "Path",
          },
        }
      );
    });

    it("validates option enum — rejects invalid values", () => {
      expect(() =>
        tool.inputSchema.parse({
          knowledgeBaseId: "kb-abc",
          url: "https://example.com",
          option: "AllPages",
        })
      ).toThrow(z.ZodError);
    });

    it("accepts all three valid option values", () => {
      for (const option of ["Exact", "Path", "Domain"] as const) {
        expect(() =>
          tool.inputSchema.parse({
            knowledgeBaseId: "kb-abc",
            url: "https://example.com",
            option,
          })
        ).not.toThrow();
      }
    });

    it("requires knowledgeBaseId, url, and option", () => {
      expect(() => tool.inputSchema.parse({})).toThrow(z.ZodError);
    });
  });

  describe("ghl_get_crawler_status", () => {
    const tool = findTool(crawlerTools, "ghl_get_crawler_status");

    it("calls GET /knowledge-bases/crawler/status with operationId and knowledgeBaseId", async () => {
      await tool.handler(
        { knowledgeBaseId: "kb-abc", operationId: "op-123" },
        CONFIG
      );

      expect(mockGhlRequest).toHaveBeenCalledWith(
        "GET",
        "/knowledge-bases/crawler/status",
        {
          token: CONFIG.token,
          params: {
            locationId: CONFIG.locationId,
            knowledgeBaseId: "kb-abc",
            operationId: "op-123",
          },
        }
      );
    });

    it("requires knowledgeBaseId and operationId", () => {
      expect(() => tool.inputSchema.parse({})).toThrow(z.ZodError);
      expect(() =>
        tool.inputSchema.parse({ knowledgeBaseId: "kb-abc" })
      ).toThrow(z.ZodError);
    });
  });

  describe("ghl_train_crawler_urls", () => {
    const tool = findTool(crawlerTools, "ghl_train_crawler_urls");

    it("calls POST /knowledge-bases/crawler/train with urlIds array", async () => {
      await tool.handler(
        {
          knowledgeBaseId: "kb-abc",
          operationId: "op-123",
          urlIds: ["url-1", "url-2"],
        },
        CONFIG
      );

      expect(mockGhlRequest).toHaveBeenCalledWith(
        "POST",
        "/knowledge-bases/crawler/train",
        {
          token: CONFIG.token,
          body: {
            locationId: CONFIG.locationId,
            knowledgeBaseId: "kb-abc",
            operationId: "op-123",
            urlIds: ["url-1", "url-2"],
          },
        }
      );
    });

    it("requires knowledgeBaseId, operationId, and urlIds", () => {
      expect(() => tool.inputSchema.parse({})).toThrow(z.ZodError);
    });
  });

  describe("ghl_delete_crawler_urls", () => {
    const tool = findTool(crawlerTools, "ghl_delete_crawler_urls");

    it("calls DELETE /knowledge-bases/crawler with urlIds in body", async () => {
      await tool.handler(
        { knowledgeBaseId: "kb-abc", urlIds: ["url-1"] },
        CONFIG
      );

      expect(mockGhlRequest).toHaveBeenCalledWith(
        "DELETE",
        "/knowledge-bases/crawler",
        {
          token: CONFIG.token,
          body: {
            locationId: CONFIG.locationId,
            knowledgeBaseId: "kb-abc",
            urlIds: ["url-1"],
          },
        }
      );
    });

    it("returns formatError on failure", async () => {
      const err = new Error("Delete failed");
      mockGhlRequest.mockRejectedValueOnce(err);

      await tool.handler(
        { knowledgeBaseId: "kb-abc", urlIds: ["url-1"] },
        CONFIG
      );

      expect(mockFormatError).toHaveBeenCalledWith(err);
    });

    it("requires knowledgeBaseId and urlIds", () => {
      expect(() => tool.inputSchema.parse({})).toThrow(z.ZodError);
      expect(() =>
        tool.inputSchema.parse({ knowledgeBaseId: "kb-abc" })
      ).toThrow(z.ZodError);
    });
  });
});
