import prisma from "../../lib/prisma";
import { createEmptyCard } from "ts-fsrs";
import { AIService } from "../ai/ai.service";

interface CreateAtomInput {
  content: string;
  userId: string;
  sourceUrl?: string;
  sourceType?: "article" | "note" | "pdf" | "voice" | "image";
}

export async function createAtom(input: CreateAtomInput) {
  const { content, sourceUrl, sourceType = "note", userId } = input;

  // Run AI tasks in parallel to save time
  const [aiResult, embedding] = await Promise.all([
    AIService.processAtomContent(content),
    AIService.generateEmbedding(content),
  ]);

  const card = createEmptyCard();

  // wrap the entire operation in a transaction to ensure atomicity
  const atom = await prisma.$transaction(async (tx) => {
    const newAtom = await tx.atom.create({
      data: {
        contentText: content,
        sourceUrl: sourceUrl ?? null,
        sourceType,
        userId,
        flashcardFront: aiResult?.front,
        flashcardBack: aiResult?.back,
        tags: {
          create: (aiResult?.tags || []).map((tagName) => ({
            tag: {
              connectOrCreate: {
                where: {
                  userId_name: {
                    userId,
                    name: tagName,
                  },
                },
                create: { name: tagName, userId },
              },
            },
          })),
        },
      },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    await tx.$executeRawUnsafe(
      `UPDATE atoms SET embedding = $1::vector WHERE id = $2::uuid`, 
      `[${embedding.join(",")}]`,
      newAtom.id,
    );

    // create the FSRS review state tied to this atom
    await tx.reviewState.create({
      data: {
        atomId: newAtom.id,
        userId,
        due: card.due,
        stability: card.stability,
        difficulty: card.difficulty,
        elapsedDays: card.elapsed_days,
        scheduledDays: card.scheduled_days,
        reps: card.reps,
        lapses: card.lapses,
        state: card.state,
        learningSteps: card.learning_steps,
        lastReview: card.last_review,
      },
    });

    return newAtom;
  });

  return {
    id: atom.id,
    content: atom.contentText,
    sourceUrl: atom.sourceUrl,
    sourceType: atom.sourceType,
    tags: atom.tags.map((at) => at.tag.name),
    createdAt: atom.createdAt,
  };
}

export async function listAtoms(userId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  const [atoms, total] = await Promise.all([
    prisma.atom.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        tags: {
          include: { tag: true },
        },
      },
    }),
    prisma.atom.count({ where: { userId } }),
  ]);

  return {
    data: atoms.map((atom) => ({
      id: atom.id,
      content: atom.contentText,
      sourceUrl: atom.sourceUrl,
      sourceType: atom.sourceType,
      tags: atom.tags.map((at) => at.tag.name),
      createdAt: atom.createdAt,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
