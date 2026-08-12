import prisma from "../../lib/prisma";
import { AIService } from "../ai/ai.service";

export async function semanticSearch(
  userId: string,
  query: string,
  limit = 20,
) {
  const queryEmbedding = await AIService.generateEmbedding(query);
  const vectorString = `[${queryEmbedding.join(",")}]`;

  const rawResults = await prisma.$queryRawUnsafe<{ id: string; similarity: number }[]>(
    `
    SELECT 
      id, 
      1 - (embedding <=> $2::vector) as similarity
    FROM atoms
    WHERE user_id = $1::uuid  -- <-- CHANGED from "userId" to user_id
    ORDER BY embedding <=> $2::vector
    LIMIT $3::int;
    `,
    userId,
    vectorString,
    limit
  );

  // If no matches found, return early
  if (rawResults.length === 0) return [];

  // 2. Extract IDs and map the scores for easy lookup later
  const scoreMap = new Map(
    rawResults.map((r) => [r.id, Math.round(r.similarity * 100) / 100]),
  );
  const ids = rawResults.map((r) => r.id);

  // 3. Fetch the full, safely-typed records using standard Prisma!
  const atoms = await prisma.atom.findMany({
    where: {
      id: { in: ids },
    },
  });

  // 4. Attach the similarity scores and re-sort them (since findMany scrambles the order)
  return atoms
    .map((atom) => ({
      id: atom.id,
      content: atom.contentText,
      sourceUrl: atom.sourceUrl,
      sourceType: atom.sourceType,
      flashcardFront: atom.flashcardFront,
      flashcardBack: atom.flashcardBack,
      createdAt: atom.createdAt,
      similarity: scoreMap.get(atom.id) || 0,
    }))
    .sort((a, b) => b.similarity - a.similarity);
}
