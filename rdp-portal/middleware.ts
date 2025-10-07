import { withAuth } from "next-auth/middleware";
import type { NextRequest } from "next/server";

export default withAuth({
  pages: { signIn: "/login" },
  callbacks: {
    authorized: ({ req, token }: { req: NextRequest; token: { role?: string } | null }) => {
      const { pathname } = req.nextUrl;
      // Allow unauthenticated access to login and registration pages
      if (pathname === "/login" || pathname === "/register" || pathname === "/") {
        return true;
      }
      // Require login for all other matched pages
      if (!token) return false;
      // Admin-only guard for control panel
      if (pathname.startsWith("/admin")) {
        return token?.role === "admin";
      }
      return true;
    },
  },
});

// Protect all pages by default, except API/static/assets and auth pages
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|public|login|register|images|fonts).*)",
  ],
};
