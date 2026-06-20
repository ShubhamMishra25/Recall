import { Queue, Worker } from "bullmq";
import prisma from "../../lib/prisma";
import { SerendipityService } from "./serendipity.service";
import { redisConnection } from "../../lib/redis";

// 3. Create the Queue
export const serendipityQueue = new Queue("daily-serendipity", { 
  connection: redisConnection as any
});

// 4. Create the Worker Engine
export const serendipityWorker = new Worker("daily-serendipity", async (job) => {
    if (job.name === "generate-all-cards") {
      console.log("Starting Daily Serendipity Generation via Upstash...");
      
      const users = await prisma.user.findMany({ select: { id: true } });
      
      for (const user of users) {
        try {
          const card = await SerendipityService.generateDailyCard(user.id);
          
          if (card) {
            // Cache the card in Upstash for 24 hours (86400 seconds)
            await redisConnection.setex(`serendipity:${user.id}`, 86400, JSON.stringify(card));
          }
        } catch (error) {
          console.error(`Failed to generate card for user ${user.id}:`, error);
        }
      }
      
      console.log("Daily Serendipity Generation Complete!");
    }
  }, 
  { connection: redisConnection as any }
);

// 5. Function to start the cron schedule
export async function startSerendipityCron() {
  // Clear old jobs so they don't duplicate when you restart the dev server
  const repeatableJobs = await serendipityQueue.getRepeatableJobs();
  for (const job of repeatableJobs) {
    await serendipityQueue.removeRepeatableByKey(job.key);
  }

  // Schedule to run every day at Midnight
  await serendipityQueue.add("generate-all-cards", {}, {
    repeat: { pattern: "0 0 * * *" } 
  });
}