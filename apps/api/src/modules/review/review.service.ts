import prisma from "../../lib/prisma";
import { fsrs, buildCard, mapGradeToRating } from "../../lib/fsrs";

const DAY_MS = 24 * 60 * 60 * 1000;

function toDayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function computeStreaks(counts: Map<string, number>, todayKey: string) {
  const daysWithReviews = new Set(counts.keys());

  // Current streak: consecutive days ending today (or yesterday, if not yet reviewed today)
  let currentStreak = 0;
  let cursor = new Date(`${todayKey}T00:00:00`);
  if (!daysWithReviews.has(toDayKey(cursor))) {
    cursor = new Date(cursor.getTime() - DAY_MS);
  }
  while (daysWithReviews.has(toDayKey(cursor))) {
    currentStreak++;
    cursor = new Date(cursor.getTime() - DAY_MS);
  }

  // Best streak: longest run of consecutive review days
  const dates = [...daysWithReviews].sort();
  let bestStreak = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const key of dates) {
    const d = new Date(`${key}T00:00:00`);
    run = prev && d.getTime() - prev.getTime() === DAY_MS ? run + 1 : 1;
    if (run > bestStreak) bestStreak = run;
    prev = d;
  }

  return { currentStreak, bestStreak };
}

export async function getReviewStats(userId: string) {
  const since = new Date(Date.now() - 90 * DAY_MS);
  const logs = await prisma.reviewLog.findMany({
    where: { userId, reviewedAt: { gte: since } },
    select: { reviewedAt: true, rating: true },
    orderBy: { reviewedAt: "asc" },
  });

  const countsByDay = new Map<string, number>();
  const grades = { again: 0, hard: 0, good: 0, easy: 0 };
  for (const log of logs) {
    const key = toDayKey(log.reviewedAt);
    countsByDay.set(key, (countsByDay.get(key) ?? 0) + 1);
    if (log.rating === 1) grades.again++;
    else if (log.rating === 2) grades.hard++;
    else if (log.rating === 3) grades.good++;
    else grades.easy++;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days: { date: string; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today.getTime() - i * DAY_MS);
    const key = toDayKey(d);
    days.push({ date: key, count: countsByDay.get(key) ?? 0 });
  }

  const { currentStreak, bestStreak } = computeStreaks(countsByDay, toDayKey(today));

  return {
    totalReviews: logs.length,
    currentStreak,
    bestStreak,
    days,
    grades,
  };
}

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
