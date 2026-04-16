import { CATEGORIES } from "@/categories";
import { glob } from "astro/loaders";
import { defineCollection, z } from "astro:content";

// 日本語あいうえおアイウエオ
// 全角スペース =>

const blog = defineCollection({
  loader: glob({ base: "./src/content/posts", pattern: "**/*.{md,mdx}" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string().optional(),
      pubDate: z.coerce.date(),
      draft: z.boolean().optional().default(false),
      categories: z.array(z.enum(CATEGORIES)).optional(),
      updatedDate: z.coerce.date().optional(),
      heroImage: image().optional(),
    }),
});

const works = defineCollection({
  loader: glob({ base: "./src/content/works", pattern: "**/*.{md,mdx}" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      draft: z.boolean().optional().default(false),
      summary: z.string().optional(),
      startDate: z.coerce.date().optional(),
      endDate: z.coerce.date().optional(),
      aboutYear: z.coerce.number().optional(),
      techs: z.array(z.string()).optional(),
      updatedDate: z.coerce.date().optional(),
      heroImage: image().optional(),
    }),
});

export const collections = { blog, works };
