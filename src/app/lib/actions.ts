'use server'

import { redirect } from 'next/navigation'

export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
) {
    throw new Error('Use signIn from next-auth/react in the client component');
}

export async function handleSignOut() {
    redirect('/api/auth/signout')
}
