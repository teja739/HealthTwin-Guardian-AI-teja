import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html|css|js|gif|svg|png|webp|jpg|jpeg|zip|images|txt|ico|xml|json|txt|woff2?|otf|ttf|woff|map|map\\.js|json|css\\.map|js\\.map)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
