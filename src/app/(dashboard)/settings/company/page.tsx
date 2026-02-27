import { getMyCompany } from "./actions"
import CompanySettingsForm from "./CompanySettingsForm"

export default async function CompanySettingsPage() {
    const company = await getMyCompany()

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">Configuración de Empresa</h1>
                <p className="text-slate-500">Administra los datos legales y financieros de tu empresa.</p>
            </div>

            <CompanySettingsForm company={company} />
        </div>
    )
}
