import { auth } from "@/lib/auth";

export default auth;

export const config = {
  // Match all routes except static files and API routes that don't need auth
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons|manifest.json).*)"],
};
