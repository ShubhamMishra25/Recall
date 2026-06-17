import prisma from "../../lib/prisma";

// Temporary hard-coded user ID
const FAKE_USER_ID = "00000000-0000-0000-0000-000000000001";

interface CreateAtomInput {
  content: string;
  sourceUrl?: string;
  sourceType?: "article" | "note" | "pdf" | "voice" | "image";
  tags?: string[];
}

export async function createAtom(input: CreateAtomInput) {
  const { content, sourceUrl, sourceType = "note", tags = [] } = input;

  const atom = await prisma.atom.create({
    data: {
      contentText: content,
      sourceUrl: sourceUrl ?? null,
      sourceType,
      userId: FAKE_USER_ID,
      tags: {
        create: tags.map((tagName) => ({
          tag: {
            connectOrCreate: {
              where: {
                userId_name: {
                  userId: FAKE_USER_ID,
                  name: tagName,
                },
              },
              create: { name: tagName, userId: FAKE_USER_ID },
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

  return {
    id: atom.id,
    content: atom.contentText,
    sourceUrl: atom.sourceUrl,
    sourceType: atom.sourceType,
    tags: atom.tags.map((at) => at.tag.name),
    createdAt: atom.createdAt,
  };
}

export async function listAtoms(page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  const [atoms, total] = await Promise.all([
    prisma.atom.findMany({
      where: { userId: FAKE_USER_ID },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        tags: {
          include: { tag: true },
        },
      },
    }),
    prisma.atom.count({ where: { userId: FAKE_USER_ID } }),
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
