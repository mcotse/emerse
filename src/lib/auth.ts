import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

/**
 * Auth configuration for Emerse.
 *
 * Currently uses credentials provider for development.
 * Production should use OAuth providers (Google, etc.) or magic links.
 *
 * See MANUAL_SETUP.md for provider configuration instructions.
 */

export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // TODO: Replace with real authentication
        // This is a placeholder for development
        if (
          credentials?.email === "demo@emerse.app" &&
          credentials?.password === "demo"
        ) {
          return {
            id: "demo-user",
            email: "demo@emerse.app",
            name: "Demo User",
          };
        }
        return null;
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isPublicPage = nextUrl.pathname.startsWith("/login");
      const isSharePage = nextUrl.pathname.startsWith("/share/");

      // Allow public pages and share links
      if (isPublicPage || isSharePage) {
        return true;
      }

      // Require auth for everything else
      return isLoggedIn;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
