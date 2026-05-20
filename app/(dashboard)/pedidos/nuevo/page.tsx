import { PageHeader } from "@/components/layout/PageHeader"
import { NewOrderForm } from "@/features/orders/components/NewOrderForm"

export default function NuevoPedidoPage() {
  return (
    <div>
      <PageHeader
        title="Nuevo pedido"
        description="Registra un nuevo trabajo de tapicería"
      />
      <NewOrderForm />
    </div>
  )
}
