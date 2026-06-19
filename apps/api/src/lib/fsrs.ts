import { FSRS, Rating, Card } from "ts-fsrs";

export const fsrs = new FSRS({});

type ReviewRating = Rating.Again | Rating.Hard | Rating.Good | Rating.Easy;

export function mapGradeToRating(grade: number): ReviewRating {
  switch (grade) {
    case 1:
      return Rating.Again;
    case 2:
      return Rating.Hard;
    case 3:
      return Rating.Good;
    case 4:
      return Rating.Easy;
    default:
      throw new Error(`Invalid grade: ${grade}`);
  }
}

export function buildCard(reviewState: any): Card {
  return {
    due: reviewState.due,
    stability: reviewState.stability,
    difficulty: reviewState.difficulty,
    elapsed_days: reviewState.elapsedDays,
    scheduled_days: reviewState.scheduledDays,
    reps: reviewState.reps,
    lapses: reviewState.lapses,
    state: reviewState.state,
    last_review: reviewState.lastReview ?? undefined,
    learning_steps: reviewState.learningSteps ?? undefined,
  };
}
