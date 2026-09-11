import jwt from "jsonwebtoken";
import { Resend } from "resend";
import { createHash } from "crypto";
import prisma from "../../lib/prisma";
import { StringValue } from "ms";

const resend = new Resend(process.env.RESEND_API_KEY);

const JWT_SECRET = process.env.JWT_SECRET!;
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET!;

function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

const DAY_MS = 24 * 60 * 60 * 1000;

interface MagicLinkToken {
  type: "magic_link";
  email: string;
  userId: string;
}

interface AccessToken {
  type: "access";
  userId: string;
}

interface RefreshToken {
  type: "refresh";
  userId: string;
}

// Verify a token and reject it unless it carries the expected purpose.
// Prevents e.g. a magic-link token from being used as an access token.
function verifyToken<T extends { type: string }>(
  token: string,
  secret: string,
  expectedType: T["type"],
): T {
  const payload = jwt.verify(token, secret) as T;
  if (payload.type !== expectedType) {
    throw new Error("Unexpected token type");
  }
  return payload;
}

function refreshExpiryDate(): Date {
  return new Date(
    Date.now() +
      parseInt(process.env.REFRESH_TOKEN_EXPIRY || "7") * 24 * 60 * 60 * 1000,
  );
}

// Remove expired or long-revoked sessions so the table stays bounded.
async function pruneSessions(userId: string) {
  await prisma.session.deleteMany({
    where: {
      userId,
      OR: [
        { expiresAt: { lt: new Date() } },
        { revoked: true, createdAt: { lt: new Date(Date.now() - 30 * DAY_MS) } },
      ],
    },
  });
}

// Revoke the session associated with the presented refresh token.
// Note: this intentionally does NOT require a valid access token, so logout
// still works after the access token has expired (the refresh cookie alone
// identifies the session). A missing token is a harmless no-op.
export async function logout(refreshToken: string) {
  if (!refreshToken) return;
  await prisma.session.updateMany({
    where: {
      refreshTokenHash: hashRefreshToken(refreshToken),
      revoked: false,
    },
    data: { revoked: true },
  });
}

export async function sendMagicLink(email: string) {
  // check if user exists; if not, create
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({ data: { email } });
  }

  // Generate a short-lived JWT containing the email
  const token = jwt.sign(
    { type: "magic_link", email, userId: user.id },
    JWT_SECRET,
    { expiresIn: (process.env.MAGIC_LINK_EXPIRY || "15m") as StringValue },
  );

  // Build the magic link URL. The token travels in the URL fragment (#)
  // so it never reaches browser history, Referer headers, or server logs.
  const link = `${process.env.FRONTEND_URL || "http://localhost:5173"}/auth/verify#token=${token}`;

  console.log(`[auth] Magic link for ${email}: ${link}`);

  // Send the magic link via email using Resend
  await resend.emails.send({
    from: "Recall <onboarding@resend.dev>",
    to: email,
    subject: "Your Recall Magic Link",
    html: `<p>Click the link below to sign in to Recall. This link will expire in ${process.env.MAGIC_LINK_EXPIRY || "15 minutes"}.</p><p><a href="${link}">Sign in</a></p>`,
  });

  return { message: "Magic link sent" };
}

export async function verifyMagicLink(token: string) {
  let payload: MagicLinkToken;
  try {
    payload = verifyToken<MagicLinkToken>(token, JWT_SECRET, "magic_link");
  } catch (err) {
    throw new Error("Invalid or expired magic link");
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Generate access and refresh tokens
  const accessToken = jwt.sign({ type: "access", userId: user.id }, JWT_SECRET, {
    expiresIn: (process.env.ACCESS_TOKEN_EXPIRY || "1h") as StringValue,
  });

  const refreshToken = jwt.sign({ type: "refresh", userId: user.id }, REFRESH_SECRET, {
    expiresIn: (process.env.REFRESH_TOKEN_EXPIRY || "7d") as StringValue,
  });

  // Store the refresh token in the Session table
  await prisma.session.create({
    data: {
      userId: user.id,
      refreshTokenHash: hashRefreshToken(refreshToken),
      expiresAt: refreshExpiryDate(),
    },
  });

  await pruneSessions(user.id);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  };
}

export async function refreshAccessToken(oldRefreshToken: string) {
  let payload: RefreshToken;
  try {
    payload = verifyToken<RefreshToken>(oldRefreshToken, REFRESH_SECRET, "refresh");
  } catch (err) {
    throw new Error("Invalid refresh token");
  }

  // Check session exists, not revoked, and not past its DB expiry
  const session = await prisma.session.findFirst({
    where: {
      userId: payload.userId,
      refreshTokenHash: hashRefreshToken(oldRefreshToken),
      revoked: false,
      expiresAt: { gt: new Date() },
    },
  });
  if (!session) throw new Error("Refresh token not found or revoked");

  // Rotate: revoke the old session, and create a new one
  await prisma.session.update({
    where: { id: session.id },
    data: { revoked: true },
  });

  const newAccessToken = jwt.sign({ type: "access", userId: payload.userId }, JWT_SECRET, {
    expiresIn: (process.env.ACCESS_TOKEN_EXPIRY || "1h") as StringValue,
  });

  const newRefreshToken = jwt.sign({ type: "refresh", userId: payload.userId }, REFRESH_SECRET, {
    expiresIn: (process.env.REFRESH_TOKEN_EXPIRY || "7d") as StringValue,
  });

  await prisma.session.create({
    data: {
      userId: payload.userId,
      refreshTokenHash: hashRefreshToken(newRefreshToken),
      expiresAt: refreshExpiryDate(),
    },
  });

  await pruneSessions(payload.userId);

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}

const DEMO_EMAIL = process.env.DEMO_EMAIL || "demo@recall.app";

// Issue a session for the shared demo account (no email/magic link needed).
// A "Try the demo" entry point on the login screen calls this. Gated by
// ENABLE_DEMO === "false" at the controller; the endpoint is heavily rate
// limited (see auth.routes.ts demoLimiter).
export async function demoLogin() {
  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: { email: DEMO_EMAIL, name: "Demo User" },
  });

  await ensureDemoSeeded(user.id);

  const accessToken = jwt.sign({ type: "access", userId: user.id }, JWT_SECRET, {
    expiresIn: (process.env.ACCESS_TOKEN_EXPIRY || "1h") as StringValue,
  });

  const refreshToken = jwt.sign({ type: "refresh", userId: user.id }, REFRESH_SECRET, {
    expiresIn: (process.env.REFRESH_TOKEN_EXPIRY || "7d") as StringValue,
  });

  await prisma.session.create({
    data: {
      userId: user.id,
      refreshTokenHash: hashRefreshToken(refreshToken),
      expiresAt: refreshExpiryDate(),
    },
  });

  await pruneSessions(user.id);

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, name: user.name },
  };
}

// Seed the demo account with realistic sample content the first time it is
// used, so the app (library, dashboard, review queue) looks alive on entry.
// Idempotent: skips entirely once the demo user owns atoms.
async function ensureDemoSeeded(userId: string) {
  const existing = await prisma.atom.count({ where: { userId } });
  if (existing > 0) return;

  const DAY = 24 * 60 * 60 * 1000;
  const hoursFromNow = (h: number) => new Date(Date.now() + h * 60 * 60 * 1000);
  const daysFromNow = (d: number) => new Date(Date.now() + d * DAY);

  interface SeedAtom {
    key: string;
    sourceType: "article" | "note" | "pdf" | "voice" | "image";
    sourceUrl?: string;
    contentText: string;
    front: string;
    back: string;
    tags: string[];
    rs: {
      due: Date;
      stability: number;
      difficulty: number;
      elapsedDays: number;
      scheduledDays: number;
      reps: number;
      lapses: number;
      state: number;
      lastReview: Date;
      learningSteps: number;
    };
  }

  const seedAtoms: SeedAtom[] = [
    {
      key: "spacing",
      sourceType: "article",
      sourceUrl: "https://en.wikipedia.org/wiki/Spacing_effect",
      contentText:
        "The spacing effect is the finding that information is retained far better when learning is spread out over time rather than massed into a single session. While cramming feels productive, it produces weak, rapidly fading memories. Distributed practice gives each encoding a chance to consolidate, and each later retrieval strengthens the trace further. This is the empirical backbone of flashcard apps like Anki.",
      front: "Why is spaced repetition more effective than cramming for long-term retention?",
      back: "The spacing effect: spreading study sessions over time strengthens memory, while massed practice (cramming) produces fast-decaying traces.",
      tags: ["learning", "memory"],
      rs: {
        due: hoursFromNow(-1),
        stability: 8.2,
        difficulty: 2.4,
        elapsedDays: 7,
        scheduledDays: 9,
        reps: 3,
        lapses: 0,
        state: 2,
        lastReview: daysFromNow(-7),
        learningSteps: 0,
      },
    },
    {
      key: "recall",
      sourceType: "note",
      contentText:
        "Active recall is the act of retrieving information from memory rather than passively re-reading it. Every successful retrieval is a memory-strengthening event, which is why quizzing yourself beats highlighting. In Recall, this is exactly what the Review screen does: it shows you a flashcard and forces you to produce the answer before showing it.",
      front: "What is active recall, and why does it outperform re-reading?",
      back: "Actively retrieving information without cues strengthens the memory trace; passive re-reading does not trigger the same strengthening mechanism.",
      tags: ["learning"],
      rs: {
        due: daysFromNow(2),
        stability: 15.1,
        difficulty: 2.0,
        elapsedDays: 14,
        scheduledDays: 16,
        reps: 4,
        lapses: 0,
        state: 2,
        lastReview: daysFromNow(-14),
        learningSteps: 0,
      },
    },
    {
      key: "forgetting",
      sourceType: "article",
      sourceUrl: "https://en.wikipedia.org/wiki/Forgetting_curve",
      contentText:
        "Ebbinghaus described forgetting as roughly exponential: most of what we learn is lost within days unless it is reviewed. The practical takeaway is not pessimism but scheduling — reviews timed before the steepest drop flatten the curve and push items farther and farther out. Spaced repetition systems exist to automate exactly this timing.",
      front: "What shape does the forgetting curve take, and how do reviews change it?",
      back: "Forgetting is roughly exponential; timely reviews before steepest decay flatten the curve and extend intervals.",
      tags: ["memory"],
      rs: {
        due: hoursFromNow(-0.5),
        stability: 5.7,
        difficulty: 3.1,
        elapsedDays: 4,
        scheduledDays: 6,
        reps: 2,
        lapses: 1,
        state: 2,
        lastReview: daysFromNow(-4),
        learningSteps: 0,
      },
    },
    {
      key: "fsrs",
      sourceType: "note",
      contentText:
        "FSRS (Free Spaced Repetition Scheduler) models each card with two parameters: stability and difficulty. Stability is how long the memory survives, difficulty is how hard the card is to recall. With each review the scheduler updates these from your rating history, then chooses the next interval so your predicted recall probability hits a target (default 90%).",
      front: "What two parameters does FSRS track per card, and what do they drive?",
      back: "Stability (memory survival) and difficulty (ease of recall); ratings update both, and the scheduler sets intervals to hit a target recall probability.",
      tags: ["spaced-repetition", "fsrs"],
      rs: {
        due: daysFromNow(7),
        stability: 3.2,
        difficulty: 2.8,
        elapsedDays: 2,
        scheduledDays: 4,
        reps: 1,
        lapses: 0,
        state: 2,
        lastReview: daysFromNow(-2),
        learningSteps: 0,
      },
    },
    {
      key: "zettelkasten",
      sourceType: "note",
      contentText:
        "A Zettelkasten is a system of atomic, linked notes. Each note should capture one idea in your own words, be numbered for permanent addressability, and link to related notes so that connections emerge over time. The value is less in the notes themselves and more in the web of links that turns isolated facts into thinking.",
      front: "What makes a Zettelkasten different from a folder of notes?",
      back: "Atomic notes in your own words, permanently addressable, and linked relationally so ideas connect and compound.",
      tags: ["note-taking", "productivity"],
      rs: {
        due: hoursFromNow(-2),
        stability: 12.0,
        difficulty: 2.2,
        elapsedDays: 21,
        scheduledDays: 24,
        reps: 5,
        lapses: 0,
        state: 2,
        lastReview: daysFromNow(-21),
        learningSteps: 0,
      },
    },
    {
      key: "morning-pages",
      sourceType: "voice",
      contentText:
        "Morning pages are three pages of longhand stream-of-consciousness writing done first thing in the morning. The point is quantity over quality — dumping the noise in your head onto the page clears space for real ideas. Capturing them as a voice note and letting AI transcribe them is a modern, lower-friction twist.",
      front: "What is the purpose of morning pages?",
      back: "Three pages of freewriting each morning to clear mental clutter and surface ideas before judgment kicks in.",
      tags: ["productivity"],
      rs: {
        due: daysFromNow(5),
        stability: 4.5,
        difficulty: 3.0,
        elapsedDays: 3,
        scheduledDays: 5,
        reps: 2,
        lapses: 0,
        state: 2,
        lastReview: daysFromNow(-3),
        learningSteps: 0,
      },
    },
    {
      key: "reading-workflow",
      sourceType: "image",
      contentText:
        "A calm reading workflow: capture interesting passages in the moment (voice, photo of a page, or pasted URL), let Recall transcribe and summarize them, then review the auto-generated flashcards. The goal is a low-friction inbox where capturing costs seconds and reviewing happens in one focused session — separate capture from processing entirely.",
      front: "Why separate capture from processing in a knowledge workflow?",
      back: "Capturing costs seconds so nothing gets lost in the moment; processing/review happens later in one focused session.",
      tags: ["productivity"],
      rs: {
        due: daysFromNow(1),
        stability: 2.1,
        difficulty: 2.5,
        elapsedDays: 1,
        scheduledDays: 2,
        reps: 1,
        lapses: 0,
        state: 1,
        lastReview: daysFromNow(-1),
        learningSteps: 1,
      },
    },
  ];

  await prisma.$transaction(async (tx) => {
    const tagsByName: Record<string, string> = {};
    for (const name of [
      "learning",
      "memory",
      "spaced-repetition",
      "fsrs",
      "note-taking",
      "productivity",
    ]) {
      const tag = await tx.tag.create({ data: { name, userId } });
      tagsByName[name] = tag.id;
    }

    const atomIds: Record<string, string> = {};
    for (const atom of seedAtoms) {
      const created = await tx.atom.create({
        data: {
          userId,
          contentText: atom.contentText,
          sourceUrl: atom.sourceUrl ?? null,
          sourceType: atom.sourceType,
          flashcardFront: atom.front,
          flashcardBack: atom.back,
        },
      });
      atomIds[atom.key] = created.id;

      for (const tagName of atom.tags) {
        await tx.atomTag.create({
          data: { atomId: created.id, tagId: tagsByName[tagName] },
        });
      }

      await tx.reviewState.create({
        data: {
          atomId: created.id,
          userId,
          due: atom.rs.due,
          stability: atom.rs.stability,
          difficulty: atom.rs.difficulty,
          elapsedDays: atom.rs.elapsedDays,
          scheduledDays: atom.rs.scheduledDays,
          reps: atom.rs.reps,
          lapses: atom.rs.lapses,
          state: atom.rs.state,
          lastReview: atom.rs.lastReview,
          learningSteps: atom.rs.learningSteps,
        },
      });
    }

    await tx.link.create({
      data: {
        sourceAtomId: atomIds.spacing,
        targetAtomId: atomIds.fsrs,
        userId,
        linkType: "manual",
      },
    });
  });
}
