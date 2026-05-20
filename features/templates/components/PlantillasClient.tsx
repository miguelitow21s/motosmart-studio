"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/layout/PageHeader"
import { TemplatesGrid } from "./TemplatesGrid"
import { NewTemplateModal } from "./NewTemplateModal"

export function PlantillasClient() {
  const [showModal, setShowModal] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  function handleSaved() {
    setShowModal(false)
    setRefreshKey((k) => k + 1)
  }

  return (
    <div>
      <PageHeader
        title="Plantillas"
        description="Siluetas SVG base por modelo de moto"
      >
        <Button size="sm" onClick={() => setShowModal(true)}>
          <Plus className="size-4 mr-1.5" /> Nueva plantilla
        </Button>
      </PageHeader>

      <TemplatesGrid key={refreshKey} />

      {showModal && (
        <NewTemplateModal onClose={() => setShowModal(false)} onSaved={handleSaved} />
      )}
    </div>
  )
}
