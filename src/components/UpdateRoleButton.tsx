'use client';

import { useState } from 'react';
import { UserRole } from '@/types';
import { updateUserRole } from '@/app/(dashboard)/settings/users/actions';

export function UpdateRoleButton({ userId, currentRole }: { userId: string; currentRole: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const newRole = formData.get('role') as string;
        
        setIsLoading(true);
        try {
            await updateUserRole(userId, newRole);
            setIsOpen(false);
        } catch (error) {
            console.error(error);
            alert('Error al actualizar el rol');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <button 
                onClick={() => setIsOpen(true)}
                className="text-blue-600 hover:text-blue-900"
                title="Cambiar Rol"
            >
                <span className="text-xs border border-blue-600 px-2 py-0.5 rounded hover:bg-blue-50">
                    {currentRole}
                </span>
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
                        <h3 className="text-lg font-semibold mb-4">Cambiar Rol de Usuario</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Nuevo Rol
                                </label>
                                <select
                                    name="role"
                                    defaultValue={currentRole}
                                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="USER">Usuario</option>
                                    <option value="ADMIN">Administrador</option>
                                    <option value="SUPER_ADMIN">Super Administrador</option>
                                </select>
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
                                    disabled={isLoading}
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
