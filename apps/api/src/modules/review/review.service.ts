import prisma from "../../lib/prisma";
import { fsrs, buildCard, mapGradeToRating } from "../../lib/fsrs";

export async function getTodayReviewQueue(userId: string, limit = 50) {
  const now = new Date();

  const reviews = await prisma.reviewState.findMany({
    where: {
      userId,
      due: {
        lte: now,
      },
    },
    orderBy: {
      due: "asc",
    },
    take: limit,
    include: {
      atom: {
        include: {
          tags: {
            include: {
              tag: true,
            },
          },
        },
      },
    },
  });

  return reviews;
}

export async function gradeAtom(userId: string, atomId: string, grade: number) {
  const reviewState = await prisma.reviewState.findUnique({
    where: {
      atomId_userId: {
        atomId,
        userId,
      },
    },
  });

  if (!reviewState) {
    throw new Error("Review state not found");
  }

  const card = buildCard(reviewState);
  const schedulingCards = fsrs.repeat(card, new Date());
  const next = schedulingCards[mapGradeToRating(grade)];

  // update the review state aand Log history in parallel
  await prisma.$transaction([
    prisma.reviewState.update({
      where: {
        atomId_userId: {
          atomId,
          userId,
        },
      },
      data: {
        due: next.card.due,
        stability: next.card.stability,
        difficulty: next.card.difficulty,
        elapsedDays: next.card.elapsed_days,
        scheduledDays: next.card.scheduled_days,
        reps: next.card.reps,
        lapses: next.card.lapses,
        state: next.card.state,
        lastReview: next.card.last_review,
        learningSteps: next.card.learning_steps,
      },
    }),
    prisma.reviewLog.create({
      data: {
        atomId,
        userId,
        rating: grade,
        stability: next.card.stability,
        difficulty: next.card.difficulty,
        interval: next.card.scheduled_days,
      },
    }),
  ]);

  return {
    due: next.card.due,
    interval: next.card.scheduled_days,
  };
}
