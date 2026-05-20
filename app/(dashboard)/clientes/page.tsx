import { PageHeader } from "@/components/layout/PageHeader"
import { ClientsTable } from "@/features/clients/components/ClientsTable"

export default function ClientesPage() {
  return (
    <div>
      <PageHeader
        title="Clientes"
        description="Historial, pedidos y gestión de clientes"
      />
      <ClientsTable />
    </div>
  )
}
