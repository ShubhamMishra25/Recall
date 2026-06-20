import prisma from "../../lib/prisma";

export class SerendipityService {
  static async generateDailyCard(userId: string) {
    const recentReviews = await prisma.reviewLog.findMany({
      where: {
        userId,
        reviewedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
      select: {
        atomId: true,
      },
      distinct: ["atomId"],
    });

    const recentAtomIds = recentReviews.map((r) => r.atomId);

    if (recentAtomIds.length === 0) {
      return this.getRandomOldAtom(userId);
    }

    const serendipityResult = await prisma.$queryRawUnsafe<any[]>(
      `
  WITH recent_vectors AS (
    SELECT embedding
    FROM atoms
    WHERE id = ANY($1::uuid[])
  ),
  average_vector AS (
    SELECT avg(embedding) AS centroid
    FROM recent_vectors
  )
  SELECT
    a.id,
    a.content_text,
    a.flashcard_front,
    a.flashcard_back,
    1 - (
      a.embedding <=>
      (SELECT centroid FROM average_vector)
    ) AS similarity
  FROM atoms a
  WHERE a.user_id = $2::uuid
    AND a.id != ALL($1::uuid[])
  ORDER BY
    a.embedding <=>
    (SELECT centroid FROM average_vector)
  LIMIT 1
  `,
      recentAtomIds,
      userId,
    );

    if (!serendipityResult || serendipityResult.length === 0) {
      return this.getRandomOldAtom(userId);
    }

    return serendipityResult[0];
  }

  private static async getRandomOldAtom(userId: string) {
    const result = await prisma.$queryRawUnsafe<any[]>(
      `
    SELECT
      id,
      content_text,
      flashcard_front,
      flashcard_back
    FROM atoms
    WHERE user_id = $1::uuid
    ORDER BY RANDOM()
    LIMIT 1
    `,
      userId,
    );

    return result[0] || null;
  }
}
