import { z } from "zod";
import { ghlRequest, formatError, GHLConfig, GHL_VERSION_V3 } from "../client.js";

export const courseTools = [
  {
    name: "ghl_import_courses",
    description:
      "Import courses with lessons and modules. Accepts an array of product objects with nested course structure (categories, posts, etc.).",
    inputSchema: z.object({
      products: z
        .array(z.record(z.unknown()))
        .describe(
          "Array of product objects, each defining a full course. Shape (nested top to bottom): " +
            "Product: { title: string (required), description: string (required), imageUrl?: string, " +
            "categories: Category[] (required), instructorDetails?: { name: string (required), description: string (required) } }. " +
            "Category: { title: string (required), visibility: 'published'|'draft' (required), thumbnailUrl?: string, " +
            "posts?: Post[], subCategories?: SubCategory[] }. SubCategory: same shape as Category minus subCategories " +
            "(title required, visibility required, thumbnailUrl?, posts?: Post[]). " +
            "Post: { title: string (required), visibility: 'published'|'draft' (required), " +
            "contentType: 'video'|'assignment'|'quiz' (required), description: string (required), thumbnailUrl?: string, " +
            "bucketVideoUrl?: string, postMaterials?: [{ title: string (required), type: string (required, file extension " +
            "e.g. 'pdf'|'mp4'|'docx'|'png'|...), url: string (required) }] }.",
        ),
      userId: z.string().optional().describe("Optional user ID for the import"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("POST", "/courses/courses-exporter/public/import", {
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
];
