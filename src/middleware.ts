import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { locales, defaultLocale } from "./i18n";

// next-intl locale routing middleware
const intlMiddleware = createMiddleware({
    locales,
    defaultLocale,
    localePrefix: "always",
});

// Public routes that don't require authentication
const publicRoutes = [
    /\/[a-z]{2}\/login$/,
    /\/[a-z]{2}\/register$/,
    /\/$/,
];

// Role-based route protection patterns
const roleBasedRoutes: Record<string, RegExp[]> = {
    ADMIN: [/\/[a-z]{2}\/admin(\/.*)?$/],
    TEACHER: [/\/[a-z]{2}\/teacher(\/.*)?$/],
    STUDENT: [/\/[a-z]{2}\/student(\/.*)?$/],
    PARENT: [/\/[a-z]{2}\/parent(\/.*)?$/],
};

export default async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Check if it's a public route
    const isPublicRoute = publicRoutes.some((route) => {
        if (typeof route === "string") {
            return pathname === route;
        }
        return route.test(pathname);
    });

    // Get the session
    const session = await auth();

    // If not authenticated and trying to access protected route, redirect to login
    if (!session && !isPublicRoute) {
        const locale = pathname.split("/")[1] || defaultLocale;
        return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
    }

    // If authenticated and trying to access login/register, redirect to dashboard
    if (session && (pathname.endsWith("/login") || pathname.endsWith("/register"))) {
        const locale = pathname.split("/")[1] || defaultLocale;
        const role = session.user?.role?.toUpperCase() || "ADMIN";
        return NextResponse.redirect(new URL(`/${locale}/${role.toLowerCase()}`, request.url));
    }

    // Check role-based access
    if (session && session.user?.role) {
        const userRole = session.user.role.toUpperCase();
        const allowedRoutes = roleBasedRoutes[userRole] || [];

        // Check if user is trying to access a route they don't have access to
        const hasAccess = allowedRoutes.some((route) => route.test(pathname));

        // Allow dashboard for their role, but redirect if trying to access other role's routes
        if (!hasAccess && !isPublicRoute) {
            // Allow root path
            if (pathname.match(/\/[a-z]{2}\/$/)) {
                // OK
            } else {
                const locale = pathname.split("/")[1] || defaultLocale;
                return NextResponse.redirect(new URL(`/${locale}/${userRole.toLowerCase()}`, request.url));
            }
        }
    }

    return intlMiddleware(request);
}

export const config = {
    // Match all pathnames except for
    // - /api routes
    // - /_next (Next.js internals)
    // - /_vercel (Vercel internals)
    // - /.*\..* (files with an extension, e.g. favicon.ico)
    matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
