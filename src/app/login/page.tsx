import LoginForm from '@/components/LoginForm';
import Image from 'next/image';

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center mb-4">
                        <Image 
                            src="/logo_login_ecunomina.png" 
                            alt="Ecunomina" 
                            width={120} 
                            height={120}
                            className="rounded-xl"
                        />
                    </div>
                    <h1 className="text-3xl font-bold text-white">Ecunomina</h1>
                    <p className="text-slate-400 mt-2">Sistema de gestión de nómina</p>
                </div>

                <div className="bg-white rounded-2xl shadow-2xl p-8">
                    <h2 className="text-xl font-semibold text-slate-800 mb-6">Bienvenido de nuevo</h2>
                    <LoginForm />
                </div>

                <div className="text-center mt-6">
                    <p className="text-slate-500 text-sm">
                        © 2026 Ecunomina. Todos los derechos reservados.
                    </p>
                </div>
            </div>
        </div>
    );
}
