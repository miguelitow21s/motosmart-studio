import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/layout/PageHeader"
import { ClientDetail } from "@/features/clients/components/ClientDetail"
import { ROUTES } from "@/lib/constants/routes"

interface Props {
  params: Promise<{ id: string }>
}

export default async function ClientDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createServerClient()

  const { data: client, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single()

  if (error || !client) notFound()

  const { data: orders } = await supabase
    .from("orders")
    .select(`*, motorcycle:motorcycles(brand, model)`)
    .eq("client_id", id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })

  return (
    <div>
      <PageHeader
        title={client.name}
        description={client.phone}
      >
        <Link
          href={ROUTES.clients.list}
          className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Volver
        </Link>
      </PageHeader>
      <ClientDetail client={client} orders={(orders ?? []) as never} />
    </div>
  )
}
