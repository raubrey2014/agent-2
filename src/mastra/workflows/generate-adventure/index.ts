import { previousAdventuresTool } from "../../tools/previous-adventures-tool";
import { weatherTool } from "../../tools/weather-tool";
import { Step, Workflow } from "@mastra/core/workflows";
import { z } from "zod";
import { mastraLogger } from "../../index";
import prisma from "../../../lib/db";

const adventureAgentInvokeStep = new Step({
  id: 'adventure-agent-invoke',
  inputSchema: z.object({}),
  outputSchema: z.object({
    result: z.object({
      condition: z.string(),
      temperature: z.number(),
      suggestion: z.string(),
    }),
  }),
  execute: async ({ context, mastra }) => {
    mastraLogger.info('[Adventure agent invoke step] Starting adventure agent invoke step with context:', context);
    const previousAdventures = context.getStepResult('get-previous-adventures');
    const weatherResult = context.getStepResult('get-weather');

    if (!weatherResult) {
      throw new Error('Weather data not available');
    }

    const weather = weatherResult as { location: string, conditions: string, temperature: number };

    const result = await mastra?.agents?.weatherAgent.generate([
      {
        role: 'system',
        content: `The weather in ${weather.location} is ${weather.conditions} with a temperature of ${weather.temperature}°F.`,
      },
      {
        role: 'system',
        content: `The previous adventures are ${previousAdventures}.`,
      },
      {
        role: 'user',
        content: `You are a helpful adventure assistant that uses accurate weather information to suggest the best adventure for the user.
 
Your primary function is to provide a fun adventure suggestion based on the weather for specific locations. When responding:
- Keep responses concise but informative
- Always include a fun adventure suggestion
- Always ensure the adventure suggestion is different than previous suggestions

Generate a fun adventure for ${weather.location}.`,
      },
    ]);

    return {
      result: {
        condition: weather.conditions,
        temperature: weather.temperature,
        suggestion: result?.text || '',
      }
    };
  },
});

const saveAdventureStep = new Step({
  id: 'save-adventure',
  inputSchema: z.object({}),
  outputSchema: z.object({}),
  execute: async ({ context }) => {
    mastraLogger.info('[Save adventure step] Starting save adventure step with context:', context);
    console.log('[Save adventure step] Starting save adventure step with context:', context);
    const adventureDataStepResult = context.getStepResult('adventure-agent-invoke');
    if (!adventureDataStepResult) {
      throw new Error('Adventure data not available');
    }

    const adventureData = adventureDataStepResult as { result: { condition: string, temperature: number, suggestion: string } };


    const adventure = await prisma.adventure.create({
      data: {
        weather: `${adventureData.result.condition}, ${adventureData.result.temperature}°F`,
        temperature: adventureData.result.temperature,
        condition: adventureData.result.condition,
        suggestion: adventureData.result.suggestion,
      },
    });

    return { adventure };
  },
});

export const generateAdventure = new Workflow({
  name: 'generate-adventure',
  triggerSchema: z.object({
    location: z.string().describe("City name"),
  }),
});

generateAdventure
  .step(weatherTool)
  .then(previousAdventuresTool)
  .then(adventureAgentInvokeStep)
  .then(saveAdventureStep)
  .commit();