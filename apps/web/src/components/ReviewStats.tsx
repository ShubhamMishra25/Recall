import { useEffect, useState } from "react";
import { Flame, Trophy, Activity } from "lucide-react";
import { getReviewStats } from "@/lib/api";

interface ReviewStatsData {
  totalReviews: number;
  currentStreak: number;
  bestStreak: number;
  days: { date: string; count: number }[];
  grades: { again: number; hard: number; good: number; easy: number };
}

const GRADE_COLORS: Record<string, string> = {
  again: "bg-destructive/80",
  hard: "bg-orange-500/80",
  good: "bg-emerald-500/80",
  easy: "bg-sky-500/80",
};

const GRADE_LABELS: Record<string, string> = {
  again: "Again",
  hard: "Hard",
  good: "Good",
  easy: "Easy",
};

function formatDayKey(key: string): string {
  const [, m, d] = key.split("-");
  return `${parseInt(m, 10)}/${parseInt(d, 10)}`;
}

export function ReviewStats() {
  const [stats, setStats] = useState<ReviewStatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await getReviewStats();
        setStats(response.data);
      } catch {
        // Stats are a bonus — fail silently
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (isLoading) {
    return <div className="h-48 rounded-2xl border border-border bg-card animate-shimmer" />;
  }

  if (!stats || stats.totalReviews === 0) {
    return null;
  }

  const maxCount = Math.max(...stats.days.map((d) => d.count), 1);
  const totalGrades = stats.grades.again + stats.grades.hard + stats.grades.good + stats.grades.easy;

  const statsRow = [
    { icon: Flame, label: "Day streak", value: stats.currentStreak },
    { icon: Trophy, label: "Best streak", value: stats.bestStreak },
    { icon: Activity, label: "Total reviews", value: stats.totalReviews },
  ];

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Flame className="w-3.5 h-3.5 text-orange-400" />
        <span className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
          Review Stats
        </span>
      </div>

      {/* Streak + total stats */}
      <div className="grid grid-cols-3 gap-3">
        {statsRow.map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-xl border border-border/60 bg-muted/30 px-3 py-2.5 flex flex-col gap-0.5">
            <Icon className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xl font-semibold tabular-nums leading-tight">{value}</span>
            <span className="text-[10px] text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      {/* 30-day activity chart */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
          Last 30 days
        </p>
        <div className="flex items-end gap-[3px] h-20">
          {stats.days.map((day) => {
            const height = day.count === 0 ? 2 : Math.max((day.count / maxCount) * 100, 6);
            return (
              <div
                key={day.date}
                className="flex-1 min-w-0 rounded-sm bg-primary/70 hover:bg-primary transition-colors"
                style={{ height: `${height}%` }}
                title={`${formatDayKey(day.date)}: ${day.count} review${day.count === 1 ? "" : "s"}`}
              />
            );
          })}
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1 tabular-nums">
          <span>{formatDayKey(stats.days[0].date)}</span>
          <span>{formatDayKey(stats.days[15].date)}</span>
          <span>{formatDayKey(stats.days[29].date)}</span>
        </div>
      </div>

      {/* Grade distribution */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
          Recall accuracy
        </p>
        <div className="space-y-1.5">
          {(["again", "hard", "good", "easy"] as const).map((grade) => {
            const count = stats.grades[grade];
            const pct = totalGrades === 0 ? 0 : Math.round((count / totalGrades) * 100);
            return (
              <div key={grade} className="flex items-center gap-2">
                <span className="w-10 text-[10px] text-muted-foreground">{GRADE_LABELS[grade]}</span>
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full ${GRADE_COLORS[grade]}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-8 text-right text-[10px] tabular-nums text-muted-foreground">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
