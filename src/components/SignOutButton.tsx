'use client';

import { signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';

export function SignOutButton() {
    return (
        <button 
            onClick={() => signOut()} 
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
            <LogOut className="w-4 h-4" />
            <span>Cerrar sesión</span>
        </button>
    )
}
