import prisma from "../../lib/prisma";
import { createEmptyCard } from "ts-fsrs";
import { openai } from "../../lib/ai";
import { toFile } from "openai";
import { containerClient, azureStorageContainerName } from "../../lib/azure-storage";

interface CreateAtomInput {
  content: string;
  userId: string;
  sourceUrl?: string;
  sourceType?: "article" | "note" | "pdf" | "voice" | "image";
}

export async function createAtom(input: CreateAtomInput) {
  const { content, sourceUrl, sourceType = "note", userId } = input;

  const card = createEmptyCard();

  // wrap the entire operation in a transaction to ensure atomicity
  const atom = await prisma.$transaction(async (tx) => {
    const newAtom = await tx.atom.create({
      data: {
        contentText: content,
        sourceUrl: sourceUrl ?? null,
        sourceType,
        userId,
      },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

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

export async function createVoiceAtom(userId: string, fileUrl: string) {
  try {
    const url = new URL(fileUrl);
    const pathPrefix = `/${azureStorageContainerName}/`;
    if (!url.pathname.startsWith(pathPrefix)) {
      throw new Error("Invalid file URL");
    }
    const blobName = decodeURIComponent(url.pathname.substring(pathPrefix.length));

    const blobClient = containerClient.getBlockBlobClient(blobName);
    const buffer = await blobClient.downloadToBuffer();

    const audioFile = await toFile(buffer, "audio.webm", { type: "audio/webm" })

    const transcription = await openai.audio.transcriptions.create({
      model: process.env.AZURE_OPENAI_WHISPER_DEPLOYMENT!,
      file: audioFile,
    })

    if (!transcription.text || transcription.text.trim().length === 0) {
      throw new Error("Could not transcribe audio")
    }

    const atom = await createAtom({
      content: transcription.text.trim(),
      userId,
      sourceUrl: fileUrl,
      sourceType: "voice"
    })

    return atom;
  } catch (error) {
    console.error("Error creating voice atom:", error);
    throw error;
  }
}