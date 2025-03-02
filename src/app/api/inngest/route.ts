import { serve } from "inngest/next";
import { generateAdventure } from "../../../lib/inngest/generate-daily-adventure.function";
import { inngest } from "../../../lib/inngest/client";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [generateAdventure],
});
