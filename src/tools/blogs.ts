import { z } from "zod";
import { ghlRequest, formatError, GHLConfig, GHL_VERSION_V3 } from "../client.js";

export const blogTools = [
  {
    name: "ghl_get_blog_authors",
    description: "List blog authors for the location.",
    inputSchema: z.object({
      limit: z.number().describe("Max results"),
      offset: z.number().describe("Results to skip"),
    }),
    handler: async (args: { limit: number; offset: number }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", "/blogs/authors", {
          token: config.token,
          version: GHL_VERSION_V3,
          params: {
            locationId: config.locationId,
            limit: args.limit,
            offset: args.offset,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_blog_categories",
    description: "List blog categories for the location.",
    inputSchema: z.object({
      limit: z.number().describe("Max results"),
      offset: z.number().describe("Results to skip"),
    }),
    handler: async (args: { limit: number; offset: number }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", "/blogs/categories", {
          token: config.token,
          version: GHL_VERSION_V3,
          params: {
            locationId: config.locationId,
            limit: args.limit,
            offset: args.offset,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_blogs",
    description: "List blog sites for the location.",
    inputSchema: z.object({
      skip: z.number().describe("Results to skip"),
      limit: z.number().describe("Max results"),
      searchTerm: z.string().optional().describe("Search term to filter blog sites"),
    }),
    handler: async (
      args: { skip: number; limit: number; searchTerm?: string },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest("GET", "/blogs/site/all", {
          token: config.token,
          version: GHL_VERSION_V3,
          params: {
            locationId: config.locationId,
            skip: args.skip,
            limit: args.limit,
            searchTerm: args.searchTerm,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_blog_posts",
    description: "List posts for a blog. Supports search and status filtering.",
    inputSchema: z.object({
      blogId: z.string().describe("The blog site ID"),
      limit: z.number().describe("Max results"),
      offset: z.number().describe("Results to skip"),
      searchTerm: z.string().optional().describe("Search term to filter posts"),
      status: z
        .enum(["ALL", "PUBLISHED", "SCHEDULED", "ARCHIVED", "DRAFT"])
        .optional()
        .describe("Filter by post status"),
    }),
    handler: async (
      args: {
        blogId: string;
        limit: number;
        offset: number;
        searchTerm?: string;
        status?: string;
      },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest("GET", "/blogs/posts/all", {
          token: config.token,
          version: GHL_VERSION_V3,
          params: {
            locationId: config.locationId,
            blogId: args.blogId,
            limit: args.limit,
            offset: args.offset,
            searchTerm: args.searchTerm,
            status: args.status,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_check_blog_url_slug",
    description: "Check whether a URL slug is already in use by another blog post.",
    inputSchema: z.object({
      urlSlug: z.string().describe("The URL slug to check"),
      postId: z.string().optional().describe("Post ID to exclude from the check (e.g. when editing an existing post)"),
    }),
    handler: async (args: { urlSlug: string; postId?: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", "/blogs/posts/url-slug-exists", {
          token: config.token,
          version: GHL_VERSION_V3,
          params: {
            locationId: config.locationId,
            urlSlug: args.urlSlug,
            postId: args.postId,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_create_blog_post",
    description:
      "Create a new blog post. All of title, blogId, imageUrl, description, rawHTML, status, imageAltText, categories, author, urlSlug, and publishedAt are required by the API.",
    inputSchema: z.object({
      title: z.string().describe("Blog post title"),
      blogId: z.string().describe("The blog site ID (from the blog site dashboard link)"),
      imageUrl: z.string().describe("Featured image URL"),
      description: z.string().describe("A short description"),
      rawHTML: z.string().describe("The blog post content as HTML"),
      status: z.enum(["DRAFT", "PUBLISHED", "SCHEDULED", "ARCHIVED"]).describe("Post status"),
      imageAltText: z.string().describe("Alt text for the featured image"),
      categories: z.array(z.string()).describe("Array of category IDs"),
      author: z.string().describe("Author ID"),
      urlSlug: z.string().describe("URL slug for the post"),
      publishedAt: z.string().describe("ISO timestamp for publish date"),
      tags: z.array(z.string()).optional().describe("Array of tag strings"),
      canonicalLink: z.string().optional().describe("Canonical URL for the post"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("POST", "/blogs/posts", {
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
    name: "ghl_update_blog_post",
    description:
      "Update an existing blog post. Provide the full replacement set of fields — title, blogId, imageUrl, description, rawHTML, status, imageAltText, categories, author, urlSlug, publishedAt, and wordCount are all required by the API.",
    inputSchema: z.object({
      postId: z.string().describe("The blog post ID to update"),
      title: z.string().describe("Blog post title"),
      blogId: z.string().describe("The blog site ID (from the blog site dashboard link)"),
      imageUrl: z.string().describe("Featured image URL"),
      description: z.string().describe("A short description"),
      rawHTML: z.string().describe("The blog post content as HTML"),
      status: z.enum(["DRAFT", "PUBLISHED", "SCHEDULED", "ARCHIVED"]).describe("Post status"),
      imageAltText: z.string().describe("Alt text for the featured image"),
      categories: z.array(z.string()).describe("Array of category IDs"),
      author: z.string().describe("Author ID"),
      urlSlug: z.string().describe("URL slug for the post"),
      // NOTE: wordCount is required on update but absent from the create schema — upstream spec inconsistency, confirmed directly against blogs-v3.json.
      wordCount: z.number().describe("Word count of the post content"),
      publishedAt: z.string().describe("ISO timestamp for publish date"),
      tags: z.array(z.string()).optional().describe("Array of tag strings"),
      canonicalLink: z.string().optional().describe("Canonical URL for the post"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      const { postId, ...fields } = args as { postId: string } & Record<string, unknown>;
      try {
        const result = await ghlRequest("PUT", `/blogs/posts/${postId}`, {
          token: config.token,
          version: GHL_VERSION_V3,
          body: { ...fields, locationId: config.locationId },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
];
