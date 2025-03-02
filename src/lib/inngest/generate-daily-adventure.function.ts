import { inngest } from "./client";
import { mastra } from "../../mastra";

export const generateAdventure = inngest.createFunction(
  { id: "generate-daily-adventure" },
  { cron: "TZ=America/New_York 0 12 * * *" },
  async ({ step }) => {
    console.log('Generating adventure via workflow...', new Date().toISOString(), JSON.stringify(step));
    const { runId, start } = mastra.getWorkflow('generateAdventure').createRun();
    try {
      console.log('Running workflow with runId:', runId);
      const result = await start({ triggerData: { location: "Boston" } });
      console.log('Workflow result for runId:', runId, 'is:', result);

      return {
        message: 'Adventure generated successfully',
        step,
        runId,
        result,
      };
    } catch (error) {
      console.error('Error generating adventure:', error);
      return {
        message: 'Error generating adventure',
        runId,
        error,
      };
    }
  }
);