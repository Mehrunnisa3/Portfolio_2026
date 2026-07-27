import { defineCollection, z } from 'astro:content';
import { glob, file } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      order: z.number(),
      oneLiner: z.string(),
      /** Hero subtitle when it differs from the index one-liner. */
      subtitle: z.string().optional(),
      disciplines: z.array(z.string()),
      sector: z.string(),
      role: z.string(),
      duration: z.string(),
      readTime: z.string(),
      year: z.string(),
      indexImage: image(),
      hero: z.object({
        image: image(),
        video: z.string().optional(),
        poster: z.string().optional(),
      }),
      metrics: z.array(
        z.object({
          value: z.string(),
          label: z.string(),
          sub: z.string().optional(),
        }),
      ),
      next: z.string().optional(),
      /** Skip the page-level Outcomes MetricPanel, e.g. when the case study
       * already presents its results inline (see Line Up's SUS results). */
      hideOutcomePanel: z.boolean().optional(),
    }),
});

const papers = defineCollection({
  loader: file('./src/data/papers.json'),
  schema: z.object({
    id: z.string(),
    title: z.string(),
    venue: z.string(),
    venueShort: z.string(),
    year: z.string(),
    status: z.string(),
    url: z.string().optional(),
    logo: z.string(),
  }),
});

export const collections = { projects, papers };
