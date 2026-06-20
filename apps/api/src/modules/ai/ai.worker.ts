import { Queue, Worker } from "bullmq";
import { redisConnection } from "../../lib/redis";
import prisma from "../../lib/prisma";
import { AIService } from "./ai.service";

export const aiQueue = new Queue("ai-pipeline", {
  connection: redisConnection as any,
});

export const aiWorker = new Worker("ai-pipeline", async (job) => {
  console.log(`Starting AI processing for Atom ${job.data.atomId}`);

  const { atomId, content, userId } = job.data;

  try {
    const embedding = await AIService.generateEmbedding(content);
    await prisma.$executeRaw`UPDATE atoms SET embedding = ${JSON.stringify(embedding)}::vector WHERE id = ${atomId}::uuid`;

    // Generate Flashcards (for FSRS Review)
    const aiData = await AIService.processAtomContent(content);

    if (aiData) {
      await prisma.atom.update({
        where: { id: atomId },
        data: { flashcardFront: aiData.front, flashcardBack: aiData.back }
      });

      // Add tags to Atom
      for (const tagName of aiData.tags) {
        const tag = await prisma.tag.upsert({
          where: { userId_name: { userId, name: tagName } },
          update: {},
          create: { name: tagName, userId }
        });

        await prisma.atomTag.upsert({
          where: { atomId_tagId: { atomId, tagId: tag.id } },
          update: {},
          create: { atomId, tagId: tag.id }
        });
      }
    }
    console.log(`AI processing complete for Atom: ${atomId}`);
  } catch (error) {
    console.error(`Failed to process Atom: ${atomId}`, error);
    throw error;
  }
},
  { connection: redisConnection as any }
);