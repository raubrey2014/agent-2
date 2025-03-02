import prisma from "../../lib/db";
import { createTool } from "@mastra/core/tools";
import { Adventure } from "@prisma/client";
import { z } from "zod";
 
interface PreviousAdventuresResponse {
  adventures: {
    adventure: string;
    date: string;
  }[];
}

const outputSchema = z.object({
  adventures: z.array(z.object({
    adventure: z.string(),
    date: z.string(),
  })),
});
 
export const previousAdventuresTool = createTool({
  id: "get-previous-adventures",
  description: "Get previous adventures",
  inputSchema: z.object({}),
  outputSchema: outputSchema,
  execute: async (): Promise<PreviousAdventuresResponse> => {
    console.log("[get-previous-adventures] Getting previous adventures");

    const adventures = await prisma.adventure.findMany() as Adventure[];
    console.log("[get-previous-adventures] Found adventures", adventures);
    return {
      adventures: adventures.map((adventure) => ({
        adventure: adventure.suggestion,
        date: adventure.createdAt.toISOString(),
      }))
    };
  },
});
