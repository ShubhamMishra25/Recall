import jwt from "jsonwebtoken";
import { Resend } from "resend";
import prisma from "../../lib/prisma";
import { StringValue } from "ms";

const resend = new Resend(process.env.RESEND_API_KEY);

const JWT_SECRET = process.env.JWT_SECRET!;
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET!;

export async function sendMagicLink(email: string) {
  // check if user exists; if not, create
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({ data: { email } });
  }

  // Generate a short-lived JWT containing the email
  const token = jwt.sign({ email, userId: user.id }, JWT_SECRET, {
    expiresIn: (process.env.MAGIC_LINK_EXPIRY || "15m") as StringValue,
  });

  // Build the magic link URL
  const link = `${process.env.FRONTEND_URL || "http://localhost:5173"}/auth/verify?token=${token}`;

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
  let payload: any;
  try {
    payload = jwt.verify(token, JWT_SECRET);
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
  const accessToken = jwt.sign({ userId: user.id }, JWT_SECRET, {
    expiresIn: (process.env.ACCESS_TOKEN_EXPIRY || "1h") as StringValue,
  });

  const refreshToken = jwt.sign({ userId: user.id }, REFRESH_SECRET, {
    expiresIn: (process.env.REFRESH_TOKEN_EXPIRY || "7d") as StringValue,
  });

  // Store the refresh token in the Session table
  await prisma.session.create({
    data: {
      userId: user.id,
      refreshTokenHash: refreshToken, // Store as is now; in production, consider hashing it for security
      expiresAt: new Date(
        Date.now() +
          parseInt(process.env.REFRESH_TOKEN_EXPIRY || "7") *
            24 *
            60 *
            60 *
            1000,
      ),
    },
  });

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
  let payload: any;
  try {
    payload = jwt.verify(oldRefreshToken, REFRESH_SECRET);
  } catch (err) {
    throw new Error("Invalid refresh token");
  }

  // Check session exists and not revoked
  const session = await prisma.session.findFirst({
    where: {
      userId: payload.userId,
      refreshTokenHash: oldRefreshToken,
      revoked: false,
    },
  });
  if (!session) throw new Error("Refresh token not found or revoked");

  // Rotate: revoke the old session, and create a new one
  await prisma.session.update({
    where: { id: session.id },
    data: { revoked: true },
  });

  const newAccessToken = jwt.sign({ userId: payload.userId }, JWT_SECRET, {
    expiresIn: (process.env.ACCESS_TOKEN_EXPIRY || "1h") as StringValue,
  });

  const newRefreshToken = jwt.sign({ userId: payload.userId }, REFRESH_SECRET, {
    expiresIn: (process.env.REFRESH_TOKEN_EXPIRY || "7d") as StringValue,
  });

  await prisma.session.create({
    data: {
      userId: payload.userId,
      refreshTokenHash: newRefreshToken,
      expiresAt: new Date(
        Date.now() +
          parseInt(process.env.REFRESH_TOKEN_EXPIRY || "7") *
            24 *
            60 *
            60 *
            1000,
      ),
    },
  });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}
