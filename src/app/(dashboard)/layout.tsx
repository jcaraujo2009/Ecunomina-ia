import Sidebar from '@/components/Sidebar';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { MessageCircle } from 'lucide-react';

export default async function Layout({ children }: { children: React.ReactNode }) {
    const session = await auth();
    const companyId = session?.user?.companyId;

    let logo = null;
    if (companyId) {
        const company = await prisma.company.findUnique({
            where: { id: companyId },
            select: { logo: true }
        });
        logo = company?.logo;
    }

    return (
        <div className="flex h-screen bg-slate-50">
            <Sidebar logo={logo} userRole={session?.user?.role} />
            <main className="flex-1 ml-64 overflow-y-auto">
                <div className="container mx-auto px-8 py-8 max-w-7xl">
                    {children}
                </div>
            </main>
            
            {/* WhatsApp Support Button */}
            <a
                href="https://wa.me/593999999999"
                target="_blank"
                rel="noopener noreferrer"
                className="fixed bottom-8 right-8 z-50 flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-5 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
                <MessageCircle className="w-6 h-6" />
                <span className="font-medium">Soporte</span>
            </a>
        </div>
    );
}
