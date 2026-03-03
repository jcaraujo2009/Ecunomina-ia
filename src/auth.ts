import NextAuth from 'next-auth';
import { signIn as nextAuthSignIn, signOut as nextAuthSignOut } from 'next-auth/react';
import { getServerSession } from 'next-auth/next';
import type { JWT } from 'next-auth/jwt';
import type { Session } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import { prisma } from './lib/prisma';
import type { User } from '@prisma/client';
import bcrypt from 'bcryptjs';

async function getUser(email: string): Promise<User | null> {
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        return user;
    } catch (error) {
        console.error('Failed to fetch user:', error);
        throw new Error('Failed to fetch user.');
    }
}

const authOptions = {
    providers: [
        Credentials({
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                const parsedCredentials = z
                    .object({ email: z.string().email(), password: z.string().min(6) })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data;
                    const user = await getUser(email);
                    if (!user || !user.password) return null;
                    
                    const passwordsMatch = await bcrypt.compare(password, user.password);
                    
                    if (passwordsMatch) {
                        return {
                            id: user.id,
                            name: user.name,
                            email: user.email,
                            emailVerified: user.emailVerified,
                            image: user.image,
                            password: user.password,
                            role: user.role,
                            companyId: user.companyId
                        } as any; 
                    }
                }

                console.log('Invalid credentials');
                return null;
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }: { token: JWT; user?: any }) {
            if (user) {
                token.companyId = user.companyId;
                token.role = user.role;
            }
            return token;
        },
        async session({ session, token }: { session: Session; token: JWT }) {
            if (token) {
                session.user.companyId = token.companyId as string;
                session.user.role = token.role as any;
            }
            return session;
        },
    }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
export { nextAuthSignIn as signIn, nextAuthSignOut as signOut };

export async function auth() {
    return await getServerSession(authOptions);
}

export { authOptions };
