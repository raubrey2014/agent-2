import { Logger, Mastra } from "@mastra/core";
 
import { weatherAgent } from "./agents/weather";
import { generateAdventure } from "./workflows/generate-adventure";

const isProduction = process.env.NODE_ENV === 'production';

export const mastraLogger = new Logger({
  name: "agent-2-mastra",
  level: isProduction ? "info" : "debug",
});

export const mastra = new Mastra({
  agents: { weatherAgent },
  workflows: { generateAdventure },
  logger: mastraLogger,
});