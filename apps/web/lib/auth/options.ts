import { prisma } from "@apibazar/prisma";
import { PrismaAdapter } from "@next-auth/prisma-adapter";

import { sendEmail } from "@apibazar/email";
import { LoginLink } from "@apibazar/email/templates/login-link";

import { isBlacklistedEmail } from "@/lib/edge-config";

import EmailProvider from "next-auth/providers/email";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";

import { type NextAuthOptions, User } from "next-auth";

const VERCEL_DEPLOYMENT = !!process.env.VERCEL_URL;

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },

  /* 1. Providers */
  providers: [
    /* magic-link e-mail */
    EmailProvider({
      sendVerificationRequest({ identifier, url }) {
        if (process.env.NODE_ENV === "development") {
          console.log(`Magic-link → ${url}`);
          return;
        }
        sendEmail({
          email: identifier,
          subject: `Your ${process.env.NEXT_PUBLIC_APP_NAME} login link`,
          react: LoginLink({ url, email: identifier }),
        });
      },
    }),

    /* Google OAuth */
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),

    /* GitHub OAuth */
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
  ],

  /* 2. Cookie */
  cookies: {
    sessionToken: {
      name: `${VERCEL_DEPLOYMENT ? "__Secure-" : ""}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        domain: VERCEL_DEPLOYMENT
          ? `.${process.env.NEXT_PUBLIC_APP_DOMAIN}`
          : undefined,
        secure: VERCEL_DEPLOYMENT,
      },
    },
  },

  /* 3. Pages */
  pages: {
    signIn: "/login",
    error: "/login",
  },

  /* 4. Callbacks */
  callbacks: {
    async signIn({ user, account, profile }) {
      /* blacklist / manual lock */
      if (!user.email || (await isBlacklistedEmail(user.email))) return false;
      if (user.lockedAt) return false;

      /* on OAuth – store picture/name if our DB lacks them */
      if (
        (account?.provider === "google" || account?.provider === "github") &&
        profile
      ) {
        const data: any = {};
        if (!user.image) {
          const pic =
            profile[account.provider === "google" ? "picture" : "avatar_url"];
          if (pic) data.image = pic;
        }
        if (!user.name && profile.name) data.name = profile.name;

        if (Object.keys(data).length) {
          await prisma.user.update({ where: { id: user.id }, data });
        }
      }
      return true;
    },

    async jwt({ token, user, trigger }) {
      if (user) token.user = user; // put user in token
      if (trigger === "update" && token.sub) {
        token.user = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { id: true, name: true, email: true, image: true },
        });
      }
      return token;
    },

    async session({ session, token }) {
      session.user = { id: token.sub, ...(token.user as any) };
      return session;
    },
  },

  /* 5. Events (welcome email – optional) */
  events: {
    async signIn(message) {
      console.log("signIn", message);
      const email = message.user.email as string;
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          createdAt: true,
        },
      });
      if (!user) {
        console.log(
          `User ${message.user.email} not found, skipping welcome workflow...`
        );
        return;
      }
      // only process new user workflow if the user was created in the last 15s (newly created user)
      if (
        user.createdAt &&
        new Date(user.createdAt).getTime() > Date.now() - 15000
      ) {
        console.log(
          `New user ${user.email} created,  triggering welcome workflow...`
        );
      }
    },
  },
};
