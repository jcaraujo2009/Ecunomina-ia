import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
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

export const { auth, signIn, signOut, handlers } = NextAuth({
    ...authConfig,
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
        async jwt({ token, user }) {
            if (user) {
                token.companyId = (user as any).companyId;
                token.role = (user as any).role;
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user.companyId = token.companyId as string;
                session.user.role = token.role as any;
            }
            return session;
        },
    }
});
