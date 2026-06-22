import prisma from "../../lib/prisma";
import { createEmptyCard } from "ts-fsrs";
import { openai } from "../../lib/ai";
import { toFile } from "openai";
import { containerClient, azureStorageContainerName } from "../../lib/azure-storage";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import { PDFParse } from "pdf-parse";

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

export async function createArticleAtom(userId: string, url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`);
    }

    const html = await response.text();

    const dom = new JSDOM(html, { url })
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article || !article.textContent) {
      throw new Error("Could not parse article");
    }

    const fullText = `Title: ${article.title}\n\n${article.textContent.trim()}`;

    const atom = await createAtom({
      content: fullText,
      userId,
      sourceUrl: url,
      sourceType: "article"
    })

    return atom;
  } catch (error) {
    console.error("Error creating article atom:", error);
    throw error;
  }
}

export async function createPdfAtom(userId: string, fileUrl: string, fileName: string) {
  try {
    const urlPath = new URL(fileUrl).pathname;
    const blobName = decodeURIComponent(urlPath.split("/").slice(2).join("/"));

    const blobClient = containerClient.getBlockBlobClient(blobName);
    const arrayBuffer = await blobClient.downloadToBuffer();

    const buffer = Buffer.from(arrayBuffer);

    const parser = new PDFParse({
      data: buffer,
    });

    const result = await parser.getText();

    await parser.destroy();

    const extractedText = result.text?.trim();

    if (!extractedText || extractedText.length === 0) {
      throw new Error("Could not parse PDF");
    }

    const fullText = `Document: ${fileName}\n\n${extractedText}`;

    const atom = await createAtom({
      content: fullText,
      userId,
      sourceUrl: fileUrl,
      sourceType: "pdf"
    })

    return atom;
  } catch (error) {
    console.error("Error creating PDF atom:", error);
    throw error;
  }
}

export async function createImageAtom(userId: string, fileUrl: string, fileName: string) {
  try {
    const urlPath = new URL(fileUrl).pathname;
    const blobName = decodeURIComponent(urlPath.split("/").slice(2).join("/"));

    const blobClient = containerClient.getBlockBlobClient(blobName);
    const buffer = await blobClient.downloadToBuffer();

    const base64Image = buffer.toString("base64");
    const mimeType = fileName.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";

    const response = await openai.chat.completions.create({
      model: process.env.AZURE_OPENAI_CHAT_DEPLOYMENT || "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Extract all text, notes, and equations from the image.If there are diagrams, describe what they show. Format the entire response beautifully in Markdown so it can be converted into study flashcards." },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 1500,
    });

    const extractedText = response.choices[0].message.content?.trim();

    if (!extractedText || extractedText.length === 0) {
      throw new Error("Could not extract text from image");
    }

    const fullText = `Image Captured: ${fileName}\n\n${extractedText}`;
    const atom = await createAtom({
      content: fullText,
      userId,
      sourceUrl: fileUrl,
      sourceType: "image"
    })

    return atom;
  } catch (error) {
    console.error("Error creating image atom:", error);
    throw error;
  }
}


