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

// Resolve a user-supplied blob URL into the blob name, verifying it points at
// our container AND at a path owned by the authenticated user. Prevents
// cross-user blob access (IDOR) and off-container URLs.
function resolveOwnedBlob(fileUrl: string, folder: string, userId: string): string {
  let url: URL;
  try {
    url = new URL(fileUrl);
  } catch {
    throw new Error("Invalid file URL");
  }

  const expectedPrefix = `/${azureStorageContainerName}/${folder}/${userId}/`;
  if (!url.pathname.startsWith(expectedPrefix)) {
    throw new Error("Invalid file URL");
  }

  const blobName = decodeURIComponent(url.pathname.substring(expectedPrefix.length));
  if (!blobName) {
    throw new Error("Invalid file URL");
  }

  return `${folder}/${userId}/${blobName}`;
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

export async function getAtomById(userId: string, atomId: string) {
  const atom = await prisma.atom.findFirst({
    where: { id: atomId, userId },
    include: {
      tags: { include: { tag: true } },
    },
  });

  if (!atom) return null;

  return {
    id: atom.id,
    content: atom.contentText,
    sourceUrl: atom.sourceUrl,
    sourceType: atom.sourceType,
    flashcardFront: atom.flashcardFront,
    flashcardBack: atom.flashcardBack,
    tags: atom.tags.map((at) => at.tag.name),
    createdAt: atom.createdAt,
  };
}

export async function createVoiceAtom(userId: string, fileUrl: string) {
  try {
    const blobName = resolveOwnedBlob(fileUrl, "voice", userId);

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

const MAX_ARTICLE_BYTES = 5 * 1024 * 1024;
const ARTICLE_FETCH_TIMEOUT_MS = 10_000;

// Block URLs that point at the server itself or private/local networks (SSRF).
function isBlockedHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost")) return true;

  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(host)) {
    const parts = host.split(".").map(Number);
    if (parts.some((p) => p > 255)) return true;
    const [a, b] = parts;
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 192 && b === 168) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
  }
  if (host === "::1" || host === "::" || host === "0:0:0:0:0:0:0:1") return true;

  return false;
}

// Drain the response body into a string, aborting if it exceeds the size cap.
async function readBodyCapped(res: Response, maxBytes: number): Promise<string> {
  if (!res.body) {
    throw new Error("Could not parse article");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let received = 0;
  let result = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    result += decoder.decode(value, { stream: true });
    if (received > maxBytes) {
      reader.cancel();
      throw new Error("Could not parse article: too large");
    }
  }
  result += decoder.decode();
  return result;
}

export async function createArticleAtom(userId: string, url: string) {
  try {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new Error("Could not parse article");
    }

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error("Could not parse article");
    }
    if (isBlockedHost(parsed.hostname)) {
      throw new Error("Could not parse article");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ARTICLE_FETCH_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(url, {
        signal: controller.signal,
        redirect: "follow",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`);
    }

    const html = await readBodyCapped(response, MAX_ARTICLE_BYTES);

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
    const blobName = resolveOwnedBlob(fileUrl, "pdf", userId);

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
    const blobName = resolveOwnedBlob(fileUrl, "images", userId);

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


