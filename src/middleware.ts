import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Everything is public (storefronts, checkout, tracking, webhooks, health, cron-with-secret)
// EXCEPT the merchant area. Page/actions additionally enforce ownership server-side.
const isProtected = createRouteMatcher(["/dashboard(.*)", "/setup(.*)"]);

export default clerkMiddleware(async (auth, req) => {
    if (isProtected(req)) await auth.protect();
});

export const config = {
    matcher: [
        "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
        "/(api|trpc)(.*)",
    ],
};
