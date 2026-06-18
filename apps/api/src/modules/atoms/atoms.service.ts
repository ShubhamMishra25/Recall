import prisma from "../../lib/prisma";

interface CreateAtomInput {
  content: string;
  userId: string;
  sourceUrl?: string;
  sourceType?: "article" | "note" | "pdf" | "voice" | "image";
  tags?: string[];
}

export async function createAtom(input: CreateAtomInput) {
  const { content, sourceUrl, sourceType = "note", tags = [], userId } = input;

  const atom = await prisma.atom.create({
    data: {
      contentText: content,
      sourceUrl: sourceUrl ?? null,
      sourceType,
      userId,
      tags: {
        create: tags.map((tagName) => ({
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

  return {
    id: atom.id,
    content: atom.contentText,
    sourceUrl: atom.sourceUrl,
    sourceType: atom.sourceType,
    tags: atom.tags.map((at) => at.tag.name),
    createdAt: atom.createdAt,
  };
}

export async function listAtoms( userId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  const [atoms, total] = await Promise.all([
    prisma.atom.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
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
