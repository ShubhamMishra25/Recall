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
