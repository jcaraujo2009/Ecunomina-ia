'use server'

import { signIn, signOut } from '@/auth'
import AuthError from 'next-auth'
import { redirect } from 'next/navigation'

export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
) {
    try {
        const credentials = {
            email: formData.get('email') as string,
            password: formData.get('password') as string,
        };
        await signIn('credentials', credentials)
    } catch (error) {
        if (error instanceof AuthError) {
            return 'Invalid credentials.'
        }
        throw error
    }
}

export async function handleSignOut() {
    await signOut({ redirect: false })
    redirect('/login')
}
