import { createTool } from '@mastra/core';
import FireCrawlApp from '@mendable/firecrawl-js';
import { z } from 'zod';

const schema = z.object({
  events: z.array(z.object({
    title: z.string(),
    date: z.string(),
    link: z.string()
  }))
});

export const doScrape = async (url: string, prompt: string) => {
    const app = new FireCrawlApp({apiKey: process.env.FIRECRAWL_API_KEY});
    const extractResult = await app.extract([
        url
      ], {
        prompt,
        schema,
    });
    return extractResult.success ? extractResult.data : { events: [] };
}   

export const scrapeTool = createTool({
    id: "scrape",
    description: "Scrape a website and extract structured data from it",
    inputSchema: z.object({
      url: z.string().describe("URL to scrape"),
      prompt: z.string().describe("Prompt to use for the scrape"),
    }),
    outputSchema: schema,
    execute: async ({ context }) => {
        return  doScrape(context.triggerData.url, context.triggerData.prompt);
    }
});