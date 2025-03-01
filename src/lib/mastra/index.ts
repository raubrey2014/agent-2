import { Mastra } from "@mastra/core";
 
import { weatherAgent } from "./agents/weather";
import { z } from "zod";
export const mastra = new Mastra({
  agents: { weatherAgent },
});

const weatherSchema = z.object({
  weather: z.string(),
  temperature: z.number(),
  condition: z.string(),
  suggestion: z.string(),
});

type WeatherData = z.infer<typeof weatherSchema>;
export async function generateAventure(): Promise<WeatherData> {
  const agent = mastra.getAgent("weatherAgent");
 
  const result = await agent.generate("What is the single best adventure for today in Boston?", {
    output: weatherSchema,
  });
 
  console.log("Agent response:", result.object);

  return result.object;
}