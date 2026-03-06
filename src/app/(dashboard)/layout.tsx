import Sidebar from '@/components/Sidebar';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { MessageCircle, Menu } from 'lucide-react';

export default async function Layout({ children }: { children: React.ReactNode }) {
    const session = await auth();
    const companyId = session?.user?.companyId;

    let logo = null;
    let companyName = null;
    if (companyId) {
        const company = await prisma.company.findUnique({
            where: { id: companyId },
            select: { logo: true, name: true }
        });
        logo = company?.logo;
        companyName = company?.name;
    }

    return (
        <div className="flex h-screen bg-slate-50">
            <Sidebar 
                logo={logo} 
                userRole={session?.user?.role} 
                companyName={companyName} 
            />
            
            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <label htmlFor="mobile-menu" className="p-2 hover:bg-slate-100 rounded-lg cursor-pointer">
                        <Menu className="w-6 h-6" />
                    </label>
                    <span className="font-bold text-gray-900">Ecunomina</span>
                </div>
            </div>

            <main className="flex-1 lg:ml-64 overflow-y-auto pt-14 lg:pt-0">
                <div className="container mx-auto px-4 md:px-8 py-6 md:py-8 max-w-7xl">
                    {children}
                </div>
            </main>

            {/* WhatsApp Support Button */}
            <a
                href="https://wa.me/593980122343"
                target="_blank"
                rel="noopener noreferrer"
                className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 md:bottom-8 md:right-8"
            >
                <MessageCircle className="w-5 h-5 md:w-6 md:h-6" />
                <span className="font-medium text-sm md:text-base hidden sm:inline">Soporte</span>
            </a>
        </div>
    );
}
