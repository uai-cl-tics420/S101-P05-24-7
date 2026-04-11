import { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

/**
 * Central NextAuth configuration.
 * Exported here so it can be shared between:
 *  - src/app/api/auth/[...nextauth]/route.ts (handler)
 *  - src/app/api/auth/set-role/route.ts      (getServerSession)
 */
export const authOptions: NextAuthOptions = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adapter: PrismaAdapter(prisma) as any,

  // Use JWT strategy so middleware (proxy.ts) can read the token at the edge
  session: { strategy: "jwt" },

  providers: [
    // ── SSO: Google OAuth 2.0 (RS256 signed id_token) ────────────────────────
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      allowDangerousEmailAccountLinking: true,
    }),

    // ── OTP: Email Magic Link (SHA-256 hashed verification token) ────────────
    // Token is generated with crypto.randomBytes(32), hashed with SHA-256,
    // stored in VerificationToken table, and sent as a one-time link via email.
    EmailProvider({
      server: process.env.EMAIL_SERVER || "",
      from: process.env.EMAIL_FROM || "noreply@loombox.cl",
      maxAge: 60 * 10, // Token expires in 10 minutes
    }),
  ],

  pages: {
    signIn: "/login",
    error: "/login",
  },

  callbacks: {
    async signIn({ account }) {
      // Allow sign in with Google SSO or Email OTP
      return account?.provider === "google" || account?.provider === "email";
    },

    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },

    async jwt({ token, user }) {
      // 1. On initial sign-in, user object is available
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }

      // 2. Always fetch the latest role and apartment from the database 
      // to ensure the session is always in sync.
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { 
            role: true,
            apartment: true 
          },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.apartment = dbUser.apartment;
        }
      }

      return token;
    },

    async session({ session, token }) {
      // Surface id, role, and apartment to the client session object
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as import("@prisma/client").UserRole;
        (session.user as any).apartment = token.apartment;
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};
