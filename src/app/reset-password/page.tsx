'use client';

import { Suspense, useState } from 'react';
import { Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [isValidToken, setIsValidToken] = useState(false);

    useState(() => {
        if (!token || !email) {
            setMessage({ type: 'error', text: 'Token o email inválido' });
        } else {
            setIsValidToken(true);
        }
    });

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();
        setMessage(null);

        if (password !== confirmPassword) {
            setMessage({ type: 'error', text: 'Las contraseñas no coinciden' });
            return;
        }

        if (password.length < 6) {
            setMessage({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres' });
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, email, password }),
            });

            if (response.ok) {
                setMessage({ type: 'success', text: 'Contraseña actualizada correctamente. Redirigiendo al login...' });
                setTimeout(() => router.push('/login'), 3000);
            } else {
                const data = await response.json();
                setMessage({ type: 'error', text: data.error || 'Error al actualizar la contraseña' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Error de conexión' });
        } finally {
            setLoading(false);
        }
    }

    if (!token || !email) {
        return (
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 text-center">
                <h2 className="text-xl font-semibold text-red-600">Enlace inválido</h2>
                <p className="text-slate-600 mt-2">El enlace de recuperación ha expirado o es inválido.</p>
                <a href="/forgot-password" className="inline-block mt-4 text-blue-600 hover:text-blue-700 font-medium">
                    Solicitar nuevo enlace
                </a>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {message && (
                <div className={`border px-4 py-3 rounded-lg text-sm ${
                    message.type === 'success' 
                        ? 'bg-green-50 border-green-200 text-green-600' 
                        : 'bg-red-50 border-red-200 text-red-600'
                }`}>
                    {message.text}
                </div>
            )}
            
            <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                    Nueva contraseña
                </label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full pl-10 pr-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="••••••••"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                        {showPassword ? (
                            <EyeOff className="h-5 w-5 text-slate-400" />
                        ) : (
                            <Eye className="h-5 w-5 text-slate-400" />
                        )}
                    </button>
                </div>
            </div>

            <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1">
                    Confirmar contraseña
                </label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={6}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="••••••••"
                    />
                </div>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Actualizando...
                    </>
                ) : (
                    'Guardar nueva contraseña'
                )}
            </button>
        </form>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-500 mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-white">Ecunomina</h1>
                    <p className="text-slate-400 mt-2">Nueva contraseña</p>
                </div>

                <Suspense fallback={
                    <div className="bg-white rounded-2xl shadow-2xl p-8 flex justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                }>
                    <div className="bg-white rounded-2xl shadow-2xl p-8">
                        <ResetPasswordForm />
                    </div>
                </Suspense>
            </div>
        </div>
    );
}
