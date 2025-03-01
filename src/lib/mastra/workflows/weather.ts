import { mastra } from '@/lib/mastra';
import { z } from 'zod';

// Define the schema for weather data
const weatherSchema = z.object({
  condition: z.string(),
  temperature: z.number(),
  suggestion: z.string().min(20)
});

export type WeatherData = z.infer<typeof weatherSchema>;

export async function getWeatherAdventure(): Promise<WeatherData> {
  const result = await mastra.getAgent("weatherAgent").generate(
    "What's the weather like in Boston today and suggest a single best adventure based on the conditions?",
    { output: weatherSchema }
  );
  
  console.log(result);

  return result.object;
}