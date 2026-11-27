import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    // One light line under the title. Optional.
    subtitle: z.string().optional(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    // Real numbers from the post, shown in the margin. Up to four.
    figures: z.array(z.object({ value: z.string(), caption: z.string() })).max(4).default([]),
    // The agent brief: three lines you write yourself. It is shown to human
    // readers at the top of the post and travels in every feed, so an agent
    // can brief its owner in your words.
    brief: z.object({
      claim: z.string(),
      audience: z.string(),
      action: z.string(),
    }),
  }),
});

export const collections = { blog };
