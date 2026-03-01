import LoginForm from '@/components/LoginForm';

export default function LoginPage() {
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
