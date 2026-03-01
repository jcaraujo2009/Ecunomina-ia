'use client';

import { useState } from 'react';
import { Key } from 'lucide-react';
import { resetUserPassword } from '@/app/(dashboard)/settings/users/actions';

export function ResetPasswordButton({ userId }: { userId: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password || password.length < 6) return;
        
        setIsLoading(true);
        try {
            await resetUserPassword(userId, password);
            setIsOpen(false);
            setPassword('');
            alert('Contraseña actualizada correctamente');
        } catch (error) {
            console.error(error);
            alert('Error al actualizar la contraseña');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <button 
                onClick={() => setIsOpen(true)}
                className="text-indigo-600 hover:text-indigo-900"
                title="Restablecer Clave"
            >
                <Key className="w-4 h-4" />
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
                        <h3 className="text-lg font-semibold mb-4">Restablecer Contraseña</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Nueva Contraseña
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Mínimo 6 caracteres"
                                    minLength={6}
                                    required
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-md"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading || password.length < 6}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
                                >
                                    {isLoading ? 'Guardando...' : 'Guardar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
