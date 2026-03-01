import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    pages: {
        signIn: '/login',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnLogin = nextUrl.pathname.startsWith('/login');

            if (isOnLogin && isLoggedIn) {
                return Response.redirect(new URL('/', nextUrl));
            }

            const isOnDashboard = nextUrl.pathname === '/' ||
                nextUrl.pathname.startsWith('/employees') ||
                nextUrl.pathname.startsWith('/payroll') ||
                nextUrl.pathname.startsWith('/departments') ||
                nextUrl.pathname.startsWith('/roles') ||
                nextUrl.pathname.startsWith('/settings') ||
                nextUrl.pathname.startsWith('/simple');

            if (isOnDashboard) {
                if (isLoggedIn) return true;
                return false; 
            } 
            
            if (isLoggedIn) return true;

            return true;
        },
    },
    providers: [], 
} satisfies NextAuthConfig;
