import { previousAdventuresTool, previousAdventuresOutputSchema } from "../../tools/previous-adventures-tool";
import { weatherTool } from "../../tools/weather-tool";
import { Step, Workflow } from "@mastra/core/workflows";
import { z } from "zod";
import { mastraLogger } from "../../index";
import prisma from "../../../lib/db";
import { doScrape } from "../../tools/scrape-tool";

const adventureAgentInvokeStep = new Step({
  id: 'generate-adventure',
  description: 'Generate an adventure suggestion based on the weather, previous adventures, and events',
  inputSchema: z.object({}),
  outputSchema: z.object({
    result: z.object({
      condition: z.string(),
      temperature: z.number(),
      suggestion: z.string(),
      location: z.string(),
    }),
  }),
  execute: async ({ context, mastra }) => {
    mastraLogger.info('[Adventure agent invoke step] Starting adventure agent invoke step with context:', context);
    const previousAdventures = context.getStepResult('get-previous-adventures') as z.infer<typeof previousAdventuresOutputSchema>;
    const events = context.getStepResult('scrape-events') as z.infer<typeof scrapeEventsOutputSchema>;
    const weatherResult = context.getStepResult('get-weather');

    if (!weatherResult) {
      throw new Error('Weather data not available');
    }

    const weather = weatherResult as { location: string, conditions: string, temperature: number, high: number, low: number, hourly: { time: string, temperature: number }[] };

    const result = await mastra?.agents?.weatherAgent.generate([
      {
        role: 'system',
        content: `The weather in ${weather.location} is ${weather.conditions} with a current temperature of ${weather.temperature}°F. 
Today's high will be ${weather.high}°F and the low will be ${weather.low}°F. 
Hourly forecast: ${weather.hourly.map(h => `${h.time}: ${h.temperature}°F`).join(', ')}.`,
      },
      {
        role: 'system',
        content: `The previous adventures are ${previousAdventures.adventures.map(a => `${a.adventure} in ${a.date}`).join(', ')}.`,
      },
      {
        role: 'system',
        content: `The events available in ${weather.location} are ${events.scrapeResults.map(e => `${e.result.events.map(event => `${event.title} on ${event.date} - ${event.link}`).join(', ')}`).join(', ')}.`,
      },
      {
        role: 'user',
        content: `You are a helpful adventure assistant that uses accurate weather information, previous adventures, and local events to suggest the best adventure for the user.
 
Your primary function is to provide a fun adventure suggestion based on the weather for specific locations. When responding:
- Keep responses concise but informative
- Always include a fun adventure suggestion specific to ${weather.location}
- Always ensure the adventure suggestion is different than previous suggestions
- Include specific landmarks, parks, or attractions in ${weather.location} when possible
- Make the adventure appropriate for the current weather conditions
- If there are no events available, just suggest an adventure based on the weather and previous adventures.
- If there are events available, consider the events available for today and suggest an adventure based on the weather and events.
- If you suggest an event, indicate from where you got the event information and include a link.

Generate a fun adventure for ${weather.location}.`,
      },
    ]);

    return {
      result: {
        condition: weather.conditions,
        temperature: weather.temperature,
        suggestion: result?.text || '',
        location: weather.location,
      }
    };
  },
});

const saveAdventureStep = new Step({
  id: 'save-adventure',
  description: 'Save the adventure to the database',
  inputSchema: z.object({}),
  outputSchema: z.object({}),
  execute: async ({ context }) => {
    mastraLogger.info('[Save adventure step] Starting save adventure step with context:', context);
    const adventureDataStepResult = context.getStepResult('generate-adventure');
    if (!adventureDataStepResult) {
      throw new Error('Adventure data not available');
    }

    const adventureData = adventureDataStepResult as {
      result: {
        condition: string,
        temperature: number,
        suggestion: string,
        location: string
      }
    };

    const weatherResult = context.getStepResult('get-weather');
    if (!weatherResult) {
      throw new Error('Weather data not available');
    }

    const weather = weatherResult as {
      location: string,
      conditions: string,
      temperature: number,
      high: number,
      low: number
    };

    console.log('[Save adventure step] Saving adventure with data:', {
      weather: `${adventureData.result.condition} (High: ${weather.high}°F, Low: ${weather.low}°F)`,
      temperature: adventureData.result.temperature,
      condition: adventureData.result.condition,
      suggestion: adventureData.result.suggestion,
      location: adventureData.result.location,
    });

    const adventure = await prisma.adventure.create({
      data: {
        weather: `${adventureData.result.condition} (High: ${weather.high}°F, Low: ${weather.low}°F)`,
        temperature: adventureData.result.temperature,
        condition: adventureData.result.condition,
        suggestion: adventureData.result.suggestion,
        location: adventureData.result.location || weather.location,
      },
    });

    const adventureAfterSave = await prisma.adventure.findUnique({
      where: { id: adventure.id },
    });
    console.log('[Save adventure step] Adventure saved:', adventureAfterSave);

    return { adventure };
  },
});

export const generateAdventure = new Workflow({
  name: 'generate-adventure',
  triggerSchema: z.object({
    location: z.string().describe("City name"),
  }),
});

const scrapeEventsOutputSchema = z.object({
  scrapeResults: z.array(z.object({
    url: z.string(),
    result: z.object({
      events: z.array(z.object({
        title: z.string(),
        date: z.string(),
        link: z.string(),
      })),
    }),
  })),
});

const scrapeEventsDataSources = new Step({
  id: "scrape-events",
  description: 'Scrape the events from the data sources',
  inputSchema: z.object({
    location: z.string().describe("City name"),
  }),
  outputSchema: scrapeEventsOutputSchema,
  execute: async ({ context }) => {
    
    const dataSources = context.getStepResult('prep-events-data-sources') as z.infer<typeof eventSourceSchema>[];

    const scrapeResults = await Promise.all(dataSources.map(async (dataSource) => {
      return { url: dataSource.url, result: await doScrape(dataSource.url, dataSource.prompt) };
    }));

    return { scrapeResults };
  },
});

const eventSourceSchema = z.object({
  url: z.string(),
  prompt: z.string(),
  schema: z.any().describe("Schema to extract from the website"),
});

const prepEventsDataSources = new Step({
  id: "prep-events-data-sources",
  description: 'Prepare the events data sources for scraping',
  inputSchema: z.object({}),
  outputSchema: z.array(eventSourceSchema),
  execute: async ({ context }) => {
    if (context.triggerData.location === "Boston") {
      return [{
        url: "https://www.downtownboston.org/events/",
        prompt: "Collect all the titles, dates, and links of each event from the page.",
        schema: z.object({
          events: z.array(z.object({
            title: z.string(),
            date: z.string(),
            link: z.string(),
          })),
        })
      }];
    }
    return [];
  },
});
generateAdventure
  .step(weatherTool)
  .then(prepEventsDataSources)
  .then(scrapeEventsDataSources)
  .then(previousAdventuresTool)
  .then(adventureAgentInvokeStep)
  .then(saveAdventureStep)
  .commit();