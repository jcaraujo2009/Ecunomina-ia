import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    pages: {
        signIn: '/login',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname === '/' ||
                nextUrl.pathname.startsWith('/employees') ||
                nextUrl.pathname.startsWith('/payroll') ||
                nextUrl.pathname.startsWith('/departments') ||
                nextUrl.pathname.startsWith('/roles') ||
                nextUrl.pathname.startsWith('/settings');
            
            // Super Admin only routes
            const isSuperAdminRoute = nextUrl.pathname.startsWith('/audit') || nextUrl.pathname.startsWith('/settings/companies');

            if (isSuperAdminRoute) {
                 if (!isLoggedIn) return false;
                 if (auth?.user?.role !== 'SUPER_ADMIN') return false; // Redirect unauthorized
                 return true;
            }

            if (isOnDashboard) {
                if (isLoggedIn) return true;
                return false; // Redirect unauthenticated users to login page
            } else if (isLoggedIn) {
                return Response.redirect(new URL('/', nextUrl));
            }
            return true;
        },
    },
    providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;
