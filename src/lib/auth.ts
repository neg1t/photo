import type { AccessStatus, Prisma } from "@prisma/client";
import type { NextAuthOptions } from "next-auth";
import NextAuth from "next-auth";
import { getServerSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

import { createUniqueUsername } from "@/lib/core/username";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";

function splitDisplayName(name?: string | null) {
  const [firstName = "", ...rest] = (name ?? "").trim().split(/\s+/);

  return {
    firstName,
    lastName: rest.join(" "),
  };
}

function isAdminEmail(email: string) {
  return env.auth.adminEmails.includes(email.toLowerCase());
}

async function usernameExists(candidate: string) {
  const existingProfile = await prisma.photographerProfile.findUnique({
    where: { username: candidate },
    select: { id: true },
  });

  return Boolean(existingProfile);
}

async function ensureUserRecord(input: {
  email: string;
  googleId?: string | null;
  name?: string | null;
  image?: string | null;
}) {
  const { email, googleId, name, image } = input;
  const normalizedEmail = email.toLowerCase();
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: { profile: true },
  });
  const { firstName, lastName } = splitDisplayName(name);

  if (existingUser) {
    return prisma.user.update({
      where: { id: existingUser.id },
      data: {
        googleId: googleId ?? existingUser.googleId,
        accessStatus: isAdminEmail(normalizedEmail)
          ? "ACTIVE"
          : existingUser.accessStatus,
        profile: existingUser.profile
          ? {
              update: {
                firstName: firstName || existingUser.profile.firstName,
                lastName: lastName || existingUser.profile.lastName,
                avatarUrl: image ?? existingUser.profile.avatarUrl,
              },
            }
          : {
              create: {
                firstName,
                lastName,
                avatarUrl: image,
                username: await createUniqueUsername(
                  {
                    firstName,
                    lastName,
                    email: normalizedEmail,
                  },
                  usernameExists,
                ),
              },
            },
      },
      include: { profile: true },
    });
  }

  const username = await createUniqueUsername(
    {
      firstName,
      lastName,
      email: normalizedEmail,
    },
    usernameExists,
  );

  return prisma.user.create({
    data: {
      email: normalizedEmail,
      googleId,
      accessStatus: isAdminEmail(normalizedEmail) ? "ACTIVE" : "PENDING",
      storageLimitBytes: env.product.defaultStorageLimitBytes,
      profile: {
        create: {
          firstName,
          lastName,
          username,
          avatarUrl: image,
        },
      },
      plans: {
        create: {
          name: "Pilot",
          storageLimitBytes: env.product.defaultStorageLimitBytes,
          retentionDaysDefault: env.product.defaultRetentionDays,
        },
      },
    },
    include: { profile: true },
  });
}

type SessionUser = Prisma.UserGetPayload<{
  include: { profile: true };
}>;

async function getSessionUserByEmail(email: string): Promise<SessionUser | null> {
  return prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: { profile: true },
  });
}

const providers = env.auth.isGoogleConfigured
  ? [
      GoogleProvider({
        clientId: env.auth.googleClientId,
        clientSecret: env.auth.googleClientSecret,
      }),
    ]
  : [];

export const authOptions: NextAuthOptions = {
  providers,
  session: {
    strategy: "jwt",
  },
  secret: env.auth.secret,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) {
        return false;
      }

      await ensureUserRecord({
        email: user.email,
        googleId: account?.providerAccountId,
        name: user.name,
        image: user.image,
      });

      return true;
    },
    async jwt({ token }) {
      if (!token.email) {
        return token;
      }

      const sessionUser = await getSessionUserByEmail(token.email);

      if (!sessionUser) {
        return token;
      }

      token.sub = sessionUser.id;
      token.accessStatus = sessionUser.accessStatus;
      token.username = sessionUser.profile?.username ?? null;
      token.isAdmin = isAdminEmail(sessionUser.email);

      return token;
    },
    async session({ session, token }) {
      if (!session.user || !token.sub) {
        return session;
      }

      session.user.id = token.sub;
      session.user.accessStatus = (token.accessStatus as AccessStatus) ?? "PENDING";
      session.user.username = token.username ?? null;
      session.user.isAdmin = Boolean(token.isAdmin);

      return session;
    },
  },
};

export const nextAuthHandler = NextAuth(authOptions);

export function getServerAuthSession() {
  return getServerSession(authOptions);
}
