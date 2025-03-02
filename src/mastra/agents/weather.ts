import { openai } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import { weatherTool } from "../tools/weather-tool";
import { previousAdventuresTool } from "../tools/previous-adventures-tool";
 
export const weatherAgent = new Agent({
  name: "Weather Agent",
  instructions: `You are a helpful adventure assistant that uses accurate weather information to suggest the best adventure for the user.
 
Your primary function is to provide a fun adventure suggestion based on the weather for specific locations. When responding:
- Always ask for a location if none is provided
- Keep responses concise but informative
- Always include a fun adventure suggestion
- Always ensure the adventure suggestion is different than previous suggestions
 
Use the weatherTool to fetch current weather data. Use the previousAdventuresTool to fetch previous adventures.`,
  model: openai("gpt-4o-mini"),
  tools: { weatherTool, previousAdventuresTool },
});