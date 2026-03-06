'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { 
    LayoutDashboard, Users, Calculator, Building2, Briefcase, 
    PlusCircle, MinusCircle, Percent, Shield, ListChecks, Menu, X
} from 'lucide-react';
import { SignOutButton } from './SignOutButton';

const links = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Empresas', href: '/settings/companies', icon: Shield, superAdminOnly: true },
    { name: 'Auditoría', href: '/audit', icon: ListChecks, superAdminOnly: true },
    { name: 'Mi Empresa', href: '/settings/company', icon: Building2 },
    { name: 'Empleados', href: '/employees', icon: Users },
    { name: 'Nómina', href: '/payroll', icon: Calculator },
    { name: 'Departamentos', href: '/departments', icon: Building2 },
    { name: 'Cargos', href: '/roles', icon: Briefcase },
    { name: 'Maestro Ingresos', href: '/settings/earnings', icon: PlusCircle },
    { name: 'Maestro Deducciones', href: '/settings/deductions', icon: MinusCircle },
    { name: 'Config. Nómina', href: '/settings/payroll-types', icon: ListChecks },
    { name: 'Impuestos', href: '/settings/taxes', icon: Percent },
    { name: 'Usuarios', href: '/settings/users', icon: Users, adminOnly: true },
];

export default function Sidebar({ logo, userRole, companyName }: { logo?: string | null, userRole?: string, companyName?: string | null }) {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    const filteredLinks = links.filter(link => 
        (!link.adminOnly || userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') && 
        (!link.superAdminOnly || userRole === 'SUPER_ADMIN')
    );

    return (
        <>
            {/* Mobile checkbox */}
            <input 
                type="checkbox" 
                id="mobile-menu" 
                className="hidden peer" 
                checked={isOpen}
                onChange={() => setIsOpen(!isOpen)}
            />

            {/* Overlay */}
            <div 
                className="fixed inset-0 z-40 bg-black/50 opacity-0 pointer-events-none peer-checked:opacity-100 peer-checked:pointer-events-auto transition-opacity lg:hidden"
                onClick={() => setIsOpen(false)}
            />

            {/* Sidebar */}
            <aside className={clsx(
                "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col shadow-xl transition-transform duration-300 lg:translate-x-0",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                {/* Logo Area */}
                <div className="h-20 flex items-center justify-between px-6 border-b border-slate-800">
                    <Link href="/" className="flex items-center gap-3" onClick={() => setIsOpen(false)}>
                        {logo ? (
                            <Image src={logo} alt="Logo" width={40} height={40} className="rounded-lg" />
                        ) : (
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                                <span className="text-xl font-bold">E</span>
                            </div>
                        )}
                        <div>
                            <h1 className="text-lg font-bold tracking-tight">Ecunomina</h1>
                            <p className="text-xs text-slate-400">Nómina Electrónica</p>
                        </div>
                    </Link>
                    <button 
                        onClick={() => setIsOpen(false)}
                        className="lg:hidden p-1 hover:bg-slate-800 rounded"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
                    {filteredLinks.map((link) => {
                        const LinkIcon = link.icon;
                        const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
                        
                        return (
                            <Link
                                key={link.name}
                                href={link.href}
                                onClick={() => setIsOpen(false)}
                                className={clsx(
                                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group',
                                    isActive 
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                )}
                            >
                                <LinkIcon className={clsx("w-5 h-5", isActive ? "text-white" : "text-slate-500 group-hover:text-white")} />
                                <span>{link.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* User Area */}
                <div className="p-4 border-t border-slate-800">
                    {companyName && (
                        <div className="mb-3 px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-md">
                            <p className="text-sm font-bold text-white truncate">{companyName}</p>
                        </div>
                    )}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-slate-700 rounded-full flex items-center justify-center text-sm font-medium">
                                <Users className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">Usuario</p>
                                <p className="text-xs text-slate-400 truncate capitalize">{userRole?.toLowerCase().replace('_', ' ')}</p>
                            </div>
                        </div>
                        <SignOutButton />
                    </div>
                </div>
            </aside>
        </>
    );
}
