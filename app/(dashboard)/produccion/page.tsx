import { PageHeader } from "@/components/layout/PageHeader"
import { KanbanBoard } from "@/features/orders/components/KanbanBoard"

export default function ProduccionPage() {
  return (
    <div>
      <PageHeader
        title="Producción"
        description="Arrastra las tarjetas para actualizar el estado del pedido"
      />
      <KanbanBoard />
    </div>
  )
}
