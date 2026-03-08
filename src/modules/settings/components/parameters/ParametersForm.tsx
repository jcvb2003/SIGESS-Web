import { FormEvent } from 'react'
import { Card, CardContent } from '@/shared/components/ui/card'
import { ParametersFormHeader } from './ParametersFormHeader'
import { FishingPeriodsSection } from './FishingPeriodsSection'
import { PublicationSection } from './PublicationSection'
import { useParametersData } from '../../hooks/useParametersData'
import { ParametersSettings } from '../../types/settings.types'

export function ParametersForm() {
  const { parameters, isLoading, isSaving, saveParameters } = useParametersData()

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)

    const values: ParametersSettings = {
      id: parameters?.id,
      defeso1Start: (formData.get('defeso1Start') as string) || null,
      defeso1End: (formData.get('defeso1End') as string) || null,
      defeso2Start: (formData.get('defeso2Start') as string) || null,
      defeso2End: (formData.get('defeso2End') as string) || null,
      defesoSpecies: String(formData.get('defesoSpecies') ?? ''),
      publicationNumber: String(formData.get('publicationNumber') ?? ''),
      publicationDate: (formData.get('publicationDate') as string) || null,
      publicationLocal: String(formData.get('publicationLocal') ?? ''),
      fishingArea: String(formData.get('fishingArea') ?? ''),
    }

    if (!isLoading && !isSaving) {
      await saveParameters(values)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="border-border/50 shadow-sm">
        <ParametersFormHeader isSaving={isSaving} isDisabled={isLoading || isSaving} />
        <CardContent className="space-y-4 border-t border-border/10">
          <div className="grid gap-4 lg:grid-cols-2">
            <FishingPeriodsSection parameters={parameters} />
            <PublicationSection parameters={parameters} />
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
